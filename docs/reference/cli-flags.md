# CLI flags reference

Unpress is designed to work well with `.env`, but CLI flags still matter for per-run overrides, source selection, output control, and indexing.

Typical usage:

```bash
pnpx @selfagency/unpress --generate-site
```

## Credentials and WordPress connection

These flags override values from `.env`:

- `--wp-url <url>`
- `--wp-user <user>`
- `--wp-app-password <password>`
- `--download-media`

Example:

```bash
pnpx @selfagency/unpress --wp-url https://example.com --wp-user admin --wp-app-password app-password --generate-site
```

## Config files and source selection

- `--config <file>` - load a project YAML config file such as `unpress.yml`
- `--types <file>` - load a content types YAML definition such as `types.yml` (shorthand for `--content-types`)
- `--content-types <file>` - same as `--types`
- `--source <type>` - choose `api` or `xml`
- `--xml-file <file>` - path to a WordPress XML export
- `--resume` - resume from saved state when supported

## Site generation and output

- `--generate-site` - generate the 11ty site structure
- `--out-dir <dir>` - choose an output directory
- `--dry-run` - validate configuration without running the migration

## Meilisearch indexing

- `--index-meili` - index generated posts into Meilisearch
- `--meili-host <url>` - override Meilisearch host
- `--meili-api-key <key>` - provide Meilisearch API key
- `--meili-index <name>` - choose the Meilisearch index name

## Processing controls

- `--concurrency <number>` - concurrent workers
- `--intervalCap <number>` - tasks allowed per interval
- `--interval <number>` - interval window in milliseconds

## Recommended pattern

Put stable credentials in `.env`, then use flags only for the current run:

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
```

```bash
pnpx @selfagency/unpress --generate-site --out-dir ./out
```

See [Environment variables](/reference/environment) and [Project config](/reference/project-config).
