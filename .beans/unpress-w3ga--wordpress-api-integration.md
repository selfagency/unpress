---
# unpress-w3ga
title: WordPress API integration
status: todo
type: epic
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T02:41:59Z
parent: unpress-9vhq
id: unpress-w3ga
---
Implements authenticated REST API access to WordPress, fetching posts, pages, and taxonomies, with YAML-based extensibility and resumable export.

## Features
- node-fetch for HTTP
- Fetch posts, pages, taxonomies
- YAML definition files for extensibility
- Pagination, batching, progress reporting
- Resumable state file

## Tasks
- [ ] Use `node-fetch` for authenticated REST API access (app password)
- [ ] Fetch all posts, pages, and taxonomies (categories/tags)
- [ ] Support YAML definition files for posts/pages/taxonomies (default + extensible)
- [ ] Handle pagination, batching, and progress reporting
- [ ] Store progress in a resumable state file in output dir
