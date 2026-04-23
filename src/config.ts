import confirm from '@inquirer/confirm';
import input from '@inquirer/input';
import password from '@inquirer/password';
import chalk from 'chalk';
import dotenv from 'dotenv';

export interface UnpressConfig {
  wpUrl: string;
  wpUser: string;
  wpAppPassword: string;
  downloadMedia: boolean;
}

export async function loadConfig(flags: Partial<UnpressConfig>): Promise<UnpressConfig> {
  dotenv.config();

  // Load from env
  let wpUrl = flags.wpUrl || process.env.WP_URL;
  let wpUser = flags.wpUser || process.env.WP_USER;
  let wpAppPassword = flags.wpAppPassword || process.env.WP_APP_PASSWORD;
  let downloadMedia =
    typeof flags.downloadMedia === 'boolean' ? flags.downloadMedia : process.env.DOWNLOAD_MEDIA === 'true';

  // Prompt for missing values
  if (!wpUrl) {
    wpUrl = await input({
      message: 'WordPress site URL:',
      validate: (input: string) => input.startsWith('http') || 'Must be a valid URL',
    });
  }
  if (!wpUser) {
    wpUser = await input({
      message: 'WordPress username:',
      validate: (input: string) => input.length > 0 || 'Required',
    });
  }
  if (!wpAppPassword) {
    wpAppPassword = await password({
      message: 'WordPress app password:',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'Required',
    });
  }
  if (typeof downloadMedia !== 'boolean') {
    downloadMedia = await confirm({
      message: 'Download referenced media?',
      default: false,
    });
  }

  // Final validation
  if (!wpUrl || !wpUser || !wpAppPassword) {
    throw new Error(chalk.red('Missing required configuration.'));
  }

  return { wpUrl, wpUser, wpAppPassword, downloadMedia };
}
