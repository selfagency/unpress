import fs from 'fs-extra';
import path from 'path';

/**
 * Generate a minimal 11ty project structure in the given directory.
 * Creates: .eleventy.js, site/content/posts, site/_includes/layouts/base.njk, site/index.md
 */
export async function generate11tyProject(dest: string) {
  const root = path.resolve(dest);
  const eleventyConfig = `module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets');
  return {
    dir: { input: 'site', includes: '_includes', data: '_data', output: 'dist' },
  };
};
`;

  const baseLayout = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{% if title %}{{ title }} - {% endif %}{{ site.title | safe }}</title>
    <link rel="stylesheet" href="/assets/styles.css" />
  </head>
  <body>
    <a href="#maincontent" class="sr-only">Skip to main</a>
    <header role="banner">
      <h1>{{ site.title }}</h1>
      <nav aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/tags/">Tags</a>
        <a href="/categories/">Categories</a>
        <a href="/authors/">Authors</a>
      </nav>
    </header>
    <main id="maincontent" role="main">
      {{ content | safe }}
    </main>

    <footer role="contentinfo">
      <p>&copy; {{ now | date: "%Y" }} {{ site.title }}</p>
    </footer>
  </body>
</html>
`;

  const indexMd = `---
title: Home
layout: layouts/base.njk
---

# Welcome

This is a generated 11ty site.
`;

  // create directories
  await fs.ensureDir(path.join(root, 'site', '_includes', 'layouts'));
  await fs.ensureDir(path.join(root, 'site', 'content', 'posts'));
  // authors collection
  await fs.ensureDir(path.join(root, 'site', 'content', 'authors'));
  await fs.ensureDir(path.join(root, 'assets'));

  // optional: create a sample author file to seed the authors collection
  const sampleAuthor = `---
name: "Site Author"
image: "/assets/author.jpg"
bio: "This is a sample author bio. Replace with real authors during migration."
---

`;

  // write files
  await fs.writeFile(path.join(root, '.eleventy.js'), eleventyConfig, 'utf8');
  await fs.writeFile(path.join(root, 'site', '_includes', 'layouts', 'base.njk'), baseLayout, 'utf8');
  await fs.writeFile(path.join(root, 'site', 'index.md'), indexMd, 'utf8');

  // write tag/category/author templates
  const tagsTemplate = `---
layout: layouts/base.njk
title: "Tags"
---

<h2>Tags</h2>
{% for tag in collections.tags | sort(false) %}
  <h3><a href="/tags/{{ tag | slug }}/">{{ tag }}</a></h3>
{% endfor %}
`;

  const categoriesTemplate = `---
layout: layouts/base.njk
title: "Categories"
---

<h2>Categories</h2>
{% for category in collections.categories | sort(false) %}
  <h3><a href="/categories/{{ category | slug }}/">{{ category }}</a></h3>
{% endfor %}
`;

  const authorsIndex = `---
layout: layouts/base.njk
title: "Authors"
---

<h2>Authors</h2>
<ul>
{% for author in collections.authors %}
  <li><a href="{{ author.url }}">{{ author.data.name }}</a></li>
{% endfor %}
</ul>
`;

  const authorTemplate = `---
layout: layouts/base.njk
pagination:
  data: collections.authorPosts
  size: 10
---

<h2>{{ pagination.items[0].data.author.name }}</h2>
<p>{{ pagination.items[0].data.author.bio }}</p>
<ul>
{% for post in pagination.items %}
  <li><a href="{{ post.url }}">{{ post.data.title }}</a></li>
{% endfor %}
</ul>
`;

  await fs.writeFile(path.join(root, 'site', '_includes', 'layouts', 'tags.njk'), tagsTemplate, 'utf8');
  await fs.writeFile(path.join(root, 'site', '_includes', 'layouts', 'categories.njk'), categoriesTemplate, 'utf8');
  await fs.writeFile(path.join(root, 'site', '_includes', 'layouts', 'authors.njk'), authorsIndex, 'utf8');
  await fs.writeFile(path.join(root, 'site', '_includes', 'layouts', 'author.njk'), authorTemplate, 'utf8');

  // sample author file
  await fs.writeFile(path.join(root, 'site', 'content', 'authors', 'site-author.md'), sampleAuthor, 'utf8');

  // basic styles
  const styles = `:root { color-scheme: light dark; }
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width: 72ch; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
header nav a { margin-right: 1rem; }
img { max-width: 100%; height: auto; }
.sr-only:not(:focus):not(:active) {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
`;
  await fs.writeFile(path.join(root, 'assets', 'styles.css'), styles, 'utf8');
  // progress message
  try {
    const { progress } = await import('./logger.js');
    progress('templates written');
  } catch {
    /* ignore */
  }

  return {
    files: ['.eleventy.js', 'site/_includes/layouts/base.njk', 'site/index.md'],
  };
}

export default generate11tyProject;
