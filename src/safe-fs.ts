import fs from 'fs-extra';
import path from 'node:path';
import { safeResolve, isAllowedAbsolute, isPathWithin } from './path-utils.js';

function assertAllowed(resolvedPath: string) {
  const norm = path.resolve(resolvedPath);
  if (isPathWithin(process.cwd(), norm)) return;
  if (isAllowedAbsolute(norm)) return;
  throw new Error(`Refusing filesystem access outside workspace or tmp: ${norm}`);
}

export async function ensureDirSafe(base: string, ...segments: string[]) {
  const resolved = safeResolve(base, ...segments);
  assertAllowed(resolved);
  return fs.ensureDir(resolved);
}

export async function writeFileSafe(base: string, data: string, ...segments: string[]) {
  const resolved = safeResolve(base, ...segments);
  assertAllowed(resolved);
  return fs.writeFile(resolved, data, 'utf8');
}

export async function copySafe(
  srcBase: string,
  srcSegments: string[],
  destBase: string,
  destSegments: string[],
  opts?: fs.CopyOptions,
) {
  const src = safeResolve(srcBase, ...srcSegments);
  const dest = safeResolve(destBase, ...destSegments);
  assertAllowed(src);
  assertAllowed(dest);
  return fs.copy(src, dest, opts);
}

export async function readdirSafe(base: string, ...segments: string[]) {
  const resolved = safeResolve(base, ...segments);
  assertAllowed(resolved);
  return fs.readdir(resolved);
}

export async function pathExistsSafe(base: string, ...segments: string[]) {
  const resolved = safeResolve(base, ...segments);
  assertAllowed(resolved);
  return fs.pathExists(resolved);
}

export function pathExistsSyncSafe(base: string, ...segments: string[]) {
  const resolved = safeResolve(base, ...segments);
  assertAllowed(resolved);
  return fs.pathExistsSync(resolved);
}

export function readFileSyncSafe(base: string, ...segments: string[]) {
  const resolved = safeResolve(base, ...segments);
  assertAllowed(resolved);
  return fs.readFileSync(resolved, 'utf8');
}

export default {
  ensureDirSafe,
  writeFileSafe,
  copySafe,
  readdirSafe,
  pathExistsSafe,
  pathExistsSyncSafe,
  readFileSyncSafe,
};
