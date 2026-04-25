import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeResolve } from './path-utils.js';

/**
 * Generate a minimal 11ty project structure in the given directory.
 * Creates: .eleventy.js, site/content/posts, site/_includes/layouts/base.njk, site/index.md
 */
export async function generate11tyProject(dest: string) {
  const root = path.resolve(dest);
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

  // create directories
  await fs.ensureDir(safeResolve(root, 'site', '_includes', 'layouts'));
  await fs.ensureDir(safeResolve(root, 'site', 'content', 'posts'));
  // authors collection
  await fs.ensureDir(safeResolve(root, 'site', 'content', 'authors'));
  await fs.ensureDir(safeResolve(root, 'assets'));

  // optional: create a sample author file to seed the authors collection
  const sampleAuthor = `---
name: "Site Author"
image: "/assets/author.jpg"
bio: "This is a sample author bio. Replace with real authors during migration."
---

`;

  // write files
  await fs.writeFile(safeResolve(root, '.eleventy.js'), eleventyConfig, 'utf8');
  await fs.writeFile(safeResolve(root, 'site', 'index.md'), indexMd, 'utf8');

  // sample author file
  await fs.writeFile(safeResolve(root, 'site', 'content', 'authors', 'site-author.md'), sampleAuthor, 'utf8');

  // basic styles
  const styles = `:root { color-scheme: light dark; }
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width: 72ch; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
header nav a { margin-right: 1rem; }
img { max-width: 100%; height: auto; }
.sr-only:not(:focus):not(:active) {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
`;
  await fs.writeFile(safeResolve(root, 'assets', 'styles.css'), styles, 'utf8');

  // Copy custom templates from the repo's templates/11ty directory
  try {
    // Find the templates directory at package root
    const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const templatesDir = path.join(packageRoot, 'templates', '11ty');

    if (await fs.pathExists(templatesDir)) {
      const siteDir = safeResolve(root, 'site');
      const includesDir = safeResolve(root, 'site', '_includes');
      const templatesIncludesDir = path.join(templatesDir, '_includes');

      // Copy top-level template pages (author.njk, tags.njk, etc.) into site root
      const templateFiles = await fs.readdir(templatesDir);
      for (const file of templateFiles) {
        if (file.endsWith('.njk')) {
          const src = path.join(templatesDir, file);
          const dest = safeResolve(siteDir, file);
          await fs.copy(src, dest);
        }
      }

      // Copy includes tree into site/_includes
      if (await fs.pathExists(templatesIncludesDir)) {
        await fs.copy(templatesIncludesDir, includesDir, { overwrite: true });
      }
    }
  } catch (err) {
    // Log but don't fail if template copying fails
    try {
      const { warn } = await import('./logger.js');
      warn(`Failed to copy custom templates: ${err instanceof Error ? err.message : err}`);
    } catch {
      /* ignore */
    }
  }

  // progress message
  try {
    const { progress } = await import('./logger.js');
    progress('templates written');
  } catch {
    /* ignore */
  }

  return {
    files: ['.eleventy.js', 'site/_includes/layouts/base.njk', 'site/index.md'],
  };
}

export default generate11tyProject;
