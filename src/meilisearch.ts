import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import YAML from 'yaml';
import { error, progress, warn } from './logger';

interface MeiliConfig {
  host: string; // e.g. http://127.0.0.1:7700
  apiKey?: string;
  indexName?: string;
}

async function readMarkdownFrontmatter(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8');
  // Match only a leading YAML frontmatter block delimited by `---` at the file start
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!fmMatch) {
    return { data: {}, content: raw };
  }
  const yamlRaw = fmMatch[1] || '';
  const content = raw.slice(fmMatch[0].length).trim();
  const data = YAML.parse(yamlRaw) || {};
  return { data, content };
}

export async function indexPostsFromDir(postsDir: string, cfg: MeiliConfig) {
  if (!(await fs.pathExists(postsDir))) {
    warn(`Posts directory does not exist: ${postsDir} — skipping indexing.`);
    return { indexed: 0 };
  }
  const files = await fs.readdir(postsDir);
  const docs: any[] = [];
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const full = path.join(postsDir, f);
    const { data, content } = await readMarkdownFrontmatter(full);
    const doc = {
      id: data.slug || data.id || f.replace(/\.md$/, ''),
      title: data.title || '',
      slug: data.slug || f.replace(/\.md$/, ''),
      excerpt: data.excerpt || '',
      content: content || '',
      date: data.date || null,
      tags: data.tags || [],
      categories: data.categories || [],
      author: data.author || null,
    };
    docs.push(doc);
  }

  if (!cfg.host) throw new Error('Meilisearch host is required');
  const index = cfg.indexName || 'posts';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['X-Meili-API-Key'] = cfg.apiKey;

  async function safePost(url: string, body: any, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res;
      } catch (err) {
        const wait = 1000 * Math.pow(2, i);
        warn(`POST ${url} failed (attempt ${i + 1}/${attempts}):`, err instanceof Error ? err.message : err);
        if (i < attempts - 1) await new Promise(r => setTimeout(r, wait));
      }
    }
    throw new Error(`Failed POST ${url} after ${attempts} attempts`);
  }

  try {
    await safePost(`${cfg.host}/indexes`, { uid: index }, 2);
  } catch (e) {
    // ignore creation failure if index exists or service unavailable
    warn('create index request failed (ignored):', e instanceof Error ? e.message : e);
  }

  // push documents in batches
  const batchSize = 500;
  if (docs.length === 0) {
    info(`No markdown documents found in ${postsDir}`);
    return { indexed: 0 };
  }
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    progress(`uploading documents ${i}-${i + batch.length}`, (i + batch.length) / docs.length);
    try {
      await safePost(`${cfg.host}/indexes/${index}/documents`, batch, 3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      error('Meilisearch indexing failed for batch:', msg);
      throw new Error(`Meilisearch indexing failed: ${msg}`);
    }
  }
  return { indexed: docs.length };
}

export default {
  indexPostsFromDir,
};
