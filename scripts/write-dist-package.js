import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const rootPkgPath = resolve(__dirname, '..', 'package.json');
  const outDir = resolve(__dirname, '..', 'dist');
  const raw = await readFile(rootPkgPath, 'utf8');
  const { name, version, description, keywords, homepage, bugs, repository, license, author, dependencies } =
    JSON.parse(raw);

  const distPkg = {
    name: name,
    version: version,
    description: description,
    keywords: keywords,
    homepage: homepage,
    bugs: bugs,
    repository: repository,
    license: license,
    author: author,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: {
      '.': {
        import: './index.js',
        types: './index.d.ts',
      },
    },
    dependencies: dependencies,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, 'package.json'), '' + JSON.stringify(distPkg, null, 2) + '\n', 'utf8');
  console.log('Wrote', resolve(outDir, 'package.json'));

  const readmeSrc = resolve(__dirname, '..', 'README.md');
  const readmeDest = resolve(outDir, 'README.md');
  try {
    await copyFile(readmeSrc, readmeDest);
    console.log('Copied', readmeSrc, 'to', readmeDest);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      console.warn('No README.md found; skipping copy.');
      return;
    }
    throw err;
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
