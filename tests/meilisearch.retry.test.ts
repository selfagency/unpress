import fs from 'fs-extra';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// mock node-fetch used by meilisearch
import fetch from 'node-fetch';
vi.mock('node-fetch');
const mockedFetch = fetch as unknown as vi.Mock;

import { indexPostsFromDir } from '../src/meilisearch';

describe('meilisearch retry/backoff', () => {
  it('retries failing POSTs and eventually succeeds', async () => {
    const out = path.join(__dirname, 'meili-retry');
    await fs.remove(out);
    await fs.ensureDir(out);
    const md = `---\ntitle: Test\nslug: test\n---\nContent`;
    await fs.writeFile(path.join(out, 'test.md'), md, 'utf8');

    // First two fetch calls fail (index creation), then succeed; subsequent document pushes succeed
    let call = 0;
    mockedFetch.mockImplementation(async (_url: string, _opts: any) => {
      call++;
      // Simple mock Response-like object
      if (call <= 2) {
        return { ok: false, status: 500, statusText: 'Server Error', text: async () => 'err' };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const res = await indexPostsFromDir(out, { host: 'http://meili.test' });
    expect(res.indexed).toBe(1);
    expect(mockedFetch).toHaveBeenCalled();
  });
});
