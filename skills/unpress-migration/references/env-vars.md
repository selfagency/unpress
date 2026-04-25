# Environment Variables

Auto-loaded from `.env` in working directory via dotenv.

## WordPress API

| Variable          | Required | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `WP_URL`          | Yes      | WordPress site URL (e.g., `https://mysite.com`) |
| `WP_USER`         | Yes      | WordPress username (not email)                  |
| `WP_APP_PASSWORD` | Yes      | WordPress Application Password                  |
| `DOWNLOAD_MEDIA`  | No       | Set to `true` to download media locally         |

## S3 (media reupload)

| Variable                                   | Required             | Description                          |
| ------------------------------------------ | -------------------- | ------------------------------------ |
| `S3_ENDPOINT`                              | No                   | S3-compatible endpoint URL           |
| `AWS_REGION`                               | No                   | AWS region (default: `us-east-1`)    |
| `AWS_ACCESS_KEY_ID` or `S3_ACCESS_KEY`     | If reuploading to S3 | Access key                           |
| `AWS_SECRET_ACCESS_KEY` or `S3_SECRET_KEY` | If reuploading to S3 | Secret key                           |
| `S3_FORCE_PATH_STYLE`                      | No                   | Set to `true` for path-style S3 URLs |

## SFTP (media reupload)

| Variable           | Required               | Description                                 |
| ------------------ | ---------------------- | ------------------------------------------- |
| `SFTP_HOST`        | If reuploading to SFTP | SFTP server hostname                        |
| `SFTP_PORT`        | No                     | SFTP port (default: 22)                     |
| `SFTP_USER`        | If reuploading to SFTP | SFTP username                               |
| `SFTP_PASSWORD`    | No\*                   | SFTP password (mutually exclusive with key) |
| `SFTP_PRIVATE_KEY` | No\*                   | Path to SSH private key file                |

\*One of `SFTP_PASSWORD` or `SFTP_PRIVATE_KEY` required.

## Meilisearch

| Variable        | Required | Description                             |
| --------------- | -------- | --------------------------------------- |
| `MEILI_HOST`    | No       | Host (default: `http://127.0.0.1:7700`) |
| `MEILI_API_KEY` | No       | Admin API key                           |
| `MEILI_INDEX`   | No       | Index name (default: `posts`)           |

## Precedence

CLI flags > environment variables > interactive prompts.

For media reupload: `unpress.yml` config > env vars > fallback error.
