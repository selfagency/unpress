import fs from 'fs-extra';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { writePostAndAuthorFiles } from '../src/convert';

describe('writePostAndAuthorFiles author preservation', () => {
  it('does not overwrite author file when identical', async () => {
    const outDir = path.join(__dirname, 'out-author');
    await fs.remove(outDir);
    const authorDir = path.join(outDir, 'site', 'content', 'authors');
    await fs.ensureDir(authorDir);
    const authorFile = path.join(authorDir, 'alice-example.md');
    const original = `---\nname: Alice Example\nimage: /img.jpg\n---\n`;
    await fs.writeFile(authorFile, original, 'utf8');

    const post = {
      title: 'Sample',
      slug: 'sample',
      content: '<p>Hello</p>',
      author: { name: 'Alice Example', image: '/img.jpg' },
    };

    await writePostAndAuthorFiles(post, outDir);
    const after = await fs.readFile(authorFile, 'utf8');
    // existing author file should be preserved except we add missing metadata like slug
    expect(after).toContain('name: Alice Example');
    expect(after).toContain('image: /img.jpg');
    expect(after).toContain('slug: alice-example');
  });
});
