# Config Schema (unpress.yml)

Full YAML schema. All fields validated by Zod at load time.

## Complete example

```yaml
source:
  type: xml
  xml:
    file: ./export.xml

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

media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: my-media-bucket
      endpoint: https://s3.amazonaws.com
      region: us-east-1

processing:
  concurrency: 2
  intervalCap: 10
  interval: 1000

resume:
  stateDir: ./.unpress/state
```

## `source`

```yaml
source:
  type: api | xml # required
  api:
    baseUrl: https://... # optional, overrides WP_URL
  xml:
    file: ./export.xml # required when type: xml
```

## `content_types`

Array of content type definitions, or a string path to a separate YAML file.

```yaml
content_types: ./docs/types.yml
# or inline:
content_types:
  - name: post           # output type name (required)
    source: post          # WordPress source field (required)
    slug_field: slug
    title_field: title
    body_field: content
    excerpt_field: excerpt
    date_field: date
    fields:
      - name: author
        source: author
        type: object      # optional
```

## `media`

```yaml
media:
  mode: local | reupload | leave # default: leave
  reupload:
    driver: s3 | sftp
    s3:
      bucket: my-bucket # required
      endpoint: https://... # optional, for S3-compatible storage
      region: us-east-1 # optional
    sftp:
      host: server.com # required
      path: /var/www/media # optional
```

## `processing`

```yaml
processing:
  concurrency: 2 # parallel workers (default: 2)
  intervalCap: 10 # tasks per interval window
  interval: 1000 # interval in milliseconds
```

Lower values reduce pressure on rate-limited hosts.

## `resume`

```yaml
resume:
  stateDir: ./.unpress/state
```

Checkpoint data saved here. Delete to force a fresh run.
