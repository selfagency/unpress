// Because ssh2 is a native module that may not be available at build time
// We keep the import, but just don't use ServerClient directly here

import { ServerClient } from 'ssh2';

declare module 'ssh2' {
  export {}; // Only re-export external to avoid bundling issues
}
