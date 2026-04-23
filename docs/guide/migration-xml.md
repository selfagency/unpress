# XML Export Migration

Migrate your WordPress content using an XML export file instead of the live API. This is ideal for large sites, archival, or offline work.

## Overview

When you migrate via XML export, Unpress parses a WordPress XML export file (generated via Tools → Export) and converts it to a static 11ty site.

**Advantages:**
- Works offline—no need for live WordPress site
- No rate limiting—process as fast as your computer can
- Includes all content (published, drafts, private)
- Perfect for archival or one-time migrations
- Checkpoint support—resume interrupted migrations

**Disadvantages:**
- Requires manual XML export from WordPress
- Data is snapshot at time of export (not real-time)
- Larger file size for sites with many posts
- Must re-export if you want to update content

## Step 1: Export WordPress Content to XML

### Export All Content

1. Log in to your WordPress admin dashboard
2. Go to **Tools → Export**
3. Select "All content" (recommended) or choose specific content
4. Click **Download Export File**

WordPress will download an XML file named like:
```
your-site-name.wordpress.YYYY-MM-DD.xml
```

### Export Specific Content

If you only want to migrate certain content:

1. Go to **Tools → Export**
2. Choose specific content type:
   - **Posts** - Export only blog posts
   - **Pages** - Export only pages
   - **Media** - Export media library (metadata only)
   - **Categories and Tags** - Export taxonomies
3. Set filters (date range, author, status) if needed
4. Click **Download Export File**

::: tip Export Options
- **"All content"** exports everything (posts, pages, media, taxonomies)
- **"Date range"** lets you export posts from specific time period
- **"Authors"** filters export to specific authors
- **"Status"** lets you include/exclude drafts, private posts
:::

### Save Export File

Save your XML export file in a memorable location:
```
/path/to/your-site-export.xml
```

You'll need this file path when running Unpress.

## Step 2: Run XML Migration

Once you have your XML export file, run migration:

```bash
unpress \
  --source xml \
  --xml-file /path/to/your-site-export.xml \
  --generate-site
```

### Required Flags

- `--source xml` - Specify XML source type (default is `api`)
- `--xml-file <path>` - Path to your WordPress XML export file

### Optional Flags

- `--generate-site` - Generate complete 11ty project in `site/` folder
- `--download-media` - Download media files locally
- `--out-dir <dir>` - Specify output directory (defaults to current directory)
- `--resume` - Resume from previous checkpoint (interrupted migration)

## Step 3: What Gets Migrated?

Unpress parses your XML export and migrates all content it finds:

### Content Types

| Content | Migrated | Notes |
|----------|-----------|--------|
| **Posts** | ✅ All posts (published, drafts, private) | Including custom post types |
| **Pages** | ✅ All pages | Including parent-child relationships |
| **Categories** | ✅ All categories with hierarchy | Preserves nesting |
| **Tags** | ✅ All tags | All tags with post associations |
| **Authors** | ✅ All authors | Creates author files and pages |
| **Media** | ⚠️ Metadata only | Media URLs preserved; download via `--download-media` |

### Post Data (XML)

Each post includes:
- **ID** - WordPress post ID
- **Title** - Post title (rendered)
- **Content** - Post body in HTML
- **Excerpt** - Post excerpt (if available)
- **Date** - Publication date
- **Modified Date** - Last modification date
- **Slug** - URL-friendly post name
- **Status** - Post status (publish, draft, private, etc.)
- **Type** - Post type (post, page, custom post type)
- **Author** - Author information (username, email, display name)
- **Categories** - Category list with hierarchy
- **Tags** - Tag list
- **Custom Fields** - All WordPress meta fields (postmeta)
- **Featured Image** - Featured image URL (if set)
- **Attachments** - Media attachment URLs

### Media Handling

XML export includes media **metadata** (URLs, sizes, captions) but not the actual media files.

#### Mode 1: Download Locally

```bash
unpress \
  --source xml \
  --xml-file /path/to/export.xml \
  --download-media \
  --generate-site
```

Media files are downloaded to `site/media/` and URLs are updated automatically.

#### Mode 2: Reupload to S3

Create a config file `unpress.yml`:

```yaml
source:
  type: xml
  xml:
    file: /path/to/export.xml

media:
  mode: reupload
  reupload:
    driver: s3
    s3:
      bucket: your-bucket-name
      region: us-east-1
      endpoint: https://s3.amazonaws.com
```

Set AWS credentials via environment variables:

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

Run migration:

```bash
unpress --config unpress.yml --generate-site
```

#### Mode 3: Leave URLs (Archival)

Keep original media URLs unchanged:

```yaml
media:
  mode: leave
```

See [Media Handling Guide](./media.md) for detailed media configuration.

## Step 4: Checkpoint and Resume

For large XML exports (thousands of posts), Unpress saves checkpoints every 100 items. If migration is interrupted, you can resume without duplicating work.

### Enable Checkpointing

By default, checkpointing is enabled. Unpress saves state to:

```
.unpress/state/xml-checkpoint.json
```

### Resume Interrupted Migration

If your migration was interrupted (power outage, crash, etc.), simply run the same command again:

```bash
unpress \
  --source xml \
  --xml-file /path/to/export.xml \
  --generate-site \
  --resume
```

Unpress will:
1. Read the checkpoint file
2. Identify the last successfully processed post
3. Resume from that point in the XML file
4. Continue migration without re-processing items

### Disable Checkpointing

If you want to disable checkpointing (not recommended for large files), modify your config:

```yaml
resume:
  enabled: false
```

