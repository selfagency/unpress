# Testing with real WordPress sites

This document describes how to test the migration utility against real WordPress sites (public demos, local dev, or large production sites) and how to validate output.

1. Prepare an output directory:

```bash
mkdir -p /tmp/unpress-test && cd /tmp/unpress-test
```

2. Create a `.env` file in the test directory:

```dotenv
WP_URL=https://demo.wp.example
WP_USER=user
WP_APP_PASSWORD=app-password
```

3. Run the CLI to generate and export from a WordPress site:

```bash
# Example: run migration from the directory containing .env
npx -y @selfagency/unpress --generate-site --out-dir ./out
```

4. Inspect generated files under `./out/site`:

- `out/site/content/posts` - markdown content
- `out/site/content/authors` - authors
- `out/site/_includes` - templates

5. Optional: start Meilisearch and index the posts (if you want to test search):

```bash
cd docs/meilisearch
docker compose up -d
# then from repo root
npx -y @selfagency/unpress --out-dir ./out --index-meili --meili-host http://127.0.0.1:7700
```

6. Manual checks:

- Open `out/site/index.html` with an 11ty dev server or build and serve the `dist` folder.
- Verify authors list and individual author pages.
- Verify that images are downloaded and the paths are correct.
- Spot-check metadata (date, tags, categories).

7. Notes on large sites

- For very large sites, run the export against a subset or use pagination to avoid memory/execution limits.
- Consider running indexing in batches and increasing Meilisearch resources.
