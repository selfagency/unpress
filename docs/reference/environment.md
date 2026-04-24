# Environment variables reference

Unpress automatically loads `.env` from the current working directory.

## Common `.env` example

```dotenv
WP_URL=https://your-site.com
WP_USER=your-username
WP_APP_PASSWORD=your-app-password
DOWNLOAD_MEDIA=false

MEILI_HOST=http://127.0.0.1:7700
MEILI_API_KEY=
MEILI_INDEX=posts
```

## WordPress variables

- `WP_URL` - WordPress site URL
- `WP_USER` - WordPress username
- `WP_APP_PASSWORD` - WordPress Application Password

## Optional migration variables

- `DOWNLOAD_MEDIA` - set to `true` to enable media download by default

## S3 reupload variables

These are used when `media.mode` is `reupload` with `driver: s3` and no explicit credentials in `unpress.yml`:

- `S3_ENDPOINT` - Custom S3 endpoint (for S3-compatible storage like MinIO, Wasabi)
- `AWS_REGION` - AWS region (default: `us-east-1`)
- `AWS_ACCESS_KEY_ID` or `S3_ACCESS_KEY` - Access key
- `AWS_SECRET_ACCESS_KEY` or `S3_SECRET_KEY` - Secret key
- `S3_FORCE_PATH_STYLE` - Set to `true` to use path-style addressing

## SFTP reupload variables

These are used when `media.mode` is `reupload` with `driver: sftp` and no explicit credentials in `unpress.yml`:

- `SFTP_HOST` - SFTP server hostname
- `SFTP_PORT` - SFTP port (default: `22`)
- `SFTP_USER` - SFTP username
- `SFTP_PASSWORD` - SFTP password
- `SFTP_PRIVATE_KEY` - Path to SSH private key

## Optional Meilisearch variables

- `MEILI_HOST` - Meilisearch base URL
- `MEILI_API_KEY` - API key when required
- `MEILI_INDEX` - target index name

## Notes

- flags override `.env`
- `.env` should stay local and never be committed
- if you use `pnpx` or `npx` from another directory, Unpress will read the `.env` in that directory instead
