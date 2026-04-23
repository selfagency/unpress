# WordPress API Migration

Migrate your WordPress content directly using the WordPress REST API. This is the simplest and most common way to use Unpress.

## Overview

When you migrate via the WordPress REST API, Unpress connects directly to your WordPress site and fetches all content (posts, pages, categories, tags, authors) programmatically.

**Advantages:**
- Fast and direct—no need to export XML files
- Real-time data—gets the latest published content
- Handles large sites with pagination
- Supports all WordPress versions with REST API (WordPress 4.7+)

**Disadvantages:**
- Requires live WordPress site with Application Password
- Can be rate-limited by WordPress server
- Depends on site uptime during migration

## Step 1: Create WordPress Application Password

Before migrating, you need an Application Password to connect Unpress to your WordPress site.

### Create Application Password

1. Log in to your WordPress admin dashboard
2. Navigate to **Users → Profile** (or click your username in top-right)
3. Scroll down to **Application Passwords** section
4. Enter a descriptive name (e.g., "Unpress Migration Tool")
5. Click **Add New Application Password**

WordPress will generate a 20-character password like:

```
abcd efgh ijkl mnop qrst
```

**Important:** Copy this password immediately and save it securely. You won't be able to see it again!

### Manage Application Passwords

If you need to revoke or recreate your Application Password:

1. Go to **Users → Profile**
2. Find "Unpress Migration Tool" in Application Passwords list
3. Click **Revoke** to invalidate the password
4. Create a new one if needed

::: tip Security Best Practices
- Use unique Application Passwords for each tool
- Revoke passwords when migration is complete
- Never commit passwords to Git or share publicly
- Store passwords in environment variables or secure config files
:::

## Step 2: Run API Migration

Once you have your Application Password, run the migration:

```bash
unpress \
  --wp-url https://your-wordpress-site.com \
  --wp-user your-username \
  --wp-app-password "your-20-char-app-password" \
  --generate-site
```

### Required Flags

- `--wp-url <url>` - Your WordPress site URL
  - Must include `https://` or `http://`
  - Example: `https://myblog.com` (not `https://myblog.com/wp-admin`)

- `--wp-user <user>` - Your WordPress username
  - This is your login username (not email address)
  - Example: `admin` or `john-doe`

- `--wp-app-password <pw>` - Application Password you created
  - Must be wrapped in quotes if it contains spaces
  - Example: `"abcd efgh ijkl mnop qrst"`

### Optional Flags

- `--generate-site` - Generate complete 11ty project in `site/` folder
- `--download-media` - Download media files locally
- `--out-dir <dir>` - Specify output directory (defaults to current directory)
- `--concurrency <num>` - Number of concurrent requests (default: 2)
- `--dry-run` - Validate configuration without making changes

## Step 3: What Gets Migrated?

Unpress migrates all public content from your WordPress site:

### Content Types

| Content | Migrated | Location in Output |
|----------|-----------|----------------------|
| **Posts** | ✅ All published posts | `site/content/posts/` |
| **Pages** | ✅ All published pages | `site/content/` (root level files) |
| **Categories** | ✅ All categories with hierarchy | Metadata in post frontmatter + category index |
| **Tags** | ✅ All tags | Metadata in post frontmatter + tag index |
| **Authors** | ✅ All authors | `site/content/authors/` (if multi-author) |

### Post Data

Each post includes:
- **Title** - Post title (rendered)
- **Content** - Post body converted to Markdown
- **Excerpt** - Post excerpt (if available)
- **Date** - Publication date
- **Modified Date** - Last modification date
- **Slug** - URL-friendly post name
- **Status** - Post status (published, draft, etc.)
- **Type** - Post type (post, page, custom post type)
- **Author** - Author information
- **Categories** - Category list
- **Tags** - Tag list
- **Custom Fields** - All WordPress custom fields (postmeta)
- **Featured Image** - Featured image URL (if set)

### Media Handling

By default, Unpress does **not** download media. To handle media, choose a mode:

#### Mode 1: Download Locally

```bash
unpress \
  --wp-url https://your-site.com \
  --wp-user admin \
  --wp-app-password "abcd efgh ijkl mnop qrst" \
  --download-media \
  --generate-site
```

Media files are saved to `site/media/` and URLs in Markdown are updated automatically.

#### Mode 2: Reupload to S3

Create a config file `unpress.yml`:

```yaml
source:
  type: api
  api:
    baseUrl: https://your-site.com

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

Keep original media URLs unchanged (best for archival):

```yaml
media:
  mode: leave
