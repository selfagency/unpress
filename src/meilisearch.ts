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
  if (!raw.startsWith('---')) return { data: {}, content: raw };
  const parts = raw.split('---');
  // parts: ['', yaml, rest]
  const yamlRaw = parts[1] || '';
  const content = parts.slice(2).join('---').trim();
  const data = YAML.parse(yamlRaw) || {};
  return { data, content };
}

export async function indexPostsFromDir(postsDir: string, cfg: MeiliConfig) {
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

  // create index (safe to call)
  try {
    await fetch(`${cfg.host}/indexes`, { method: 'POST', headers, body: JSON.stringify({ uid: index }) });
  } catch (e) {
    // ignore - index may already exist or host unreachable
    warn('create index request failed (ignored):', e instanceof Error ? e.message : e);
  }

  // push documents in batches
  const batchSize = 1000;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    progress(`uploading documents ${i}-${i + batch.length}`, (i + batch.length) / docs.length);
    const res = await fetch(`${cfg.host}/indexes/${index}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const text = await res.text();
      error('Meilisearch indexing failed:', res.status, text);
      throw new Error(`Meilisearch indexing failed: ${res.status} ${text}`);
    }
  }
  return { indexed: docs.length };
}

export default {
  indexPostsFromDir,
};
