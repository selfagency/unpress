# PRD: WordPress Content Types & Flexible Import

> Status: DRAFT
> Last updated: 2026-04-23

## Problem Statement

Teams migrating content from WordPress into static sites (11ty) need a flexible, repeatable way to map custom WordPress content types and fields into Markdown files with frontmatter. The current tool supports a fixed set of types and flags-only CLI usage; it lacks a declarative content-type schema, a persistent YAML config, flexible media handling (download, reupload, or leave), and support for WordPress XML exports. Resumability across long runs and network interruptions is required.

## Goals and Non-Goals

### Goals

- Allow users to declare custom content types and field mappings via a YAML definition file.
- Provide a YAML CLI config file so users can store project-level settings. CLI flags may override config file values.
- Implement three media handling modes: `local` (download), `reupload` (download then upload to S3/SFTP), and `leave` (keep source URLs).
- Support input from the WordPress REST API and WordPress XML export files; processing should be resumable for both sources.
- Provide configurable, rate-limited concurrency for processing (p-queue) and robust error handling (retry/backoff).

### Non-Goals

- Providing a web UI for configuring mappings in v1.
- Supporting non-HTTP media sources outside S3/SFTP for the initial release.

## Success Criteria

- Users can provide a YAML content-type definition and successfully convert custom types into Markdown with correct frontmatter fields in at least 3 tested example sites.
- Resume works: interrupted runs restart from last checkpoint without duplicating previously processed items.
- Media `reupload` flow can upload to an S3-compatible endpoint or an SFTP server using credentials from environment or config and returns rewired URLs in output Markdown.
- Tests cover API and XML import flows, schema validation, media modes, and resume behavior.

## Scope

### In Scope

- Declarative YAML content-type schema and parser.
- YAML-based CLI config file (`--config path/to/config.yml`) with CLI flag override semantics.
- Media adapters for local download, S3-compatible upload, and SFTP upload.
- XML import parser for WordPress export files (streaming, resumable).
- Resume/state management under `stateDir` with JSON checkpoint files.
- Tests and documentation.

### Out of Scope

- Web UI for mapping and previews (future feature).

## Requirements

### Functional

1. Accept `--config <file.yml>` on CLI; merge with CLI flags (flags win).
2. Load content-type definitions from a YAML file referenced in config or via `--types <types.yml>`.
3. Allow sources: `api` (REST) and `xml` (WP export). When `xml`, the tool should parse the XML and extract posts/pages/custom post types.
4. Media handling modes: `local`, `reupload`, `leave`. When `reupload`, support `s3` and `sftp` under `media.reupload.driver`.
5. Processing must use a queue with configurable `concurrency`, `intervalCap`, and `interval` (for p-queue). Default: concurrency=2.
6. Resume: write checkpoints after `checkpointInterval` items; checkpoints store processed IDs/offsets, current file position for XML, and media upload state.

### Non-functional

- Secure handling of credentials; recommend env vars; do not print secrets.
- Provide good observability: progress logs, per-source metrics, and errors.
- Backwards-compatible default behavior with existing flags.

## User Flows

1. Quick run with flags (backward compatible):

```bash
unpress --wp-url https://example.com --wp-user me --wp-app-password XXX --generate-site
```

1. Project config (recommended):

```yaml
# unpress.yml
source:
  type: api
  api:
    baseUrl: https://example.com
    auth:
      username: $WP_USER
      appPassword: $WP_APP_PASSWORD
content_types: ./types.yml
media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: my-bucket
      endpoint: https://s3.example.com
processing:
  concurrency: 4
  intervalCap: 10
  interval: 1000
resume:
  stateDir: ./.unpress/state
```

Run:

```bash
unpress --config unpress.yml --generate-site
```

1. XML import:

```bash
unpress --config unpress.yml --source xml --xml-file ./wp-export.xml
```

1. Resume after interruption:

```bash
unpress --config unpress.yml --resume
```

## Implementation Plan (high level)

Phase A — Config & Content-Type Schema (2w)

- Define canonical YAML schema for content types (fields, sources, transformations).
- Implement parser + validator (ajv or custom checks).
- Add CLI `--config` flag to load YAML config; implement merge precedence (flags > config > defaults).

Phase B — Source Adapters (API + XML) (2w)

- Implement streaming XML parser that can resume: track file byte offset and processed item index; write checkpoint after N items.
- Enhance API client to store last processed ID/page per type and checkpoint periodically.

Phase C — Media Handling Adapters (2w)

- Implement `local` downloader (existing pipeline), `reupload` adapter with S3 and SFTP implementations, and `leave` behavior.
- Rewire `relinkMediaUrls` to accept post-processing map from uploader.

Phase D — Processing Pipeline & Resume (2w)

- Integrate `src/processor.ts` queue (p-queue) with config-driven options.
- Ensure idempotency: skip already-processed IDs via state files; support dry-run.

Phase E — Tests, Docs, Examples (1w)

- Add unit + integration tests, sample configs and sample `types.yml` for 2-3 content types.
- Update README with config examples and media options.

## Files (impact)

- `src/config.ts` — load/merge YAML config and CLI flags
- `src/content-types.ts` — parse/validate content-type definitions
- `src/source-api.ts` — REST API adapter (resume support)
- `src/source-xml.ts` — streaming XML adapter (resume support)
- `src/media-*` — media adapters: local, s3, sftp

## Problem Statement

Teams migrating content from WordPress into static sites (11ty) need a flexible, repeatable way to map custom WordPress content types and fields into Markdown files with frontmatter. The current tool supports a fixed set of types and flags-only CLI usage; it lacks a declarative content-type schema, a persistent YAML config, flexible media handling (download, reupload, or leave), and support for WordPress XML exports. Resumability across long runs and network interruptions is required.

