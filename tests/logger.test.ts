import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { info, warn, error } from '../src/logger';

describe('logger functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    info('Test info message');
    expect(consoleSpy).toHaveBeenCalledWith('[info]', 'Test info message');
    consoleSpy.mockRestore();
  });

  it('should log warning messages', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warn('Test warning message');
    expect(consoleSpy).toHaveBeenCalledWith('[warn]', 'Test warning message');
    consoleSpy.mockRestore();
  });

  it('should log error messages', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    error('Test error message');
    expect(consoleSpy).toHaveBeenCalledWith('[error]', 'Test error message');
    consoleSpy.mockRestore();
  });

  it('should log progress messages correctly formatted', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warn('Processing (75%)', '[progress]');
    expect(consoleSpy).toHaveBeenCalledWith('[warn]', 'Processing (75%)', '[progress]');
    consoleSpy.mockRestore();
  });

  it('should not log info messages in silent mode', () => {
    process.env.UNPRESS_SILENT = 'true';
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    info('Test info message');
    warn('Processing (75%)', '[progress]');

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();

    process.env.UNPRESS_SILENT = 'false';
    consoleLogSpy.mockRestore();
  });
});
