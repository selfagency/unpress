import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writePostAndAuthorFiles } from '../src/convert';
import { processItems } from '../src/processor';

describe('processor', () => {
  let out = '';

  beforeEach(async () => {
    out = await fs.mkdtemp(path.join(os.tmpdir(), 'unpress-processor-'));
  });

  afterEach(async () => {
    if (out) await fs.remove(out);
  });

  it('processes posts using writePostAndAuthorFiles', async () => {
    const posts = [
      { title: 'One', slug: 'one', content: '<p>One</p>', author: { name: 'A' } },
      { title: 'Two', slug: 'two', content: '<p>Two</p>', author: { name: 'B' } },
      { title: 'Three', slug: 'three', content: '<p>Three</p>', author: { name: 'C' } },
    ];

    const results = await processItems(
      posts,
      async p => {
        const file = await writePostAndAuthorFiles(p, out);
        return file;
      },
      { concurrency: 2 },
    );

    expect(results.length).toBe(3);
    for (const p of posts) {
      const f = path.join(out, 'site', 'content', 'posts', `${p.slug}.md`);
      expect(await fs.pathExists(f)).toBe(true);
    }
  });
});
