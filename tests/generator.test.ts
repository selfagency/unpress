import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import generate11tyProject from '../src/generator';

describe('generate11tyProject', () => {
  it('creates minimal 11ty structure', async () => {
    const tmp = path.join(os.tmpdir(), `unpress-test-${Date.now()}`);
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
    // cleanup
    await fs.remove(tmp);
  });
});
