import PQueue from 'p-queue';
import { progress } from './logger.js';

export interface ProcessorOptions {
  concurrency?: number; // number of concurrent workers
  intervalCap?: number; // number of tasks per interval
  interval?: number; // interval in ms
}

/**
 * Process an array of items using a provided async worker function, with controlled concurrency/rate via p-queue.
 * @param items - array of items to process
 * @param worker - async function that processes a single item
 * @param opts - processor options (concurrency, intervalCap, interval)
 */
export async function processItems<T, R = any>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  opts: ProcessorOptions = {},
) {
  const pqOpts: any = { concurrency: opts.concurrency ?? 2 };
  if (typeof opts.intervalCap === 'number' && opts.intervalCap > 0) pqOpts.intervalCap = opts.intervalCap;
  if (typeof opts.interval === 'number' && opts.interval > 0) pqOpts.interval = opts.interval;
  const queue = new PQueue(pqOpts as any);

  const results: R[] = Array.from({ length: items.length });
  let processed = 0;

  const addPromises = items.map((it, idx) =>
    queue.add(async () => {
      const res = await worker(it, idx);
      processed++;
      progress(`processed ${processed}/${items.length}`);
      results[idx] = res;
      return res;
    }),
  );

  const resolved = await Promise.all(addPromises);
  return resolved;
}

export default { processItems };
