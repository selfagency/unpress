# Archival migration

This example is for stale blogs and historical sites where the goal is preservation more than active publishing.

## `.env`

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
```

## `unpress.yml`

```yaml
source:
  type: xml
  xml:
    file: ./export.xml

media:
  mode: leave

resume:
  stateDir: ./.unpress/state
```

## Command

```bash
pnpx @selfagency/unpress --config ./unpress.yml --generate-site --resume --out-dir ./out
```

## Expected output

- static content in `out/site/`
- original media URLs preserved
- resume support for large XML exports

## Good fit

Use this when you want to preserve the content structure with minimal moving parts and are comfortable keeping the original media host alive or archived separately.
