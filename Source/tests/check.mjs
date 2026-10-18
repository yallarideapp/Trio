// Quick checks that need no browser: catalog data, pricing rules, mobile numbers,
// built files, and no private values or tool names in what ships.
// Run: npm test (live build), or npm test -- --pages (after npm run build:pages).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import seed from '../shared/catalog.js';
import { verifyStorefront } from './storefront.mjs';
import { verifyCatalogImages } from './images.mjs';
import { verifyPagesEditor } from './pages-editor.mjs';
import { verifyWorkerOrders } from './worker-orders.mjs';
import { verifyCustomerAccountUI } from './customer-account-ui.mjs';
import { priceLines, normaliseMobile, fromPrice, toFils, validPrice, MAX_QTY, MAX_LINES } from '../shared/pricing.js';
import { conditions, notes, warranties } from '../shared/labels.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log(`FAIL ${msg}`); } };

// catalog
const ids = new Set();
const cats = new Set(seed.categories.map((c) => c.id));
for (const p of seed.products) {
  ok(!ids.has(p.id), `unique id ${p.id}`); ids.add(p.id);
  ok(/^[a-z0-9][a-z0-9-]*$/.test(p.id), `id format ${p.id}`);
  ok(cats.has(p.category), `${p.id} category`);
  ok(p.name.ar && p.name.en, `${p.id} names`);
  ok(Boolean(p.image) && existsSync(path.join(root, 'site', p.image)), `${p.id} image file ${p.image}`);
  ok(p.variants.length > 0, `${p.id} has options`);
  const keys = new Set();
  for (const v of p.variants) {
    ok(!keys.has(v.key), `${p.id} unique option ${v.key}`); keys.add(v.key);
    ok(validPrice(v.price), `${p.id}:${v.key} price`);
    ok(Object.hasOwn(conditions, v.condition), `${p.id}:${v.key} condition`);
    ok(Object.hasOwn(warranties, v.warranty), `${p.id}:${v.key} warranty`);
    ok(v.notes.every((n) => Object.hasOwn(notes, n)), `${p.id}:${v.key} notes`);
  }
}
ok(seed.products.length >= 20, 'catalog has the Instagram devices');

// pricing
const one = priceLines(seed, [{ id: 'airtag:one', qty: 2 }, { id: 'iphone-17-pro-max:512-new', qty: 1 }]);
ok(one.ok && one.totalFils === 2 * 28000 + 939000, 'bag total in fils');
ok(priceLines(seed, [{ id: 'airtag:one', qty: MAX_QTY + 1 }]).error === 'bad-qty', 'qty cap');
ok(priceLines(seed, [{ id: 'airtag:one', qty: 0 }]).error === 'bad-qty', 'qty zero');
ok(priceLines(seed, [{ id: 'airtag:nope', qty: 1 }]).error === 'unknown', 'unknown option');
ok(priceLines(seed, Array.from({ length: MAX_LINES + 1 }, (_, i) => ({ id: `x:${i}`, qty: 1 }))).error === 'too-many-lines', 'line cap');
ok(priceLines(seed, []).error === 'empty', 'empty bag');
ok(fromPrice(seed.products.find((p) => p.id === 'iphone-17-pro-max')) === 789000, 'from-price is the cheapest option');
ok(toFils(0.1 + 0.2) === 300, 'fils rounding');
// randomised: total equals the sum of unit × qty
for (let i = 0; i < 2000; i++) {
  const pool = seed.products.flatMap((p) => p.variants.map((v) => `${p.id}:${v.key}`));
  const n = 1 + Math.floor(Math.random() * 6);
  const lines = [...new Set(Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]))].map((id) => ({ id, qty: 1 + Math.floor(Math.random() * MAX_QTY) }));
  const r = priceLines(seed, lines);
  const expect = lines.reduce((s, l) => { const [pid, key] = [l.id.slice(0, l.id.lastIndexOf(':')), l.id.slice(l.id.lastIndexOf(':') + 1)]; const v = seed.products.find((p) => p.id === pid).variants.find((x) => x.key === key); return s + toFils(v.price) * l.qty; }, 0);
  if (!r.ok || r.totalFils !== expect) { ok(false, `random bag ${JSON.stringify(lines)}`); break; }
}

