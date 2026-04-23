import { describe, it, expect } from 'vitest';
import { indexPostsFromDir } from '../src/meilisearch';
import path from 'path';

describe('meilisearch edge cases', () => {
  it('returns zero when posts dir is missing', async () => {
    const missing = path.join(__dirname, 'non-existent-dir');
    const res = await indexPostsFromDir(missing, { host: 'http://127.0.0.1:7700' });
    expect(res).toEqual({ indexed: 0 });
  });
});
