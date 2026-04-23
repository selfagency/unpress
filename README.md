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

Contributing

This project is a work-in-progress. Please open issues or PRs for improvements.
