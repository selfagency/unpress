import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isAllowedAbsolute, safeResolve } from './path-utils.js';
import { pathExistsSyncSafe, readFileSyncSafe } from './safe-fs.js';

export const ProcessingSchema = z.object({
  concurrency: z.number().int().positive().optional(),
  intervalCap: z.number().int().nonnegative().optional(),
  interval: z.number().int().nonnegative().optional(),
});

export const MediaReuploadS3Schema = z.object({
  bucket: z.string(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
});
// SFTP and SCP schemas are identical - reuse the same schema
export const MediaRemoteUploadSchema = z.object({
  host: z.string(),
  port: z.number().optional(),
  path: z.string().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  privateKey: z.string().optional(),
});
export const MediaReuploadSftpSchema = MediaRemoteUploadSchema;
export const MediaReuploadScpSchema = MediaRemoteUploadSchema;

export const MediaSchema = z.object({
  mode: z.enum(['local', 'reupload', 'leave']).optional(),
  reupload: z
    .object({
      driver: z.enum(['s3', 'sftp', 'scp']),
      s3: MediaReuploadS3Schema.optional(),
      sftp: MediaReuploadSftpSchema.optional(),
      scp: MediaReuploadScpSchema.optional(),
    })
    .optional(),
});

export const SourceSchema = z.object({
  type: z.enum(['api', 'xml']).optional(),
  api: z
    .object({
      baseUrl: z.string().optional(),
    })
    .optional(),
  xml: z.object({ file: z.string().optional() }).optional(),
});

export const ResumeSchema = z.object({
  stateDir: z.string().optional(),
  checkpointInterval: z.number().int().positive().optional(),
});

export const ContentTypeFieldSchema = z.object({
  name: z.string(),
  source: z.string(),
  type: z.string().optional(),
});

export const ContentTypeSchema = z.object({
  name: z.string(),
  source: z.string(),
  slug_field: z.string().optional(),
  title_field: z.string().optional(),
  body_field: z.string().optional(),
  excerpt_field: z.string().optional(),
  date_field: z.string().optional(),
  fields: z.array(ContentTypeFieldSchema).optional(),
});

export const ProjectConfigSchema = z.object({
  source: SourceSchema.optional(),
  content_types: z.union([z.array(ContentTypeSchema), z.string()]).optional(),
  media: MediaSchema.optional(),
  processing: ProcessingSchema.optional(),
  resume: ResumeSchema.optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

function loadContentTypesFromFile(contentTypesPath: string) {
  // Resolve the provided path against the current working dir and
  // ensure it cannot escape the repo via path traversal.
  // Resolve and verify containment before reading to avoid path traversal
  const raw = readFileSyncSafe(process.cwd(), contentTypesPath);
  const parsed = parse(raw);
  const result = z.array(ContentTypeSchema).safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid content types file ${contentTypesPath}: ${result.error.message}`);
  }
  return result.data;
}

export function loadProjectConfigFromFile(configPath: string): ProjectConfig {
  let resolvedConfigPath: string;
  if (path.isAbsolute(configPath)) {
    const norm = path.normalize(configPath);
    if (!isAllowedAbsolute(norm)) throw new Error(`Refusing to read config outside workspace or tmp: ${norm}`);
    resolvedConfigPath = norm;
  } else {
    resolvedConfigPath = safeResolve(process.cwd(), configPath);
  }
  // Ensure config file is readable and contained before reading (sync for CLI flow)
  if (!pathExistsSyncSafe(path.dirname(resolvedConfigPath), path.basename(resolvedConfigPath))) {
    throw new Error(`Config file not found: ${resolvedConfigPath}`);
  }
  const raw = readFileSyncSafe(path.dirname(resolvedConfigPath), path.basename(resolvedConfigPath));
  const parsed = parse(raw);
  const result = ProjectConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid config file ${resolvedConfigPath}: ${result.error.message}`);
  }

  const config = result.data;
  if (typeof config.content_types === 'string') {
    // If the content types path in config is relative, resolve it against the
    // directory containing the project config file to avoid surprises.
    const cfgDir = path.dirname(resolvedConfigPath);
    const ctRaw = config.content_types as string;
    let ctResolved: string;
    if (path.isAbsolute(ctRaw)) {
      // Only allow absolute content_types files inside workspace or tmp
      const norm = path.normalize(ctRaw);
      if (!isAllowedAbsolute(norm)) throw new Error(`Refusing to read content_types outside workspace or tmp: ${norm}`);
      ctResolved = norm;
    } else {
      ctResolved = safeResolve(cfgDir, ctRaw);
    }
    config.content_types = loadContentTypesFromFile(ctResolved);
  }
  return config;
}

export function mergeConfig(flags: Record<string, any>, fileConfig?: ProjectConfig): ProjectConfig {
  // Small merge: flags override fileConfig for a few known keys; expand as needed.
  const merged: any = fileConfig ? { ...fileConfig } : {};

  function applySourceFlags(): void {
    if (flags.source) merged.source = { ...merged.source, type: flags.source };
    if (flags['source-type']) merged.source = { ...merged.source, type: flags['source-type'] };
    if (flags['xml-file']) merged.source = { ...merged.source, xml: { file: flags['xml-file'] } };
  }

  function applyContentTypesFlag(): void {
    const contentTypesFlag = flags['content-types'] || flags.types;
    if (!contentTypesFlag) return;
    if (typeof contentTypesFlag === 'string') {
      // Resolve against cwd to avoid path traversal and ensure containment
      merged.content_types = loadContentTypesFromFile(contentTypesFlag);
    } else if (Array.isArray(contentTypesFlag)) {
      merged.content_types = contentTypesFlag;
    }
  }

  function applyProcessingFlags(): void {
    if (!merged.processing) merged.processing = {};
    if (typeof flags.concurrency === 'number') merged.processing.concurrency = flags.concurrency;
    if (typeof flags.intervalCap === 'number') merged.processing.intervalCap = flags.intervalCap;
    if (typeof flags.interval === 'number') merged.processing.interval = flags.interval;
  }

  applySourceFlags();
  applyContentTypesFlag();
  // If fileConfig had a content_types string reference, ensure it's resolved
  if (typeof merged.content_types === 'string') {
    merged.content_types = loadContentTypesFromFile(merged.content_types);
  }
  applyProcessingFlags();

  // Validate merged result
  const parsed = ProjectConfigSchema.parse(merged);
  return parsed as ProjectConfig;
}
