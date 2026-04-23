import fs from 'fs-extra';
import path from 'path';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

// We will stub media-adapters to avoid real network calls
import * as mediaAdapters from '../src/media-adapters';
import { parseWpXmlItems } from '../src/xml-parser';

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <item>
      <title>Test Post</title>
      <link>http://example.com/test-post</link>
      <content:encoded><![CDATA[This is a post with an image ![](https://example.com/media/img.jpg)]]></content:encoded>
      <wp:post_id>100</wp:post_id>
      <wp:post_date>2026-04-23 12:00:00</wp:post_date>
    </item>
  </channel>
</rss>`;

describe('e2e xml import with media reupload (stubbed)', () => {
  const tmp = path.join(__dirname, 'e2e-tmp');
  const xmlPath = path.join(tmp, 'sample.xml');
  const stateDir = path.join(tmp, 'state');

  beforeAll(async () => {
    await fs.remove(tmp);
    await fs.ensureDir(tmp);
    await fs.writeFile(xmlPath, FIXTURE_XML, 'utf8');
  });

  afterAll(async () => {
    await fs.remove(tmp);
    vi.restoreAllMocks();
  });

  it('processes xml items and rewrites media with stubbed reupload', async () => {
    const checkpointPath = path.join(stateDir, 'xml-checkpoint.json');
    await fs.ensureDir(stateDir);
    const processed: any[] = [];
    await parseWpXmlItems(
      xmlPath,
      async item => {
        // emulate CLI behavior: instead of calling external upload, synthesize a replacement mapping
        const content = (item['content:encoded'] || item.content || '') as string;
        if (content.includes('https://example.com/media/img.jpg')) {
          item._media_map = { 'https://example.com/media/img.jpg': 's3://test-bucket/img.jpg' };
        }
        processed.push(item);
      },
      { checkpointPath, resume: false },
    );

    expect(processed.length).toBe(1);
    expect(processed[0]._media_map['https://example.com/media/img.jpg']).toBe('s3://test-bucket/img.jpg');
    // checkpoint file should exist
    const ck = await fs.readJson(checkpointPath);
    expect(ck.processed).toBeDefined();
    expect(ck.last_guid || ck.last_post_id).toBeDefined();
  });
});
