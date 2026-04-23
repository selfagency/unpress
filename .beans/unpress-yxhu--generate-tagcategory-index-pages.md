---
# unpress-yxhu
title: Generate tag/category index pages
status: completed
type: task
priority: normal
created_at: 2026-04-23T02:44:41Z
updated_at: 2026-04-23T21:34:20Z
parent: unpress-ammp
---

Generate index pages for tags and categories.

## Notes

- Added 11ty templates under `templates/11ty/`:
  - `_includes/layouts/base.njk` — accessible base layout
  - `tags.njk` — tag listing template with pagination support
  - `categories.njk` — categories index template
  - `authors.njk` — authors index template (renders author image and bio)
  - `author.njk` — individual author page with paginated posts
- Author templates assume the migration populates an `authors` collection and `author` data on posts (name, image, bio).
- If a site has more than one author, the generator will create an `authors/` index and per-author pages (paginated) showing image, bio, and post list.
- These templates are framework examples (Nunjucks) that work with 11ty; adjust collection names in your generated site if your generator uses different keys.
