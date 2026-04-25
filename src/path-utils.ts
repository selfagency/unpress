import path from 'path';

/**
 * Sanitize a path component to prevent directory traversal.
 * Strips leading slashes, `..` segments, and null bytes.
 */
export function sanitizePathComponent(segment: string): string {
  return segment
    .split('\0')
    .join('')
    .replace(/^(\/|\\)+/, '')
    .split(/[/\\]/)
    .filter(part => part !== '..' && part !== '.')
    .join(path.sep);
}

/**
 * Resolve a path against a base directory and verify it stays within it.
 * Throws if the resolved path escapes the base.
 */
export function safeResolve(base: string, ...segments: string[]): string {
  const resolved = path.resolve(base, ...segments.map(sanitizePathComponent));
  const normalizedBase = path.resolve(base);
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error(`Path traversal detected: ${resolved} escapes ${normalizedBase}`);
  }
  return resolved;
}
