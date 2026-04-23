import fs from 'fs';
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
  content_types: z.array(ContentTypeSchema).optional(),
  media: MediaSchema.optional(),
  processing: ProcessingSchema.optional(),
  resume: ResumeSchema.optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export function loadProjectConfigFromFile(path: string): ProjectConfig {
  if (!fs.existsSync(path)) throw new Error(`Config file not found: ${path}`);
  const raw = fs.readFileSync(path, 'utf8');
  const parsed = parse(raw);
  const result = ProjectConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid config file ${path}: ${result.error.message}`);
  }
  return result.data;
}

export function mergeConfig(flags: Record<string, any>, fileConfig?: ProjectConfig): ProjectConfig {
  // Very small merge: flags override fileConfig for a few known keys; expand as needed.
  const merged: any = { ...(fileConfig || {}) };

  if (flags.source) merged.source = { ...(merged.source || {}), type: flags.source };
  if (flags['source-type']) merged.source = { ...(merged.source || {}), type: flags['source-type'] };
  if (flags['xml-file']) merged.source = { ...(merged.source || {}), xml: { file: flags['xml-file'] } };
  if (flags['content-types'])
    merged.content_types = Array.isArray(flags['content-types']) ? flags['content-types'] : [flags['content-types']];

  if (!merged.processing) merged.processing = {};
  if (typeof flags.concurrency === 'number') merged.processing.concurrency = flags.concurrency;
  if (typeof flags.intervalCap === 'number') merged.processing.intervalCap = flags.intervalCap;
  if (typeof flags.interval === 'number') merged.processing.interval = flags.interval;

  // Validate merged result
  const parsed = ProjectConfigSchema.parse(merged);
  return parsed;
}
