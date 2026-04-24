---
name: unpress-migration
description: Configure and run WordPress-to-11ty migrations using Unpress. Use when migrating a WordPress site to static HTML, setting up unpress.yml project config, configuring media handling via local download or S3/SFTP reupload, creating .env files for WordPress credentials, enabling Meilisearch search indexing, troubleshooting migration failures, or customizing generated 11ty site output. Also use when the user mentions unpress, wordpress-to-11ty, wp-export, site generation, or media reupload.
metadata:
  author: selfagency
  version: '1.0'
---

# Unpress Migration

Migrate WordPress sites to 11ty static sites via CLI. Published as `@selfagency/unpress`.

## Migration workflow

1. Create `.env` with WordPress credentials in working directory
2. Run migration with `--generate-site`
3. Build with 11ty, deploy `dist/`

```bash
# .env
WP_URL=https://your-site.com
WP_USER=username
WP_APP_PASSWORD=app-password

# Run migration
pnpx @selfagency/unpress --generate-site --out-dir ./out

# Build static site
cd out && npx @11ty/eleventy
```

Output lands in `out/`:

```text
out/
├── .eleventy.js          # input:'site', output:'dist'
├── assets/styles.css
└── site/
    ├── index.md
    ├── content/posts/*.md
    ├── content/authors/*.md
    └── _includes/layouts/{base,tags,categories,authors,author}.njk
```

## XML source (offline)

For WordPress XML export files instead of live API:

```bash
pnpx @selfagency/unpress --source xml --xml-file ./export.xml --generate-site --resume --out-dir ./out
```

`--resume` continues from checkpoint in `.unpress/state/`. Delete that directory to start fresh.

## Project config

For repeatable migrations, use `unpress.yml` loaded via `--config ./unpress.yml`.

Read [references/config-schema.md](references/config-schema.md) for the full Zod-validated schema with examples.

## Media handling

| Mode       | Config                 | Behavior                                       |
| ---------- | ---------------------- | ---------------------------------------------- |
| `leave`    | default                | Keeps original WordPress URLs                  |
| `local`    | `--download-media`     | Downloads to local, rewrites to relative paths |
| `reupload` | `media.mode: reupload` | Uploads to S3 or SFTP, rewrites URLs           |

For S3/SFTP credentials, use environment variables or `unpress.yml`. Read [references/env-vars.md](references/env-vars.md) when configuring media reupload.

## Meilisearch

```bash
pnpx @selfagency/unpress --index-meili --meili-host http://127.0.0.1:7700 --out-dir ./out
```

Indexes `out/site/content/posts/*.md` into Meilisearch. Requires a running instance.

## Frontmatter schemas

**Post**: `title`, `date`, `slug`, `tags`, `categories`, `author` (object with `name`/`slug`/`image`/`website`), `custom`.

**Author**: `name`, `slug`, `bio`, `image`, `website`.

## Gotchas

- WordPress Application Passwords are not the user's login password. Generate one at WP Admin → Users → Profile → Application Passwords.
- `WP_USER` must be the username, not the email address. The API uses Basic auth with username.
- `.env` must be in the working directory where you run unpress. Keys are uppercase, no quotes around values.
- 11ty config uses `input: 'site'`, `output: 'dist'` — not `input: 'src'`. This is hardcoded in the generator.
- SFTP env var is `SFTP_USER`, not `SFTP_USERNAME`.
- S3 `forcePathStyle` must be `true` for MinIO and other S3-compatible storage. Set `S3_FORCE_PATH_STYLE=true`.
- For XML source, `--xml-file` is required. The export must contain `<item>` elements — empty exports produce no output.
- `--resume` only works for XML source. API source always fetches fresh.
- Rate-limited hosts: use `--concurrency 1 --intervalCap 2 --interval 1000`.

## Troubleshooting

| Symptom               | Cause                     | Fix                                                  |
| --------------------- | ------------------------- | ---------------------------------------------------- |
| 401/403               | Wrong credentials         | Verify username (not email), regenerate App Password |
| `.env` ignored        | Wrong directory or syntax | Run from `.env` directory, uppercase keys, no quotes |
| No posts from XML     | Empty export              | Confirm file has `<item>` elements                   |
| No posts from API     | No published posts        | Verify posts exist and are published                 |
| Media not downloading | Missing flag              | Add `--download-media` or set `DOWNLOAD_MEDIA=true`  |
| Resume corrupted      | Stale checkpoint          | `rm -rf .unpress/state` and rerun                    |

## CLI flags

Read [references/cli-reference.md](references/cli-reference.md) for the complete flag reference.

Precedence: CLI flags > env vars > `unpress.yml` > interactive prompts.

## Validation loop

After migration, verify output:

1. Check `out/site/content/posts/` has `.md` files with frontmatter
2. Check `out/site/content/authors/` has author files
3. Run `cd out && npx @11ty/eleventy` — must complete without errors
4. If media reupload: verify rewritten URLs point to new destination
