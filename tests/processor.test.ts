import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { processItems } from '../src/processor';
import { writePostAndAuthorFiles } from '../src/convert';

describe('processor', () => {
  it('processes posts using writePostAndAuthorFiles', async () => {
    const out = path.join(__dirname, 'processor-out');
    await fs.remove(out);
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
