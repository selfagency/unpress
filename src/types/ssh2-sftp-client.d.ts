declare module 'ssh2-sftp-client' {
  export interface SftpClientConfig {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string | Buffer;
    passphrase?: string;
    readyTimeout?: number;
    strictVendor?: boolean;
    debug?: (msg: string) => void;
    promiseLimit?: number;
    forceIPv4?: boolean;
    forceIPv6?: boolean;
    agent?: string;
  }

  export interface SftpClient {
    constructor(name?: string);
    connect(config: SftpClientConfig): Promise<this>;
    list(pathname: string, options?: any): Promise<any[]>;
    stat(pathname: string): Promise<any>;
    exists(pathname: string): Promise<boolean>;
    get(localFile: string, remoteFile?: string, options?: any): Promise<any>;
    put(localFile: string, remoteFile: string, options?: any): Promise<any>;
    mkdir(remoteDir: string, attributes?: any, options?: any): Promise<void>;
    rmdir(remoteDir: string): Promise<void>;
    chmod(pathname: string, mode: string | number): Promise<void>;
    rename(src: string, dest: string): Promise<void>;
    readlink(pathname: string): Promise<string>;
    symlink(targetPath: string, linkPath: string): Promise<void>;
    realPath(pathname: string): Promise<string>;
    command(command: string): any;
    end(): void;
  }

  export default function SftpClient(options?: any): SftpClient;
}
