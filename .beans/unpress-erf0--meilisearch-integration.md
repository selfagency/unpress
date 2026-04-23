---
# unpress-erf0
title: Meilisearch integration
status: completed
type: epic
priority: medium
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T10:59:57Z
parent: unpress-9vhq
blocking:
    - unpress-pri5
---

Integrates Meilisearch for local search, adds Docker Compose, indexing script, and a minimal search UI for the 11ty site.

## Features
- Docker Compose for Meilisearch
- Indexing script for posts/pages
- Minimal search UI (client-side fetch)
- Documentation for Meilisearch usage

## Tasks
- [x] Add Docker Compose file for Meilisearch service
- [x] Implement script to index all posts/pages into Meilisearch
- [x] Add minimal search UI to 11ty site (client-side fetch)
- [x] Document Meilisearch usage in README.md

## Notes
- Meilisearch integration is optional. Users can run Meilisearch locally (native) or via Docker Compose (`docs/meilisearch/docker-compose.yml`).
- Use `src/meilisearch.ts` to index generated markdown files into a Meilisearch index.
