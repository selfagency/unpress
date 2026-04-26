import fetch from 'node-fetch';
// import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import stream from 'node:stream';
import { promisify } from 'node:util';
import { safeResolve, isPathWithin } from './path-utils.js';
import os from 'node:os';

const pipeline = promisify(stream.pipeline);

/**
 * Safely reads a private key file from disk.
 * Validates the path to prevent path traversal attacks.
 * @param privateKeyPath Path to the private key file
 * @returns The private key content as a string
 * @throws Error if the path is invalid or file cannot be read
 */
export function readPrivateKeySafely(privateKeyPath: string): string {
  // Only allow paths with directory traversal attempts if they resolve to a safe location
  // Prevent attacks like '../../etc/passwd'
  const resolvedPath = path.resolve(privateKeyPath);
  const allowedBase = path.resolve(process.cwd());

  // Validate path doesn't escape the allowed base directories
  if (!isPathWithin(allowedBase, resolvedPath)) {
    const tmpDir = os.tmpdir();
    if (!isPathWithin(tmpDir, resolvedPath)) {
      throw new Error(`Invalid private key path: ${privateKeyPath} (outside allowed directories)`);
    }
  }

  // Check if file exists and is readable
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Private key file not found: ${privateKeyPath}`);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`Path is not a file: ${privateKeyPath}`);
  }

  // Read the file
  const keyData = fs.readFileSync(resolvedPath, 'utf8');
  if (!keyData || keyData.trim().length === 0) {
    throw new Error(`Private key file is empty: ${privateKeyPath}`);
  }

  return keyData;
}

// S3
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// SFTP
// @ts-ignore - CommonJS compatible default export treated as class
import ssh2SftpClient from 'ssh2-sftp-client';

// SCP
import { Client as ScpClient } from 'node-scp';

export type MediaAdapterOptions = {
  localDir?: string;
  s3?: { client?: S3Client; bucket: string; prefix?: string };
  ftp?: { host: string; user: string; password: string; remotePath?: string };
  sftp?: {
    host: string;
    user: string;
    password?: string;
    privateKey?: string;
    remotePath?: string;
    port?: number;
  };
  scp?: {
    host: string;
    user: string;
    password?: string;
    privateKey?: string;
    remotePath?: string;
    port?: number;
  };
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
  const remoteFile = path.posix.join(ftpConfig.remotePath || '/', path.basename(localPath));
  return `ftp:${remoteFile}`;
}

export async function reuploadMediaToFtp(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.ftp) throw new Error('FTP configuration not provided');

  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const _remoteFile = path.posix.join(opts.ftp.remotePath || '/', path.basename(tmp));

  return uploadToFtp(tmp, opts.ftp);
}

export async function reuploadMediaToS3(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.s3 || !opts.s3.bucket) throw new Error('S3 configuration not provided');
  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const key = (opts.s3.prefix || 'uploads') + '/' + path.basename(tmp);
  const client = opts.s3.client || createS3ClientFromEnv();
  return uploadToS3(tmp, client, opts.s3.bucket, key);
}

async function uploadViaScpImpl(scpConfig: any, localPath: string, remoteFile: string): Promise<string> {
  const scpOptions = { ...scpConfig };
  scpOptions.username = scpConfig.user;

  if (!scpConfig.privateKey && !scpConfig.password) {
    throw new Error('Either private key or password must be provided for SCP');
  }

  if (scpConfig.privateKey) {
    const keyData = readPrivateKeySafely(scpConfig.privateKey);
    scpOptions.privateKey = keyData;
  } else {
    scpOptions.password = scpConfig.password;
  }

  const client = await ScpClient(scpOptions);
  await client.uploadFile(localPath, remoteFile);
  const url = `scp://${scpConfig.host}${remoteFile}`;
  await client.close();
  return url;
}

export async function reuploadMediaToSftp(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.sftp) throw new Error('SFTP configuration not provided');

  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const remoteFile = path.posix.join(opts.sftp.remotePath || '/', path.basename(tmp));

  const sftpConfig: any = {
    host: opts.sftp.host,
    user: opts.sftp.user,
    password: opts.sftp.password,
    port: opts.sftp.port,
  };

  if (opts.sftp.privateKey) {
    // Validate if the key appears to be a file path
    try {
      sftpConfig.privateKey = readPrivateKeySafely(opts.sftp.privateKey);
    } catch {
      // If it looks like a passphrase or other non-file value, keep as-is
      sftpConfig.privateKey = opts.sftp.privateKey;
    }
  }

  await uploadViaSftpImpl(sftpConfig, tmp, remoteFile);

  return `sftp://${opts.sftp.host}${remoteFile}`;
}

