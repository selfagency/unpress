import TurndownService from 'turndown';
import fs from 'fs-extra';
import path from 'path';

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

  // Frontmatter — include common metadata
  const frontmatterLines = [
    '---',
    `title: "${(post.title || '').replace(/"/g, '\"') }"`,
  ];
  if (post.date) frontmatterLines.push(`date: "${new Date(post.date).toISOString()}"`);
  if (post.slug) frontmatterLines.push(`slug: "${post.slug}"`);
  if (post.tags && Array.isArray(post.tags)) frontmatterLines.push(`tags: ${JSON.stringify(post.tags)}`);
  if (post.categories && Array.isArray(post.categories)) frontmatterLines.push(`categories: ${JSON.stringify(post.categories)}`);
  if (post.custom && typeof post.custom === 'object') frontmatterLines.push(`custom: ${JSON.stringify(post.custom)}`);

  // Author handling: attach author object in frontmatter and emit author file
  if (post.author) {
    const author = typeof post.author === 'string' ? { name: post.author } : post.author;
    frontmatterLines.push('author:');
    frontmatterLines.push(`  name: "${(author.name || '').replace(/"/g, '\"')}"`);
    if (author.image) frontmatterLines.push(`  image: "${author.image}"`);
    if (author.bio) frontmatterLines.push(`  bio: "${(author.bio || '').replace(/"/g, '\"')}"`);

    // write/update author file
    const authorSlug = slugify(author.name || 'author');
    const authorFile = path.join(authorsDir, `${authorSlug}.md`);
    const authorFront = ['---', `name: "${(author.name || '').replace(/"/g, '\"')}"`];
    if (author.image) authorFront.push(`image: "${author.image}"`);
    if (author.bio) authorFront.push(`bio: "${(author.bio || '').replace(/"/g, '\"')}"`);
    authorFront.push('---', '');

    // Only overwrite if content differs to avoid stomping manual edits
    let existing = null;
    try { existing = await fs.readFile(authorFile, 'utf8'); } catch (e) { /* missing file */ }
    const newAuthorContent = authorFront.join('\n');
    if (existing !== newAuthorContent) {
      await fs.writeFile(authorFile, newAuthorContent, 'utf8');
    }
  }

  frontmatterLines.push('---', '');

  const outSlug = post.slug ? slugify(post.slug) : slugify(post.title || 'post');
  const outPath = path.join(postsDir, `${outSlug}.md`);
  const contentToWrite = frontmatterLines.join('\n') + '\n' + markdown + '\n';
  await fs.writeFile(outPath, contentToWrite, 'utf8');

  return outPath;
}

export default {
  htmlToMarkdown,
  writePostAndAuthorFiles,
};
