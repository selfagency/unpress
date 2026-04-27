import fs from 'fs-extra';
import fetch from 'node-fetch';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { indexPostsFromDir } from '../src/meilisearch';
import { WordPressApi } from '../src/wordpress';
import { parseWpXmlItems } from '../src/xml-parser';

const fixtureDir = path.resolve(process.cwd(), 'tests/e2e-wordpress');
const composeFile = path.join(fixtureDir, 'docker-compose.yml');
const outputDir = path.join(fixtureDir, 'output');
const credentialsPath = path.join(outputDir, 'credentials.env');
const deterministicXmlPath = path.join(outputDir, 'unpress-e2e-export.xml');
const meiliHost = 'http://127.0.0.1:7711';
const meiliApiKey = 'masterKey';

function hasDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker compose version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const canRun = process.env.RUN_WORDPRESS_E2E === '1' && hasDocker();

function compose(cmd: string, opts?: { ignoreError?: boolean }) {
  try {
    return execSync(`docker compose -f "${composeFile}" ${cmd}`, {
      cwd: fixtureDir,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    if (opts?.ignoreError) return '';
    if (err && typeof err === 'object') {
      const stdout = 'stdout' in err ? String((err as any).stdout || '') : '';
      const stderr = 'stderr' in err ? String((err as any).stderr || '') : '';
      throw new Error(`docker compose failed for: ${cmd}\n${stdout}\n${stderr}`.trim());
    }
    throw err;
  }
}

function parseEnvFile(filePath: string): Record<string, string> {
  const envRaw = fs.readFileSync(filePath, 'utf8');
  const lines = envRaw.split(/\r?\n/).filter(Boolean);
  const out: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    out[k] = v;
  }
  return out;
}

async function waitForMeilisearch(host: string, attempts = 60, intervalMs = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${host}/health`);
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Meilisearch was not ready at ${host}`);
}

