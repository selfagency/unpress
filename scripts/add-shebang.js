/* eslint-disable no-undef */
/* eslint-env node */
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const [out] = process.argv.slice(2);
  if (!out) {
    console.error('Usage: node scripts/add-shebang.js <file>');
    process.exit(2);
  }

  const path = resolve(process.cwd(), out);
  const raw = await readFile(path, 'utf8');
  if (raw.startsWith('#!')) {
    console.log('Shebang already present in', path);
    return;
  }
  const outContent = '#!/usr/bin/env node\\n' + raw;
  await writeFile(path, outContent, 'utf8');
  await chmod(path, 0o755);
  console.log('Prepended shebang and set executable mode on', path);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
