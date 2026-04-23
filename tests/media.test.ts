import { describe, it, expect } from 'vitest';
import { findMediaUrls, relinkMediaUrls } from '../src/media';

describe('findMediaUrls', () => {
  it('extracts image URLs from Markdown', () => {
    const md = '![alt text](https://example.com/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/image.jpg']);
  });

  it('extracts multiple URLs', () => {
    const md = '![img1](a.jpg) text ![img2](b.png)';
    expect(findMediaUrls(md)).toEqual(['a.jpg', 'b.png']);
  });

  it('returns empty array if no media', () => {
    expect(findMediaUrls('no images here')).toEqual([]);
  });

  it('relinks media URLs according to map', () => {
    const md = '![alt](https://example.com/image.jpg) and ![b](http://cdn.com/pic.png)';
    const map = {
      'https://example.com/image.jpg': '/media/image.jpg',
      'http://cdn.com/pic.png': '/media/pic.png',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toContain('![alt](/media/image.jpg)');
    expect(out).toContain('![b](/media/pic.png)');
  });
});