// mobile numbers
for (const [input, want] of [['0791234567', '0791234567'], ['٠٧٩١٢٣٤٥٦٧', '0791234567'], ['+962 79 123 4567', '0791234567'], ['00962791234567', '0791234567'], ['+962 0791234567', '0791234567'], ['791234567', '0791234567'], ['0761234567', null], ['12345', null], ['', null]]) {
  ok(normaliseMobile(input) === want, `mobile ${input} -> ${want}`);
}

// Ordinary Pages visits must remain usable without a backend, and must never
// save simulated orders or load a draft without an explicit preview selection.
const adapterPath = path.join(root, 'site/src/store.js');
const adapterSource = readFileSync(adapterPath, 'utf8')
  .replace(/\b__MODE__\b/g, JSON.stringify('pages'))
  .replace(/from '([^']+)'/g, (_, ref) => `from ${JSON.stringify(pathToFileURL(path.resolve(path.dirname(adapterPath), ref)).href)}`);
const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
let pagesNetwork = 0;
let pagesStorage = 0;
try {
  globalThis.fetch = () => { pagesNetwork++; throw new Error('Pages must not call a backend'); };
  globalThis.location = { search: '' };
  globalThis.localStorage = new Proxy({}, { get() { pagesStorage++; throw new Error('Pages must not read local content or orders'); } });
  const { api, local, MODE, ApiError } = await import(`data:text/javascript;base64,${Buffer.from(adapterSource).toString('base64')}`);
  const loaded = await api.loadContent();
  ok(MODE === 'pages', 'Pages selects the catalog adapter');
  ok(loaded.content.settings.ordersOn === false, 'Pages disables online ordering');
  ok(loaded.source === 'seed' && loaded.content.products.length === seed.products.length, 'Pages loads shipped content');
  ok(!Object.hasOwn(api, 'admin'), 'Pages does not expose demo or live admin');
  ok(JSON.stringify(await api.account.session()) === JSON.stringify({ configured: false, signedIn: false, customer: null }), 'Pages explicitly reports customer accounts as unavailable');
  for (const action of ['register', 'login', 'logout', 'profile', 'password', 'orders']) {
    let unavailable = false;
    try { await api.account[action]({}); }
    catch (error) { unavailable = error instanceof ApiError && error.code === 'accounts-unavailable' && error.status === 503; }
    ok(unavailable, `Pages customer ${action} cannot simulate a shared account`);
  }
  ok(api.photoUrl('draft-photo') === '', 'Pages does not request backend photos');
  loaded.content.settings.phone = 'changed';
  ok((await api.loadContent()).content.settings.phone === seed.settings.phone, 'Pages returns a fresh content copy');
  let rejected = false;
  try { await api.placeOrder({ token: 'not-a-real-order' }); }
  catch (error) { rejected = error instanceof ApiError && error.code === 'orders-off' && error.status === 403; }
  ok(rejected, 'Pages rejects orders explicitly');
  ok(pagesNetwork === 0 && pagesStorage === 0, 'Pages neither contacts an API nor reads/writes demo orders');
  let savedPreference = 'en';
  globalThis.localStorage = { getItem: () => savedPreference };
  ok(local.read('trio-language') === 'en', 'keeps legacy raw English preference');
  savedPreference = 'ar';
  ok(local.read('trio-language') === 'ar', 'keeps legacy raw Arabic preference');
  ok(local.read('some-other-key', 'fallback') === 'fallback', 'legacy exception applies only to language');
  savedPreference = '"en"';
  ok(local.read('trio-language') === 'en', 'keeps new JSON language preference');
  savedPreference = 'unsupported';
  ok(local.read('trio-language', 'fallback') === 'fallback', 'ignores invalid unquoted preference');
} finally {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
  if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
  else delete globalThis.location;
}

