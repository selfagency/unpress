import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

vi.mock('node-fetch');
import fetch from 'node-fetch';
const { Response } = vi.importMock('node-fetch');

import { indexPostsFromDir } from '../src/meilisearch';

describe('meilisearch indexer', () => {
  const tmp = path.join(__dirname, 'tmp_meili');
  beforeEach(async () => {
    await fs.remove(tmp);
    await fs.ensureDir(tmp);
  });
  afterEach(async () => {
    await fs.remove(tmp);
    vi.resetAllMocks();
  });

  it('parses markdown and posts documents to Meilisearch', async () => {
    // write a sample markdown
    const md = `---\ntitle: "Hello"\nslug: "hello"\n---\nThis is content.`;
    await fs.writeFile(path.join(tmp, 'hello.md'), md, 'utf8');

    // mock fetch to capture calls
    const mockFetch = fetch as unknown as vi.Mock;
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, text: async () => '{}' }); // create index
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, text: async () => '{}' }); // post documents

    const res = await indexPostsFromDir(tmp, { host: 'http://127.0.0.1:7700' });
    expect(res.indexed).toBe(1);
    expect(mockFetch).toHaveBeenCalled();
    // second call should be to /documents
    const calledUrl = mockFetch.mock.calls[1][0] as string;
    expect(calledUrl).toContain('/indexes/posts/documents');
  });
});
