# Multi-author blog

This example is for WordPress sites with multiple writers and author archive pages.

## `.env`

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
```

## `types.yml`

```yaml
- name: post
  source: post
  slug_field: slug
  title_field: title
  body_field: content
  excerpt_field: excerpt
  date_field: date
  fields:
    - name: author
      source: author
```

## Command

```bash
pnpx @selfagency/unpress --types ./types.yml --generate-site --out-dir ./out
```

## Expected output

- `out/site/content/authors/`
- `out/site/content/posts/`
- author pages rendered by the generated templates

## Good fit

Use this when preserving author attribution is part of the migration goal.
