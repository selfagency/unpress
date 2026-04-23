---
# unpress-ammp
title: Content conversion & 11ty generation
status: todo
type: epic
created_at: 2026-04-23T02:41:59Z
updated_at: 2026-04-23T02:41:59Z
parent: unpress-9vhq
id: unpress-ammp
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
- [ ] Use `turndown` for HTML→Markdown conversion
- [ ] Map all metadata to Markdown frontmatter (YAML/JSON)
- [ ] Optionally download referenced media (if user specifies)
- [ ] Relink media URLs in Markdown if downloaded
- [ ] Generate 11ty project structure (config, content, layouts)
- [ ] Write all posts/pages as Markdown files with correct frontmatter
- [ ] Generate tag/category index pages
- [ ] Copy/generate default 11ty layouts/templates
- [ ] Add README.md with usage instructions
