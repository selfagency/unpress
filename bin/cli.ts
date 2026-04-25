#!/usr/bin/env node

import cac from 'cac';
import fs from 'fs-extra';
import path from 'path';
import { loadConfig } from '../src/config';
import { loadProjectConfigFromFile, mergeConfig } from '../src/config-loader';
import { safeResolve } from '../src/path-utils';

const cli = cac('unpress');

cli
  .option('--wp-url <url>', 'WordPress site URL')
  .option('--wp-user <user>', 'WordPress username')
  .option('--wp-app-password <password>', 'WordPress app password')
  .option('--download-media', 'Download referenced media');
// project config and source selection
cli.option('--config <file>', 'Project YAML config file (unpress.yml)');
cli.option('--types <file>', 'Content types YAML file (types.yml)');
cli.option('--source <type>', 'Source type: api or xml');
cli.option('--xml-file <file>', 'WordPress XML export file to import');
cli.option('--resume', 'Resume a previous run using stateDir checkpoints');
// generation & indexing
cli.option('--generate-site', 'Generate a minimal 11ty site in the output dir');
cli.option('--out-dir <dir>', 'Output directory for generated site (defaults to cwd)');
cli.option('--index-meili', 'After generation, index generated posts into Meilisearch');
cli.option('--meili-host <url>', 'Meilisearch host (e.g., http://127.0.0.1:7700)');
cli.option('--meili-api-key <key>', 'Meilisearch API key');
cli.option('--meili-index <name>', 'Meilisearch index name');
cli.option('--dry-run', 'Validate configuration and exit without performing network or file operations');

cli.help();

