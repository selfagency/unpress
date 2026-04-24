# Project config

Use `unpress.yml` when you want a repeatable migration setup that is more structured than a long command.

## Example

```yaml
source:
  type: xml
  xml:
    file: ./export.xml

content_types: ./docs/types.yml

media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: example-bucket
      endpoint: https://s3.example.com
      region: us-east-1

processing:
  concurrency: 2
  intervalCap: 10
  interval: 1000

resume:
  stateDir: ./.unpress/state
```

Run it with:

```bash
pnpx @selfagency/unpress --config ./docs/unpress.yml --generate-site
```

## Top-level keys

- `source` - choose `api` or `xml`
- `content_types` - path to the content type definition file
- `media` - choose how media URLs are handled
- `processing` - concurrency and rate limiting
- `resume` - state directory and resume-related behavior

## Source

### API source

```yaml
source:
  type: api
  api:
    baseUrl: https://example.com
```

Use `.env` for credentials such as `WP_URL`, `WP_USER`, and `WP_APP_PASSWORD`.

### XML source

```yaml
source:
  type: xml
  xml:
    file: ./export.xml
```

## Content types

A `types.yml` file tells Unpress how to map WordPress content into generated files. The `content_types` key in `unpress.yml` can either be a path to a separate YAML file, or an inline array of content type definitions.

### As a file reference

```yaml
content_types: ./docs/types.yml
```

### As inline definitions

```yaml
content_types:
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
      - name: featured_image
        source: featured_media
```

### Content type schema

Each content type object supports these fields:

- `name` (required) - Output type name
- `source` (required) - WordPress source field
- `slug_field` - Field to use for URL slug
- `title_field` - Field to use for title
- `body_field` - Field to use for body content
- `excerpt_field` - Field to use for excerpt
- `date_field` - Field to use for date
- `fields` - Array of additional field mappings, each with `name`, `source`, and optional `type`

## Media modes

### Leave URLs

```yaml
media:
  mode: leave
```

### Download locally

Use `.env` with `DOWNLOAD_MEDIA=true` or pass `--download-media` for one-off runs.

### Reupload

```yaml
media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: example-bucket
      endpoint: https://s3.example.com
      region: us-east-1
```

Or use `driver: sftp` with the related SFTP connection details:

```yaml
media:
  mode: reupload
  reupload:
    driver: sftp
    sftp:
      host: your-server.com
      path: /var/www/media
```

Credentials for S3 or SFTP can be provided in `unpress.yml` or via environment variables. See the [Environment variables reference](./environment.md) for the full list.

## Processing

```yaml
processing:
  concurrency: 2
  intervalCap: 10
  interval: 1000
```

Use lower values if the source WordPress site is rate-limiting requests.

## Resume

```yaml
resume:
  stateDir: ./.unpress/state
```

This is especially useful for large XML imports.

## Recommended pattern

Keep secrets in `.env` and durable structure in `unpress.yml`. That gives you both safety and repeatability.