// built files
const dist = path.join(root, 'dist');
if (existsSync(dist)) {
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const files = walk(dist);
  ok(files.some((f) => f.endsWith('_headers')), 'dist has _headers');
  const banned = /claude|anthropic|openai|chatgpt|codex|replit|copilot|image_gen/i;
  for (const f of files.filter((x) => /\.(html|js|css|txt|json|md)$|_headers$/.test(x))) {
    const text = readFileSync(f, 'utf8');
    ok(!banned.test(text), `no tool names in ${path.relative(root, f)}`);
    ok(!/test-setup-code|SETUP_CODE=|RESEND_API_KEY=/.test(text), `no private values in ${path.relative(root, f)}`);
  }
} else console.log('(dist/ not built; skipped built-file checks)');

if (process.argv.includes('--pages')) {
  const website = path.join(root, '..', 'website');
  const bundlePath = path.join(website, 'app.js');
  ok(existsSync(bundlePath), 'Pages storefront built');
  if (existsSync(bundlePath)) {
    const bundle = readFileSync(bundlePath, 'utf8');
    ok(!bundle.includes('/api/'), 'Pages bundle has no live backend endpoints');
    ok(!/trio-demo-(?:content|orders|photos|counter)/.test(bundle), 'Pages bundle has no local demo data adapter');
    ok(!bundle.includes('trio-pages-orders-v1'), 'public storefront does not ship the private browser order book');
  }
  ok(existsSync(path.join(website, '.nojekyll')), 'Pages serves static files directly');
  const storefrontHtml = readFileSync(path.join(website, 'index.html'), 'utf8');
  ok(/<a\b[^>]*class="admin-corner"[^>]*href="admin\/index\.html"/.test(storefrontHtml), 'Pages exposes a repository-relative admin link in the page corner');
  ok(storefrontHtml.includes('data-ar-label="لوحة التحكم"') && storefrontHtml.includes('data-en-label="Admin panel"'), 'the corner admin link has Arabic and English accessible labels');
  const adminBundlePath = path.join(website, 'admin/admin.js');
  ok(existsSync(adminBundlePath), 'Pages ships the browser catalog editor');
  ok(existsSync(path.join(website, 'admin/admin.css')), 'Pages ships editor styles');
  if (existsSync(adminBundlePath)) {
    const adminBundle = readFileSync(adminBundlePath, 'utf8');
    ok(!adminBundle.includes('/api/'), 'Pages editor has no live backend endpoints');
    ok(!/trio-demo-(?:content|orders|photos|counter)/.test(adminBundle), 'Pages editor keeps the legacy demo order adapter out of the build');
    ok(adminBundle.includes('Browser-only preview') && adminBundle.includes('Save preview'), 'Pages editor clearly labels browser-only previews');
    ok(adminBundle.includes('Shared order service not connected') && adminBundle.includes('Customer orders will appear here after the shared order service is connected.'), 'Pages explains how customer orders are enabled');
    ok(!adminBundle.includes('data-new-order') && !adminBundle.includes('new-order-form'), 'Pages provides no manual order creation form');
  }
  const adminPath = path.join(website, 'admin/index.html');
  ok(existsSync(adminPath), 'Pages has a runnable editor entry point');
  if (existsSync(adminPath)) {
    const admin = readFileSync(adminPath, 'utf8');
    ok(/<script\b[^>]*\bsrc="admin\.js\?v=/.test(admin), 'Pages editor loads its repository-relative application');
    ok(/<link\b[^>]*\bhref="admin\.css\?v=/.test(admin), 'Pages editor loads its repository-relative styles');
    ok(admin.includes('noindex, nofollow'), 'Pages editor opts out of search indexing');
  }
}

try { console.log('image checks passed:', JSON.stringify(verifyCatalogImages())); } catch (error) { ok(false, error.message); }

try { verifyStorefront(); } catch (error) { ok(false, `storefront: ${error.message}`); }
try { await verifyPagesEditor(); } catch (error) { ok(false, `Pages editor: ${error.stack || error.message}`); }
try { await verifyWorkerOrders(); } catch (error) { ok(false, `Worker integration: ${error.stack || error.message}`); }
try { await verifyCustomerAccountUI(); } catch (error) { ok(false, `Customer account UI: ${error.stack || error.message}`); }

console.log(failed ? `\n${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
