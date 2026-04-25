# CLI Reference

All flags for `pnpx @selfagency/unpress` (or `npx @selfagency/unpress`).

## WordPress connection

| Flag                     | Env var               | Description            |
| ------------------------ | --------------------- | ---------------------- |
| `--wp-url <url>`         | `WP_URL`              | WordPress site URL     |
| `--wp-user <user>`       | `WP_USER`             | WordPress username     |
| `--wp-app-password <pw>` | `WP_APP_PASSWORD`     | Application password   |
| `--download-media`       | `DOWNLOAD_MEDIA=true` | Download media locally |

## Source and config

| Flag                | Description               |
| ------------------- | ------------------------- |
| `--config <file>`   | Path to `unpress.yml`     |
| `--types <file>`    | Path to `types.yml`       |
| `--source <type>`   | `api` or `xml`            |
| `--xml-file <file>` | WordPress XML export file |
| `--resume`          | Resume from checkpoint    |

## Generation

| Flag              | Description                     |
| ----------------- | ------------------------------- |
| `--generate-site` | Generate minimal 11ty project   |
| `--out-dir <dir>` | Output directory (default: cwd) |

## Meilisearch

| Flag                    | Env var         | Description                   |
| ----------------------- | --------------- | ----------------------------- |
| `--index-meili`         | —               | Enable indexing               |
| `--meili-host <url>`    | `MEILI_HOST`    | Host URL                      |
| `--meili-api-key <key>` | `MEILI_API_KEY` | API key                       |
| `--meili-index <name>`  | `MEILI_INDEX`   | Index name (default: `posts`) |

## Processing control

| Flag                | Description                    |
| ------------------- | ------------------------------ |
| `--dry-run`         | Validate config, no operations |
| `--concurrency <n>` | Parallel workers               |
| `--intervalCap <n>` | Tasks per interval             |
| `--interval <ms>`   | Interval in milliseconds       |

## Precedence

CLI flags > environment variables > `unpress.yml` > interactive prompts.
