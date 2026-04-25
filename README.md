# Unpress — Instamatically convert your WordPress site to an 11ty static site

![NPM Version](https://img.shields.io/npm/v/@selfagency/unpress) [![CI](https://github.com/selfagency/unpress/actions/workflows/ci.yml/badge.svg)](https://github.com/selfagency/unpress/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/selfagency/unpress/graph/badge.svg?token=bu8564ydRz)](https://codecov.io/gh/selfagency/unpress) [![Codacy Badge](https://app.codacy.com/project/badge/Grade/485824d3c24849baac6d2d77077b9169)](https://app.codacy.com/gh/selfagency/unpress/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=selfagency_unpress&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=selfagency_unpress)

`unpress` is a CLI utility that migrates WordPress posts, pages, taxonomies, and media into a generated 11ty site.

Quick features implemented in this workspace:

- Generate a minimal 11ty project skeleton (layouts, content folders, styles)
- Tag and category index templates
- Authors index and per-author paginated pages (generated when migration writes `site/content/authors`)
- Optional Meilisearch integration (documented below)

## Documentation

For complete guides, API reference, troubleshooting, and examples, visit the [documentation site](https://unpress.self.agency).

## Quick Start

Run migration in 2 steps with `pnpx` or `npx` (no installation needed):

```bash
# 1. Add credentials to .env in the directory where you will run Unpress
WP_URL=https://your-site.com
WP_USER=your-username
WP_APP_PASSWORD=your-app-password

# 2. Run migration without installing the package globally
pnpx @selfagency/unpress --generate-site
# or
npx -y @selfagency/unpress --generate-site
```

Then deploy your new static site by uploading the generated `site/` folder to Netlify, Vercel, or Cloudflare Pages.

## Authors handling

If the source WordPress site has more than one author, the migration will create files under `site/content/authors/` for each author. Each author file should include frontmatter fields `name`, `image`, and `bio`. The generated templates (`authors` and `author`) render an authors index and per-author paginated posts.

## Meilisearch (optional)

Meilisearch is optional. You can either:

- Run Meilisearch locally (native install) and point the indexing script at it, or
- Use Docker Compose (recommended for quick local setup). See `docs/meilisearch.md` for an example `docker-compose.yml` and indexing commands.

If you don't enable Meilisearch, the generated site still works; search UI will be disabled or should fallback to client-side solutions.

### How to enable Meilisearch (quick start)

1. Start Meilisearch via Docker Compose (recommended):

```bash
cd docs/meilisearch
docker compose up -d
```

1. Index generated posts (example):

```bash
npx -y @selfagency/unpress --index-meili --meili-host http://127.0.0.1:7700
```

1. Configure the generated site to know the Meilisearch URL by setting `window.MEILI_CONFIG` in a small inline script in your base layout or via environment-specific templating.

If you prefer not to run Meilisearch, skip the steps above — search UI will display a message that search is not configured.

## Accessibility & cross-platform notes

- A "Skip to main" link is included in generated templates to improve keyboard navigation. Use tools like Accessibility Insights or Lighthouse to audit pages.
- For cross-platform checks, a helper script is available: `node scripts/platform-check.js`.

## Testing with real WordPress sites

See `docs/testing/real-wordpress.md` for instructions on testing migration against public or local WordPress instances and validating output.

## Contributing

This project is a work-in-progress. Please open issues or PRs for improvements.

## CLI flags and environment variables

You can run the CLI (`unpress`) with flags or environment variables. Flags accept either kebab-case or camelCase variants.

## Examples

```bash
# recommended: put credentials in .env, then run with pnpx
pnpx @selfagency/unpress --download-media --generate-site --out-dir ./out

# equivalent npx invocation
npx -y @selfagency/unpress --download-media --generate-site --out-dir ./out

# you can still override values explicitly with flags when needed
pnpx @selfagency/unpress --wp-url https://example.com --wp-user admin --wp-app-password app_pw --generate-site
```

## Relevant environment variables

- `WP_URL` - WordPress base URL
- `WP_USER` - WordPress username
- `WP_APP_PASSWORD` - WordPress application password
- `DOWNLOAD_MEDIA` - Set to `true` to download referenced media by default
- `MEILI_HOST` - Meilisearch host (e.g., `http://127.0.0.1:7700`)
- `MEILI_API_KEY` - Meilisearch API key (if required)
- `MEILI_INDEX` - Meilisearch index name

### S3 reupload variables

- `S3_ENDPOINT` - Custom S3 endpoint (for MinIO, Wasabi, etc.)
- `AWS_REGION` - AWS region (default: `us-east-1`)
- `AWS_ACCESS_KEY_ID` or `S3_ACCESS_KEY` - Access key
- `AWS_SECRET_ACCESS_KEY` or `S3_SECRET_KEY` - Secret key
- `S3_FORCE_PATH_STYLE` - Set to `true` for path-style addressing

### SFTP reupload variables

- `SFTP_HOST` - SFTP server hostname
- `SFTP_PORT` - SFTP port (default: `22`)
- `SFTP_USER` - SFTP username
- `SFTP_PASSWORD` - SFTP password
- `SFTP_PRIVATE_KEY` - Path to SSH private key
