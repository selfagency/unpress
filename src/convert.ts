import fs from 'fs-extra';
import path from 'path';
import TurndownService from 'turndown';
import matter from 'gray-matter';
import { downloadToLocal } from './media-adapters.js';
import { safeResolve } from './path-utils.js';

/**
 * Converts HTML content to Markdown using turndown.
 * @param html - The HTML string to convert.
 * @returns The converted Markdown string.
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService();
  return turndownService.turndown(html);
}

function slugify(value: string) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Write a post Markdown file with frontmatter and ensure an author file exists/updated.
 * @param post - Post object with at least { title, date, content, slug, author }
 * @param outDir - Root output directory (where `site/content` lives)
 */
export async function writePostAndAuthorFiles(post: any, outDir: string) {
  const postsDir = path.join(outDir, 'site', 'content', 'posts');
  const authorsDir = path.join(outDir, 'site', 'content', 'authors');
  await fs.ensureDir(postsDir);
  await fs.ensureDir(authorsDir);

  const markdown = htmlToMarkdown(post.content || post.excerpt || '');

  // Build frontmatter object and serialize with YAML for correctness
  const fm: Record<string, any> = {};
  if (post.title) fm.title = post.title;
  if (post.date) fm.date = new Date(post.date).toISOString();
  if (post.slug) fm.slug = post.slug;
  if (post.tags && Array.isArray(post.tags)) fm.tags = post.tags;
  if (post.categories && Array.isArray(post.categories)) fm.categories = post.categories;
  if (post.custom && typeof post.custom === 'object') fm.custom = post.custom;

  // Author handling: attach author object in frontmatter and emit author file
  if (post.author) {
    const author = typeof post.author === 'string' ? { name: post.author } : post.author;
    // derive slug from author name
    const authorSlug = slugify(author.name || 'author');
    fm.author = { name: author.name, slug: authorSlug };
    if (author.bio) fm.author.bio = author.bio;
    // collect website/url if available from various possible properties
    const website = author.website || author.url || author.website_url || author.user_url || null;
    if (website) fm.author.website = website;

    // handle image: attempt to download remote image into site assets and reference local path
    if (author.image) {
      try {
        const assetsDir = path.join(outDir, 'site', 'assets', 'authors');
        await fs.ensureDir(assetsDir);
        const downloaded = await downloadToLocal(author.image, assetsDir);
        // make a site-root-relative URL path (posix)
        const rel = path.relative(path.join(outDir, 'site'), downloaded).split(path.sep).join('/');
        fm.author.image = '/' + rel;
      } catch (err) {
        // if download fails, fall back to original URL
        fm.author.image = author.image;
      }
    }

    // write/update author file using YAML
    const authorFile = safeResolve(authorsDir, `${authorSlug}.md`);
    const authorFrontObj: Record<string, any> = { name: author.name, slug: authorSlug };
    if (fm.author.image) authorFrontObj.image = fm.author.image;
    if (author.bio) authorFrontObj.bio = author.bio;
    if (website) authorFrontObj.website = website;
    // Normalize author frontmatter to a single trailing newline to match existing file style
    const authorFm = matter.stringify('', authorFrontObj);
    const newAuthorContent = authorFm.replace(/\s+$/, '') + '\n';

    // Only overwrite if content differs to avoid stomping manual edits
    let existing = null;
    try {
      existing = await fs.readFile(authorFile, 'utf8');
    } catch {
      /* missing file */
    }
    if (existing !== newAuthorContent) {
      await fs.writeFile(authorFile, newAuthorContent, 'utf8');
    }
  }

  const outSlug = post.slug ? slugify(post.slug) : slugify(post.title || 'post');
  const outPath = safeResolve(outDir, 'site', 'content', 'posts', `${outSlug}.md`);
  const contentToWrite = matter.stringify(markdown, fm);
  await fs.writeFile(outPath, contentToWrite, 'utf8');

  return outPath;
}

export default {
  htmlToMarkdown,
  writePostAndAuthorFiles,
};
