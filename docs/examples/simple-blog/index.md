# Simple blog

This example is for a straightforward blog migration: one author, posts, and local media download.

## `.env`

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
DOWNLOAD_MEDIA=true
```

## Command

```bash
pnpx @selfagency/unpress --generate-site --out-dir ./out
```

## Expected output

- `out/site/content/posts/`
- `out/site/media/`
- `out/site/_includes/layouts/base.njk`

## Good fit

Use this when you want the simplest migration path and your media library is small enough to ship with the site.
