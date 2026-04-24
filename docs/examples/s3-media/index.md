# S3 media reupload

This example is for sites that want to move media off WordPress while keeping the generated site static.

## `.env`

```dotenv
WP_URL=https://example.com
WP_USER=admin
WP_APP_PASSWORD=your-app-password
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
```

## `unpress.yml`

```yaml
source:
  type: api
  api:
    baseUrl: https://example.com

media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: example-bucket
      endpoint: https://s3.amazonaws.com
      region: us-east-1
```

## Command

```bash
pnpx @selfagency/unpress --config ./unpress.yml --generate-site --out-dir ./out
```

## Expected output

- post Markdown rewritten to S3 URLs
- static site output in `out/site/`
- media no longer depends on the original WordPress server

## Good fit

Use this when you want lower WordPress hosting dependency without bundling all media into the static site repo.
