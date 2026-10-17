import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const { products, categories, instagramUrl, phoneUrl, mapsUrl } = await import('data:text/javascript;base64,' + Buffer.from(read('catalog.js')).toString('base64'));
const html = read('index.html');
const css = read('styles.css');
const app = read('app.js');
const sources = JSON.parse(read('sources.json'));
const files = new Map(sources.images.map(item => [item.file, item]));
assert.equal(products.length, 10);
assert.equal(new Set(products.map(item => item.id)).size, products.length, 'Unique product IDs');
assert.equal(instagramUrl, sources.profile);
assert.equal(phoneUrl, sources.contacts.phone.href);
assert.equal(mapsUrl, sources.contacts.maps.url);
assert(html.includes(phoneUrl) && html.includes(mapsUrl) && html.includes(sources.contacts.facebook.url));
for (const item of sources.images) {
  const bytes = fs.readFileSync(path.join(root, item.file));
  assert.equal(bytes.length, item.bytes, `${item.file}: complete original`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, `${item.file}: unchanged original`);
  assert(bytes[0] === 0xff && bytes[1] === 0xd8, `${item.file}: JPEG`);
  assert.equal(new URL(item.source).hostname, 'www.instagram.com');
}
for (const product of products) {
  assert(categories[product.category], `Valid category for ${product.id}`);
  for (const field of ['name', 'caption', 'description']) for (const language of ['ar', 'en']) assert(product[field][language]?.trim(), `${product.id}: ${field}.${language}`);
  assert(files.has(product.image), `${product.id}: image provenance`);
  assert.equal(files.get(product.image).source, product.source, `${product.id}: original post matches image`);
  for (const field of ['price', 'stock', 'available', 'availability', 'warranty']) assert(!Object.hasOwn(product, field), `${product.id}: no inferred ${field}`);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Unique HTML IDs');
for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const value = match[1];
  if (value === '#') continue;
  if (value.startsWith('#')) assert(ids.includes(value.slice(1)), `Anchor exists: ${value}`);
  else if (!/^[a-z]+:/i.test(value)) assert(fs.existsSync(path.join(root, value)), `Local resource exists: ${value}`);
}
for (const match of (html + css).matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) assert(fs.existsSync(path.join(root, match[1])), `CSS resource exists: ${match[1]}`);
for (const tag of html.matchAll(/<[^>]+\bdata-ar="[^"]*"[^>]*>/g)) assert(/\bdata-en="/.test(tag[0]), 'English translation present');
for (const tag of html.matchAll(/<[^>]+\btarget="_blank"[^>]*>/g)) assert(/rel="[^"]*noopener/.test(tag[0]), 'External link isolation');
assert(!/assets\/products|AI-generated|illustrative imagery|images are illustrative/i.test(html + css + app + read('catalog.js')), 'Sample content replaced');
assert(css.includes('prefers-reduced-motion'), 'Reduced-motion preference respected');
assert(app.includes("localStorage.getItem") && app.includes('catch'), 'Storage failures handled');
console.log(`PASS: ${products.length} bilingual products, ${sources.images.length} original image checksums, sources, contact links, local assets, anchors and translations.`);
