import fs from 'fs-extra';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writePostAndAuthorFiles } from '../src/convert';

describe('writePostAndAuthorFiles', () => {
  const tmp = path.join(__dirname, 'tmp_convert');
  beforeEach(async () => {
    await fs.remove(tmp);
    await fs.ensureDir(tmp);
  });
  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('writes a post markdown and an author file', async () => {
    const post = {
      title: 'Test Post',
      slug: 'test-post',
      content: '<p>Hello world</p>',
      date: '2026-04-23',
      author: { name: 'Alice Example', image: '/img/alice.jpg', bio: 'Writer' },
      tags: ['x'],
    };

    const out = await writePostAndAuthorFiles(post, tmp);
    const postPath = path.join(tmp, 'site', 'content', 'posts', 'test-post.md');
    const authorPath = path.join(tmp, 'site', 'content', 'authors', 'alice-example.md');

    expect(out).toBe(postPath);
    expect(await fs.pathExists(postPath)).toBe(true);
    const postContent = await fs.readFile(postPath, 'utf8');
    expect(postContent).toContain('Test Post');
    expect(postContent).toContain('author:');

    expect(await fs.pathExists(authorPath)).toBe(true);
    const authorContent = await fs.readFile(authorPath, 'utf8');
    expect(authorContent).toContain('Alice Example');
    expect(authorContent).toContain('Writer');
  });

  it('does not overwrite author file if identical, but updates when changed', async () => {
    const post = {
      title: 'Another Post',
      slug: 'another-post',
      content: '<p>Ok</p>',
      author: { name: 'Bob', bio: 'Bio1' },
    };
    const authorPath = path.join(tmp, 'site', 'content', 'authors', 'bob.md');

    // first write
    await writePostAndAuthorFiles(post, tmp);
    const content1 = await fs.readFile(authorPath, 'utf8');

    // write again with same author — content should be unchanged
    await writePostAndAuthorFiles(post, tmp);
    const content2 = await fs.readFile(authorPath, 'utf8');
    expect(content2).toBe(content1);

    // change author bio — should update
    post.author.bio = 'Bio2';
    await writePostAndAuthorFiles(post, tmp);
    const content3 = await fs.readFile(authorPath, 'utf8');
    expect(content3).toContain('Bio2');
    expect(content3).not.toBe(content2);
  });
});
