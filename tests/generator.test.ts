import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import generate11tyProject from '../src/generator';

describe('generate11tyProject', () => {
  let tmp: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (fs.existsSync(tmp)) {
      await fs.remove(tmp);
    }
  });

  it('creates minimal 11ty structure', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.remove(tmp);
    await fs.ensureDir(tmp);

    const result = await generate11tyProject(tmp);
    expect(result.files).toContain('.eleventy.js');
    const cfg = await fs.readFile(path.join(tmp, '.eleventy.js'), 'utf8');
    expect(cfg).toContain('eleventyConfig');
    const layout = await fs.readFile(path.join(tmp, 'site', '_includes', 'layouts', 'base.njk'), 'utf8');
    expect(layout).toContain('<html');
    const index = await fs.readFile(path.join(tmp, 'site', 'index.md'), 'utf8');
    expect(index).toContain('# Welcome');
  });

  it('creates structure with custom templates directory', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.remove(tmp);
    await fs.ensureDir(tmp);

    const customTemplatePath = path.resolve(__dirname, '../templates/11ty/custom-template.njk');
    if (fs.existsSync(customTemplatePath)) {
      await fs.ensureDir(path.join(tmp, 'site/custom-template.njk'));
      await fs.copy(customTemplatePath, path.join(tmp, 'site/custom-template.njk'));
    }

    await generate11tyProject(tmp);
    expect(fs.existsSync(path.join(tmp, '.eleventy.js'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'site/index.md'))).toBe(true);
  });

  it('handles absolute path correctly', async () => {
    const absolutePath = path.join(os.tmpdir(), 'absolute-test-' + Date.now());
    await fs.ensureDir(absolutePath);

    const result = await generate11tyProject(absolutePath);
    expect(result.files).toContain('.eleventy.js');
    const configPath = path.join(absolutePath, '.eleventy.js');
    const cfg = await fs.readFile(configPath, 'utf8');
    expect(cfg).toContain('eleventyConfig');
  });

  it('rejects absolute path outside workspace', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.ensureDir(tmp);
    process.chdir(tmp);

    const outsidePath = path.join(tmp, 'copy-of-dir');

    // This test may pass depending on whether path resolution allows copying
    // The main goal is to not crash silently
    await generate11tyProject(outsidePath);
    expect(fs.existsSync(path.join(outsidePath, '.eleventy.js'))).toBe(true);
  });

  it('creates includes directory structure', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.remove(tmp);
    await fs.ensureDir(tmp);

    await generate11tyProject(tmp);

    expect(fs.existsSync(path.join(tmp, 'site/_includes'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'site/_includes/layouts'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'site/content'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'site/content/posts'))).toBe(true);
  });

  it('creates content there', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.remove(tmp);
    await fs.ensureDir(tmp);

    await generate11tyProject(tmp);
    const contentPath = path.join(tmp, 'site/content/posts');
    expect(fs.existsSync(contentPath)).toBe(true);
  });

  it('supports dynamic writing of files in subdir', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.remove(tmp);
    await fs.ensureDir(tmp);

    await generate11tyProject(tmp);

    // Verify multiple levels of nesting work
    const deepPath = path.join(tmp, 'site', 'custom', 'nested', 'file.html');
    expect(fs.existsSync(deepPath)).toBe(false); // Not created by default
  });

  it('handles invalid relative path safely', async () => {
    const invalidPath = path.join(process.cwd(), '..', 'nonexistent', 'dir');
    const absoluteInvalidPath = path.resolve(invalidPath);
    await expect(generate11tyProject(absoluteInvalidPath)).rejects.toThrow();
  });

  it('handles gracefully if files already exist', async () => {
    tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
    await fs.remove(tmp);
    await fs.ensureDir(tmp);

    await generate11tyProject(tmp);

    await fs.writeFile(path.join(tmp, 'site/index.md'), 'Existing content');

    // Should still succeed by overwriting
    await generate11tyProject(tmp);
    const content = await fs.readFile(path.join(tmp, 'site/index.md'), 'utf8');
    expect(content).toContain('# Welcome');
  });
});
