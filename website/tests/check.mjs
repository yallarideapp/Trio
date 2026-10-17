import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const catalog = await import('data:text/javascript;base64,' + Buffer.from(read('catalog.js')).toString('base64'));
const { products, categories, instagramUrl, phoneUrl, mapsUrl, facebookUrl } = catalog;
const html = read('index.html'), css = read('styles.css'), app = read('app.js');
const sources = JSON.parse(read('sources.json'));
const originals = new Map(sources.images.map(item => [item.file, item]));
const deviceImages = new Map((sources.deviceImages || []).map(item => [item.file, item]));
const checksum = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bilingual = (value, label) => {
  for (const language of ['ar', 'en']) assert(value?.[language]?.trim(), `${label}.${language}: nonempty translation`);
};
function file(value) {
  const resolved = path.resolve(root, decodeURIComponent(value.split(/[?#]/)[0]));
  assert(resolved.startsWith(root + path.sep), `Resource stays inside website: ${value}`);
  assert(fs.statSync(resolved).isFile(), `Local resource exists: ${value}`);
  return fs.readFileSync(resolved);
}
assert.equal(products.length, 10, 'Complete verified product feed');
assert.equal(new Set(products.map(item => item.id)).size, products.length, 'Unique product IDs');
assert.equal(new Set(products.map(item => item.image)).size, products.length, 'Each device has its own image');
assert.equal(sources.images.length, 13, 'All original Instagram images retained');
assert.equal(originals.size, 13, 'Unique original image records');
assert.equal(sources.deviceImages?.length, 10, 'All extracted device images have provenance');
assert.equal(deviceImages.size, 10, 'Unique device image records');
assert.equal(instagramUrl, sources.profile);
assert.equal(phoneUrl, sources.contacts.phone.href);
assert.equal(mapsUrl, sources.contacts.maps.url);
assert.equal(facebookUrl, sources.contacts.facebook.url);
for (const contact of [phoneUrl, mapsUrl, facebookUrl, instagramUrl]) assert(html.includes(contact), `Verified shell contact: ${contact}`);
for (const item of sources.images) {
  assert(/^assets\/instagram\/[^/]+\.jpg$/.test(item.file), `${item.file}: original JPEG path`);
  const bytes = file(item.file);
  assert.equal(bytes.length, item.bytes, `${item.file}: complete original`);
  assert.equal(checksum(bytes), item.sha256, `${item.file}: unchanged original`);
  assert(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9, `${item.file}: complete JPEG`);
  assert.equal(new URL(item.source).hostname, 'www.instagram.com');
}
for (const item of sources.deviceImages) {
  assert(/^assets\/devices\/[^/]+\.png$/.test(item.file), `${item.file}: standalone device PNG`);
  assert(originals.has(item.sourceImage), `${item.file}: authentic original exists`);
  assert.equal(item.source, originals.get(item.sourceImage).source, `${item.file}: source post agrees`);
  assert(item.method?.trim() && item.prompt?.trim(), `${item.file}: extraction method and exact prompt`);
  const bytes = file(item.file);
  assert.equal(bytes.length, item.bytes, `${item.file}: complete extraction`);
  assert.equal(checksum(bytes), item.sha256, `${item.file}: checksum`);
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${item.file}: PNG signature`);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', `${item.file}: PNG header`);
  assert(bytes.readUInt32BE(16) >= 256 && bytes.readUInt32BE(20) >= 256, `${item.file}: usable dimensions`);
  assert.equal(bytes[24], 8, `${item.file}: 8-bit image`);
  assert.equal(bytes[25], 6, `${item.file}: RGBA transparency channel`);
}
for (const [id, category] of Object.entries(categories)) bilingual(category, `Category ${id}`);
const counts = {};
for (const product of products) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id), `${product.id}: URL-safe identifier`);
  assert(product.category !== 'all' && categories[product.category], `${product.id}: valid category`);
  counts[product.category] = (counts[product.category] || 0) + 1;
  for (const field of ['name', 'caption', 'description']) bilingual(product[field], `${product.id}.${field}`);
  assert(Array.isArray(product.specs), `${product.id}: specification list`);
  product.specs.forEach((spec, index) => bilingual(spec, `${product.id}.specs[${index}]`));
  assert(originals.has(product.originalImage), `${product.id}: authentic source image`);
  assert.equal(originals.get(product.originalImage).source, product.source, `${product.id}: original post matches`);
  assert(deviceImages.has(product.image), `${product.id}: extracted image provenance`);
  assert.equal(deviceImages.get(product.image).sourceImage, product.originalImage, `${product.id}: correct extraction original`);
  assert.equal(deviceImages.get(product.image).source, product.source, `${product.id}: correct extraction post`);
  for (const field of ['price', 'stock', 'available', 'availability', 'warranty']) assert(!Object.hasOwn(product, field), `${product.id}: no inferred ${field}`);
}
assert.deepEqual(counts, { phones: 3, wearables: 3, computers: 3, accessories: 1 }, 'Verified category counts');

// Run the real routing, filtering and render functions against a minimal shell.
// Browser checks separately cover events, layout, focus and persistent interaction.
const stored = new Map(), location = { hash: '#/' };
const document = { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, documentElement: { classList: { toggle() {} } } };
const context = vm.createContext({ __catalog: catalog, document, location, URLSearchParams, Intl, console,
  localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
  history: { replaceState(_state, _title, hash) { location.hash = hash; } }, requestAnimationFrame: callback => callback() });
vm.runInContext(app.replace(/^import\s+\{[^}]+\}\s+from\s+['"]\.\/catalog\.js(?:\?[^'"]*)?['"];?\s*$/m, 'const { categories, facebookUrl, instagramUrl, mapsUrl, phoneUrl, products } = __catalog;'), context);
const api = vm.runInContext('({ state, words, readRoute, readSaved, renderHome, renderCatalog, renderDetail, renderService, renderContact, productUrl, categoryUrl, categoryTabs, filteredProducts })', context);
assert.deepEqual(Object.keys(api.words.ar).sort(), Object.keys(api.words.en).sort(), 'Dynamic translation keys agree');
for (const language of ['ar', 'en']) for (const [key, value] of Object.entries(api.words[language])) assert(typeof value === 'function' || (typeof value === 'string' && value.trim()), `Dynamic translation ${language}.${key}`);
const routes = new Set(['#/', '#/shop', '#/saved', '#/maintenance', '#/trade-in', '#/contact']);
for (const category of Object.keys(categories).filter(id => id !== 'all')) { routes.add(api.categoryUrl(category)); routes.add(`#/saved/${category}`); }
for (const product of products) {
  const route = api.productUrl(product);
  assert(!routes.has(route), `${product.id}: unique detail route`);
  routes.add(route); location.hash = route;
  assert.equal(api.readRoute().name, 'p'); assert.equal(api.readRoute().id, product.id);
}
for (const name of ['shop', 'saved', 'maintenance', 'trade-in', 'contact']) { location.hash = `#/${name}`; assert.equal(api.readRoute().name, name, `Direct route: ${name}`); }
location.hash = '#/shop/computers?q=MacBook%20Air&brand=Apple';
assert.equal(api.readRoute().category, 'computers');
assert.equal(api.readRoute().params.get('q'), 'MacBook Air');
assert.equal(api.readRoute().params.get('brand'), 'Apple');
Object.assign(api.state, { language: 'en', route: { name: 'shop' }, category: 'all', query: '', brand: 'all', sort: 'featured' });
assert.equal(api.filteredProducts().length, 10, 'Unfiltered catalog');
for (const [category, count] of Object.entries(counts)) { api.state.category = category; assert.equal(api.filteredProducts().length, count, `${category}: filtered count`); }
api.state.category = 'all'; api.state.query = 'galaxy 128';
assert.equal(api.filteredProducts()[0]?.id, 'galaxy-s25-fe', 'Multiword product search');
api.state.query = 'آيفون'; assert.equal(api.filteredProducts().length, 2, 'Arabic search normalization');
api.state.brand = 'Samsung'; assert.equal(api.filteredProducts().length, 0, 'Search and brand filters combine');
api.state.query = ''; assert.equal(api.filteredProducts().length, 1, 'Brand filter');
api.state.brand = 'all'; api.state.route = { name: 'saved' }; api.state.saved.add(products[0].id);
assert.equal(api.filteredProducts().length, 1, 'Favorites feed');
stored.set('trio-saved', '{broken'); assert.equal(api.readSaved().size, 0, 'Corrupt saved data recovers');
stored.set('trio-saved', JSON.stringify([products[0].id, 'unknown-product', products[0].id]));
assert.equal(api.readSaved().size, 1, 'Unknown favorites and duplicates discarded');
api.state.route = { name: 'shop' }; api.state.saved.clear();

const shellIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(shellIds.length, new Set(shellIds).size, 'Unique shell IDs');
assert(shellIds.includes('main'), 'Skip link target exists');
function checkMarkup(markup, label) {
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${label}: unique IDs`);
  for (const match of markup.matchAll(/<[^>]+>/g)) {
    const tag = match[0];
    assert.equal((tag.match(/"/g) || []).length % 2, 0, `${label}: balanced attribute quotes: ${tag.slice(0, 100)}`);
    const attrs = new Map([...tag.matchAll(/\b([\w-]+)="([^"]*)"/g)].map(attr => [attr[1], attr[2]]));
    for (const [key, value] of attrs) {
      const translated = key.match(/^data-(ar|en)(-.*)?$/);
      if (translated) assert(value.trim() && attrs.get(`data-${translated[1] === 'ar' ? 'en' : 'ar'}${translated[2] || ''}`)?.trim(), `${label}: bilingual ${key}`);
      if (!['href', 'src'].includes(key)) continue;
      if (value.startsWith('#/')) assert(routes.has(value.split('?')[0]), `${label}: valid route ${value}`);
      else if (value.startsWith('#')) assert([...shellIds, ...ids].includes(value.slice(1)), `${label}: anchor exists ${value}`);
      else if (!/^[a-z][a-z\d+.-]*:/i.test(value) && !value.startsWith('//')) file(value);
    }
    if (attrs.get('target') === '_blank') assert(attrs.get('rel')?.split(/\s+/).includes('noopener'), `${label}: external link isolation`);
  }
}
checkMarkup(html, 'Shell');
for (const language of ['ar', 'en']) {
  api.state.language = language;
  checkMarkup(api.renderHome(), `${language} home`); checkMarkup(api.renderCatalog(), `${language} catalog`); checkMarkup(api.categoryTabs(), `${language} categories`);
  for (const product of products) {
    const detail = api.renderDetail(product.id);
    assert(detail.includes(`src="${product.image}"`), `${product.id}: standalone detail image`);
    assert(!detail.includes(`src="${product.originalImage}"`), `${product.id}: no poster device image`);
    assert(detail.includes(`href="${product.source}"`), `${product.id}: original source accessible`);
    checkMarkup(detail, `${language} ${product.id}`);
  }
  checkMarkup(api.renderService(), `${language} repair`); checkMarkup(api.renderService(true), `${language} trade in`); checkMarkup(api.renderContact(), `${language} contact`);
}
for (const match of (html + css).matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) if (!/^(?:data:|https?:|#)/i.test(match[1])) file(match[1].trim());
assert(!/<dialog\b|\.showModal\s*\(/.test(html + app), 'Devices navigate to pages');
assert(!/backgroundImage|background-image\s*:[^;}]*assets\/instagram/.test(app + css), 'No original poster product backgrounds');
assert(css.includes('prefers-reduced-motion'), 'Reduced-motion preference respected');
assert(app.includes('localStorage.getItem') && app.includes('catch'), 'Storage failures handled');
console.log(`PASS: ${products.length} bilingual devices, ${routes.size} routes, filtering/search/favorites, ${sources.images.length} original checksums, ${sources.deviceImages.length} RGBA device checksums, rendered sources/links/translations and local resources.`);
