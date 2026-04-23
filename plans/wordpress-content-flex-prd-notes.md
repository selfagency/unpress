# PRD Notes: WordPress Content Types & Flexible Import

## Raw Requirements

- Allow repository maintainers to declare custom WordPress content types (post types, taxonomies, field mappings) via a YAML definition file. This definition drives conversion to Markdown/11ty content and mapping of fields->frontmatter.
- Accept a YAML CLI config file to avoid long, repeated CLI flags; CLI flags should override config file values.
- Media handling modes: `local` (download files), `reupload` (download and upload to S3-compatible or SFTP target), `leave` (keep original URLs). Support credentials for S3 or SFTP in config (read from env or config file).
- Support input sources: WordPress JSON REST API and WordPress XML export files. Users can choose one or both. Provide resume capability for both sources.
- Provide rate-limited and concurrent processing (p-queue) with configurable concurrency and rate window.
- Provide robust frontmatter parsing (gray-matter) and content-type schema validation.
- Keep resumable state files under `.unpress/state/` or user-configurable path; store checkpoints and progress metrics in machine-readable JSON.

## Constraints

- Backwards-compatible with existing CLI usage; keep short flags supported.
- Avoid breaking changes to existing frontmatter layout unless user opts-in to new schema.
- Security: avoid writing credentials to logs; recommend using env vars for secrets.
- Performance: support batching for indexing and streaming for very large XML files.

## Inferred Patterns (from codebase)

| Edge Case | Source | Pattern Applied |
|-----------|--------|-----------------|
| Frontmatter parsing | `src/meilisearch.ts` | Use gray-matter (already applied) |
| Media downloads | `src/media.ts` | stream.pipeline used; extend with upload adapters |
| Queueing | `src/processor.ts` | p-queue available; expose options in config |

## Edge Cases

### Auto-handled (following codebase patterns)

- Empty posts directory => indexer skips (already implemented)
- Partial failures during indexing => retries/backoff (already implemented)

### Confirmed by User

- Whether new frontmatter schema should be opt-in or forced.

### Open Questions

- Which fields should be required in content-type definitions by default?
- Should we provide a GUI or web preview for media reuploads? (out of scope for v1)

## Research Findings

- YAML schema should be simple but expressive. Use a small declarative schema (see below sample) and validate with `ajv` using JSON Schema converted from a canonical schema, or use `yaml` + custom checks.
- For S3 uploads, use `@aws-sdk/client-s3` or `minio` compatible SDK; for SFTP use `ssh2-sftp-client`.

## Architecture Options

- Option A: Minimal CLI-first
  - Pros: Fast to implement; reuses existing codepaths; users keep CLI flags
  - Cons: Less discoverable config; limited reupload feature UX

- Option B: Config-first with YAML (recommended)
  - Pros: Declarative, reproducible, easy to store per-project; supports multiple sources and media adapters
  - Cons: Slightly more initial implementation work

- Option C: Server-mode with web UI (future)
  - Pros: UX for non-devs
  - Cons: Large scope; not recommended for v1

**Selected**: Option B (Config-first with YAML) — balances usability and implementation effort.

## Draft YAML Schema (proposal)

```yaml
# top-level config
source:
  type: api|xml
  api:
    baseUrl: https://example.com
    auth:
      username: $WP_USER
      appPassword: $WP_APP_PASSWORD
  xml:
    file: ./wordpress-export.xml

content_types:
  - name: event
    source: post             # WP post type
    slug_field: slug
    title_field: title.rendered
    body_field: content.rendered
    excerpt_field: excerpt.rendered
    date_field: date
    fields:
      - name: location
        source: meta.location
        type: string
      - name: price
        source: meta.price
        type: number

media:
  mode: local|reupload|leave
  reupload:
    driver: s3|sftp
    s3:
      bucket: my-bucket
      region: us-east-1
      endpoint: https://s3.example.com
    sftp:
      host: sftp.example.com
      path: /uploads

processing:
  concurrency: 4
  intervalCap: 10
  interval: 1000

resume:
  stateDir: ./.unpress/state
  checkpointInterval: 100
```

## Tests to add

- Unit tests for YAML content-type validation and mapping to frontmatter
- Integration tests processing a sample XML export
- Tests for media modes including S3 mock and SFTP mock
- Resume tests for both API and XML processing
