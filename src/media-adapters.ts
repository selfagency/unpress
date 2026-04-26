import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import stream from 'node:stream';
import { promisify } from 'node:util';
import { safeResolve } from './path-utils.js';
const pipeline = promisify(stream.pipeline);

// S3
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
// FTP
import FtpDeploy from 'ftp-deploy';

export type MediaAdapterOptions = {
  localDir?: string;
  s3?: { client?: S3Client; bucket: string; prefix?: string };
  ftp?: { host: string; user: string; password: string; remotePath?: string };
};

export async function downloadToLocal(url: string, destDir: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const urlObj = new URL(url);
  const filename = path.basename(urlObj.pathname) || `media-${Date.now()}`;
  const outPath = safeResolve(destDir, filename);
  await fs.promises.mkdir(destDir, { recursive: true });
  await pipeline(res.body as NodeJS.ReadableStream, fs.createWriteStream(outPath));
  return outPath;
}

export async function uploadToS3(localPath: string, client: S3Client, bucket: string, key: string): Promise<string> {
  const body = fs.createReadStream(localPath);
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body });
  await client.send(cmd);
  // Minimal URL formation; the caller may want to rewrite using CDN or endpoint
  return `s3://${bucket}/${key}`;
}

export async function uploadToFtp(
  localPath: string,
  ftpConfig: { host: string; user: string; password: string; remotePath?: string },
): Promise<string> {
  const ftpDeploy = new FtpDeploy();
  const remoteFile = path.posix.join(ftpConfig.remotePath || '/', path.basename(localPath));

  const config = {
    host: ftpConfig.host,
    user: ftpConfig.user,
    password: ftpConfig.password,
    include: [localPath],
    deleteRemote: false,
    forcePasv: true,
  };

  await ftpDeploy.deploy(config);
  return `ftp:${remoteFile}`;
}

export async function reuploadMediaToS3(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.s3 || !opts.s3.bucket) throw new Error('S3 configuration not provided');
  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const key = (opts.s3.prefix || 'uploads') + '/' + path.basename(tmp);
  const client = opts.s3.client || createS3ClientFromEnv();
  return uploadToS3(tmp, client, opts.s3.bucket, key);
}

export async function reuploadMediaToFtp(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.ftp) throw new Error('FTP configuration not provided');
  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  return uploadToFtp(tmp, opts.ftp);
}

// Helpers to construct clients from configuration or environment variables
export function createS3ClientFromConfig(cfg?: {
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}) {
  const region = cfg?.region || process.env.AWS_REGION || 'us-east-1';
  const endpoint = cfg?.endpoint ?? process.env.S3_ENDPOINT;
  const credentials =
    cfg?.accessKeyId && cfg?.secretAccessKey
      ? { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
      : undefined;

  // Build config object only with defined properties to satisfy strict TS config types
  const s3Config: any = { region };
  if (endpoint) s3Config.endpoint = endpoint;
  if (credentials) s3Config.credentials = credentials;
  if (typeof cfg?.forcePathStyle !== 'undefined') s3Config.forcePathStyle = cfg?.forcePathStyle;

  const client = new S3Client(s3Config);
  return client;
}

export function createS3ClientFromEnv() {
  const cfg: any = {};
  if (process.env.S3_ENDPOINT) cfg.endpoint = process.env.S3_ENDPOINT;
  if (process.env.AWS_REGION) cfg.region = process.env.AWS_REGION;
  if (process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY)
    cfg.accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY;
  if (process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY)
    cfg.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY;
  cfg.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || false;
  return createS3ClientFromConfig(cfg);
}
