# WordPress live E2E fixture

This fixture spins up a disposable WordPress + MariaDB stack, seeds deterministic content with WP-CLI, exports XML, and validates Unpress behavior against both API and XML flows.

## What it seeds

- 2 author accounts (`author1`, `author2`)
- 24 posts total (12 per author)
- 12 pages
- 1 custom post type (`book`) via MU plugin, with 12 entries
- Categories and tags for post metadata coverage

## Files

- `docker-compose.yml` - WordPress/MariaDB/WP-CLI stack
- `scripts/seed-and-export.sh` - install, seed, app-password generation, XML export
- `unpress.api.yml` - API source config example
- `unpress.xml.yml` - XML source config example
- `output/` - generated XML and credentials during tests

## Run test

From repo root:

```bash
RUN_WORDPRESS_E2E=1 pnpm test -- tests/e2e-wordpress.live.test.ts
```

To keep containers/volumes for debugging:

```bash
RUN_WORDPRESS_E2E=1 KEEP_WORDPRESS_E2E=1 pnpm test -- tests/e2e-wordpress.live.test.ts
```
