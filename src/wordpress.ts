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
  async fetch(path: string, init: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = (init as any).timeout ?? 30000; // 30s default
    const signal = controller.signal;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: this.getAuthHeader(),
      ...(init.headers as Record<string, string>),
    };

    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...init, headers, signal } as any);
      if (!res.ok) {
        throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /** Raw fetch that returns the Response object for header access. */
  private async fetchRaw(path: string, init: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = (init as any).timeout ?? 30000;
    const signal = controller.signal;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: this.getAuthHeader(),
      ...(init.headers as Record<string, string>),
    };

    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...init, headers, signal } as any);
      if (!res.ok) {
        throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  // Helper to perform GET with retries for transient errors
  private async requestWithRetries(path: string, attempts = 3, perTryTimeout = 30000) {
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.fetch(path, { method: 'GET', timeout: perTryTimeout } as any);
      } catch (err) {
        lastErr = err;
        // simple backoff
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
          const res = await this.fetchRaw(url);
          const h = res.headers.get('X-WP-TotalPages') || res.headers.get('x-wp-totalpages');
          total = parseInt(h || '1', 10);
          data = (await res.json()) as any[];
        } else {
          data = (await this.requestWithRetries(url)) as any[];
        }
        items.push(...(Array.isArray(data) ? data : []));
        if (onProgress) onProgress(key, page, total);
        if (page >= total || data.length < (perPage ?? 100)) break;
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