::: tip Checkpoint Best Practices
- Always use `--resume` for interrupted migrations
- Checkpoint file is saved automatically every 100 items
- You can manually delete `.unpress/state/` to force fresh migration
- Checkpoint file includes: processed count, last processed ID, timestamp
:::

## Step 5: Understand Output Structure

After successful XML migration, check your output:

```bash
ls -la site/
```

You should see:

```
site/
├── content/
│   ├── posts/
│   │   ├── 2024-01-15-my-first-post.md
│   │   ├── 2024-01-16-second-post.md
│   │   └── ...
│   ├── authors/
│   │   ├── admin.md
│   │   └── jane-doe.md
│   ├── tags/
│   │   ├── travel.md
│   │   ├── food.md
│   │   └── ...
│   └── categories/
│       ├── uncategorized.md
│       └── ...
├── _includes/
│   └── layouts/
│       └── base.njk
├── assets/
│   └── styles.css
└── index.md
```

### Post File Example (XML Source)

Posts from XML export have similar structure to API migration, but include all content types (drafts, private posts):

```markdown
---
title: "My First Blog Post"
date: 2024-01-15T10:30:00
modified: 2024-01-16T14:20:00
slug: my-first-post
status: publish
type: post
author:
  name: Admin User
  email: admin@example.com
categories:
  - Uncategorized
tags:
  - travel
  - food
---

# My First Blog Post

This is the content of my blog post, converted from WordPress HTML to clean Markdown...

![Featured image](https://your-site.com/wp-content/uploads/2024/01/image.jpg)
```

## Step 6: Performance and Large Files

### Processing Large XML Exports

Large XML exports (10,000+ posts) may be slow or use significant memory.

**Tips for large files:**
1. **Use checkpointing** - Always enable `--resume` flag
2. **Reduce concurrency** - Lower concurrent processing if needed
3. **Increase memory** - Give Node.js more RAM if needed:

```bash
NODE_OPTIONS=--max-old-space-size=4096 unpress --source xml --xml-file large-export.xml --generate-site
```

4. **Split export** - Consider splitting large exports into smaller chunks by date range or author

### Memory Usage

Unpress parses XML using a streaming parser, which is memory efficient. However, very large files (100MB+) may still require significant RAM.

**If you encounter memory errors:**
- Increase Node.js memory limit (see above)
- Close other applications to free RAM
- Process exports in smaller chunks

### Processing Speed

XML processing speed depends on:
- Your computer's CPU speed
- Disk I/O speed (reading XML file, writing output)
- Number of posts in export
- Media downloading (if enabled)

**Typical speeds:**
- 1,000 posts: ~1-2 minutes
- 10,000 posts: ~10-20 minutes
- 100,000 posts: ~2-4 hours

Your actual speed may vary significantly.

## Step 7: Troubleshooting XML Migration

### "Invalid XML" or "Parse Error"

**Cause:** Corrupted or malformed XML export file.

**Solutions:**
- Re-export XML from WordPress
- Try using a different browser to export
- Check if export file is complete (not truncated download)
- Validate XML structure online: [XML Validator](https://www.xmlvalidation.com/)

### "No Content Found"

**Cause:** XML file doesn't contain expected content.

**Solutions:**
- Open XML file in a text editor—verify it contains `<wp:post>` elements
- Check if you exported "All content" or specific content type
- Ensure XML file is not empty (size > 0 bytes)
- Try exporting again from WordPress

### "Checkpoint File Error"

**Cause:** Corrupted checkpoint file from previous interrupted migration.

**Solutions:**
- Delete checkpoint directory: `rm -rf .unpress/state/`
- Run migration again without `--resume` flag (fresh migration)
- Check file permissions on `.unpress/state/` directory

### "Media Download Failed"

**Cause:** Media URLs in XML are no longer accessible or invalid.

**Solutions:**
- Verify media URLs are accessible in a browser
- Check if your WordPress site is still live (for XML exports, site may not be live)
- Try migration without `--download-media` (leave URLs unchanged)
- Use reupload mode with credentials for your media storage

### "Disk Space Error"

**Cause:** Not enough disk space for media files or output.

**Solutions:**
- Free up disk space before running migration
- Use reupload mode instead of local download
- Migrate media separately or exclude certain media types
- Choose a different output directory with more space: `--out-dir /path/to/drive`

## Next Steps

After successful XML migration:

1. **[Generated Site Guide](./generated-site.md)** - Understand your output structure
2. **[Customization Guide](./customization.md)** - Modify templates and styles
3. **[Deployment Guide](./deployment.md)** - Deploy your site to hosting platform
4. **[Media Handling Guide](./media.md)** - Configure media download or reupload

## Comparison: XML Export vs API Migration

| Feature | XML Export | API Migration |
|---------|-------------|---------------|
| **Connection** | Works offline | Requires live site |
| **Content** | All content (drafts, private) | Published content only |
| **Speed** | Limited by computer speed | Limited by API rate limits |
| **Rate Limits** | None | May be rate-limited |
| **Data Freshness** | Snapshot at export time | Real-time (latest content) |
| **Best For** | Large sites, archival, offline work | Active sites, frequent migrations |

**When to use XML export:**
- Your WordPress site is large (5,000+ posts)
- You want to migrate offline or on another computer
- You need to include drafts or private posts
- Your WordPress site has strict API rate limiting
- You want to archive your WordPress site completely

**When to use API migration:**
- Your WordPress site is live and accessible
- You have fewer than 5,000 posts
- You want to latest published content
- You don't want to export XML manually

See [API Migration Guide](./migration-api.md) for API-based migration.
