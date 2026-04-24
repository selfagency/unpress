# Troubleshooting

This page covers the most common problems when running Unpress.

## First checks

Before diving into edge cases, verify these basics:

- you are running from the same directory as your `.env`
- `.env` is named exactly `.env`
- `WP_URL`, `WP_USER`, and `WP_APP_PASSWORD` are present
- your WordPress Application Password is still valid

## Authentication failures

### `401 Unauthorized` or `403 Forbidden`

Usually this means one of three things:

- the WordPress username is wrong
- the Application Password is wrong or revoked
- the WordPress site blocks or customizes the REST API

Try these checks:

1. open `https://your-site.com/wp-json/` in a browser
2. verify you are using your WordPress username, not your email address
3. create a fresh Application Password and update `.env`

## `.env` is ignored

Unpress calls `dotenv.config()` during config loading, so `.env` should work automatically.

If it is not working:

- run the command from the directory that contains `.env`
- remove extra quotes around the full assignment line
- make sure the keys are uppercase

Correct example:

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
```

## No posts were generated

If `site/content/posts` is empty:

- confirm the source actually contains posts
- for API mode, verify published posts exist in WordPress
- for XML mode, confirm the export file contains post items
- check whether your `types.yml` maps the content types you expect

## Media was not downloaded or rewritten

If images still point at old WordPress URLs or show as broken:

- confirm you used `--download-media` or a reupload config
- verify the original media URLs still work
- confirm the generated `site/media` folder exists when using local download
- confirm S3 or SFTP credentials are valid when using reupload mode

## XML migration stopped partway through

Use resume mode:

```bash
pnpx @selfagency/unpress --source xml --xml-file ./export.xml --generate-site --resume
```

If resume state seems corrupted, delete the checkpoint directory and rerun:

```bash
rm -rf ./.unpress/state
```

## API migration is slow or rate-limited

Reduce request pressure:

```bash
pnpx @selfagency/unpress --concurrency 1 --intervalCap 2 --interval 1000 --generate-site
```

That tells Unpress to back off instead of trying to sprint through a guarded WordPress host.

## Meilisearch indexing fails

Check:

- the Meilisearch server is running
- `MEILI_HOST` points at the correct URL
- the posts directory exists in the generated site
- the API key is correct if your Meilisearch instance requires one

## Still stuck?

Collect these details before opening an issue:

- command used
- whether you ran with `pnpx`, `npx`, or local dev CLI
- whether you used API or XML mode
- whether `.env` was present
- relevant logs or stack trace

Then open an issue at <https://github.com/selfagency/unpress/issues>.
