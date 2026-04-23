# Understanding Generated Site

Learn about the 11ty project structure that Unpress generates and how to work with it.

## Overview

When you run Unpress with `--generate-site` flag, it creates a complete, working 11ty project in a `site/` folder. This includes:

- **Content** - Your WordPress posts, pages, authors as Markdown files
- **Layouts** - HTML templates for rendering pages
- **Assets** - CSS styles and static files
- **Configuration** - 11ty setup file

You can immediately deploy this project or customize it further.

## Project Structure

```
site/
├── .eleventy.js          # 11ty configuration
├── index.md               # Home page
├── content/
│   ├── posts/            # Blog posts as Markdown
│   ├── authors/          # Author information files
│   ├── tags/             # Tag index pages
│   └── categories/       # Category index pages
├── _includes/
│   └── layouts/
│       └── base.njk     # Base HTML template
└── assets/
    └── styles.css        # CSS styles (dark mode support)
```

### Detailed Breakdown

#### `.eleventy.js` - Configuration File

11ty's configuration file. Includes:

- **Input directory** - Where content lives (`content/`)
- **Output directory** - Where built site goes (`_site/`)
- **Template formats** - Markdown, Nunjucks
- **Passthrough copy** - Copy `assets/` to output
- **Markdown plugins** - Customize markdown rendering

**Default settings:**
```javascript
module.exports = function(eleventyConfig) {
  return {
    dir: {
      input: 'content',
      output: '_site',
      includes: '../_includes',
    },
    templateFormats: ['md', 'njk'],
  };
};
```

You can modify this to:
- Add custom Markdown plugins (syntax highlighting, etc.)
- Change input/output directories
- Add 11ty plugins
- Configure collections (posts, authors, tags, etc.)

#### `index.md` - Home Page

Your WordPress site's home page content in Markdown format.

**Example:**
```markdown
---
title: "My WordPress Site"
---

Welcome to my blog migrated from WordPress!

## Latest Posts

<!-- 11ty will render post listings here -->
```

Unpress copies your home page content from WordPress. Customize this file to change your home page.

#### `content/posts/` - Blog Posts

All your WordPress blog posts as Markdown files with YAML frontmatter.

**File naming:**
```
2024-01-15-my-first-post.md
2024-01-16-second-post.md
2024-02-20-third-post.md
```

Naming format: `YYYY-MM-DD-slug.md`

**Post file structure:**
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

Lorem ipsum dolor sit amet, consectetur adipiscing elit...
```

**Frontmatter fields:**
- `title` - Post title
- `date` - Publication date (ISO 8601 format)
- `modified` - Last modification date
- `slug` - URL-friendly post name
- `status` - Post status (publish, draft, private)
- `type` - Post type (post, page, custom type)
- `author` - Author information
- `categories` - Category list
- `tags` - Tag list
- `featured_image` - Featured image URL (if set)
- `custom_fields` - Any WordPress custom fields

#### `content/authors/` - Author Files

Author information files (created only for multi-author WordPress sites).

**File naming:**
```
admin.md
jane-doe.md
john-smith.md
```

Naming format: `username.md` (WordPress username)

**Author file structure:**
```markdown
---
name: "Jane Doe"
email: jane@example.com
bio: "Jane is a travel writer and photographer based in New York."
image: https://your-site.com/wp-content/uploads/avatars/jane.jpg
---

# Jane Doe

Jane writes about travel, food, and culture.
```

**Frontmatter fields:**
- `name` - Display name
- `email` - Email address
- `bio` - Author biography
- `image` - Profile image URL

These files are used to:
- Render author pages (individual author with all their posts)
- Show author information on post pages
- Create author index page (list of all authors)

#### `content/tags/` - Tag Index Pages

Tag browsing pages (created when posts have tags).

**File naming:**
```
travel.md
food.md
technology.md
```

Naming format: `tag-name.md` (tag slug)

**Tag page structure:**
```markdown
---
title: "Travel"
---

# Travel

Posts tagged with "travel":

<!-- 11ty will render post list here -->
```

These pages:
- List all posts with a specific tag
- Can be paginated (if you have many posts)
- Include tag metadata

#### `content/categories/` - Category Index Pages

Category browsing pages (created when posts have categories).

**File naming:**
```
uncategorized.md
travel.md
food.md
```

Naming format: `category-name.md` (category slug)

**Category page structure:**
```markdown
---
title: "Travel"
---

# Travel

Posts in "Travel" category:

<!-- 11ty will render post list here -->
```

These pages:
- List all posts in a specific category
- Can be paginated (if you have many posts)
- Include category metadata

#### `_includes/layouts/base.njk` - Base Template

Base HTML template that all pages inherit from. Includes:

**Accessibility features:**
- "Skip to main" link for keyboard navigation
- Semantic HTML (`<main>`, `<header>`, `<footer>`)
- ARIA labels for navigation and interactive elements
- Responsive meta tags for mobile devices

**Template structure:**
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} - My Site</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <!-- Skip to main link for accessibility -->
  <a href="#maincontent" class="skip-link">Skip to main content</a>

  <!-- Navigation -->
  <header>
    <nav aria-label="Main Navigation">
      <a href="/">Home</a>
      <a href="/tags/">Tags</a>
      <a href="/categories/">Categories</a>
      <a href="/authors/">Authors</a>
    </nav>
  </header>

  <!-- Main content area -->
  <main id="maincontent">
    {{ content | safe }}
  </main>

  <!-- Footer -->
  <footer>
    <p>&copy; 2024 My Site. All rights reserved.</p>
  </footer>
</body>
</html>
```

