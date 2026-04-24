# Quick Start

Get your WordPress site migrated to 11ty in under 5 minutes using npx.

## Prerequisites

Before you start, make sure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **WordPress site** with Application Password created

::: tip No installation required!
Unpress runs directly with `npx`—no installation needed. Just have Node.js installed and you're ready to go!
:::

## Step 1: Create WordPress Application Password

1. Log in to your WordPress admin dashboard
2. Go to **Users → Profile** (or click your username in top right)
3. Scroll down to **Application Passwords** section
4. Enter a name (e.g., "Unpress Migration") and click **Add New Application Password**
5. **Copy the password** immediately—you won't see it again!

::: warning Keep your password secure
Never share your application password publicly or commit it to Git. Store it in environment variables or a secure config file.
:::

## Step 2: Create a `.env` file

Create a `.env` file in your current directory with your WordPress credentials:

```dotenv
WP_URL=https://your-wordpress-site.com
WP_USER=your-username
WP_APP_PASSWORD=your-20-char-app-password
```

**Replace with your own values:**

- `WP_URL`: Your WordPress site URL (without `/wp-admin`)
- `WP_USER`: Your WordPress username
- `WP_APP_PASSWORD`: The application password you created in Step 1

::: tip What is `.env`?
The `.env` file stores configuration and secrets. Unpress automatically reads this file from your current working directory, so you usually do not need to pass credentials as command-line flags.
:::

### Managing Your .env File

Keep your `.env` file secure:

- **Never commit to Git** - Add `.env` to your `.gitignore` file
- **Keep it private** - Never share your `.env` file publicly
- **Update as needed** - Edit `.env` file when credentials change
- **Delete when done** - Remove `.env` file after migration (optional)

## Step 3: Run migration with `pnpx` or `npx`

```bash
pnpx @selfagency/unpress --generate-site
# or
npx -y @selfagency/unpress --generate-site
```

Because Unpress reads `.env` automatically, you only need flags for overrides like `--download-media`, `--out-dir`, or `--source xml`.

**What happens next?**

Unpress will:

1. Connect to your WordPress site
2. Fetch all posts, pages, categories, and tags
3. Download media files (if using `--download-media`)
4. Convert WordPress HTML to Markdown
5. Generate a complete 11ty project in a `site/` folder

**Watch for progress messages:**

```text
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

```text
site/
├── .eleventy.js          # 11ty configuration
├── assets/
│   └── styles.css        # CSS styles (dark mode support)
└── site/
    ├── index.md           # Home page
    ├── content/
    │   ├── authors/       # Author files (if multi-author blog)
    │   └── posts/         # Your blog posts as Markdown
    └── _includes/
        └── layouts/
            ├── base.njk   # Base HTML template
            ├── tags.njk   # Tags index
            ├── categories.njk  # Categories index
            ├── authors.njk     # Authors index
            └── author.njk      # Per-author page
```

Open `site/index.md` in a text editor—you'll see your home page content in Markdown with YAML frontmatter.

## Step 5: Test Your Site Locally (Optional)

If you want to preview your site before deploying:

```bash
cd site
npx @11ty/eleventy --serve
```

The 11ty config uses `input: 'site'` and `output: 'dist'`, so the built output will be in `site/dist/`.

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

- **[Installation Guide](./installation.md)** - Running Unpress without installing it globally
- **[WordPress API Migration](./migration-api.md)** - Deep dive into API-based migration
- **[XML Export Migration](./migration-xml.md)** - Use WordPress export files instead
- **[Media Handling](./media.md)** - Configure media download or reupload
- **[Troubleshooting](../troubleshooting.md)** - More common issues and solutions

::: tip Want to migrate a large site?
For sites with thousands of posts, use the `--resume` flag to save checkpoints. If migration is interrupted, run the same command again to continue where you left off.
:::