cli.command('[...args]').action(async (_args, flags) => {
  try {
    const getFlag = (...keys: string[]) =>
      keys.find(k => typeof (flags as any)[k] !== 'undefined')
        ? (flags as any)[keys.find(k => typeof (flags as any)[k] !== 'undefined') as string]
        : undefined;

    // Normalize flags (support both kebab-case and camelCase) to a known shape
    const normalized = {
      wpUrl: getFlag('wpUrl', 'wp-url', 'wp_url'),
      wpUser: getFlag('wpUser', 'wp-user', 'wp_user'),
      wpAppPassword: getFlag('wpAppPassword', 'wp-app-password', 'wp_app_password'),
      downloadMedia:
        typeof getFlag('downloadMedia', 'download-media') === 'boolean'
          ? getFlag('downloadMedia', 'download-media')
          : false,
    };

    // Load optional YAML project config and merge with CLI flags (flags win)
    let projectCfg: any = undefined;
    if (getFlag('config')) {
      const cfgArg = String(getFlag('config'));
      const cfgPath = safeResolve(process.cwd(), cfgArg);
      projectCfg = loadProjectConfigFromFile(cfgPath);
    }
    const mergedProject = mergeConfig(flags, projectCfg);

    // Determine source type early
    const sourceType = mergedProject?.source?.type || getFlag('source', 'source-type', 'sourceType');
    const needsApiAuth =
      sourceType === 'api' ||
      (!sourceType &&
        !getFlag('generateSite', 'generate-site') &&
        !getFlag('indexMeili', 'index-meili') &&
        !getFlag('xmlFile', 'xml-file'));

    // Only prompt for WordPress credentials when API source is needed
    let config: any = undefined;
    if (needsApiAuth) {
      config = await loadConfig(normalized);
    }
    // If dry-run requested, validate and exit
    if (getFlag('dryRun', 'dry-run')) {
      console.log('Dry-run: validated config:', config || 'no API config needed');
      process.exit(0);
    }

    // Optionally generate site first
    const outDir = getFlag('outDir', 'out-dir') || process.cwd();
    if (getFlag('generateSite', 'generate-site')) {
      try {
        const gen = (await import('../src/generator')).default;
        console.log(`Generating 11ty site into ${outDir}/site`);
        await gen(outDir);
        console.log('Site generation complete');
      } catch (err) {
        console.error('Site generation failed:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }

    // Optional Meilisearch indexing step (can run alone or after generation)
    if (getFlag('indexMeili', 'index-meili')) {
      const host = getFlag('meiliHost', 'meili-host') || process.env.MEILI_HOST || 'http://127.0.0.1:7700';
      const apiKey = getFlag('meiliApiKey', 'meili-api-key') || process.env.MEILI_API_KEY;
      const indexName = getFlag('meiliIndex', 'meili-index') || process.env.MEILI_INDEX || 'posts';
      try {
        const { indexPostsFromDir } = await import('../src/meilisearch');
        console.log(`Indexing posts from ${outDir}/site/content/posts -> ${host}`);
        const res = await indexPostsFromDir(`${outDir}/site/content/posts`, { host, apiKey, indexName });
        console.log('Indexing result:', res);
      } catch (err) {
        console.error('Meilisearch indexing failed:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }

    // Handle source-specific flows: API or XML (minimal wiring)
    if (sourceType === 'xml' || getFlag('source') === 'xml') {
      const xmlFile = getFlag('xmlFile', 'xml-file') || mergedProject?.source?.xml?.file;
      if (!xmlFile) {
        console.error('XML source selected but no --xml-file provided or configured in project config');
        process.exit(1);
      }
      try {
        const { parseWpXmlItems } = await import('../src/xml-parser');
        const outDir = getFlag('outDir', 'out-dir') || process.cwd();
        const stateDir = mergedProject?.resume?.stateDir || path.join(outDir, '.unpress', 'state');
        await fs.ensureDir(stateDir);
        const checkpointPath = path.join(stateDir, 'xml-checkpoint.json');

        console.log(`Processing XML: ${xmlFile} -> state: ${checkpointPath}`);

        // prepare media helpers
        const { findMediaUrls, relinkMediaUrls } = await import('../src/media');
        const mediaAdapters = await import('../src/media-adapters');

        // construct upload clients if reupload is configured
        let s3Client: any = undefined;
        let sftpClient: any = undefined;
        if (mergedProject?.media?.mode === 'reupload') {
          const driver = mergedProject?.media?.reupload?.driver;
          if (driver === 's3') {
            try {
              s3Client = mediaAdapters.createS3ClientFromConfig(mergedProject.media.reupload.s3);
            } catch {
              // fallback to env-based client
              s3Client = mediaAdapters.createS3ClientFromEnv();
            }
          } else if (driver === 'sftp') {
            try {
              sftpClient = await mediaAdapters.createSftpClientFromConfig(mergedProject.media.reupload.sftp);
            } catch {
              sftpClient = await mediaAdapters.createSftpClientFromEnv();
            }
          }
        }

        await parseWpXmlItems(
          xmlFile,
          async (item: any) => {
            const itemsDir = path.join(stateDir, 'items');
            await fs.ensureDir(itemsDir);
            const id = item.post_id || item.wp_post_id || item.id || `item-${Date.now()}`;

            // handle media according to project config
            const mediaCfg = mergedProject?.media || {};
            const mode = mediaCfg.mode || 'local';
            const mediaMap: Record<string, string> = {};

            // find markdown fields to search (body/excerpt)
            const mdFields = [] as string[];
            if (item.content && typeof item.content === 'string') mdFields.push('content');
            if (item.excerpt && typeof item.excerpt === 'string') mdFields.push('excerpt');

            for (const field of mdFields) {
              const md = item[field] as string;
              const urls = findMediaUrls(md);
              for (const url of urls) {
                try {
                  if (mode === 'leave') {
                    // do nothing
                  } else if (mode === 'local') {
                    // save to local state dir
                    const localDest = await mediaAdapters.downloadToLocal(url, path.join(stateDir, 'media'));
                    mediaMap[url] = localDest;
                  } else if (mode === 'reupload') {
                    const driver = mediaCfg.reupload?.driver || 's3';
                    if (driver === 's3') {
                      const s3cfg = mediaCfg.reupload?.s3;
                      if (s3cfg && s3cfg.bucket) {
                        try {
                          const res = await mediaAdapters.reuploadMediaToS3(url, {
                            localDir: path.join(stateDir, 'media'),
                            s3: { client: s3Client, bucket: s3cfg.bucket, prefix: s3cfg.prefix },
                          });
                          mediaMap[url] = res;
                        } catch {
                          const fname = path.basename(new URL(url).pathname || `file-${Date.now()}`);
                          mediaMap[url] = `s3://${s3cfg.bucket}/${fname}`;
                        }
                      }
                    } else if (driver === 'sftp') {
                      const sftpCfg = mediaCfg.reupload?.sftp;
                      if (sftpCfg && sftpCfg.host) {
                        try {
                          const res = await mediaAdapters.reuploadMediaToSftp(url, {
                            localDir: path.join(stateDir, 'media'),
                            sftp: { client: sftpClient, remotePath: sftpCfg.path || '/' },
                          });
                          mediaMap[url] = res;
                        } catch {
                          const fname = path.basename(new URL(url).pathname || `file-${Date.now()}`);
                          mediaMap[url] = `sftp:${sftpCfg.path || '/'}${fname}`;
                        }
                      }
                    }
                  }
                } catch {
                  // best-effort: record failure in mediaMap as null
                  mediaMap[url] = mediaMap[url] || '';
                }
              }
              // rewrite markdown in item
              if (Object.keys(mediaMap).length > 0) {
                item[field] = relinkMediaUrls(md, mediaMap);
              }
            }

            const filename = `item-${id}.json`;
            await fs.writeJson(path.join(itemsDir, filename), { item, media_map: mediaMap }, { spaces: 2 });
          },
          { checkpointPath, resume: !!getFlag('resume') },
        );

        console.log('XML processing complete');

        // Convert JSON items to markdown files in appropriate directories based on post_type
        try {
          const { htmlToMarkdown } = await import('../src/convert');
          const itemsDir = path.join(stateDir, 'items');
          const itemFiles = await fs.readdir(itemsDir);
          const outDir = getFlag('outDir', 'out-dir') || process.cwd();
          const siteDir = path.join(outDir, 'site');

          // Helper to extract string from CDATA objects
          const extractText = (val: any): string => {
            if (!val) return '';
            if (typeof val === 'string') return val;
            if (typeof val === 'object' && val.__cdata) return val.__cdata;
            if (typeof val === 'object' && val['#text']) return val['#text'];
            return String(val);
          };

          const postTypeMap: Record<string, string> = {
            post: 'posts',
            page: 'pages',
            book: 'books',
          };

          for (const itemFile of itemFiles) {
            if (!itemFile.endsWith('.json')) continue;
            const itemData = await fs.readJson(path.join(itemsDir, itemFile));
            const item = itemData.item || itemData;
            if (!item) continue;

            const title = extractText(item.title);
            if (!title) continue;

            const postType = (item.post_type || 'post').toLowerCase();
            const contentSubdir = postTypeMap[postType] || 'posts';
            const contentDir = path.join(siteDir, 'content', contentSubdir);
            await fs.ensureDir(contentDir);

            const content = extractText(item['content:encoded'] || item.content || item.excerpt || '');
            const markdown = htmlToMarkdown(content);

            // Build frontmatter
            const fm: Record<string, any> = {};
            fm.title = title;
            if (item['wp:post_date']) {
              const dateStr = extractText(item['wp:post_date']);
              if (dateStr) fm.date = new Date(dateStr).toISOString();
            }
            if (item['wp:post_name']) {
              fm.slug = extractText(item['wp:post_name']);
            }

            // Handle tags and categories from terms
            const tags: string[] = [];
            const categories: string[] = [];
            if (item.terms && Array.isArray(item.terms)) {
              for (const term of item.terms) {
                const domain = extractText(term.domain);
                const name = extractText(term['#text']);
                if (domain === 'tag') tags.push(name);
                else if (domain === 'category') categories.push(name);
              }
            }
            if (tags.length > 0) fm.tags = tags;
            if (categories.length > 0) fm.categories = categories;

            if (item['dc:creator']) {
              fm.author = extractText(item['dc:creator']);
            }

            fm.layout = 'layouts/base.njk';

            // Serialize frontmatter as YAML
            const fmLines = ['---'];
            for (const [key, value] of Object.entries(fm)) {
              if (typeof value === 'string') {
                fmLines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
              } else if (Array.isArray(value)) {
                fmLines.push(`${key}:`);
                for (const v of value) {
                  fmLines.push(`  - "${v}"`);
                }
              } else {
                fmLines.push(`${key}: ${value}`);
              }
            }
            fmLines.push('---');
            fmLines.push('');

            const slug = extractText(item['wp:post_name'] || `item-${item.post_id || Date.now()}`);
            const filename = `${slug}.md`;
            const fileContent = fmLines.join('\n') + markdown;
            await fs.writeFile(path.join(contentDir, filename), fileContent, 'utf8');
          }

          console.log(`Generated markdown files for ${itemFiles.filter(f => f.endsWith('.json')).length} items`);
        } catch (err) {
          console.error('Markdown generation failed:', err instanceof Error ? err.message : err);
          process.exit(1);
        }
      } catch (err) {
        console.error('XML processing failed:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
});

cli.parse();