## Goals and Non-Goals

### Goals

- Allow users to declare custom content types and field mappings via a YAML definition file.

- Provide a YAML CLI config file so users can store project-level settings. CLI flags may override config file values.

- Implement three media handling modes: `local` (download), `reupload` (download then upload to S3/SFTP), and `leave` (keep source URLs).

- Support input from the WordPress REST API and WordPress XML export files; processing should be resumable for both sources.

- Provide configurable, rate-limited concurrency for processing (p-queue) and robust error handling (retry/backoff).

### Non-Goals

- Providing a web UI for configuring mappings in v1.

## Success Criteria

- Users can provide a YAML content-type definition and successfully convert custom types into Markdown with correct frontmatter fields in at least 3 tested example sites.

- Resume works: interrupted runs restart from last checkpoint without duplicating previously processed items.

- Media `reupload` flow can upload to an S3-compatible endpoint or an SFTP server using credentials from environment or config and returns rewired URLs in output Markdown.

- Tests cover API and XML import flows, schema validation, media modes, and resume behavior.

## Scope

### In Scope

- Declarative YAML content-type schema and parser.

- YAML-based CLI config file (`--config path/to/config.yml`) with CLI flag override semantics.

- Media adapters for local download, S3-compatible upload, and SFTP upload.

- XML import parser for WordPress export files (streaming, resumable).

- Resume/state management under `stateDir` with JSON checkpoint files.

- Tests and documentation.

### Out of Scope

- Web UI for mapping and previews (future feature).

## Requirements

### Functional

1. Accept `--config <file.yml>` on CLI; merge with CLI flags (flags win).

1. Load content-type definitions from a YAML file referenced in config or via `--types <types.yml>`.

1. Allow sources: `api` (REST) and `xml` (WP export). When `xml`, the tool should parse the XML and extract posts/pages/custom post types.

1. Media handling modes: `local`, `reupload`, `leave`. When `reupload`, support `s3` and `sftp` under `media.reupload.driver`.

1. Processing must use a queue with configurable `concurrency`, `intervalCap`, and `interval` (for p-queue). Default: concurrency=2.

1. Resume: write checkpoints after `checkpointInterval` items; checkpoints store processed IDs/offsets, current file position for XML, and media upload state.

### Non-functional

- Secure handling of credentials; recommend env vars; do not print secrets.

- Provide good observability: progress logs, per-source metrics, and errors.

- Backwards-compatible default behavior with existing flags.

## User Flows

1. Quick run with flags (backward compatible):

```bash
unpress --wp-url https://example.com --wp-user me --wp-app-password XXX --generate-site
```

1. Project config (recommended):

```yaml
# unpress.yml
source:
  type: api
  api:
    baseUrl: https://example.com
    auth:
      username: $WP_USER
      appPassword: $WP_APP_PASSWORD
content_types: ./types.yml
media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: my-bucket
      endpoint: https://s3.example.com
processing:
  concurrency: 4
  intervalCap: 10
  interval: 1000
resume:
  stateDir: ./.unpress/state
```

Run:

```bash
unpress --config unpress.yml --generate-site
```

1. XML import:

```bash
unpress --config unpress.yml --source xml --xml-file ./wp-export.xml
```

1. Resume after interruption:

```bash
unpress --config unpress.yml --resume
```

## Implementation Plan (high level)

Phase A — Config & Content-Type Schema (2w)

- Define canonical YAML schema for content types (fields, sources, transformations).

- Implement parser + validator (ajv or custom checks).

- Add CLI `--config` flag to load YAML config; implement merge precedence (flags > config > defaults).

Phase B — Source Adapters (API + XML) (2w)

- Implement streaming XML parser that can resume: track file byte offset and processed item index; write checkpoint after N items.

- Enhance API client to store last processed ID/page per type and checkpoint periodically.

Phase C — Media Handling Adapters (2w)

- Implement `local` downloader (existing pipeline), `reupload` adapter with S3 and SFTP implementations, and `leave` behavior.

- Rewire `relinkMediaUrls` to accept post-processing map from uploader.

Phase D — Processing Pipeline & Resume (2w)

- Integrate `src/processor.ts` queue (p-queue) with config-driven options.

- Ensure idempotency: skip already-processed IDs via state files; support dry-run.

Phase E — Tests, Docs, Examples (1w)

- Add unit + integration tests, sample configs and sample `types.yml` for 2-3 content types.

- Update README with config examples and media options.

## Files (impact)

- `src/config.ts` — load/merge YAML config and CLI flags

- `src/content-types.ts` — parse/validate content-type definitions

- `src/source-api.ts` — REST API adapter (resume support)

- `src/source-xml.ts` — streaming XML adapter (resume support)

- `src/media-*` — media adapters: local, s3, sftp

- `src/processor.ts` — existing p-queue processor (extend)

- `docs/` — sample `types.yml` and `unpress.yml`

## Testing

- Unit tests: schema validation, content mapping, media adapters (mocked), resume logic.

- Integration: run with a sample XML export and sample API mock; assert outputs and state checkpoint files.

## Risks & Assumptions

- RISK: Users provide malformed YAML; mitigate by strong validation and clear error messages.

- ASSUMPTION: Users can supply S3/SFTP credentials via env or config; recommend secrets managers for production.

## Related Specs / Further Reading

- `docs/wordpress-content-flex-prd-notes.md`
- `docs/wordpress-content-flex-tech.md` (to be written)
