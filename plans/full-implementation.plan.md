---
goal: TypeScript npx utility to migrate WordPress posts/pages/taxonomies to 11ty static site with Meilisearch, using node-fetch, cac, @inquirer/prompts, and vitest; supports app passwords, env var auth, optional media download, YAML-based extensibility, resumable exports, MIT license
version: 1.1
date_created: 2026-04-22
last_updated: 2026-04-22
owner: GitHub Copilot (GPT-4.1)
status: 'Planned'
tags: [feature, migration, static-site, wordpress, 11ty, typescript, meilisearch, npx, utility, cac, node-fetch, vitest, yaml, resumable, mit]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan details a TypeScript utility, executable via `npx`, to migrate WordPress posts, pages, and taxonomies to a new 11ty static site, preserving metadata and supporting Meilisearch-powered search. The tool uses `node-fetch` for HTTP, `cac` for CLI, `@inquirer/prompts` for interactive input, and `vitest` for testing. It supports WordPress app passwords, reads credentials from env vars or prompts, optionally downloads referenced media, and is extensible via YAML definition files for future custom post type support. The export is resumable, and the project is MIT licensed.

---

## 1. Requirements & Constraints

- **REQ-001**: Executable via `npx`, no global install required.
- **REQ-002**: User provides WordPress URL, app password, and username via CLI flags, env vars, or interactive prompt.
- **REQ-003**: Only migrate posts, pages, and taxonomies (categories/tags); extensibility for custom post types via YAML definition files (future roadmap).
- **REQ-004**: Convert content to Markdown with all original metadata (title, date, author, tags, categories, slugs, custom fields).
- **REQ-005**: Optionally download referenced media if user specifies; otherwise, preserve original URLs (e.g., CDN).
- **REQ-006**: Generate a fresh 11ty project structure with all content in correct folders.
- **REQ-007**: Integrate Meilisearch for local search (Docker Compose for dev), with a minimal search UI.
- **REQ-008**: Output is a single output folder for the 11ty site; operation is resumable (tracks progress, can continue after interruption).
- **REQ-009**: If not resuming, output folder is recreated and all items are reprocessed.
- **REQ-010**: All code in TypeScript, with type safety and robust error handling.
- **REQ-011**: Use `node-fetch` for HTTP, `cac` for CLI, `@inquirer/prompts` for prompts, `vitest` for testing.
- **REQ-012**: Credentials never written to disk or logs.
- **REQ-013**: MIT license.
- **SEC-001**: Validate/sanitize all user input and file paths.
- **CON-001**: Only open-source dependencies.
- **GUD-001**: Follow 11ty and Meilisearch best practices.
- **PAT-001**: Use YAML for definition files (posts, pages, taxonomies) to allow user extensibility.

---

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Project scaffolding, CLI, and configuration

| Task     | Description                                                                 | Completed | Date       |
|----------|-----------------------------------------------------------------------------|-----------|------------|
| TASK-001 | Scaffold TypeScript project with CLI entrypoint (`bin/cli.ts`)              |           |            |
| TASK-002 | Set up `package.json` with npx-executable config (bin field, build scripts) |           |            |
| TASK-003 | Implement CLI argument parsing with `cac`                                   |           |            |
| TASK-004 | Implement interactive prompt fallback with `@inquirer/prompts`              |           |            |
| TASK-005 | Support env var loading for credentials (dotenv)                            |           |            |
| TASK-006 | Validate and sanitize all user input                                        |           |            |

### Implementation Phase 2

- GOAL-002: WordPress API integration and content fetching

| Task     | Description                                                                 | Completed | Date       |
|----------|-----------------------------------------------------------------------------|-----------|------------|
| TASK-007 | Use `node-fetch` for authenticated REST API access (app password)           |           |            |
| TASK-008 | Fetch all posts, pages, and taxonomies (categories/tags)                    |           |            |
| TASK-009 | Support YAML definition files for posts/pages/taxonomies (default + extensible) |           |            |
| TASK-010 | Handle pagination, batching, and progress reporting                         |           |            |
| TASK-011 | Store progress in a resumable state file in output dir                      |           |            |

### Implementation Phase 3

- GOAL-003: Content conversion and 11ty project generation

| Task     | Description                                                                 | Completed | Date       |
|----------|-----------------------------------------------------------------------------|-----------|------------|
| TASK-012 | Use `turndown` for HTML→Markdown conversion                                 |           |            |
| TASK-013 | Map all metadata to Markdown frontmatter (YAML/JSON)                        |           |            |
| TASK-014 | Optionally download referenced media (if user specifies)                    |           |            |
| TASK-015 | Relink media URLs in Markdown if downloaded                                 |           |            |
| TASK-016 | Generate 11ty project structure (config, content, layouts)                  |           |            |
| TASK-017 | Write all posts/pages as Markdown files with correct frontmatter            |           |            |
| TASK-018 | Generate tag/category index pages                                           |           |            |
| TASK-019 | Copy/generate default 11ty layouts/templates                                |           |            |
| TASK-020 | Add README.md with usage instructions                                       |           |            |

### Implementation Phase 4

- GOAL-004: Meilisearch integration and search UI

| Task     | Description                                                                 | Completed | Date       |
|----------|-----------------------------------------------------------------------------|-----------|------------|
| TASK-021 | Add Docker Compose file for Meilisearch service                             |           |            |
| TASK-022 | Implement script to index all posts/pages into Meilisearch                  |           |            |
| TASK-023 | Add minimal search UI to 11ty site (client-side fetch to Meilisearch)       |           |            |
| TASK-024 | Document Meilisearch usage in README.md                                     |           |            |

### Implementation Phase 5

- GOAL-005: Testing, validation, and polish

