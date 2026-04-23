# Testing with real WordPress sites

This document describes how to test the migration utility against real WordPress sites (public demos, local dev, or large production sites) and how to validate output.

1. Prepare an output directory:

```bash
mkdir -p /tmp/unpress-test && cd /tmp/unpress-test
```

2. Run the CLI to generate and export from a WordPress site:

```bash
# Example: run migration (use your WP URL and app password)
pnpm dev:cli -- --wp-url https://demo.wp.example --wp-user user --wp-app-password "app:password" --generate-site --out-dir ./out
```

3. Inspect generated files under `./out/site`:

- `out/site/content/posts` - markdown content
- `out/site/content/authors` - authors
- `out/site/_includes` - templates

4. Optional: start Meilisearch and index the posts (if you want to test search):

```bash
cd docs/meilisearch
docker compose up -d
# then from repo root
pnpm dev:cli -- --out-dir ./out --index-meili --meili-host http://127.0.0.1:7700
```

5. Manual checks:

- Open `out/site/index.html` with an 11ty dev server or build and serve the `dist` folder.
- Verify authors list and individual author pages.
- Verify that images are downloaded and the paths are correct.
- Spot-check metadata (date, tags, categories).

6. Notes on large sites

- For very large sites, run the export against a subset or use pagination to avoid memory/execution limits.
- Consider running indexing in batches and increasing Meilisearch resources.
