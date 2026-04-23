---
# unpress-ammp
title: Content conversion & 11ty generation
status: completed
type: epic
priority: high
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T21:34:20Z
parent: unpress-9vhq
blocking:
    - unpress-erf0
---

Converts WordPress content to Markdown with metadata, downloads media, and generates a complete 11ty project structure.

## Features
- HTML→Markdown conversion (turndown)
- Metadata mapping to frontmatter
- Optional media download/relink
- 11ty project structure generation
- Tag/category index pages
- Default layouts/templates

## Tasks
- [x] Use `turndown` for HTML→Markdown conversion
- [x] Map all metadata to Markdown frontmatter (YAML/JSON)
- [x] Optionally download referenced media (if user specifies)
- [x] Relink media URLs in Markdown if downloaded
- [x] Generate 11ty project structure (config, content, layouts)
- [x] Write all posts/pages as Markdown files with correct frontmatter
- [x] Generate tag/category index pages
- [x] Copy/generate default 11ty layouts/templates
- [x] Add README.md with usage instructions

## Notes
- Migration now emits per-author files under `site/content/authors/` and the post frontmatter includes an `author` object when available.
- Templates assume `collections.authors` and `author` data on posts; generator seeds a sample author file.
