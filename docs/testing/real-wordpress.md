# Manual testing against a live WordPress blog

Use this guide to validate Unpress with a real WordPress site before release.

## Scope

This test verifies:

- WordPress API authentication
- Content export and Markdown conversion
- Taxonomies and author output
- Media URL behavior
- Generated 11ty project validity

## Prerequisites

- Node.js 20+ and npm/pnpm available
- Local clone of this repository with dependencies installed (`pnpm install`)
- Access to a WordPress site URL
- A WordPress Application Password for a low-privilege test user
- Docker (optional, only for Meilisearch test)

## Safety notes

- Unpress reads content; it does not write to WordPress.
- Use a dedicated test user when possible.
- Do not commit `.env` or any real credentials.

## 1) Prepare local repo environment

```bash
cd /path/to/unpress
pnpm install
```

Create a local `.env` file in the repository root:

```dotenv
WP_URL=https://your-live-blog.example
WP_USER=your-test-user
WP_APP_PASSWORD=your-app-password
```

## 2) Run a baseline migration

```bash
pnpm dev:cli -- --generate-site --out-dir ./out
```

Expected result: command exits successfully and creates `./out/site`.

## 3) Validate generated structure

Check that key folders exist:

- `out/site/content/posts`
- `out/site/content/pages`
- `out/site/content/authors`
- `out/site/_includes`

Quick check:

```bash
find out/site -maxdepth 3 -type d | sort
```

## 4) Manual content QA checklist

Sample at least 5 posts across different dates/authors.

- [ ] Frontmatter includes expected title/date/slug
- [ ] Category and tag metadata are present
- [ ] HTML was converted to readable Markdown
- [ ] Internal links still point to expected targets
- [ ] Embedded images have expected URLs/paths

Sample at least 2 pages:

- [ ] Parent/child pages (if used) look correct
- [ ] Long-form content and headings are preserved

Author/taxonomy checks:

- [ ] Author files exist in `content/authors`
- [ ] Category and tag archives are generated

## 5) Build generated 11ty site

From your repository root, run:

```bash
cp ./out/.eleventy.js ./out/.eleventy.cjs
npx --yes @11ty/eleventy@3 --config=./out/.eleventy.cjs --input=./out/site --output=./out/dist
```

Expected result: static output in `./out/dist` with no build errors.

## 6) Optional: validate search indexing (Meilisearch)

Start Meilisearch from this repository:

```bash
cd docs/meilisearch
docker compose up -d
```

Then run indexing:

```bash
pnpm dev:cli -- --out-dir ./out --index-meili --meili-host http://127.0.0.1:7700
```

Validation:

- [ ] Indexing command exits successfully
- [ ] Index exists in Meilisearch
- [ ] Sample queries return expected posts

## 7) Resume-path test (recommended)

Run once with `--resume` after an interrupted run (or rerun) to verify state recovery:

```bash
pnpm dev:cli -- --generate-site --out-dir ./out --resume
```

Validation:

- [ ] Command resumes cleanly
- [ ] No duplicated content output

## 8) Report template for QA notes

Capture these details in your test report:

- Test date and environment (OS, Node version)
- WordPress source type (`api` or `xml`)
- Command(s) executed
- Output directory used
- Pass/fail per checklist section
- Any regressions with sample file paths

## Related references

- [CLI flags](/reference/cli-flags)
- [Environment variables](/reference/environment)
- [Generated site](/guide/generated-site)
