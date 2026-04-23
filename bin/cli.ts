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
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
});

cli.parse();
