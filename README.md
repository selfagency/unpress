# Unpress — WordPress to 11ty migration utility

This repository contains `unpress`, a TypeScript utility to migrate WordPress posts, pages, taxonomies, and media into a generated 11ty site.

Quick features implemented in this workspace:

- Generate a minimal 11ty project skeleton (layouts, content folders, styles)
- Tag and category index templates
- Authors index and per-author paginated pages (generated when migration writes `site/content/authors`)
- Optional Meilisearch integration (documented below)

Getting started

1. Build/install (using pnpm):

```bash
pnpm install
pnpm build
```

2. Generate a site skeleton (example):

```js
import generate11tyProject from './src/generator';
await generate11tyProject('out');
```

Authors handling

If the source WordPress site has more than one author, the migration will create files under `site/content/authors/` for each author. Each author file should include frontmatter fields `name`, `image`, and `bio`. The generated templates (`authors` and `author`) render an authors index and per-author paginated posts.

Meilisearch (optional)

Meilisearch is optional. You can either:

- Run Meilisearch locally (native install) and point the indexing script at it, or
- Use Docker Compose (recommended for quick local setup). See `docs/meilisearch.md` for an example `docker-compose.yml` and indexing commands.

If you don't enable Meilisearch, the generated site still works; search UI will be disabled or should fallback to client-side solutions.

How to enable Meilisearch (quick start)

1. Start Meilisearch via Docker Compose (recommended):

```bash
cd docs/meilisearch
docker compose up -d
```

2. Index generated posts (example):

```js
import { indexPostsFromDir } from './src/meilisearch';
await indexPostsFromDir('out/site/content/posts', { host: 'http://127.0.0.1:7700' });
```

3. Configure the generated site to know the Meilisearch URL by setting `window.MEILI_CONFIG` in a small inline script in your base layout or via environment-specific templating.

If you prefer not to run Meilisearch, skip the steps above — search UI will display a message that search is not configured.

Accessibility & cross-platform notes

- A "Skip to main" link is included in generated templates to improve keyboard navigation. Use tools like Accessibility Insights or Lighthouse to audit pages.
- For cross-platform checks, a helper script is available: `node scripts/platform-check.js`.

Testing with real WordPress sites

See `docs/testing/real-wordpress.md` for instructions on testing migration against public or local WordPress instances and validating output.

Contributing

This project is a work-in-progress. Please open issues or PRs for improvements.

CLI flags and environment variables

You can run the CLI (`unpress`) with flags or environment variables. Flags accept either kebab-case or camelCase variants.

Examples:

```bash
# using flags
pnpm dev:cli -- --wp-url https://example.com --wp-user admin --wp-app-password "app_pw" --download-media

# using environment variables
export WP_URL=https://example.com
export WP_USER=admin
export WP_APP_PASSWORD=app_pw
pnpm dev:cli -- --generate-site --out-dir ./out
```

Relevant environment variables:

- `WP_URL` - WordPress base URL
- `WP_USER` - WordPress username
- `WP_APP_PASSWORD` - WordPress application password
- `MEILI_HOST` - Meilisearch host (e.g., `http://127.0.0.1:7700`)
-- `MEILI_API_KEY` - Meilisearch API key (if required)
