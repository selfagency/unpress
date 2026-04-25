import fs from 'fs-extra';
import matter from 'gray-matter';
import fetch from 'node-fetch';
import PQueue from 'p-queue';
import { error, info, progress, warn } from './logger.js';
import { safeResolve } from './path-utils.js';

interface MeiliConfig {
  host: string; // e.g. http://127.0.0.1:7700
  apiKey?: string;
  indexName?: string;
}

interface MeiliDocument {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string | null;
  tags: string[];
  categories: string[];
  author: string | null;
}

interface MeiliTask {
  status: string;
  error?: {
    message?: string;
    code?: string;
  };
}

async function readMarkdownFrontmatter(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8');
  // Use gray-matter to parse frontmatter robustly (supports YAML, TOML, etc.)
  const parsed = matter(raw);
  return { data: parsed.data || {}, content: parsed.content || '' };
}

async function parseJsonSafe(res: any) {
  if (typeof res?.json === 'function') {
    try {
      return await res.json();
    } catch {
      // fall through to text parsing
    }
  }
  if (typeof res?.text === 'function') {
    try {
      const raw = await res.text();
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
}

async function waitForTask(cfg: MeiliConfig, taskUid: number, attempts = 60, intervalMs = 250) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${cfg.host}/tasks/${taskUid}`, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to fetch task ${taskUid}: ${res.status} ${body}`);
    }
    const task = (await parseJsonSafe(res)) as MeiliTask;
    if (task?.status === 'succeeded') return;
    if (task?.status === 'failed') {
      const reason = task?.error?.message || task?.error?.code || 'unknown error';
      throw new Error(`Meilisearch task ${taskUid} failed: ${reason}`);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for Meilisearch task ${taskUid}`);
}

export async function indexPostsFromDir(
  postsDir: string,
  cfg: MeiliConfig & { concurrency?: number; intervalCap?: number; interval?: number },
) {
  if (!(await fs.pathExists(postsDir))) {
    warn(`Posts directory does not exist: ${postsDir} — skipping indexing.`);
    return { indexed: 0 };
  }
  const files = await fs.readdir(postsDir);
  const docs: MeiliDocument[] = [];
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const full = safeResolve(postsDir, f);
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
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;

  async function safePost(url: string, body: any, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) {
          const details = await res.text();
          throw new Error(`Status ${res.status} ${details}`);
        }
        return res;
      } catch (err) {
        const wait = 1000 * Math.pow(2, i);
        warn(`POST ${url} failed (attempt ${i + 1}/${attempts}):`, err instanceof Error ? err.message : err);
        if (i < attempts - 1) await new Promise(r => setTimeout(r, wait));
      }
    }
    throw new Error(`Failed POST ${url} after ${attempts} attempts`);
  }

  async function ensureIndexExists(attempts = 5) {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(`${cfg.host}/indexes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ uid: index }),
        });

        if (res.ok) {
          const payload = (await parseJsonSafe(res)) as any;
          if (typeof payload?.taskUid === 'number') await waitForTask(cfg, payload.taskUid);
          return;
        }

        const raw = await res.text();
        let code: string | undefined;
        try {
          const parsed = JSON.parse(raw) as any;
          code = parsed?.code;
        } catch {
          // ignore json parse error
        }

        if (code === 'index_already_exists' || res.status === 409) {
          return;
        }

        throw new Error(`Status ${res.status} ${raw}`);
      } catch (e) {
        const wait = 1000 * Math.pow(2, i);
        warn(`ensure index ${index} failed (attempt ${i + 1}/${attempts}):`, e instanceof Error ? e.message : e);
        if (i < attempts - 1) await new Promise(r => setTimeout(r, wait));
        else throw e;
      }
    }
  }

  await ensureIndexExists();

  // push documents in batches
  const batchSize = 500;
  if (docs.length === 0) {
    info(`No markdown documents found in ${postsDir}`);
    return { indexed: 0 };
  }
  // Use PQueue to control concurrent uploads and rate (intervalCap/interval)
  const pqOpts: any = { concurrency: cfg.concurrency || 1 };
  if (typeof cfg.intervalCap === 'number' && cfg.intervalCap > 0) pqOpts.intervalCap = cfg.intervalCap;
  if (typeof cfg.interval === 'number' && cfg.interval > 0) pqOpts.interval = cfg.interval;
  const queue = new PQueue(pqOpts);

  const uploadPromises: Promise<any>[] = [];
  const taskWaitPromises: Promise<void>[] = [];
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    progress(`scheduling upload documents ${i}-${i + batch.length}`, (i + batch.length) / docs.length);
    async function task() {
      const res = await safePost(`${cfg.host}/indexes/${index}/documents`, batch, 5).catch(err => {
        const msg = err instanceof Error ? err.message : String(err);
        error('Meilisearch indexing failed for batch:', msg);
        throw new Error(`Meilisearch indexing failed: ${msg}`);
      });
      const payload = (await parseJsonSafe(res)) as any;
      if (typeof payload?.taskUid === 'number') {
        taskWaitPromises.push(waitForTask(cfg, payload.taskUid));
      }
      return payload;
    }
    uploadPromises.push(queue.add(task));
  }

  // wait for all uploads to complete
  await queue.onIdle();
  // ensure any rejections surface
  await Promise.all(uploadPromises);
  await Promise.all(taskWaitPromises);
  return { indexed: docs.length };
}

export default {
  indexPostsFromDir,
};
