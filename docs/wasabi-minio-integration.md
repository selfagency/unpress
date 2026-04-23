# Wasabi / MinIO Integration Example

This document shows how to configure `unpress` to upload media to an S3-compatible provider such as Wasabi or MinIO using the built-in `@aws-sdk/client-s3` helper.

Environment variables (example for Wasabi):

```
export S3_ENDPOINT=https://s3.wasabisys.com
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=YOUR_WASABI_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_WASABI_SECRET
export S3_FORCE_PATH_STYLE=false
```

Example `unpress.yml` snippet:

```yaml
media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: my-wasabi-bucket
      endpoint: https://s3.wasabisys.com
      region: us-east-1
      # optional: accessKeyId/secretAccessKey (prefer env vars)
      # accessKeyId: YOUR_WASABI_KEY
      # secretAccessKey: YOUR_WASABI_SECRET
      prefix: uploads
```

Usage (generally):

```
unpress --config unpress.yml --source xml --xml-file ./wp-export.xml
```

The CLI will construct an S3 client from `unpress.yml` when present, or fall back to environment variables. For local testing you can point `S3_ENDPOINT` at a MinIO instance:

```
export S3_ENDPOINT=http://127.0.0.1:9000
export AWS_ACCESS_KEY_ID=minio
export AWS_SECRET_ACCESS_KEY=minio123
export S3_FORCE_PATH_STYLE=true
```

Notes:
- Use `S3_FORCE_PATH_STYLE=true` for some setups (MinIO, older providers).
- Wasabi supports SIGv4; standard AWS SDK configuration works.
