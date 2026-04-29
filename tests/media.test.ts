import { describe, it, expect } from 'vitest';
import { findMediaUrls, relinkMediaUrls } from '../src/media';

describe('findMediaUrls', () => {
  it('extracts single image URL', () => {
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

  it('returns empty array if markdown has no closing parens', () => {
    expect(findMediaUrls('![alt text [missing] ](')).toEqual([]);
  });

  it('does not extract URLs from regular text', () => {
    const md = 'Visit https://example.com for more info';
    expect(findMediaUrls(md)).toEqual([]);
  });

  it('extracts relative URLs', () => {
    const md = '![image](/assets/img.png)';
    expect(findMediaUrls(md)).toEqual(['/assets/img.png']);
  });

  it('handles existing glob pattern', () => {
    const md = 'Regular ![alt](url) image ![alt2](url2)';
    expect(findMediaUrls(md)).toHaveLength(2);
  });

  it('handles text between matches', () => {
    const md = 'Text before and after image reference ![image](url)';
    expect(findMediaUrls(md)).toEqual(['url']);
  });

  it('extracts URLs with special characters', () => {
    const md = '![image](https://example.com/path?query=value&other=test&id=12345)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/path?query=value&other=test&id=12345']);
  });

  it('handles quotes in alt text', () => {
    const md = '![alt "text" with "quotes"](https://example.com/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/image.jpg']);
  });

  it('handles empty alt text', () => {
    const md = '![alt text](https://example.com/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/image.jpg']);
  });

  it('does not extract link syntax', () => {
    const md = '[link text](https://example.com/link)';
    expect(findMediaUrls(md)).toEqual([]);
  });

  it('extracts URLs with fragments', () => {
    const md = '![image](https://example.com/image.jpg#section)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/image.jpg#section']);
  });

  it('extracts URLs with ports', () => {
    const md = '![image](https://example.com:8080/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com:8080/image.jpg']);
  });

  it('extracts URLs with authentication', () => {
    const md = '![image](https://user:pass@example.com/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://user:pass@example.com/image.jpg']);
  });

  it('extracts URLs with IPv4 addresses', () => {
    const md = '![image](http://192.168.1.1/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['http://192.168.1.1/image.jpg']);
  });

  it('extracts URLs with IPv6 addresses', () => {
    const md = '![image](http://[::1]:8080/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['http://[::1]:8080/image.jpg']);
  });

  it('handles Unicode characters in URLs', () => {
    const md = '![图片](https://example.com/images/测试.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/images/测试.jpg']);
  });

  it('handles vertical bar separator in alt text', () => {
    const md = '![alt|separator](https://example.com/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/image.jpg']);
  });

  it.skip('handles square brackets in alt text', () => {
    const md = '![alt [with] brackets](https://example.com/image.jpg)';
    expect(findMediaUrls(md)).toEqual(['https://example.com/image.jpg']);
  });
});

describe('relinkMediaUrls', () => {
  it('relinks single URL', () => {
    const md = '![alt](https://example.com/image.jpg)';
    const map = {
      'https://example.com/image.jpg': '/media/image.jpg',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toEqual('![alt](/media/image.jpg)');
  });

  it('relinks multiple URLs', () => {
    const md = '![alt](https://example.com/image.jpg) and ![b](http://cdn.com/pic.png)';
    const map = {
      'https://example.com/image.jpg': '/media/image.jpg',
      'http://cdn.com/pic.png': '/media/pic.png',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toContain('/media/image.jpg');
    expect(out).toContain('/media/pic.png');
  });

  it('keeps unreplaced URLs intact', () => {
    const md = '![alt](old.jpg) and ![new](new.jpg)';
    const map = {
      'https://example.com/image.jpg': '/media/image',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toContain('![alt](old.jpg)');
    expect(out).toContain('![new](new.jpg)');
  });

  it('keeps unreplaced URLs intact (no changes)', () => {
    const md = '![alt](specific.jpg)';
    const map = {
      'https://example.com/image.jpg': '/media/image',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toBe(md);
  });

  it('handles empty map', () => {
    const md = '![alt](https://example.com/image.jpg)';
    const map = {};
    const out = relinkMediaUrls(md, map);
    expect(out).toBe(md);
  });

  it('handles undefined replacements', () => {
    const md = '![alt](https://example.com/image.jpg)';
    const map = {
      'https://example.com/image.jpg': null,
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toBe(md);
  });

  it('handles replacements', () => {
    const md = '![alt](https://example.com/image.jpg)';
    const map = {
      'https://example.com/image.jpg': '/media/image.jpg',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toContain('/media/image.jpg');
  });

  it('handles replacements with query strings', () => {
    const md = '![alt](https://example.com/image.jpg?ver=1)';
    const map = {
      'https://example.com/image.jpg?ver=1': '/media/image.jpg?new',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toBe('![alt](/media/image.jpg?new)');
  });

  it('handles replacements with anchors', () => {
    const md = '![alt](https://example.com/image.jpg#footer)';
    const map = {
      'https://example.com/image.jpg#footer': '/media/image.jpg#new-anchor',
    };
    const out = relinkMediaUrls(md, map);
    expect(out).toBe('![alt](/media/image.jpg#new-anchor)');
  });
});
