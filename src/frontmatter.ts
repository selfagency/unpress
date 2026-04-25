import matter from 'gray-matter';

/**
 * Converts a WordPress post/page object to Markdown frontmatter (YAML).
 * @param meta - The WordPress post/page object.
 * @returns The YAML frontmatter string (with --- delimiters).
 */
export function metadataToFrontmatter(meta: Record<string, any>): string {
  // Pick common fields for demo; extend as needed
  const { id, date, modified, slug, title, excerpt, status, type, author, categories, tags, ...rest } = meta;
  const frontmatter: Record<string, any> = {
    id,
    date,
    modified,
    slug,
    title: title && typeof title === 'object' && 'rendered' in title ? title.rendered : title,
    excerpt: excerpt && typeof excerpt === 'object' && 'rendered' in excerpt ? excerpt.rendered : excerpt,
    status,
    type,
    author,
    categories,
    tags,
    ...rest,
  };
  // Remove undefined/null
  for (const k of Object.keys(frontmatter)) {
    const key = k as keyof typeof frontmatter;
    if (frontmatter[key] == null || frontmatter[key] === '') {
      delete frontmatter[key];
    }
  }
  // Use gray-matter to produce a consistent frontmatter block.
  // Trim trailing newline so callers expecting `---` at the end still work.
  const out = matter.stringify('', frontmatter);
  // Trim all trailing whitespace/newlines so callers that expect the closing `---`
  // to be the last characters still work (tests rely on this).
  return out.replace(/\s+$/, '');
}
