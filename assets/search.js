// Minimal client-side Meilisearch fetcher. Expects window.MEILI_CONFIG = { host, apiKey, index }
(function(){
  const cfg = window.MEILI_CONFIG || {};
  const form = document.getElementById('search-form');
  const results = document.getElementById('results');
  if (!form || !results) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const q = document.getElementById('q').value;
    if (!q) return;
    if (!cfg.host) {
      results.innerHTML = '<p>Search is not configured. Enable Meilisearch to use search.</p>';
      return;
    }
    const url = `${cfg.host}/indexes/${cfg.index || 'posts'}/search`;
    const body = { q, limit: 10 };
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers['X-Meili-API-Key'] = cfg.apiKey;
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      const hits = json.hits || [];
      results.innerHTML = hits.map(h=>`<article><h3><a href="/${h.slug}/">${h.title}</a></h3><p>${h.excerpt||''}</p></article>`).join('') || '<p>No results</p>';
    } catch (err) {
      results.innerHTML = '<p>Error querying search service.</p>';
    }
  });
})();
