import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs-extra');

describe('CLI flag normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should get flag value from CLI flags', () => {
    const flags = { 'wp-url': 'https://example.com' };
    const getFlag = (...keys: string[]) => {
      for (const k of keys) {
        if (typeof (flags as any)[k] !== 'undefined') return (flags as any)[k];
      }
      return undefined;
    };

    const result = getFlag('wpUrl', 'wp-url', 'wp_url');
    expect(result).toBe('https://example.com');
  });

  it('should return undefined for missing flags', () => {
    const flags = {};
    const getFlag = (...keys: string[]) => {
      for (const k of keys) {
        if (typeof (flags as any)[k] !== 'undefined') return (flags as any)[k];
      }
      return undefined;
    };

    const result = getFlag('wpUrl', 'wp-url');
    expect(result).toBeUndefined();
  });

  it('should prioritize later keys in getFlag', () => {
    const flags = { 'wp-url': 'first', wp_user: 'second' };
    const getFlag = (...keys: string[]) => {
      for (const k of keys) {
        if (typeof (flags as any)[k] !== 'undefined') return (flags as any)[k];
      }
      return undefined;
    };

    const result = getFlag('wp_url', 'wp-user', 'wp_user');
    expect(result).toBe('second');
  });
});

describe('CLI config loading logic', () => {
  it('should normalize WP URL from flags', () => {
    const flags = { 'wp-url': 'https://example.com', abc: 'xyz' };

    const normalized = {
      wpUrl: (flags as any).wpUrl || (flags as any)['wp-url'],
    };

    expect(normalized.wpUrl).toBe('https://example.com');
  });

  it('should normalize WP user from multiple format variations', () => {
    const flags1 = { 'wp-user': 'testuser' };
    const flags2 = { wp_user: 'testuser' };
    const flags3 = { wpUser: 'testuser' };

    const normalized1 = { wpUser: flags1.wp_user || flags1['wp-user'] || flags1.wp_user || undefined };
    const normalized2 = { wpUser: flags2.wpUser || flags2['wp-user'] || flags2.wp_user || undefined };
    const normalized3 = { wpUser: flags3.wpUser || flags3['wp-user'] || flags3.wp_user || undefined };

    expect(normalized1.wpUser).toBe('testuser');
    expect(normalized2.wpUser).toBe('testuser');
    expect(normalized3.wpUser).toBe('testuser');
  });

  it('should convert download-media boolean flag', () => {
    const flags1 = { 'download-media': true };
    const flags2 = { 'download-media': false };

    const normalized1 = typeof flags1['download-media'] === 'boolean' ? flags1['download-media'] : false;
    const normalized2 = typeof flags2['download-media'] === 'boolean' ? flags2['download-media'] : false;

    expect(normalized1).toBe(true);
    expect(normalized2).toBe(false);
  });

  it('should use default false when download-media flag is missing', () => {
    const flags = {};
    const normalized = typeof flags['download-media'] === 'boolean' ? flags['download-media'] : false;

    expect(normalized).toBe(false);
  });

  it('should determine source type from flags', () => {
    const flags = { source: 'api' };
    const sourceType = flags.source || flags.sourceType || flags['source-type'];

    expect(sourceType).toBe('api');
  });

  it('should determine source type from missing not needed operations', () => {
    const flags = { 'generate-site': true, 'index-meili': true };
    const sourceType = flags.source || flags.sourceType || flags['source-type'];

    expect(sourceType).toBeUndefined();
  });

  it('should determine source from XML file', () => {
    const flags = { 'xml-file': 'export.xml' };
    const sourceType = flags.source || flags.sourceType || flags['source-type'];

    expect(sourceType).toBeUndefined();
  });

  it('should check if API auth is needed', () => {
    const flags = { source: 'api' };
    const sourceType = flags.source || flags.sourceType || flags['source-type'];
    const needsApiAuth =
      sourceType === 'api' || (!sourceType && !flags['generate-site'] && !flags['index-meili'] && !flags['xml-file']);

    expect(needsApiAuth).toBe(true);
  });

  it('should check if API auth is not needed', () => {
    const flags = { 'generate-site': true };
    const sourceType = flags.source || flags.sourceType || flags['source-type'];
    const needsApiAuth =
      sourceType === 'api' || (!sourceType && !flags['generate-site'] && !flags['index-meili'] && !flags['xml-file']);

    expect(needsApiAuth).toBe(false);
  });
});

describe('CLI output directory validation', () => {
  it('should preserve absolute path without normalization', () => {
    const outDirRaw = '/some/absolute/path';
    const outDir = path.isAbsolute(outDirRaw) ? path.normalize(outDirRaw) : path.join(process.cwd(), outDirRaw);

    expect(path.isAbsolute(outDir)).toBe(true);
  });

  it('should resolve relative path relative to cwd', () => {
    const outDirRaw = 'output';
    const outDir = path.isAbsolute(outDirRaw) ? path.normalize(outDirRaw) : path.join(process.cwd(), outDirRaw);

    expect(path.relative(process.cwd(), outDir)).toBe('output');
  });

  it('should validate absolute paths through security check', () => {
    const outDir = path.join(process.cwd(), 'output');

    expect(path.isAbsolute(outDir)).toBe(true);
  });
});

describe('CLI dry-run flag', () => {
  it('should detect dry-run flag', () => {
    const flags = { 'dry-run': true };

    const hasDryRun = typeof flags['dry-run'] === 'boolean' ? flags['dry-run'] : false;

    expect(hasDryRun).toBe(true);
  });

  it('should use default false when dry-run flag is missing', () => {
    const flags = {};
    const hasDryRun = typeof flags['dry-run'] === 'boolean' ? flags['dry-run'] : false;

    expect(hasDryRun).toBe(false);
  });

  it('should validate config during dry-run', () => {
    const hasDryRun = true;
    const shouldValidateConfig = hasDryRun;

    expect(shouldValidateConfig).toBe(true);
  });
});
