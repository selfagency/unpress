---
# unpress-uqic
title: Implement script to index all posts/pages into Meilisearch
status: completed
type: task
priority: normal
created_at: 2026-04-23T02:44:59Z
updated_at: 2026-04-23T10:59:57Z
parent: unpress-erf0
---

Implement a script that indexes all posts and pages into Meilisearch.

## Notes
- Added `src/meilisearch.ts` providing `indexPostsFromDir(postsDir, { host, apiKey, indexName })`.
- The script reads markdown frontmatter from post files and uploads batches of documents to Meilisearch via the HTTP API.
- The indexing is optional and only runs when the user invokes it; it is not required for site generation.
