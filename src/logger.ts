export function info(msg: string, ...args: any[]) {
  console.log('[info]', msg, ...args);
}

export function warn(msg: string, ...args: any[]) {
  console.warn('[warn]', msg, ...args);
}

export function error(msg: string, ...args: any[]) {
  console.error('[error]', msg, ...args);
}

export function progress(step: string, pct?: number) {
  if (pct != null) {
    console.log(`[progress] ${step} (${Math.round(pct * 100)}%)`);
  } else {
    console.log(`[progress] ${step}`);
  }
}

export default { info, warn, error, progress };
