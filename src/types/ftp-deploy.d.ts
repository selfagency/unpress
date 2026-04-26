declare module 'ftp-deploy' {
  import { EventEmitter } from 'events';

  interface FtpDeployConfig {
    host: string;
    user: string;
    password: string;
    port?: number;
    localRoot?: string;
    remoteRoot?: string;
    include?: string[];
    exclude?: string[];
    deleteRemote?: boolean;
    forcePasv?: boolean;
    sftp?: boolean;
    privateKey?: string;
    passphrase?: string;
  }

  interface FtpDeployEventObject {
    totalFilesCount: number;
    transferredFileCount: number;
    filename: string;
  }

  class FtpDeployer extends EventEmitter {
    eventObject: FtpDeployEventObject;
    ftp: any;

    constructor();

    deploy(config: FtpDeployConfig): Promise<void>;
    makeDir(newDirectory: string): Promise<string>;
    makeAndUpload(remoteDir: string, localDir: string, files: string[]): Promise<void>;
    makeAllAndUpload(remoteDir: string, filemap: Record<string, string[]>): Promise<void>;
  }

  export = FtpDeployer;
}
