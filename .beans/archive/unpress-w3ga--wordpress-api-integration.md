---
# unpress-w3ga
title: WordPress API integration
status: completed
type: epic
priority: high
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T03:11:41Z
parent: unpress-9vhq
blocking:
    - unpress-ammp
---

Implements authenticated REST API access to WordPress, fetching posts, pages, and taxonomies, with YAML-based extensibility and resumable export.

## Features
- node-fetch for HTTP
- Fetch posts, pages, taxonomies
- YAML definition files for extensibility
- Pagination, batching, progress reporting
- Resumable state file

## Tasks
- [x] Use `node-fetch` for authenticated REST API access (app password)
- [x] Fetch all posts, pages, and taxonomies (categories/tags)
- [x] Support YAML definition files for posts/pages/taxonomies (default + extensible)
- [x] Handle pagination, batching, and progress reporting
- [x] Store progress in a resumable state file in output dir
