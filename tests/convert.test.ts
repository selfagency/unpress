import { htmlToMarkdown } from '../src/convert';
import { describe, it, expect } from 'vitest';

describe('htmlToMarkdown', () => {
  it('converts simple HTML to Markdown', () => {
    const html = '<h1>Hello</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Hello');
    expect(md).toContain('=====');
    expect(md).toContain('**bold**');
    expect(md).toContain('_italic_');
  });

  it('handles empty string', () => {
    expect(htmlToMarkdown('')).toBe('');
  });

  it('strips HTML tags', () => {
    const html = '<div><span>Text</span></div>';
    expect(htmlToMarkdown(html)).toBe('Text');
  });
});
