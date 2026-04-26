// Minimal client-side Meilisearch fetcher. Expects window.MEILI_CONFIG = { host, apiKey, index }
(function () {
  interface SearchConfig {
    host?: string;
    apiKey?: string;
    index?: string;
  }

  type Hit = {
    title?: string;
    slug?: string;
    excerpt?: string;
  };

  const cfg: SearchConfig = globalThis?.MEILI_CONFIG || {};
  const form = document.getElementById('search-form');
  const results = document.getElementById('results');

  if (!form || !results) {
    return;
  }

  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const qInput = document.getElementById('q');
    if (!qInput) return;
    const q = qInput.value;
    if (!q) {
      return;
    }

    if (!cfg.host) {
      results.textContent = 'Search is not configured. Enable Meilisearch to use search.';
      return;
    }

    const indexName = cfg.index || 'posts';
    const url = `${String(cfg.host).replace(/\/$/, '')}/indexes/${encodeURIComponent(
      indexName
    )}/search`;
    const body = { q: q, limit: 10 };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (cfg.apiKey) {
      headers['X-Meili-API-Key'] = cfg.apiKey;
    }

    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      const hits = json.hits || [];

      results.innerHTML = '';

      if (!hits || hits.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No results';
        results.appendChild(p);
      } else {
        const createArticleNode = (title?: string, slug?: string, excerpt?: string): HTMLElement => {
          const article = document.createElement('article');
          const h3 = document.createElement('h3');
          const a = document.createElement('a');

          const slugValue = slug != null ? String(slug) : '';
          a.setAttribute('href', `/${encodeURIComponent(slugValue)}/`);

          const titleText = title != null ? String(title) : 'Untitled';
          a.textContent = titleText;

          h3.appendChild(a);
          article.appendChild(h3);

          const p = document.createElement('p');
          const excerptValue = excerpt != null ? String(excerpt) : '';
          p.textContent = excerptValue;

          article.appendChild(p);
          return article;
        };

        for (const h of hits) {
          const node = createArticleNode(h?.title, h?.slug, h?.excerpt);
          results.appendChild(node);
        }
      }
    } catch {
      results.innerHTML = '<p>Error querying search service.</p>';
    }
  });
})();