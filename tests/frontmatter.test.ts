import { describe, it, expect } from 'vitest';
import { metadataToFrontmatter } from '../src/frontmatter';

describe('metadataToFrontmatter', () => {
  it('converts minimal post meta to YAML frontmatter', () => {
    const meta = {
      id: 123,
      date: '2024-01-01T00:00:00',
      slug: 'hello-world',
      title: { rendered: 'Hello World' },
      excerpt: { rendered: 'Short summary.' },
      status: 'publish',
      type: 'post',
      author: 1,
      categories: [2, 3],
      tags: [4],
    };
    const fm = metadataToFrontmatter(meta);
    expect(fm).toContain('id: 123');
    expect(fm).toContain('slug: hello-world');
    expect(fm).toContain('title: Hello World');
    expect(fm).toContain('excerpt: Short summary.');
    expect(fm).toContain('categories:');
    expect(fm).toContain('- 2');
    expect(fm).toContain('- 3');
    expect(fm).toContain('tags:');
    expect(fm).toContain('- 4');
    expect(fm.startsWith('---')).toBe(true);
    expect(fm.endsWith('---')).toBe(true);
  });

  it('omits undefined/null/empty fields', () => {
    const meta = {
      id: 1,
      slug: '',
      title: null,
      excerpt: undefined,
      status: 'draft',
    };
    const fm = metadataToFrontmatter(meta);
    expect(fm).toContain('id: 1');
    expect(fm).toContain('status: draft');
    expect(fm).not.toContain('slug:');
    expect(fm).not.toContain('title:');
    expect(fm).not.toContain('excerpt:');
  });
});
