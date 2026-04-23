# Quick Start

Get your WordPress site migrated to 11ty in under 5 minutes.

## Prerequisites

Before you start, make sure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **pnpm** package manager ([install here](https://pnpm.io/installation))
- **WordPress site** with Application Password created

::: tip What is an Application Password?
WordPress Application Passwords are a secure way to connect tools like Unpress to your site without using your main login password. They can be revoked anytime.
:::

## Step 1: Create a WordPress Application Password

1. Log in to your WordPress admin dashboard
2. Go to **Users → Profile** (or click your username in top right)
3. Scroll down to **Application Passwords** section
4. Enter a name (e.g., "Unpress Migration") and click **Add New Application Password**
5. **Copy the password** immediately—you won't see it again!

::: warning Keep your password secure
Never share your application password publicly or commit it to Git. Store it in environment variables or a secure config file.
:::

## Step 2: Install Unpress

Choose how you want to install Unpress:

### Option A: Install Globally (Recommended)

```bash
pnpm install -g @selfagency/unpress
```

This lets you run `unpress` from anywhere on your computer.

### Option B: Install Locally

```bash
git clone https://github.com/selfagency/unpress.git
cd unpress
pnpm install
pnpm build
```

Run Unpress using `pnpm dev:cli -- <flags>` instead of `unpress <flags>`.

## Step 3: Run Your Migration

```bash
unpress \
  --wp-url https://your-wordpress-site.com \
  --wp-user your-username \
  --wp-app-password "your-20-char-app-password" \
  --generate-site
```

Replace the values with your own:
- `--wp-url`: Your WordPress site URL (without `/wp-admin`)
- `--wp-user`: Your WordPress username
- `--wp-app-password`: The application password you created in Step 1

**What happens next?**

Unpress will:
1. Connect to your WordPress site
2. Fetch all posts, pages, categories, and tags
3. Download media files (if using `--download-media`)
4. Convert WordPress HTML to Markdown
5. Generate a complete 11ty project in a `site/` folder

**Watch for progress messages:**
```
Fetching posts and pages... ✓
Converting HTML to Markdown... ✓
Generating 11ty project... ✓
Migration complete! Check the 'site/' folder.
```

## Step 4: Verify Your Migration

Check what Unpress created:

```bash
ls -la site/
```

You should see:
```
site/
├── content/
│   ├── authors/      # Author files (if multi-author blog)
│   ├── posts/        # Your blog posts as Markdown
│   └── tags/         # Tag and category index pages
├── _includes/
│   └── layouts/
│       └── base.njk # Base HTML template
├── assets/
│   └── styles.css  # Basic styles with dark mode
└── index.md           # Home page
```

Open `site/index.md` in a text editor—you'll see your home page content in Markdown with YAML frontmatter.

## Step 5: Test Your Site Locally (Optional)

If you want to preview your site before deploying:

```bash
# Install 11ty globally
pnpm install -g @11ty/eleventy

# Navigate to your site folder
cd site

# Build and serve locally
eleventy --serve
```

Visit `http://localhost:8080` to see your new site!

## Step 6: Deploy Your Site

Your static site is ready to deploy! Choose a platform:

### Netlify (Easiest)

1. Drag and drop the `site/` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Netlify will deploy it instantly and give you a live URL
3. Add a custom domain in Netlify settings if needed

### Vercel (Recommended)

1. Push your `site/` folder to GitHub
2. Import the repository to [Vercel](https://vercel.com/new)
3. Vercel will auto-deploy on every push

### Cloudflare Pages (Fast)

1. Upload `site/` folder to GitHub or GitLab
2. Import the repository to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Cloudflare will deploy with global CDN

See the [Deployment Guide](./deployment.md) for detailed instructions.

## Common Quick Start Issues

### "Authentication Failed" Error

**Problem:** Unpress can't connect to WordPress.

**Solution:**
- Double-check your username matches your WordPress login (not email)
- Verify your application password was copied correctly
- Make sure your WordPress site URL is correct (try in a browser)
- Check if your site uses HTTPS—use `https://` in the URL

### "No Content Found"

**Problem:** Migration finishes but `site/content/posts/` is empty.

**Solution:**
- Check if your WordPress posts are "Published" (not "Draft" or "Private")
- Ensure your WordPress REST API is enabled (it is by default)
- Try visiting `https://your-site.com/wp-json/wp/v2/posts` in a browser—you should see JSON data

### "Media Files Not Downloaded"

**Problem:** Images in your posts show broken links.

**Solution:**
- Add `--download-media` flag to your command
- If using reupload mode, check your S3/SFTP credentials in config file
- Verify media URLs in your original WordPress are accessible

## Next Steps

- **[Installation Guide](./installation.md)** - Detailed installation options
- **[WordPress API Migration](./migration-api.md)** - Deep dive into API-based migration
- **[XML Export Migration](./migration-xml.md)** - Use WordPress export files instead
- **[Media Handling](./media.md)** - Configure media download or reupload
- **[Troubleshooting](../troubleshooting.md)** - More common issues and solutions

::: tip Want to migrate a large site?
For sites with thousands of posts, use the `--resume` flag to save checkpoints. If migration is interrupted, run the same command again to continue where you left off.
:::
