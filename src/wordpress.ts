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
    let baseHeaders: Record<string, string> = {};
    if (init.headers) {
      if (Array.isArray(init.headers)) {
        for (const [k, v] of init.headers as [string, string][]) {
          baseHeaders[k] = v;
        }
      } else if (init.headers instanceof Object && !(init.headers instanceof Headers)) {
        baseHeaders = { ...(init.headers as Record<string, string>) };
      } else if (init.headers instanceof Headers) {
        (init.headers as Headers).forEach((v, k) => {
          baseHeaders[k] = v;
        });
      }
    }
    const headers = {
      ...baseHeaders,
      Authorization: this.getAuthHeader(),
      Accept: 'application/json',
    };
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
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
        // reuse this.fetch to ensure consistent headers/auth and centralized error handling
        const data = (await this.fetch(`${endpoint}?per_page=${perPage ?? 100}&page=${page}`)) as any[];
        // attempt to read total pages from header via a raw fetch for first page
        if (page === 1) {
          try {
            const head = await fetch(`${this.baseUrl}${endpoint}?per_page=${perPage ?? 100}&page=1`, {
              method: 'HEAD',
              headers: { Authorization: this.getAuthHeader(), Accept: 'application/json' },
            });
            const h = head.headers.get('X-WP-TotalPages') || head.headers.get('x-wp-totalpages');
            total = parseInt(h || '1', 10);
          } catch {
            total = 1;
          }
        }
        items.push(...data);
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