```

See [Media Handling Guide](./media.md) for detailed media configuration.

## Step 4: Understand Output Structure

After successful migration, check your output:

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

### Post File Example

Open a post file to see the structure:

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

## Step 5: Rate Limiting and Concurrency

WordPress servers may rate-limit API requests to prevent overload. Unpress provides flags to control this:

### Concurrency Control

Limit number of simultaneous requests:

```bash
unpress \
  --wp-url https://your-site.com \
  --wp-user admin \
  --wp-app-password "abcd efgh ijkl mnop qrst" \
  --concurrency 1 \
  --generate-site
```

- **Default**: 2 concurrent requests
- **Recommendation**: Start with 1-2 for unknown servers
- **Large sites**: Reduce concurrency to avoid timeouts

### Rate Limiting

Control request rate per second:

```bash
unpress \
  --wp-url https://your-site.com \
  --wp-user admin \
  --wp-app-password "abcd efgh ijkl mnop qrst" \
  --intervalCap 5 \
  --interval 1000 \
  --generate-site
```

- `--intervalCap 5`: Max 5 requests per interval
- `--interval 1000`: 1000ms (1 second) interval
- **Result**: Max 5 requests/second

### Configuration File Example

Set these options in `unpress.yml` for consistency:

```yaml
processing:
  concurrency: 2
  intervalCap: 10
  interval: 1000
```

## Step 6: Troubleshooting API Migration

### "Authentication Failed" Error

**Cause:** Wrong credentials or authentication method.

**Solutions:**
- Double-check username matches your WordPress login (not email)
- Verify Application Password was copied correctly (20 characters)
- Check if your site uses HTTPS—use `https://` in URL
- Test credentials manually: `curl -u username:password https://your-site.com/wp-json`

### "403 Forbidden" or "401 Unauthorized"

**Cause:** Permission denied or CORS issues.

**Solutions:**
- Ensure Application Password has correct permissions (it should by default)
- Check if your WordPress installation blocks REST API (some security plugins do)
- Try accessing `https://your-site.com/wp-json/wp/v2/posts` in a browser
- Contact your hosting provider if issue persists

### "429 Too Many Requests"

**Cause:** WordPress server rate limiting.

**Solutions:**
- Reduce concurrency: `--concurrency 1`
- Add rate limiting: `--intervalCap 2 --interval 1000`
- Wait a few minutes and run migration again
- Contact your hosting provider to increase API limits

### "Empty Content" (No Posts Migrated)

**Cause:** No published posts or wrong query.

**Solutions:**
- Verify posts are "Published" status (not "Draft" or "Private")
- Check if custom post types exist—configure `types.yml` to include them
- Test API directly in browser: `https://your-site.com/wp-json/wp/v2/posts`
- Check WordPress REST API is enabled: `https://your-site.com/wp-json/`

### "Timeout" or "Connection Reset"

**Cause:** Server timeout or network issues.

**Solutions:**
- Reduce concurrency and increase rate limiting
- Check your internet connection
- Try migrating during off-peak hours
- Contact your hosting provider if timeout is too aggressive

### "Memory Error" (Node.js)

**Cause:** Processing too much data at once.

**Solutions:**
- Reduce concurrency to process fewer items simultaneously
- Use pagination to fetch smaller batches
- Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096 unpress ...`

## Next Steps

After successful API migration:

1. **[Generated Site Guide](./generated-site.md)** - Understand your output structure
2. **[Customization Guide](./customization.md)** - Modify templates and styles
3. **[Deployment Guide](./deployment.md)** - Deploy your site to hosting platform
4. **[Meilisearch Guide](./meilisearch.md)** - Add search to your site

## Comparison: API vs XML Export

| Feature | API Migration | XML Export |
|---------|---------------|-------------|
| **Speed** | Fast, real-time | Slower, requires export first |
| **Connection** | Requires live site | Works offline with export file |
| **Content** | All published content | All content (including drafts) |
| **Media** | Handles media via flags | Same media options |
| **Rate Limits** | May be rate-limited | No rate limiting (local processing) |
| **Best For** | Active sites, small-to-medium sites | Large sites, archival, offline work |

**When to use API migration:**
- Your WordPress site is live and accessible
- You have fewer than 5,000 posts
- You want the latest published content
- You don't want to export XML manually

**When to use XML export:**
- Your WordPress site is large (5,000+ posts)
- You want to migrate offline
- You need to include drafts or private posts
- Your WordPress site has strict rate limiting

See [XML Export Migration Guide](./migration-xml.md) for XML-based migration.
