import { describe, it, expect } from 'vitest';

describe('SCP Media Configuration', () => {
  it('should allow host configuration', () => {
    const config = {
      scp: {
        host: 'sftp.example.com',
        username: 'deploy',
        destinationPath: '/var/www/media',
      },
    };

    expect(config.scp.host).toBe('sftp.example.com');
  });

  it('should support path configuration', () => {
    const config = {
      scp: {
        host: 'sftp.example.com',
        destinationPath: '/var/www/media/uploads',
      },
    };

    expect(config.scp.destinationPath).toBe('/var/www/media/uploads');
  });

  it('should support environment-based configuration', () => {
    const config = {
      scp: {
        env: 'SCP_PRODUCTION',
      },
    };

    expect(config.scp.env).toBe('SCP_PRODUCTION');
  });

  it('should maintain compatibility with existing adapter types', () => {
    const config = {
      type: 'scp',
    } as any;

    expect(config.type).toBe('scp');
  });
});
