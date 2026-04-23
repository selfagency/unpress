#!/usr/bin/env node

import cac from 'cac';
import { loadConfig } from '../src/config';

const cli = cac('unpress');

cli
  .option('--wp-url <url>', 'WordPress site URL')
  .option('--wp-user <user>', 'WordPress username')
  .option('--wp-app-password <password>', 'WordPress app password')
  .option('--download-media', 'Download referenced media');

cli.help();

cli.command('', async flags => {
  try {
    const config = await loadConfig(flags);
    // Placeholder: print config for now
    console.log('Loaded config:', config);

    // Optional Meilisearch indexing step
    if (flags['index-meili']) {
      const host = flags['meili-host'] || process.env.MEILI_HOST || 'http://127.0.0.1:7700';
      const apiKey = flags['meili-api-key'] || process.env.MEILI_API_KEY;
      const indexName = flags['meili-index'] || process.env.MEILI_INDEX || 'posts';
      // output dir for generated site
      const outDir = flags['out-dir'] || process.cwd();
      try {
        const { indexPostsFromDir } = await import('../src/meilisearch');
        console.log(`Indexing posts from ${outDir}/site/content/posts -> ${host}`);
        const res = await indexPostsFromDir(`${outDir}/site/content/posts`, { host, apiKey, indexName });
        console.log('Indexing result:', res);
      } catch (err) {
        console.error('Meilisearch indexing failed:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
});

cli.parse();