**Customizing base template:**
- Add your own header/footer
- Include analytics (Google Analytics, etc.)
- Add social media links
- Customize navigation
- Add custom CSS or JavaScript

#### `assets/styles.css` - CSS Styles

Basic CSS styles with dark mode support.

**Features:**
- Responsive typography
- Mobile-friendly layout
- Dark mode support (via `prefers-color-scheme`)
- Basic styling for posts, lists, and navigation

**Customizing styles:**
- Add your own CSS
- Use CSS variables for theming
- Include CSS frameworks (Tailwind, Bootstrap, etc.)
- Override default styles

## Building Your Site

Once you're happy with your generated site, build it with 11ty:

```bash
# Install 11ty (if not already)
pnpm install -g @11ty/eleventy

# Navigate to site folder
cd site

# Build site
eleventy

# Output will be in _site/ folder
```

### Build Output

11ty will generate static HTML files in `_site/` folder:

```
site/
└── _site/
    ├── index.html                    # Home page
    ├── posts/
    │   ├── 2024-01-15-my-first-post.html
    │   ├── 2024-01-16-second-post.html
    │   └── ...
    ├── authors/
    │   ├── admin.html
    │   ├── jane-doe.html
    │   └── ...
    ├── tags/
    │   ├── travel.html
    │   ├── food.html
    │   └── ...
    ├── categories/
    │   ├── uncategorized.html
    │   ├── travel.html
    │   └── ...
    ├── assets/
    │   └── styles.css
    └── ...
```

Deploy the `_site/` folder to your hosting platform.

### Preview Locally

To preview your site locally during development:

```bash
cd site

# Build and serve with auto-reload
eleventy --serve
```

Visit `http://localhost:8080` to see your site. Files will rebuild automatically when you make changes.

## Customization Options

### Modify Base Template

Edit `_includes/layouts/base.njk` to:
- Change site structure (add sidebar, footer, etc.)
- Add analytics or tracking codes
- Include CSS/JavaScript libraries
- Customize navigation menu
- Add social media links

### Add Custom CSS

Edit `assets/styles.css` or create new CSS files:
```html
<!-- In base.njk -->
<link rel="stylesheet" href="/assets/custom.css">
```

### Add Custom JavaScript

Create `assets/script.js`:
```html
<!-- In base.njk, before </body> -->
<script src="/assets/script.js"></script>
```

### Create New Page Types

Add new Markdown files in `content/`:
- `about.md` - About page
- `contact.md` - Contact page
- `projects/` - Custom page type with subdirectory

### Add Plugins to 11ty

Edit `.eleventy.js` to add plugins:
```javascript
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  return {
    // ... config
  };
};
```

See [11ty Plugins](https://www.11ty.dev/docs/plugins/) for available plugins.

## Next Steps

After understanding your generated site:

1. **[Customization Guide](./customization.md)** - Customize templates and styles
2. **[Deployment Guide](./deployment.md)** - Deploy your site to hosting platform
3. **[Meilisearch Guide](./meilisearch.md)** - Add search to your site
4. **[11ty Documentation](https://www.11ty.dev/docs/)** - Learn more about 11ty

## Common Tasks

### Add Favicon

1. Create `favicon.ico` file
2. Place in `site/assets/`
3. Add to base template `<head>`:
   ```html
   <link rel="icon" href="/assets/favicon.ico">
   ```

### Add Google Analytics

1. Get Google Analytics tracking code
2. Add to base template `<head>`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

### Add Social Media Meta Tags

Add to base template `<head>` for better social sharing:
```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://your-site.com/">
<meta property="og:title" content="My Site">
<meta property="og:description" content="My WordPress site migrated to 11ty">
<meta property="og:image" content="https://your-site.com/assets/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="My Site">
<meta property="twitter:description" content="My WordPress site migrated to 11ty">
<meta property="twitter:image" content="https://your-site.com/assets/og-image.jpg">
```

### Change Site Title/Description

Edit base template or use 11ty data:
```javascript
// In .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addGlobalData("site", {
    title: "My Site",
    description: "My WordPress site migrated to 11ty"
  });
};
```

Use in template:
```html
<title>{{ site.title }} - {{ title }}</title>
<meta name="description" content="{{ site.description }}">
```

### Customize Navigation

Edit navigation in base template:
```html
<nav aria-label="Main Navigation">
  <a href="/">Home</a>
  <a href="/about/">About</a>
  <a href="/tags/">Tags</a>
  <a href="/categories/">Categories</a>
  <a href="/authors/">Authors</a>
</nav>
```

Or use 11ty data for navigation:
```javascript
// In .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addGlobalData("nav", [
    { text: "Home", url: "/" },
    { text: "About", url: "/about/" },
    { text: "Tags", url: "/tags/" },
    { text: "Categories", url: "/categories/" },
  ]);
};
```

Use in template:
```html
<nav aria-label="Main Navigation">
  {% for item in nav %}
    <a href="{{ item.url }}">{{ item.text }}</a>
  {% endfor %}
</nav>
```