export async function reuploadMediaToScp(url: string, opts: MediaAdapterOptions): Promise<string> {
  if (!opts.scp) throw new Error('SCP configuration not provided');

  const tmp = await downloadToLocal(url, opts.localDir || '.unpress/media');
  const remoteFile = path.posix.join(opts.scp.remotePath || '/', path.basename(tmp));

  await uploadViaScpImpl(opts.scp, tmp, remoteFile);

  return `scp://${opts.scp.host}${remoteFile}`;
}

async function uploadViaSftpImpl(clientConfig: any, localPath: string, remoteFile: string): Promise<string> {
  if (!clientConfig.connect) {
    throw new Error('Invalid SFTP client configuration');
  }

  const client = await ssh2SftpClient(clientConfig);
  await client.put(localPath, remoteFile);
  const url = `sftp://${clientConfig.host}${remoteFile}`;
  await client.end();
  return url;
}

export async function uploadViaSftp(
  localPath: string,
  remoteFile: string,
  opts: {
    host: string;
    user: string;
    password?: string;
    privateKey?: string;
    port?: number;
  },
): Promise<string> {
  try {
    const sftpConfig: any = {
      host: opts.host,
      port: opts.port || 22,
      username: opts.user,
    };

    if (opts.privateKey) {
      const keyData = readPrivateKeySafely(opts.privateKey);
      sftpConfig.privateKey = keyData;
    } else if (opts.password) {
      sftpConfig.password = opts.password;
    }

    const client = await ssh2SftpClient(sftpConfig);
    await client.put(localPath, remoteFile);
    const url = `sftp://${opts.host}${remoteFile}`;
    await client.end();
    return url;
  } catch (err: any) {
    throw new Error(`SFTP transfer failed: ${err.message}`);
  }
}

export async function uploadViaScp(
  localPath: string,
  remoteFile: string,
  opts: {
    host: string;
    user: string;
    password?: string;
    privateKey?: string;
    port?: number;
  },
): Promise<string> {
  try {
    const scpOptions: any = {
      host: opts.host,
      port: opts.port || 22,
      username: opts.user,
    };

    if (opts.privateKey) {
      const keyData = readPrivateKeySafely(opts.privateKey);
      scpOptions.privateKey = keyData;
    } else if (opts.password) {
      scpOptions.password = opts.password;
    }

    const client = await ScpClient(scpOptions);
    await client.uploadFile(localPath, remoteFile);
    const url = `scp://${opts.host}${remoteFile}`;
    await client.close();
    return url;
  } catch (err: any) {
    throw new Error(`SCP upload failed: ${err.message}`);
  }
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

export async function createSftpClientFromConfig(cfg?: NonNullable<MediaAdapterOptions['sftp']>) {
  const sftpConfig: any = {
    host: cfg?.host || process.env.SFTP_HOST || 'localhost',
    port: cfg?.port || Number.parseInt(process.env.SFTP_PORT || '22', 10),
    username: cfg?.user || process.env.SFTP_USER || 'root',
  };

  if (cfg?.password) sftpConfig.password = cfg.password;
  if (cfg?.privateKey) sftpConfig.privateKey = cfg.privateKey;

  const client = await ScpClient(sftpConfig);
  return client;
}

export async function createSftpClientFromEnv() {
  return createSftpClientFromConfig();
}

export async function createScpClientFromConfig(cfg?: NonNullable<MediaAdapterOptions['scp']>) {
  const scpConfig: any = {
    host: cfg?.host || process.env.SCP_HOST || 'localhost',
    port: cfg?.port || Number(process.env.SCP_PORT || '22'),
    username: cfg?.user || process.env.SCP_USER || 'root',
  };

  if (cfg?.password) scpConfig.password = cfg.password;
  if (cfg?.privateKey) scpConfig.privateKey = cfg.privateKey;

  try {
    const client = await ScpClient(scpConfig);
    return client;
  } catch (err: any) {
    throw new Error(`Failed to connect to SCP server: ${err.message}`);
  }
}
