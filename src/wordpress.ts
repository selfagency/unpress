import fs from 'fs-extra';
import type { RequestInit } from 'node-fetch';
import fetch from 'node-fetch';
import YAML from 'yaml';

export interface WordPressAuth {
  username: string;
  appPassword: string;
}

export interface WordPressApiOptions {
  baseUrl: string;
  auth: WordPressAuth;
}

export class WordPressApi {
  private baseUrl: string;
  private auth: WordPressAuth;

  constructor(options: WordPressApiOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.auth = options.auth;
  }

  private getAuthHeader() {
    const { username, appPassword } = this.auth;
    const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
    return `Basic ${token}`;
  }

  private buildHeaders(initHeaders?: RequestInit['headers']): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: this.getAuthHeader(),
    };

    if (!initHeaders) return headers;

    if (Array.isArray(initHeaders)) {
      for (const [key, value] of initHeaders) headers[key] = String(value);
      return headers;
    }

    if (typeof (initHeaders as any).forEach === 'function') {
      (initHeaders as any).forEach((value: unknown, key: string) => {
        headers[key] = String(value);
      });
      return headers;
    }

    Object.assign(headers, initHeaders as Record<string, string>);
    return headers;
  }

  async fetch(path: string, init: RequestInit = {}): Promise<any> {
    return this.fetchRaw(path, init);
  }

  /** Raw fetch that returns the Response object for header access. */
  private async fetchRaw(path: string, init: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    return this.fetchWithTimeout(url, init, async () => {
      const res = await fetch(url, init);
      return res as unknown as Response;
    });
  }

  // Helper to handle common timeout and response handling
  private async fetchWithTimeout<T>(url: string, init: RequestInit, fetchFn: () => Promise<Response>): Promise<T> {
    const controller = new AbortController();
    const timeout = ((init as Record<string, unknown>)?.timeout ?? 30000) as number;
    const signal = controller.signal;
    const headers = this.buildHeaders(init.headers);

    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetchFn();
      if (!res.ok) {
        throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // Helper to perform GET with retries for transient errors
  private async requestWithRetries(path: string, attempts = 3, perTryTimeout = 30000) {
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.fetch(path, {
          method: 'GET',
          timeout: perTryTimeout,
        } as RequestInit);
      } catch (err) {
        lastErr = err;
        // simple backoff
        const wait = 500 * Math.pow(2, i);
        await new Promise(r => setTimeout(r, wait));
      }
    }
    throw lastErr;
  }

  private async requestRawWithRetries(path: string, attempts = 3, perTryTimeout = 30000) {
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.fetchRaw(path, {
          method: 'GET',
          timeout: perTryTimeout,
        } as RequestInit);
      } catch (err) {
        lastErr = err;
        const wait = 500 * Math.pow(2, i);
        await new Promise(r => setTimeout(r, wait));
      }
    }
    throw lastErr;
  }

  async fetchAllPostsPagesAndTaxonomiesPaged({
    perPage,
    onProgress,
  }: { perPage?: number; onProgress?: (type: string, page: number, total: number) => void } = {}) {
    const types = [
      { key: 'posts', endpoint: '/wp-json/wp/v2/posts' },
      { key: 'pages', endpoint: '/wp-json/wp/v2/pages' },
      { key: 'categories', endpoint: '/wp-json/wp/v2/categories' },
      { key: 'tags', endpoint: '/wp-json/wp/v2/tags' },
    ];
    const results: Record<string, any[]> = {};
    for (const { key, endpoint } of types) {
      let page = 1;
      let items: any[] = [];
      let total = 0;
      while (true) {
        const url = `${endpoint}?per_page=${perPage ?? 100}&page=${page}`;
        let data: any[];

        if (page === 1) {
          // Use raw fetch on first page to read pagination headers
          const res = await this.requestRawWithRetries(url);
          const response = res as unknown as Response;
          const h = response.headers.get('X-WP-TotalPages') || response.headers.get('x-wp-totalpages');
          total = Number.parseInt(h || '1', 10);
          data = (await response.json()) as any[];
        } else {
          data = (await this.requestWithRetries(url)) as any[];
        }
        const pageItems = Array.isArray(data) ? data : [];
        items.push(...pageItems);
        if (onProgress) onProgress(key, page, total);
        if (page >= total || pageItems.length < (perPage ?? 100)) break;
        page++;
      }
      results[key] = items;
    }
    return results;
  }

  static async loadYamlDefinition(filePath: string) {
    const content = await fs.readFile(filePath, 'utf8');
    return YAML.parse(content);
  }

  static async saveState(filePath: string, state: any) {
    await fs.writeJson(filePath, state, { spaces: 2 });
  }

  static async loadState(filePath: string): Promise<null | Record<string, unknown>> {
    try {
      return await fs.readJson(filePath);
    } catch {
      return null;
    }
  }
}
