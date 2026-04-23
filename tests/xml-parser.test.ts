import fs from 'fs';
import path from 'path';
import { test, expect, beforeEach, afterEach } from 'vitest';
import { parseWpXmlItems } from '../src/xml-parser';

const TMP_DIR = path.join(__dirname, 'tmp');

beforeEach(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
});
afterEach(() => {
  try {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
});

test('parseWpXmlItems parses post and attachment items and writes checkpoint', async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/">
  <channel>
    <title>Example</title>
    <item>
      <title>Sample Post</title>
      <link>https://example.com/sample-post</link>
      <pubDate>Tue, 01 Jan 2020 00:00:00 +0000</pubDate>
      <dc:creator>admin</dc:creator>
      <guid isPermaLink="false">https://example.com/?p=101</guid>
      <content:encoded><![CDATA[<p>hello world</p>]]></content:encoded>
      <excerpt:encoded><![CDATA[summary]]></excerpt:encoded>
      <wp:post_id>101</wp:post_id>
      <wp:post_date>2020-01-01 00:00:00</wp:post_date>
      <wp:post_name>sample-post</wp:post_name>
      <wp:status>publish</wp:status>
      <wp:post_type>post</wp:post_type>
      <category domain="category" nicename="news">News</category>
      <wp:postmeta>
        <wp:meta_key>_key1</wp:meta_key>
        <wp:meta_value><![CDATA[value1]]></wp:meta_value>
      </wp:postmeta>
    </item>

    <item>
      <title>Attachment File</title>
      <guid isPermaLink="false">https://cdn.example.com/uploads/image.jpg</guid>
      <wp:post_id>102</wp:post_id>
      <wp:post_type>attachment</wp:post_type>
    </item>
  </channel>
  </rss>`;

  const xmlPath = path.join(TMP_DIR, 'sample.xml');
  fs.writeFileSync(xmlPath, xml, 'utf8');
  const checkpointPath = path.join(TMP_DIR, 'checkpoint.json');

  const items: any[] = [];
  await parseWpXmlItems(
    xmlPath,
    async item => {
      items.push(item);
    },
    { checkpointPath, resume: false },
  );
  expect(items.length).toBe(2);

  const post = items.find(i => i.post_type === 'post' || i.post_type === 'post');
  expect(post).toBeDefined();
  expect(post.content).toContain('<p>hello world</p>');
  expect(post.excerpt).toBe('summary');
  expect(post.postmeta && post.postmeta['_key1']).toBe('value1');
  expect(post.terms && Array.isArray(post.terms['category'])).toBeTruthy();

  const attachment = items.find(i => i.post_type === 'attachment');
  expect(attachment).toBeDefined();
  expect(attachment.guid).toContain('cdn.example.com/uploads/image.jpg');

  const ckpt = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
  // checkpoint should include last ids
  expect(ckpt.processed >= 2).toBeTruthy();
  expect(ckpt.last_post_id).toBeDefined();
  expect(ckpt.last_guid).toBeDefined();
});
