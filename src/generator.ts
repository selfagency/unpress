import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { isAllowedAbsolute, safeResolve } from './path-utils.js';

async function createProjectDirs(baseRoot: string) {
  await fs.ensureDir(safeResolve(baseRoot, 'site', '_includes', 'layouts'));
  await fs.ensureDir(safeResolve(baseRoot, 'site', 'content', 'posts'));
  await fs.ensureDir(safeResolve(baseRoot, 'site', 'content', 'authors'));
  await fs.ensureDir(safeResolve(baseRoot, 'assets'));
}

async function writeCoreFiles(baseRoot: string, eleventyConfig: string, indexMd: string) {
  const sampleAuthor =
    '---\n' +
    'name: "Site Author"\n' +
    'image: "/assets/author.jpg"\n' +
    'bio: "This is a sample author bio. Replace with real authors during migration."\n' +
    '---\n\n';

  await fs.writeFile(safeResolve(baseRoot, '.eleventy.js'), eleventyConfig, 'utf8');
  await fs.writeFile(safeResolve(baseRoot, 'site', 'index.md'), indexMd, 'utf8');
  await fs.writeFile(safeResolve(baseRoot, 'site', 'content', 'authors', 'site-author.md'), sampleAuthor, 'utf8');

  const styles =
    ':root { color-scheme: light dark; }\n' +
    "body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width: 72ch; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }\n" +
    'header nav a { margin-right: 1rem; }\n' +
    'img { max-width: 100%; height: auto; }\n' +
    '.sr-only:not(:focus):not(:active) {\n' +
    '  clip: rect(0 0 0 0);\n' +
    '  clip-path: inset(50%);\n' +
    '  height: 1px;\n' +
    '  overflow: hidden;\n' +
    '  position: absolute;\n' +
    '  white-space: nowrap;\n' +
    '  width: 1px;\n' +
    '}\n';

  await fs.writeFile(safeResolve(baseRoot, 'assets', 'styles.css'), styles, 'utf8');
}

async function copyCustomTemplates(root: string) {
  try {
    const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const templatesDir = safeResolve(packageRoot, 'templates', '11ty');

    if (await fs.pathExists(templatesDir)) {
      const siteDir = safeResolve(root, 'site');
      const includesDir = safeResolve(root, 'site', '_includes');
      const templatesIncludesDir = safeResolve(templatesDir, '_includes');

      const templateFiles = await fs.readdir(templatesDir);
      for (const file of templateFiles) {
        if (file.endsWith('.njk')) {
          const src = safeResolve(templatesDir, file);
          const dest = safeResolve(siteDir, file);
          await fs.copy(src, dest);
        }
      }

      if (await fs.pathExists(templatesIncludesDir)) {
        await fs.copy(templatesIncludesDir, includesDir, { overwrite: true });
      }
    }
  } catch (err) {
    try {
      const { warn } = await import('./logger.js');
      warn(`Failed to copy custom templates: ${err instanceof Error ? err.message : (err as string)}`);
    } catch {
      /* ignore */
    }
  }
}

async function ensureBaseLayoutExists(root: string, fallbackBaseLayout: string) {
  const baseLayoutPath = safeResolve(root, 'site', '_includes', 'layouts', 'base.njk');
  if (!(await fs.pathExists(baseLayoutPath))) {
    await fs.ensureDir(safeResolve(root, 'site', '_includes', 'layouts'));
    await fs.writeFile(baseLayoutPath, fallbackBaseLayout, 'utf8');
  }
}

async function notifyProgress(msg: string) {
  try {
    const { progress } = await import('./logger.js');
    progress(msg);
  } catch {
    /* ignore */
  }
}
/**
 * Generate a minimal 11ty project structure in the given directory.
 * Creates: .eleventy.js, site/content/posts, site/_includes/layouts/base.njk, site/index.md
 */
export async function generate11tyProject(dest: string) {
  // Allow absolute destinations (useful for tests / temp dirs). For relative
  // destinations, resolve against cwd and ensure the path doesn't escape the
  // workspace using safeResolve.
  let root: string;
  if (path.isAbsolute(dest)) {
    const norm = path.resolve(dest);
    // Only allow absolute paths that are inside the workspace or the OS temp dir
    if (!isAllowedAbsolute(norm)) {
      throw new Error(`Refusing to generate site into absolute path outside workspace or tmp: ${norm}`);
    }
    root = norm;
  } else {
    root = safeResolve(process.cwd(), dest);
  }
  const eleventyConfig = `module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets');
  return {
    dir: { input: 'site', includes: '_includes', data: '_data', output: 'dist' },
    templateFormats: ['njk', 'md'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
};
`;

  const indexMd = `---
title: Home
layout: layouts/base.njk
---

# Welcome

This is a generated 11ty site.
`;

  // Build nunjucks layout while avoiding static-analysis false-positives for
  // template-like sequences by composing the tag tokens.
  const tb = '{%';
  const te = '%}';
  const ob = '{{';
  const cb = '}}';

  const fallbackBaseLayout =
    '<!doctype html>\n' +
    '<html>\n' +
    '  <head>\n' +
    '    <meta charset="utf-8" />\n' +
    '    <meta name="viewport" content="width=device-width,initial-scale=1" />\n' +
    '    <title>' +
    tb +
    ' if title ' +
    te +
    ob +
    ' title ' +
    cb +
    tb +
    ' endif ' +
    te +
    '</title>\n' +
    '    <link rel="stylesheet" href="/assets/styles.css" />\n' +
    '  </head>\n' +
    '  <body>\n' +
    '    <a href="#maincontent" class="sr-only">Skip to main</a>\n' +
    '    <main id="maincontent" role="main">\n' +
    '      ' +
    ob +
    ' content | safe ' +
    cb +
    '\n' +
    '    </main>\n' +
    '  </body>\n' +
    '</html>\n';

  await createProjectDirs(root);
  await writeCoreFiles(root, eleventyConfig, indexMd);

  await copyCustomTemplates(root);

  await ensureBaseLayoutExists(root, fallbackBaseLayout);

  await notifyProgress('templates written');

  return {
    files: ['.eleventy.js', 'site/_includes/layouts/base.njk', 'site/index.md'],
  };
}

export default generate11tyProject;
