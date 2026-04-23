# Customization Guide

Customize your generated 11ty site with new templates, styles, and functionality.

## Overview

Unpress generates a minimal, working 11ty site. You can customize nearly everything:

- **Layouts** - Change HTML structure and design
- **Styles** - Add CSS, themes, or frameworks
- **Templates** - Create new page types and components
- **Content Types** - Add custom WordPress content types
- **Frontmatter** - Add custom fields and metadata

::: tip Work with Copies
Before customizing, copy your `site/` folder to preserve the original migration output. This way, you can always re-run migration if needed.
:::

## Customizing Templates

### Modify Base Template

Edit `_includes/layouts/base.njk` to change site-wide structure:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} - My Site</title>
  <link rel="stylesheet" href="/assets/styles.css">
  <!-- Add custom CSS -->
  <link rel="stylesheet" href="/assets/custom.css">
</head>
<body>
  <a href="#maincontent" class="skip-link">Skip to main content</a>

  <header>
    <nav aria-label="Main Navigation">
      <a href="/">Home</a>
      <a href="/about/">About</a>
      <a href="/tags/">Tags</a>
      <a href="/categories/">Categories</a>
    </nav>
  </header>

  <main id="maincontent">
    {{ content | safe }}
  </main>

  <footer>
    <p>&copy; 2024 My Site. All rights reserved.</p>
  </footer>
</body>
</html>
```

**Common customizations:**
- Add logo or site title in header
- Add sidebar with recent posts or categories
- Add search box or social media links
- Change footer with additional links or copyright
- Add analytics (Google Analytics, Plausible, etc.)

### Create New Layouts

Create additional layouts in `_includes/layouts/`:

**Post layout** - `_includes/layouts/post.njk`:
```html
---
layout: base.njk
---

<article class="post">
  <header>
    <h1>{{ title }}</h1>
    <time datetime="{{ date | date('iso') }}">{{ date | date('MMMM D, YYYY') }}</time>
    {% if author %}
      <p>By {{ author.name }}</p>
    {% endif %}
  </header>

  {{ content | safe }}

  {% if tags %}
    <footer>
      <p>Tags: {% for tag in tags %}<a href="/tags/{{ tag }}/">{{ tag }}</a>{% if not loop.last %}, {% endif %}{% endfor %}</p>
    </footer>
  {% endif %}
</article>
```

**Use layout in post:**
```markdown
---
layout: post.njk
title: "My Post"
---
```

### Create Page Templates

Create reusable page templates:

**About page template** - `_includes/templates/about.njk`:
```html
---
layout: base.njk
title: "About"
---

<section class="about">
  <h1>About {{ site.name }}</h1>
  {{ content | safe }}
</section>
```

**Use template:**
```markdown
---
layout: ../templates/about.njk
---

This is the about page content.
```

## Customizing Styles

### Modify Existing CSS

Edit `assets/styles.css` to change colors, fonts, and layout:

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #1e293b;
  --color-text: #334155;
  --color-background: #ffffff;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-background);
  line-height: 1.6;
}

header {
  background: var(--color-secondary);
  color: white;
  padding: 1rem 2rem;
}

nav a {
  color: white;
  margin-right: 1rem;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}

main {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

footer {
  background: var(--color-secondary);
  color: white;
  padding: 1rem 2rem;
  text-align: center;
}
```

### Add Custom CSS

Create `assets/custom.css` and include it in base template:

```html
<link rel="stylesheet" href="/assets/custom.css">
```

**Custom CSS example:**
```css
/* Custom button styles */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 0.25rem;
  transition: background 0.3s;
}

.btn:hover {
  background: #2563eb;
}

/* Sidebar styles */
.sidebar {
  background: var(--color-background);
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #e2e8f0;
    --color-background: #1e293b;
  }
}
```

### Use CSS Framework

Add a CSS framework like Tailwind CSS, Bootstrap, or Bulma:

**Install Tailwind CSS:**
```bash
cd site
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Create `assets/tailwind.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Include in base template:**
```html
<link rel="stylesheet" href="/assets/tailwind.css">
```

**Use Tailwind classes in templates:**
```html
<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-blue-600">{{ title }}</h1>
  <div class="prose prose-lg mt-6">
    {{ content | safe }}
  </div>
</div>
```

## Customizing Frontmatter

### Add Custom Fields

Add custom fields to your post frontmatter:

```markdown
---
title: "My Post"
date: 2024-01-15
slug: my-post
author:
  name: Jane Doe
  email: jane@example.com
categories:
  - Technology
tags:
  - Web Development
featured_image: https://example.com/image.jpg
reading_time: 5 minutes  # Custom field
difficulty: Intermediate  # Custom field
---

Post content...
```

### Display Custom Fields in Templates

**In post layout:**
```html
<article>
  <header>
    <h1>{{ title }}</h1>
    {% if reading_time %}
      <p>Reading time: {{ reading_time }}</p>
    {% endif %}
    {% if difficulty %}
      <span class="badge">{{ difficulty }}</span>
    {% endif %}
  </header>

  {{ content | safe }}

  {% if featured_image %}
    <img src="{{ featured_image }}" alt="{{ title }}">
  {% endif %}
</article>
```

### Add Custom Fields to All Posts

Edit migration config (`types.yml`) to map WordPress custom fields:

```yaml
- name: post
  source: post
  slug_field: slug
  title_field: title
  body_field: content
  excerpt_field: excerpt
  date_field: date
  fields:
    - name: author
      source: author
    - name: featured_image
      source: featured_media
    - name: reading_time
      source: custom_field_reading_time  # WordPress custom field
    - name: difficulty
      source: custom_field_difficulty  # WordPress custom field
```

