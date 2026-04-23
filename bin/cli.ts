#!/usr/bin/env node

import cac from 'cac';
import { loadConfig } from '../src/config';

const cli = cac('unpress');

cli
  .option('--wp-url <url>', 'WordPress site URL')
  .option('--wp-user <user>', 'WordPress username')
  .option('--wp-app-password <password>', 'WordPress app password')
  .option('--download-media', 'Download referenced media');
// generation & indexing
cli.option('--generate-site', 'Generate a minimal 11ty site in the output dir');
cli.option('--out-dir <dir>', 'Output directory for generated site (defaults to cwd)');
cli.option('--index-meili', 'After generation, index generated posts into Meilisearch');
cli.option('--meili-host <url>', 'Meilisearch host (e.g., http://127.0.0.1:7700)');
cli.option('--meili-api-key <key>', 'Meilisearch API key');
cli.option('--meili-index <name>', 'Meilisearch index name');

cli.help();

cli.command('', async flags => {
  try {
    const config = await loadConfig(flags);
    // Placeholder: print config for now
    console.log('Loaded config:', config);

    // Optionally generate site first
    const outDir = flags['out-dir'] || process.cwd();
    if (flags['generate-site']) {
      try {
        const gen = (await import('../src/generator')).default;
        console.log(`Generating 11ty site into ${outDir}/site`);
        await gen(outDir);
        console.log('Site generation complete');
      } catch (err) {
        console.error('Site generation failed:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }

    // Optional Meilisearch indexing step (can run alone or after generation)
    if (flags['index-meili']) {
      const host = flags['meili-host'] || process.env.MEILI_HOST || 'http://127.0.0.1:7700';
      const apiKey = flags['meili-api-key'] || process.env.MEILI_API_KEY;
      const indexName = flags['meili-index'] || process.env.MEILI_INDEX || 'posts';
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
