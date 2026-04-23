import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import readline from 'readline';

export interface XmlParseOptions {
  checkpointPath?: string;
  resume?: boolean;
}

export async function parseWpXmlItems(
  filePath: string,
  onItem: (itemObj: any) => Promise<void>,
  opts: XmlParseOptions = {},
) {
  const checkpoint =
    opts.checkpointPath && fs.existsSync(opts.checkpointPath)
      ? JSON.parse(fs.readFileSync(opts.checkpointPath, 'utf8'))
      : { processed: 0 };
  let processed = checkpoint.processed || 0;

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  // We will accumulate lines between <item>...</item>
  let buffer = '';
  let inItem = false;
  let index = 0;
  let lastPostId: any = undefined;
  let lastGuid: any = undefined;

  // fast-xml-parser options: strip namespace prefixes and preserve CDATA
  const parser = new XMLParser(({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    // strip namespace prefixes
    tagNameProcessor: (name: string) => name.replace(/^.*:/, ''),
  } as any));

  for await (const line of rl) {
    if (!inItem) {
      const start = line.indexOf('<item');
      if (start !== -1) {
        inItem = true;
        buffer = line.slice(start) + '\n';
        // If closing is on same line continue to parser below
      }
    } else {
      buffer += line + '\n';
    }

    if (inItem && buffer.includes('</item>')) {
      // Extract one or more items if multiple close tags exist
      const parts = buffer.split(/<\/item>/i);
      for (let i = 0; i < parts.length - 1; i++) {
        const itemXml = parts[i] + '</item>';
        index++;
        if (opts.resume && index <= processed) {
          // skip already processed
        } else {
          try {
            const parsed = parser.parse(itemXml);
            // XML structure places item fields under 'item'
            const raw = parsed && parsed.item ? parsed.item : parsed;

            // normalize a few common fields for downstream use
            const normalized: any = { ...raw };

            // content may be under content -> encoded
            // content may be under content -> encoded, or 'content:encoded' depending on parser
            if (raw['content'] && raw['content']['encoded']) {
              const enc = raw['content']['encoded'];
              normalized.content = enc && enc.__cdata ? enc.__cdata : enc;
            } else if (raw['content:encoded']) {
              const enc = raw['content:encoded'];
              normalized.content = enc && enc.__cdata ? enc.__cdata : enc;
            } else if (raw['encoded']) {
              normalized.content = raw['encoded'] && raw['encoded'].__cdata ? raw['encoded'].__cdata : raw['encoded'];
            }

            // excerpt
            if (raw['excerpt'] && raw['excerpt']['encoded']) {
              const exc = raw['excerpt']['encoded'];
              normalized.excerpt = exc && exc.__cdata ? exc.__cdata : exc;
            } else if (raw['excerpt:encoded']) {
              const exc = raw['excerpt:encoded'];
              normalized.excerpt = exc && exc.__cdata ? exc.__cdata : exc;
            }

            // postmeta -> map
            const pm = raw['postmeta'] || raw['wp:postmeta'];
            if (pm) {
              const metas = Array.isArray(pm) ? pm : [pm];
              const metaMap: Record<string, any> = {};
              for (const m of metas) {
                const key = m['meta_key'] || m['wp:meta_key'] || m['metaKey'] || m['meta-key'];
                const val = m['meta_value'] || m['wp:meta_value'] || m['metaValue'];
                const value = val && val.__cdata ? val.__cdata : val;
                if (key) metaMap[key] = val;
              }
              normalized.postmeta = metaMap;
            }

            // categories/tags (category elements with domain attribute)
            if (raw['category']) {
              const cats = Array.isArray(raw['category']) ? raw['category'] : [raw['category']];
              const terms: Record<string, string[]> = {};
              for (const c of cats) {
                const domain = c['@_domain'] || 'category';
                const label = typeof c === 'string' ? c : c['#text'] || c['text'] || Object.values(c).find(Boolean);
                terms[domain] = terms[domain] || [];
                if (label) terms[domain].push(label);
              }
              normalized.terms = terms;
            }

            // post_type and id
            normalized.post_type = raw['post_type'] || raw['postType'] || raw['wp:post_type'];
            normalized.post_id = raw['post_id'] || raw['postId'] || raw['wp:post_id'] || raw['post_id'];
            // guid
            if (raw['guid']) {
              const guid = typeof raw['guid'] === 'string' ? raw['guid'] : raw['guid']['#text'] || raw['guid'];
              normalized.guid = guid;
            }

            await onItem(normalized);

            // update processed and checkpoint with optional last id/guid
            processed = index;
            if (normalized.post_id) lastPostId = normalized.post_id;
            if (normalized.guid) lastGuid = normalized.guid;
            const ckpt: any = { processed };
            if (lastPostId) ckpt.last_post_id = lastPostId;
            if (lastGuid) ckpt.last_guid = lastGuid;
            if (opts.checkpointPath) {
              fs.writeFileSync(opts.checkpointPath, JSON.stringify(ckpt, null, 2));
            }
          } catch (err) {
            // swallow per-item parse errors but continue
            // could add retries/backoff if needed
            // write a simple error log to stderr
            console.error('Failed to parse item XML:', err instanceof Error ? err.message : err);
          }
        }
      }
      // remainder becomes buffer for next item
      buffer = parts[parts.length - 1] || '';
      inItem = buffer.trim().length > 0 && !buffer.includes('<item');
      if (!inItem) buffer = '';
    }
  }

  // Final checkpoint write
  if (opts.checkpointPath) {
    const finalCkpt: any = { processed };
    if (lastPostId) finalCkpt.last_post_id = lastPostId;
    if (lastGuid) finalCkpt.last_guid = lastGuid;
    fs.writeFileSync(opts.checkpointPath, JSON.stringify(finalCkpt, null, 2));
  }
}
