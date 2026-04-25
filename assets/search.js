// Minimal client-side Meilisearch fetcher. Expects window.MEILI_CONFIG = { host, apiKey, index }
(function () {
  const cfg = (globalThis && globalThis.MEILI_CONFIG) || {};
  const form = document.getElementById('search-form');
  const results = document.getElementById('results');
  if (!form || !results) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const q = document.getElementById('q').value;
    if (!q) return;
    if (!cfg.host) {
      // Render a plain-text message to avoid HTML injection
      results.textContent = 'Search is not configured. Enable Meilisearch to use search.';
      return;
    }
    // Compose URL safely and avoid operator-precedence bugs
    const indexName = cfg.index || 'posts';
    const url = `${String(cfg.host).replace(/\/$/, '')}/indexes/${encodeURIComponent(indexName)}/search`;
    const body = { q: q, limit: 10 };
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers['X-Meili-API-Key'] = cfg.apiKey;
    try {
      const res = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      const json = await res.json();
      const hits = json.hits || [];
      // Clear results and append DOM nodes to avoid using innerHTML with untrusted data
      results.innerHTML = '';
      if (!hits || hits.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No results';
        results.appendChild(p);
      } else {
        for (const h of hits) {
          const article = document.createElement('article');
          const h3 = document.createElement('h3');
          const a = document.createElement('a');
          // Ensure slug is treated as text for URL parts
          const slug = h?.slug ? String(h.slug) : '';
          a.setAttribute('href', `/${encodeURIComponent(slug)}/`);
          a.textContent = h?.title ? String(h.title) : 'Untitled';
          h3.appendChild(a);
          article.appendChild(h3);
          const p = document.createElement('p');
          p.textContent = h?.excerpt ? String(h.excerpt) : '';
          article.appendChild(p);
          results.appendChild(article);
        }
      }
    } catch {
      results.innerHTML = '<p>Error querying search service.</p>';
    }
  });
})();
