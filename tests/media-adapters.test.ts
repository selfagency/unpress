import { describe, it, expect } from 'vitest';
import { uploadToS3, uploadToSftp } from '../src/media-adapters';

describe('media-adapters', () => {
  it('should have uploadToS3 function', () => {
    expect(uploadToS3).toBeDefined();
  });

  it('should have uploadToSftp function', () => {
    expect(uploadToSftp).toBeDefined();
  });
});
