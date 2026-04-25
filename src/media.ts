import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
const streamPipeline = promisify(pipeline);

/**
 * Download a file from a URL to a local path.
 * @param url - The URL to download.
 * @param dest - The local file path to save to.
 */
export async function downloadFile(url: string, dest: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to download: ${url}`);
    await fs.ensureDir(path.dirname(dest));
    const fileStream = fs.createWriteStream(dest);
    await streamPipeline(res.body as any, fileStream);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Find all Markdown image URLs in a Markdown string.
 * @param markdown - The Markdown content.
 * @returns Array of URLs.
 */
export function findMediaUrls(markdown: string): string[] {
  const urlPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let match;
  while ((match = urlPattern.exec(markdown))) {
    if (match[1]) urls.push(match[1]);
  }
  return urls;
}

/**
 * Replace media URLs in a Markdown string according to a mapping.
 * @param markdown - The Markdown content.
 * @param map - A mapping from original URL -> replacement path/URL
 * @returns The updated Markdown with URLs replaced.
 */
export function relinkMediaUrls(markdown: string, map: Record<string, string>): string {
  // Replace only URLs that appear in image/link markdown syntax
  return markdown.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (full, prefix, url, suffix) => {
    const replacement = Object.hasOwn(map, url) ? map[url] : undefined;
    if (replacement) return `${prefix}${replacement}${suffix}`;
    return full;
  });
}
