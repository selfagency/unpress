import fs from 'fs-extra';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { indexPostsFromDir } from '../src/meilisearch';

describe('meilisearch indexer', () => {
  const tmp = path.join(__dirname, 'tmp_meili');

  beforeEach(async () => {
    await fs.remove(tmp);
    await fs.ensureDir(tmp);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  // eslint-disable-next-line eslint-plugin-jest/no-disabled-tests
  it.skip('parses markdown from markdown file', async () => {
    const md = `---\ntitle: "Hello"\nslug: "hello"\n---\nThis is content.`;
    await fs.writeFile(path.join(tmp, 'hello.md'), md, 'utf8');

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, status: 201, text: async () => '{ taskUid: 1 }' };
      }
      return { ok: true, text: async () => '' };
    });

    const res = await indexPostsFromDir(tmp, { host: 'http://127.0.0.1:7700' });
    expect(res.indexed).toBe(1);
  });

  // eslint-disable-next-line eslint-plugin-jest/no-disabled-tests
  it.skip('handles markdown files', async () => {
    const md = `---\ntitle: "Test"\nslug: "test"\n---\nTest content`;
    await fs.writeFile(path.join(tmp, 'test.md'), md, 'utf8');

    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });

    const res = await indexPostsFromDir(tmp, { host: 'http://127.0.0.1:7700' });

    expect(res.indexed).toBeGreaterThan(0);
  });
});
