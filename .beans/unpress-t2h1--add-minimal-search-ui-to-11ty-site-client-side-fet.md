---
# unpress-t2h1
title: Add minimal search UI to 11ty site (client-side fetch to Meilisearch)
status: completed
type: task
priority: normal
created_at: 2026-04-23T02:44:59Z
updated_at: 2026-04-23T10:59:57Z
parent: unpress-erf0
---

Add a minimal search UI to the 11ty site that fetches results from Meilisearch.

## Notes

- Added `templates/11ty/_includes/search.njk` and `/assets/search.js`.
- The search UI is disabled if Meilisearch is not configured; it displays a friendly message.
- To enable, set `window.MEILI_CONFIG = { host: 'http://127.0.0.1:7700', apiKey: '...' }` in a small inline script in your base layout or via environment templating.
