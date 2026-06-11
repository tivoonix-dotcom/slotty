import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSeoMeta } from './seoConfig.js';
import { SEO_DEFAULT_ROBOTS, SEO_NOINDEX_ROBOTS } from './seoSite.js';

test('resolveSeoMeta returns hub meta for /book', () => {
  const meta = resolveSeoMeta('/book');
  assert.match(meta.title, /Минске/);
  assert.equal(meta.robots, SEO_DEFAULT_ROBOTS);
  assert.equal(meta.canonicalPath, '/book');
});

test('resolveSeoMeta indexes master landing', () => {
  const meta = resolveSeoMeta('/master/start');
  assert.equal(meta.robots, SEO_DEFAULT_ROBOTS);
  assert.equal(meta.canonicalPath, '/master/start');
  assert.match(meta.title.toLowerCase(), /мастер/);
});

test('resolveSeoMeta noindexes private zones', () => {
  assert.equal(resolveSeoMeta('/login').robots, SEO_NOINDEX_ROBOTS);
  assert.equal(resolveSeoMeta('/zapis').robots, SEO_NOINDEX_ROBOTS);
  assert.equal(resolveSeoMeta('/profile').robots, SEO_NOINDEX_ROBOTS);
  assert.equal(resolveSeoMeta('/admin/overview').robots, SEO_NOINDEX_ROBOTS);
  assert.equal(resolveSeoMeta('/client/appointments/SL-123').robots, SEO_NOINDEX_ROBOTS);
  assert.equal(resolveSeoMeta('/payment/success').robots, SEO_NOINDEX_ROBOTS);
});

test('resolveSeoMeta returns category-specific meta and og image', () => {
  const meta = resolveSeoMeta('/services/category/manicure');
  assert.match(meta.title, /Маникюр/);
  assert.match(meta.ogImage ?? '', /og-category-manicure\.jpg/);
  assert.equal(meta.canonicalPath, '/services/category/manicure');
});

test('resolveSeoMeta returns noindex for unknown routes', () => {
  const meta = resolveSeoMeta('/does-not-exist');
  assert.equal(meta.robots, SEO_NOINDEX_ROBOTS);
  assert.match(meta.title, /не найдена/);
});

test('resolveSeoMeta ignores query params for canonical path resolution', () => {
  const meta = resolveSeoMeta('/services?sort=rating&tab=popular');
  assert.equal(meta.canonicalPath, '/services');
});
