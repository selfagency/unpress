import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import stream from 'stream';
import { promisify } from 'util';
const pipeline = promisify(stream.pipeline);

// S3
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
// SFTP
import SftpClient from 'ssh2-sftp-client';

export type MediaAdapterOptions = {
  localDir?: string;
  s3?: { client?: S3Client; bucket: string; prefix?: string };
  // ssh2-sftp-client has no bundled types in this project; accept any here
  sftp?: { client?: any; remotePath?: string };
};

export async function downloadToLocal(url: string, destDir: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const urlObj = new URL(url);
  const filename = path.basename(urlObj.pathname) || `media-${Date.now()}`;
  const outPath = path.join(destDir, filename);
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

export async function uploadToSftp(localPath: string, client: any, remotePath: string): Promise<string> {
  const remoteFile = path.posix.join(remotePath, path.basename(localPath));
  await client.put(localPath, remoteFile);
  return `sftp:${remoteFile}`;
}

export async function reuploadMediaToS3(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.s3 || !opts.s3.bucket) throw new Error('S3 configuration not provided');
  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const key = (opts.s3.prefix || 'uploads') + '/' + path.basename(tmp);
  const client = opts.s3.client || createS3ClientFromEnv();
  return uploadToS3(tmp, client, opts.s3.bucket, key);
}

export async function reuploadMediaToSftp(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.sftp) throw new Error('SFTP configuration not provided');
  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const client = opts.sftp.client || (await createSftpClientFromEnv());
  return uploadToSftp(tmp, client, opts.sftp.remotePath || '/');
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

export async function createSftpClientFromConfig(cfg?: {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
}) {
  const client = new SftpClient();
  const connectCfg: any = {};
  connectCfg.host = cfg?.host ?? process.env.SFTP_HOST;
  connectCfg.port = cfg?.port ?? (process.env.SFTP_PORT ? parseInt(process.env.SFTP_PORT, 10) : 22);
  connectCfg.username = cfg?.username ?? process.env.SFTP_USER;
  if (cfg?.password ?? process.env.SFTP_PASSWORD) connectCfg.password = cfg?.password ?? process.env.SFTP_PASSWORD;
  if (cfg?.privateKey ?? process.env.SFTP_PRIVATE_KEY)
    connectCfg.privateKey = cfg?.privateKey ?? process.env.SFTP_PRIVATE_KEY;
  await client.connect(connectCfg);
  return client;
}

export async function createSftpClientFromEnv() {
  const cfg: any = {};
  if (process.env.SFTP_HOST) cfg.host = process.env.SFTP_HOST;
  if (process.env.SFTP_PORT) cfg.port = parseInt(process.env.SFTP_PORT, 10);
  if (process.env.SFTP_USER) cfg.username = process.env.SFTP_USER;
  if (process.env.SFTP_PASSWORD) cfg.password = process.env.SFTP_PASSWORD;
  if (process.env.SFTP_PRIVATE_KEY) cfg.privateKey = process.env.SFTP_PRIVATE_KEY;
  return createSftpClientFromConfig(cfg);
}
