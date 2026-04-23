# Unpress

**Convert your whole WordPress site to 11ty with one command!**

Unpress is a CLI utility that helps you migrate your WordPress content (posts, pages, taxonomies, and media) to a static Eleventy site. Whether you're looking to save hosting costs or archive a stale blog, Unpress makes the migration simple and reliable.

::: tip Why Migrate?
- **Cost Savings**: WordPress hosting costs $10–$100/month. Static hosting can be free or under $5/month.
- **Performance**: Static sites load faster because there's no database or PHP processing.
- **Security**: No WordPress vulnerabilities to patch—static sites can't be hacked the same way.
- **Archival**: Preserve your content in a future-proof, maintainable format that doesn't require updates.
:::

## Quick Start

Get started in 3 commands:

```bash
# 1. Install Unpress
pnpm install -g @selfagency/unpress

# 2. Run migration (replace with your WordPress credentials)
unpress \
  --wp-url https://your-site.com \
  --wp-user your-username \
  --wp-app-password "your-app-password" \
  --generate-site

# 3. Deploy your new static site!
# Drag the `site/` folder to Netlify, Vercel, or Cloudflare Pages.
```

That's it! Unpress will:
- Fetch all your posts, pages, categories, and tags
- Convert WordPress HTML to clean Markdown
- Download or reupload your media files
- Generate a complete 11ty project with layouts and templates
- Create author pages and tag/category indexes

**Need help?** See the [Installation Guide](./guide/installation.md) or [Troubleshooting](./troubleshooting.md).

## What Gets Migrated?

| Content | Migrated | Notes |
|----------|-----------|--------|
| Posts | ✅ | All post types, statuses, and custom fields |
| Pages | ✅ | All pages including parent-child relationships |
| Categories | ✅ | Preserves category hierarchy |
| Tags | ✅ | All tags with post associations |
| Authors | ✅ | Creates author files and per-author pages (multi-author blogs) |
| Media | ✅ | Download locally, reupload to S3/SFTP, or leave URLs unchanged |
| Custom Fields | ✅ | Configurable via `types.yml` |

## Key Features

### Dual Source Support

Choose how to connect to WordPress:
- **WordPress API**: Connect directly with your site URL and application password
- **XML Export**: Use WordPress's export tool for large migrations or offline work

### Flexible Media Handling

Three modes to handle your images and files:
- **Local Download**: Save media files to your `site/` folder
- **Reupload**: Upload media to S3 or SFTP with automatic URL replacement
- **Leave URLs**: Keep original media URLs (perfect for archival)

### Resume Capability

Large WordPress site? Unpress saves checkpoints every 100 items. If migration is interrupted, run `--resume` to continue exactly where you left off—no duplicate work.

### Search Integration

Static sites don't have built-in search. Unpress integrates with [Meilisearch](./guide/meilisearch.md) to add fast, typo-tolerant search to your new site.

### Accessibility First

Generated 11ty templates include:
- "Skip to main" links for keyboard navigation
- Semantic HTML with proper ARIA labels
- Responsive meta tags for mobile devices
- WCAG 2.2 AA compliant base template

## Example Migrations

See our [example projects](./examples/) for complete, working configurations:

- **[Simple Blog](./examples/simple-blog/)** - Single author, posts only, local media
- **[Multi-Author Blog](./examples/multi-author/)** - Multiple authors with author pages
- **[S3 Media Reupload](./examples/s3-media/)** - Migrate media to AWS S3 with CDN
- **[Archival Migration](./examples/archival/)** - Minimal output, leave media URLs, no search

## Next Steps

1. **[Quick Start Guide](./guide/quick-start.md)** - Step-by-step first migration
2. **[Installation Guide](./guide/installation.md)** - Install and verify Unpress
3. **[Migration Guides](./guide/migration-api.md)** - Detailed instructions for API and XML migrations
4. **[Deployment Guide](./guide/deployment.md)** - Deploy your new site to Netlify, Vercel, or Cloudflare Pages

## Need Help?

- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions
- **[GitHub Issues](https://github.com/selfagency/unpress/issues)** - Report bugs or request features
- **[Contributing](./contributing.md)** - How to contribute to Unpress

## License

MIT © 2024-present [Self Agency](https://self.agency)