describe.skipIf(!canRun)('live WordPress E2E (API + XML export)', () => {
  let envVars: Record<string, string> = {};

  beforeAll(async () => {
    await fs.ensureDir(outputDir);
    await fs.emptyDir(outputDir);

    compose('down -v --remove-orphans', { ignoreError: true });
    compose('up -d db wordpress meilisearch');
    compose('run --rm wpcli');
    await waitForMeilisearch(meiliHost);

    // Verify credentials file was created
    // eslint-disable-next-line eslint-plugin-jest/no-standalone-expect
    expect(await fs.pathExists(credentialsPath)).toBe(true);
    envVars = parseEnvFile(credentialsPath);

    const exportedXmls = (await fs.readdir(outputDir))
      .filter(name => name.endsWith('.xml') && name.startsWith('unpress-e2e-'))
      .map(name => path.join(outputDir, name))
      .sort();

    // Verify XML files were exported
    // eslint-disable-next-line eslint-plugin-jest/no-standalone-expect
    expect(exportedXmls.length).toBeGreaterThan(0);
    // No need to copy the file to itself
    if (exportedXmls[0] !== deterministicXmlPath) {
      await fs.copyFile(exportedXmls[0], deterministicXmlPath);
    }

    // Keep test fixture YAML in sync with actual exported file path.
    // Verify required test fixture files exist
    // eslint-disable-next-line eslint-plugin-jest/no-standalone-expect
    expect(await fs.pathExists(path.join(fixtureDir, 'unpress.api.yml'))).toBe(true);
    // eslint-disable-next-line eslint-plugin-jest/no-standalone-expect
    expect(await fs.pathExists(path.join(fixtureDir, 'unpress.xml.yml'))).toBe(true);
  }, 600000);

  afterAll(async () => {
    if (process.env.KEEP_WORDPRESS_E2E !== '1') {
      compose('down -v --remove-orphans', { ignoreError: true });
    }
  }, 120000);

  it('fetches expected seeded content via WordPress REST API', async () => {
    const wpUrl = envVars.WP_URL;
    const wpUser = envVars.WP_USER;
    const wpAppPassword = envVars.WP_APP_PASSWORD;

    expect(wpUrl).toBeTruthy();
    expect(wpUser).toBeTruthy();
    expect(wpAppPassword).toBeTruthy();

    const api = new WordPressApi({
      baseUrl: wpUrl,
      auth: { username: wpUser, appPassword: wpAppPassword },
    });

    const result = await api.fetchAllPostsPagesAndTaxonomiesPaged({ perPage: 100 });
    expect(result.posts.length).toBeGreaterThanOrEqual(24);
    expect(result.pages.length).toBeGreaterThanOrEqual(12);

    const distinctAuthors = new Set(result.posts.map((p: any) => p.author));
    expect(distinctAuthors.size).toBeGreaterThanOrEqual(2);

    const books = (await api.fetch('/wp-json/wp/v2/book?per_page=100')) as any[];
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThanOrEqual(12);
  }, 120000);

  it('processes WP-CLI XML export through local Unpress CLI config', async () => {
    expect(await fs.pathExists(deterministicXmlPath)).toBe(true);

    const stateDir = path.join(outputDir, '.unpress', 'state');
    await fs.remove(stateDir);

    execSync('pnpm exec tsx bin/cli.ts --config tests/e2e-wordpress/unpress.xml.yml --source xml', {
      cwd: path.resolve(process.cwd()),
      stdio: 'inherit',
      encoding: 'utf8',
    });

    const itemsDir = path.join(stateDir, 'items');
    expect(await fs.pathExists(itemsDir)).toBe(true);
    const generatedItems = (await fs.readdir(itemsDir)).filter(name => name.endsWith('.json'));
    expect(generatedItems.length).toBeGreaterThanOrEqual(48);

    const counts = {
      post: 0,
      page: 0,
      book: 0,
    };

    await parseWpXmlItems(
      deterministicXmlPath,
      async item => {
        const postType = String(item.post_type || '').toLowerCase();
        if (postType === 'post') counts.post += 1;
        if (postType === 'page') counts.page += 1;
        if (postType === 'book') counts.book += 1;
      },
      { resume: false },
    );

    expect(counts.post).toBeGreaterThanOrEqual(24);
    expect(counts.page).toBeGreaterThanOrEqual(12);
    expect(counts.book).toBeGreaterThanOrEqual(12);
  }, 300000);

  it('generates 11ty site and validates content migration', async () => {
    const siteDir = path.join(outputDir, 'site');
    const distDir = path.join(outputDir, 'dist');

    // Clean up previous generation
    await fs.remove(siteDir);
    await fs.remove(distDir);

    // Generate 11ty site structure with Unpress CLI (which also converts items to markdown)
    execSync(
      `pnpm exec tsx bin/cli.ts --config tests/e2e-wordpress/unpress.xml.yml --source xml --generate-site --out-dir tests/e2e-wordpress/output`,
      {
        cwd: path.resolve(process.cwd()),
        stdio: 'inherit',
        encoding: 'utf8',
      },
    );

    // Verify site structure was created
    expect(await fs.pathExists(siteDir)).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, '_includes'))).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'content'))).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'index.md'))).toBe(true);
    expect(await fs.pathExists(path.join(outputDir, '.eleventy.js'))).toBe(true);

    // Verify content directories and markdown files were generated
    expect(await fs.pathExists(path.join(siteDir, 'content', 'posts'))).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'content', 'pages'))).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'content', 'books'))).toBe(true);

    const postsDir = path.join(siteDir, 'content', 'posts');
    const pagesDir = path.join(siteDir, 'content', 'pages');
    const booksDir = path.join(siteDir, 'content', 'books');

    const posts = (await fs.readdir(postsDir)).filter(f => f.endsWith('.md'));
    const pages = (await fs.readdir(pagesDir)).filter(f => f.endsWith('.md'));
    const books = (await fs.readdir(booksDir)).filter(f => f.endsWith('.md'));

    expect(posts.length).toBeGreaterThanOrEqual(24);
    expect(pages.length).toBeGreaterThanOrEqual(12);
    expect(books.length).toBeGreaterThanOrEqual(12);

    // Verify post markdown files contain expected frontmatter
    // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
    const samplePost = posts[0];
    if (samplePost) {
      const postContent = await fs.readFile(path.join(postsDir, samplePost), 'utf8');
      // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
      expect(postContent).toMatch(/^---[\s\S]*?title:/);
      // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
      expect(postContent).toMatch(/layout:/);
      // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
      expect(postContent).toMatch(/date:/);
    }

    // Verify site directory structure exists
    expect(await fs.pathExists(siteDir)).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'content', 'posts'))).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'content', 'pages'))).toBe(true);
    expect(await fs.pathExists(path.join(siteDir, 'content', 'books'))).toBe(true);

    // Build the 11ty site using the generated config in outputDir.
    await fs.copyFile(path.join(outputDir, '.eleventy.js'), path.join(outputDir, '.eleventy.cjs'));
    execSync('pnpm exec npx @11ty/eleventy --config=.eleventy.cjs --input=./site --output=./dist', {
      cwd: outputDir,
      stdio: 'inherit',
      encoding: 'utf8',
    });

    // Verify dist output was generated
    expect(await fs.pathExists(distDir)).toBe(true);
    expect(await fs.pathExists(path.join(distDir, 'index.html'))).toBe(true);

    // Verify posts were generated in dist
    const distPostsDir = path.join(distDir, 'content', 'posts');
    expect(await fs.pathExists(distPostsDir)).toBe(true);
    const postDirs = await fs.readdir(distPostsDir);
    let generatedPostCount = 0;
    let firstPostDir: string | undefined;
    for (const dir of postDirs) {
      const indexPath = path.join(distPostsDir, dir, 'index.html');
      if (await fs.pathExists(indexPath)) {
        generatedPostCount++;
        if (!firstPostDir) firstPostDir = dir;
      }
    }
    expect(generatedPostCount).toBeGreaterThanOrEqual(24);

    // Verify pages were generated in dist
    const distPagesDir = path.join(distDir, 'content', 'pages');
    expect(await fs.pathExists(distPagesDir)).toBe(true);
    const pageDirs = await fs.readdir(distPagesDir);
    let generatedPageCount = 0;
    for (const dir of pageDirs) {
      const indexPath = path.join(distPagesDir, dir, 'index.html');
      if (await fs.pathExists(indexPath)) generatedPageCount++;
    }
    expect(generatedPageCount).toBeGreaterThanOrEqual(12);

    // Verify books were generated in dist
    const distBooksDir = path.join(distDir, 'content', 'books');
    expect(await fs.pathExists(distBooksDir)).toBe(true);
    const bookDirs = await fs.readdir(distBooksDir);
    let generatedBookCount = 0;
    for (const dir of bookDirs) {
      const indexPath = path.join(distBooksDir, dir, 'index.html');
      if (await fs.pathExists(indexPath)) generatedBookCount++;
    }
    expect(generatedBookCount).toBeGreaterThanOrEqual(12);

    // Spot-check sample generated HTML for proper content migration
    // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
    if (firstPostDir) {
      const htmlPath = path.join(distPostsDir, firstPostDir, 'index.html');
      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      // Verify HTML structure and migrated content
      // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
      expect(htmlContent).toMatch(/<html/);
      // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
      expect(htmlContent).toMatch(/<title>/);
      // eslint-disable-next-line eslint-plugin-jest/no-conditional-expect
      expect(htmlContent).toMatch(/<main/);
    }
  }, 600000);

  it('indexes generated posts into meilisearch and returns search hits', async () => {
    const postsDir = path.join(outputDir, 'site', 'content', 'posts');

    expect(await fs.pathExists(postsDir)).toBe(true);

    const indexName = `wp_e2e_posts_${Date.now()}`;
    const result = await indexPostsFromDir(postsDir, {
      host: meiliHost,
      apiKey: meiliApiKey,
      indexName,
    });

    expect(result.indexed).toBeGreaterThanOrEqual(24);

    const res = await fetch(`${meiliHost}/indexes/${indexName}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${meiliApiKey}`,
      },
      body: JSON.stringify({ q: 'Hello world', limit: 5 }),
    });

    expect(res.ok).toBe(true);
    const payload = (await res.json()) as { hits?: Array<{ slug?: string; title?: string }> };

    expect(Array.isArray(payload.hits)).toBe(true);
    expect(payload.hits?.length ?? 0).toBeGreaterThan(0);
    expect(payload.hits?.some(hit => hit.slug === 'hello-world' || hit.title === 'Hello world!')).toBe(true);
  }, 120000);
});

describe.skipIf(canRun)('live WordPress E2E (API + XML export) - Skipped', () => {
  it('requires RUN_WORDPRESS_E2E=1 and Docker to run', () => {
    expect(true).toBe(true);
  });
});
