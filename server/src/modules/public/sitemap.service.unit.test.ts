import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemapXml } from './sitemap.service.js';

test('buildSitemapXml escapes special characters and includes lastmod', () => {
  const xml = buildSitemapXml([
    {
      loc: 'https://slotty.of.by/master/test?id=1&x=2',
      lastmod: '2026-06-12',
    },
  ]);
  assert.match(xml, /<loc>https:\/\/slotty\.of\.by\/master\/test\?id=1&amp;x=2<\/loc>/);
  assert.match(xml, /<lastmod>2026-06-12<\/lastmod>/);
});
