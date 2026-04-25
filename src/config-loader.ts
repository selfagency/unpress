import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { z } from 'zod';

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
export const MediaReuploadSftpSchema = z.object({
  host: z.string(),
  path: z.string().optional(),
});

export const MediaSchema = z.object({
  mode: z.enum(['local', 'reupload', 'leave']).optional(),
  reupload: z
    .object({
      driver: z.enum(['s3', 'sftp']),
      s3: MediaReuploadS3Schema.optional(),
      sftp: MediaReuploadSftpSchema.optional(),
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
  const resolvedPath = path.resolve(contentTypesPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Content types file not found: ${resolvedPath}`);
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = parse(raw);
  const result = z.array(ContentTypeSchema).safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid content types file ${resolvedPath}: ${result.error.message}`);
  }
  return result.data;
}

export function loadProjectConfigFromFile(path: string): ProjectConfig {
  if (!fs.existsSync(path)) throw new Error(`Config file not found: ${path}`);
  const raw = fs.readFileSync(path, 'utf8');
  const parsed = parse(raw);
  const result = ProjectConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid config file ${path}: ${result.error.message}`);
  }

  const config = result.data;
  if (typeof config.content_types === 'string') {
    config.content_types = loadContentTypesFromFile(config.content_types);
  }
  return config;
}

export function mergeConfig(flags: Record<string, any>, fileConfig?: ProjectConfig): ProjectConfig {
  // Very small merge: flags override fileConfig for a few known keys; expand as needed.
  const merged: any = { ...fileConfig };

  if (flags.source) merged.source = { ...merged.source, type: flags.source };
  if (flags['source-type']) merged.source = { ...merged.source, type: flags['source-type'] };
  if (flags['xml-file']) merged.source = { ...merged.source, xml: { file: flags['xml-file'] } };
  const contentTypesFlag = flags['content-types'] || flags.types;
  if (contentTypesFlag) {
    if (typeof contentTypesFlag === 'string') {
      merged.content_types = loadContentTypesFromFile(contentTypesFlag);
    } else if (Array.isArray(contentTypesFlag)) {
      merged.content_types = contentTypesFlag;
    }
  }

  if (typeof merged.content_types === 'string') {
    merged.content_types = loadContentTypesFromFile(merged.content_types);
  }

  if (!merged.processing) merged.processing = {};
  if (typeof flags.concurrency === 'number') merged.processing.concurrency = flags.concurrency;
  if (typeof flags.intervalCap === 'number') merged.processing.intervalCap = flags.intervalCap;
  if (typeof flags.interval === 'number') merged.processing.interval = flags.interval;

  // Validate merged result
  const parsed = ProjectConfigSchema.parse(merged);
  return parsed as ProjectConfig;
}