| Task     | Description                                                                 | Completed | Date       |
|----------|-----------------------------------------------------------------------------|-----------|------------|
| TASK-025 | Add unit/integration tests with `vitest`                                    |           |            |
| TASK-026 | Test with real WordPress sites (public demo, local dev, large site)         |           |            |
| TASK-027 | Validate output: all posts/pages, metadata, media, search                   |           |            |
| TASK-028 | Add error handling, logging, and progress bars                              |           |            |
| TASK-029 | Ensure cross-platform compatibility                                         |           |            |
| TASK-030 | Accessibility review (CLI and generated site)                               |           |            |
| TASK-031 | Final code review and documentation                                         |           |            |

---

## 3. Alternatives

- **ALT-001**: Use commander/yargs for CLI (rejected: cac is lighter, more modern)
- **ALT-002**: Use old inquirer (rejected: use @inquirer/prompts for modern API)
- **ALT-003**: Use node-wpapi (rejected: node-fetch is lighter and more flexible for custom YAML mapping)
- **ALT-004**: Download all media by default (rejected: user should control, supports CDN use cases)
- **ALT-005**: Support incremental sync (future roadmap, not in v1)

---

## 4. Dependencies

- **DEP-001**: [node-fetch](https://www.npmjs.com/package/node-fetch) for HTTP
- **DEP-002**: [cac](https://github.com/cacjs/cac) for CLI
- **DEP-003**: [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts) for prompts
- **DEP-004**: [turndown](https://www.npmjs.com/package/turndown) for HTML→Markdown
- **DEP-005**: [js-yaml](https://www.npmjs.com/package/js-yaml) for YAML definition files
- **DEP-006**: [fs-extra](https://www.npmjs.com/package/fs-extra) for file ops
- **DEP-007**: [chalk](https://www.npmjs.com/package/chalk) for CLI output
- **DEP-008**: [ora](https://www.npmjs.com/package/ora) or [progress](https://www.npmjs.com/package/progress) for progress bars
- **DEP-009**: [dotenv](https://www.npmjs.com/package/dotenv) for env config
- **DEP-010**: [vitest](https://www.npmjs.com/package/vitest) for testing
- **DEP-011**: [11ty](https://www.11ty.dev/docs/) for static site generation
- **DEP-012**: [Meilisearch](https://www.meilisearch.com/docs/resources/self_hosting/getting_started/quick_start) (Docker)

---

## 5. Files

- **FILE-001**: `bin/cli.ts` — CLI entrypoint (cac)
- **FILE-002**: `src/config.ts` — Config loader/validator (env, flags, prompts)
- **FILE-003**: `src/wp.ts` — WordPress API integration (node-fetch)
- **FILE-004**: `src/definitions/` — YAML definition files for posts/pages/taxonomies
- **FILE-005**: `src/download.ts` — Media download/relink logic
- **FILE-006**: `src/convert.ts` — HTML→Markdown and metadata mapping
- **FILE-007**: `src/11ty.ts` — 11ty project generator
- **FILE-008**: `src/meilisearch.ts` — Meilisearch integration/indexing
- **FILE-009**: `src/search-ui.js` — Minimal search UI for 11ty site
- **FILE-010**: `docker-compose.yml` — Meilisearch service
- **FILE-011**: `README.md` — Usage and documentation
- **FILE-012**: `tests/` — Vitest unit/integration tests
- **FILE-013**: `.env.example` — Example env vars for credentials
- **FILE-014**: `LICENSE` — MIT license
- **FILE-015**: `.resume.json` — Progress tracking for resumable export

---

## 6. Testing

- **TEST-001**: Vitest unit tests for CLI/config parsing (flags, env, prompts)
- **TEST-002**: Integration tests for WordPress API fetch (mock server, real site)
- **TEST-003**: Conversion tests (HTML→Markdown, metadata mapping)
- **TEST-004**: Media download/relink tests (various image/file types, CDN/no-download)
- **TEST-005**: 11ty project generation tests (structure, content, layouts)
- **TEST-006**: Meilisearch indexing/search tests (indexing, search UI)
- **TEST-007**: End-to-end test: migrate a real WordPress site, run 11ty, verify output
- **TEST-008**: Resume/interrupt test: simulate interruption, resume, verify no duplicates
- **TEST-009**: Accessibility tests (CLI output, generated site)
- **TEST-010**: Error handling tests (network failures, invalid credentials, disk full, etc.)

---

## 7. Risks & Assumptions

- **RISK-001**: WordPress REST API may be disabled/restricted.
- **RISK-002**: Large sites may hit API rate limits or memory constraints.
- **RISK-003**: Media download failures (broken links, hotlinked images).
- **RISK-004**: Custom fields may not map cleanly; extensibility via YAML is future roadmap.
- **RISK-005**: Meilisearch Docker may not run on all systems (e.g., ARM, Windows Home).
- **RISK-006**: Resume logic must be robust to avoid duplicates or missed items.
- **ASSUMPTION-001**: User has app password and API access.
- **ASSUMPTION-002**: User has Docker for Meilisearch.
- **ASSUMPTION-003**: All content can be represented as Markdown with frontmatter.
- **ASSUMPTION-004**: User will not require incremental sync in v1.

---

## 8. Related Specifications / Further Reading

- [cac CLI](https://github.com/cacjs/cac)
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [turndown](https://www.npmjs.com/package/turndown)
- [js-yaml](https://www.npmjs.com/package/js-yaml)
- [11ty docs](https://www.11ty.dev/docs/)
- [Meilisearch quick start](https://www.meilisearch.com/docs/resources/self_hosting/getting_started/quick_start)
- [MIT license](https://opensource.org/licenses/MIT)

---

**This plan is now fully specified and ready for implementation.**
