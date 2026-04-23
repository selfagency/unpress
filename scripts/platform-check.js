#!/usr/bin/env node
// Quick platform compatibility helper
const os = require('os');
console.log('Platform:', process.platform);
console.log('Node.js version:', process.version);
console.log('CPU count:', os.cpus().length);
console.log('Home dir:', os.homedir());
console.log('Path separator:', require('path').sep);
console.log('\nNote: This script verifies Node environment details. For full cross-platform tests, run the CLI on each target platform or set up CI matrix.');
