import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';

const host = process.env.MEILI_HOST;
const apiKey = process.env.MEILI_API_KEY;

describe('meilisearch integration', () => {
  it('indexes documents into a running Meilisearch instance', async () => {
    if (!host) {
      console.warn('MEILI_HOST not set — skipping integration test');
      return;
    }

    const tmp = path.join(__dirname, 'tmp_meili_integration');
    await fs.remove(tmp);
    await fs.ensureDir(tmp);
    const md = `---\ntitle: "CI Doc"\nslug: "ci-doc"\n---\nCI content`;
    await fs.writeFile(path.join(tmp, 'ci-doc.md'), md, 'utf8');

    const { indexPostsFromDir } = await import('../src/meilisearch');
    const res = await indexPostsFromDir(tmp, { host, apiKey, indexName: 'ci_test_posts' });
    expect(res.indexed).toBeGreaterThan(0);

    // query documents
    const url = `${host}/indexes/ci_test_posts/documents?limit=1`;
    const r = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
    const docs = await r.json();
    expect(Array.isArray(docs)).toBe(true);
  }, 30000);
});
