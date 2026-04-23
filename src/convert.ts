import fs from 'fs-extra';
import path from 'path';
import TurndownService from 'turndown';
import YAML from 'yaml';

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
    fm.author = { name: author.name };
    if (author.image) fm.author.image = author.image;
    if (author.bio) fm.author.bio = author.bio;

    // write/update author file using YAML
    const authorSlug = slugify(author.name || 'author');
    const authorFile = path.join(authorsDir, `${authorSlug}.md`);
    const authorFrontObj: Record<string, any> = { name: author.name };
    if (author.image) authorFrontObj.image = author.image;
    if (author.bio) authorFrontObj.bio = author.bio;
    const newAuthorContent = `---\n${YAML.stringify(authorFrontObj)}---\n`;

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
  const outPath = path.join(postsDir, `${outSlug}.md`);
  const frontmatter = `---\n${YAML.stringify(fm)}---\n\n`;
  const contentToWrite = frontmatter + markdown + '\n';
  await fs.writeFile(outPath, contentToWrite, 'utf8');

  return outPath;
}

export default {
  htmlToMarkdown,
  writePostAndAuthorFiles,
};
