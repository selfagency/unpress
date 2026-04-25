import os from 'os';
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

/**
 * Return true if `target` is inside `base`.
 */
export function isPathWithin(base: string, target: string): boolean {
  const normBase = path.resolve(base);
  const normTarget = path.resolve(target);
  return normTarget === normBase || normTarget.startsWith(normBase + path.sep);
}

/**
 * Allow absolute paths only if they live inside the workspace root or the OS temp
 * directory. This is used to safely permit test harnesses to use /tmp while
 * preventing arbitrary absolute path writes.
 */
export function isAllowedAbsolute(target: string): boolean {
  const normTarget = path.resolve(target);
  if (isPathWithin(process.cwd(), normTarget)) return true;
  const tmp = os.tmpdir();
  if (isPathWithin(tmp, normTarget)) return true;
  return false;
}