Unpress will now include these fields in frontmatter.

## Customizing Content Types

### Add New Content Type

Add custom WordPress content type to migration:

**Edit `types.yml`:**
```yaml
- name: product  # New content type
  source: product  # WordPress post type slug
  slug_field: slug
  title_field: title
  body_field: content
  excerpt_field: excerpt
  date_field: date
  fields:
    - name: price
      source: custom_field_price
    - name: sku
      source: custom_field_sku
```

**Run migration:**
```bash
unpress --config unpress.yml --generate-site
```

Products will be created in `content/products/` folder.

### Create Custom Template for New Type

Create `_includes/layouts/product.njk`:
```html
---
layout: base.njk
---

<article class="product">
  <header>
    <h1>{{ title }}</h1>
    {% if price %}
      <p class="price">${{ price }}</p>
    {% endif %}
    {% if sku %}
      <p class="sku">SKU: {{ sku }}</p>
    {% endif %}
  </header>

  {{ content | safe }}
</article>
```

**Add to product frontmatter:**
```markdown
---
layout: product.njk
title: "My Product"
price: 29.99
sku: PROD-001
---
```

## Customizing 11ty Configuration

### Add Plugins

Edit `.eleventy.js` to add 11ty plugins:

```javascript
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {
  // Add RSS feed
  eleventyConfig.addPlugin(pluginRss, {
    outputFilename: "feed.xml",
  });

  // Add syntax highlighting for code blocks
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  return {
    dir: {
      input: "content",
      output: "_site",
      includes: "../_includes",
    },
    templateFormats: ["md", "njk"],
  };
};
```

### Add Filters

Create custom 11ty filters:

```javascript
// In .eleventy.js
module.exports = function(eleventyConfig) {
  // Custom filter: capitalize first letter
  eleventyConfig.addFilter("capitalize", (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Custom filter: reading time estimate
  eleventyConfig.addFilter("readingTime", (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  });

  return {
    // ... config
  };
};
```

**Use filters in templates:**
```html
<h1>{{ title | capitalize }}</h1>
<p>Reading time: {{ content | readingTime }}</p>
```

### Add Shortcodes

Create reusable content with shortcodes:

```javascript
// In .eleventy.js
module.exports = function(eleventyConfig) {
  // Shortcode: YouTube embed
  eleventyConfig.addShortcode("youtube", (videoId) => {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
  });

  // Shortcode: Warning box
  eleventyConfig.addShortcode("warning", (content) => {
    return `<div class="warning-box">${content}</div>`;
  });

  return {
    // ... config
  };
};
```

**Use shortcodes in Markdown:**
```markdown
This is my post.

{% youtube "dQw4w9WgXcQ" %}

{% warning %}This is a warning message.{% endwarning %}
```

## Advanced Customization

### Add Search

Integrate Meilisearch for site search:

**See [Meilisearch Guide](./meilisearch.md) for complete setup.**

### Add Comments

Add third-party commenting system:

**Disqus:**
```html
<div id="disqus_thread"></div>
<script>
  var disqus_config = function () {
    this.page.url = '{{ page.url | absoluteUrl }}';
    this.page.identifier = '{{ page.fileSlug }}';
  };
  (function() {
    var d = document, s = d.createElement('script');
    s.src = 'https://your-site.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  })();
</script>
```

**Utterances (GitHub comments):**
```html
<script src="https://utteranc.es/client.js"
  repo="username/repo"
  issue-term="title"
  theme="github-light"
  crossorigin="anonymous"
  async>
</script>
```

### Add Analytics

**Google Analytics:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Plausible Analytics (privacy-friendly):**
```html
<script defer data-domain="your-site.com" src="https://plausible.io/js/script.js"></script>
```

### Add Image Optimization

Use 11ty image plugin for responsive images:

```javascript
// In .eleventy.js
const Image = require("@11ty/eleventy-img");

module.exports = function(eleventyConfig) {
  eleventyConfig.addAsyncShortcode("image", async function(src, alt, sizes) {
    let metadata = await Image(src, {
      widths: [300, 600, 900, 1200],
      formats: ["avif", "jpeg"],
      outputDir: "./_site/img/",
    });

    let imageAttributes = {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes, {
      whitespaceMode: "inline",
    });
  });

  return {
    // ... config
  };
};
```

**Use in templates:**
```html
{% image "/assets/image.jpg", "Alt text", "(max-width: 800px) 100vw" %}
```

## Customization Workflow

### Recommended Workflow

1. **Copy site folder** - Preserve original migration output
2. **Test changes locally** - Use `eleventy --serve` to preview
3. **Commit changes** - Use Git to track customizations
4. **Re-run migration** - When WordPress site updates
5. **Apply customizations** - Copy custom templates/styles back to new site

### Using Git for Customizations

Initialize Git repository for your customizations:

```bash
cd site
git init
git add .
git commit -m "Initial migration"

# Customize site
git add .
git commit -m "Add custom layout and styles"
```

**Re-run migration:**
```bash
# Backup customizations
cd ..
cp -r site site-custom

# Re-run migration
unpress --config unpress.yml --generate-site

# Restore customizations
cp -r site-custom/.git site/.git
cd site
git checkout -- .
```

## Next Steps

After customizing your site:

1. **[Deployment Guide](./deployment.md)** - Deploy your customized site
2. **[11ty Documentation](https://www.11ty.dev/docs/)** - Learn more advanced 11ty features
3. **[Generated Site Guide](./generated-site.md)** - Understand site structure better
