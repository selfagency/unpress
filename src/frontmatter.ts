import YAML from 'yaml';

/**
 * Converts a WordPress post/page object to Markdown frontmatter (YAML).
 * @param meta - The WordPress post/page object.
 * @returns The YAML frontmatter string (with --- delimiters).
 */
export function metadataToFrontmatter(meta: Record<string, any>): string {
  // Pick common fields for demo; extend as needed
  const {
    id,
    date,
    modified,
    slug,
    title,
    excerpt,
    status,
    type,
    author,
    categories,
    tags,
    ...rest
  } = meta;
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
  Object.keys(frontmatter).forEach(
    k => (frontmatter[k] == null || frontmatter[k] === '') && delete frontmatter[k]
  );
  return `---\n${YAML.stringify(frontmatter)}---`;
}
