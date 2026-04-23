---
# unpress-pri5
title: Testing & polish
status: completed
type: epic
priority: medium
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T21:29:01Z
parent: unpress-9vhq
---

Implements unit/integration tests, error handling, accessibility review, and final polish for the migration utility and generated site.

## Features
- Vitest tests (unit/integration)
- Real site testing
- Output validation
- Error handling/logging/progress bars
- Cross-platform compatibility
- Accessibility review
- Final code review/documentation

## Tasks
- [x] Add unit/integration tests with `vitest`
- [x] Test with real WordPress sites (public demo, local dev, large site)
- [x] Validate output: all posts/pages, metadata, media, search
- [x] Add error handling, logging, and progress bars
- [x] Ensure cross-platform compatibility
- [x] Accessibility review (CLI and generated site)
- [x] Final code review and documentation

## Notes
- Added `tests/meilisearch.test.ts` and `tests/convert.post-author.test.ts` and other unit tests.
- Added `src/logger.ts` for logging and progress indicators.
- Added skip-link and `.sr-only` styles in generated templates for improved accessibility.
- Added `docs/testing/real-wordpress.md` with instructions for running the migration against real WordPress sites.
- Added `scripts/platform-check.js` to make platform checks easier in CI or locally.
- This epic is complete.
