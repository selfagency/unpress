import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ext(filePath) {
  const idx = filePath.lastIndexOf('.');
  return idx >= 0 ? filePath.slice(idx).toLowerCase() : '';
}

const raw = readFileSync(0, 'utf8').trim();
if (!raw) process.exit(0);

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const toolName = payload.tool_name ?? '';
if (!['editFiles', 'create_file', 'replace_string_in_file'].includes(toolName)) {
  process.exit(0);
}

let toolInput = payload.tool_input ?? payload.toolArgs ?? {};

if (typeof toolInput === 'string') {
  try {
    toolInput = JSON.parse(toolInput);
  } catch {
    toolInput = {};
  }
}

const filePath =
  toolInput.filePath ??
  toolInput.file_path ??
  toolInput.target_file ??
  toolInput.old_file_path ??
  toolInput.new_file_path ??
  toolInput.file?.filePath ??
  toolInput.file?.path ??
  '';
if (!filePath || typeof filePath !== 'string') {
  process.exit(0);
}

const extension = ext(filePath);
const jsTs = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);
const data = new Set(['.yaml', '.yml', '.json', '.jsonc']);
const markdown = new Set(['.md', '.markdown', '.mdown', '.mkdn', '.mdx']);

if (jsTs.has(extension)) {
  run('pnpm', ['run', 'typecheck']);
  run('pnpm', ['exec', 'oxlint', '--fix', filePath]);
  run('pnpm', ['exec', 'oxfmt', '--no-error-on-unmatched-pattern', filePath]);
  process.exit(0);
}

if (data.has(extension)) {
  run('pnpm', ['exec', 'oxfmt', '--no-error-on-unmatched-pattern', filePath]);
  process.exit(0);
}

if (markdown.has(extension)) {
  run('pnpm', ['exec', 'rumdl', 'check', '--fix', filePath]);
  run('pnpm', ['exec', 'rumdl', 'fmt', filePath]);
}
