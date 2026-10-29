// Browser check of Google measurement on the live build (Source/dist), with a fake /api.
// Google hosts are intercepted, so nothing reaches Google.   node tests/local/measurement.mjs
// Needs Playwright: set PLAYWRIGHT to its index.mjs path, or have it installed.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import seed from '../../shared/catalog.js';

const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
let tracking = { gaId: '', adsId: '', adsOrderLabel: '', adsContactLabel: '' };
const content = () => { const c = structuredClone(seed); c.settings.whatsapp = '962796999292'; c.settings.ordersOn = true; c.settings.tracking = tracking; return { content: c, version: 1 }; };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/content') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(content())); return; }
  if (url.pathname === '/api/order' && req.method === 'POST') { let body = ''; for await (const chunk of req) body += chunk; const order = JSON.parse(body); res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ number: 'T-1001', totalFils: order.totalFils })); return; }
  if (url.pathname.startsWith('/api/')) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"error":"signed-out"}'); return; }
  const file = path.join(dist, url.pathname === '/' ? 'index.html' : url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname);
  try { res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(await readFile(file)); } catch { res.writeHead(404); res.end(); }
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
async function page() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const google = [];
  await context.route(/googletagmanager|google-analytics|doubleclick|google\.com|google\.jo/, (route) => { google.push(route.request().url()); route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }); });
  const p = await context.newPage(); const errors = [];
  p.on('pageerror', (error) => errors.push(error.message));
  return { context, p, google, errors };
}
const settle = (p) => p.waitForTimeout(500);
try {
  // 1. No IDs: no banner, no footer link, no Google requests.
  {
    const { context, p, google, errors } = await page();
    await p.goto(`${base}/#/`); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 0, 'no IDs: no banner');
    assert(await p.locator('[data-consent-open]').isHidden(), 'no IDs: no footer link');
    assert.equal(google.length, 0, 'no IDs: no Google requests');
    assert.deepEqual(errors, []); await context.close();
  }
  tracking = { gaId: 'G-TEST1234', adsId: 'AW-123456789', adsOrderLabel: 'orderLabel1', adsContactLabel: 'contactLabel1' };
  // 2. No thanks: nothing loads, the choice is remembered, the footer reopens the banner.
  {
    const { context, p, google, errors } = await page();
    await p.goto(`${base}/#/`); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 1, 'banner shows');
    assert.equal(google.length, 0, 'nothing loads before a choice');
    await p.click('[data-consent="denied"]'); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 0);
    await p.reload(); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 0, 'No thanks is remembered');
    assert.equal(google.length, 0, 'No thanks: no Google requests');
    await p.click('[data-consent-open]'); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 1, 'the footer link reopens the choice');
    await p.goto(`${base}/admin/index.html`); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 0, 'no banner in the admin');
    assert.equal(google.length, 0); assert.deepEqual(errors, []); await context.close();
  }
  // 3. Accept: gtag loads with the ID; WhatsApp and phone taps are measured without personal data.
  {
    const { context, p, google, errors } = await page();
    await p.goto(`${base}/#/contact`); await settle(p);
    await p.click('[data-consent="granted"]'); await settle(p);
    assert(google.some((url) => url.startsWith('https://www.googletagmanager.com/gtag/js?id=G-TEST1234')), 'Accept loads gtag with the Analytics ID');
    const layer = () => p.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)));
    const first = await layer();
    assert(first.some((e) => e[0] === 'consent' && e[1] === 'update' && e[2].analytics_storage === 'granted' && e[2].ad_personalization === 'denied'), 'consent granted, personalised ads denied');
    assert(first.some((e) => e[0] === 'config' && e[1] === 'G-TEST1234') && first.some((e) => e[0] === 'config' && e[1] === 'AW-123456789'));
    await p.evaluate(() => { const a = document.createElement('a'); a.href = 'https://wa.me/962796999292'; a.id = 'wa-test'; a.addEventListener('click', (event) => event.preventDefault()); document.body.appendChild(a); a.textContent = 'wa'; });
    await p.$eval('#wa-test', (a) => a.click());
    const after = await layer();
    assert(after.some((e) => e[0] === 'event' && e[1] === 'generate_lead' && e[2].method === 'whatsapp'), 'a WhatsApp tap is a lead');
    assert(after.some((e) => e[0] === 'event' && e[1] === 'conversion' && e[2].send_to === 'AW-123456789/contactLabel1'), 'the Ads contact conversion fires');
    const text = JSON.stringify(after);
    for (const secret of ['0796999292', 'Khalda', 'خلدا']) assert(!text.includes(secret), `no personal or contact data in dataLayer (${secret})`);
    await p.reload(); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 0, 'Accept is remembered');
    // A website order: purchase + the Ads order conversion, with the order number and total only.
    await p.goto(`${base}/#/p/airtag`); await settle(p);
    await p.locator('[data-add]').first().evaluate((button) => button.click());
    await p.goto(`${base}/#/checkout`); await settle(p);
    await p.fill('input[name=name]', 'Measured Customer'); await p.fill('input[name=mobile]', '0791112233'); await p.fill('input[name=address]', 'Secret Street 5');
    await p.waitForTimeout(3100);
    await p.locator('#checkout-form button[type=submit]').evaluate((button) => button.click()); await p.waitForTimeout(1200);
    const ordered = await layer();
    const purchase = ordered.find((e) => e[0] === 'event' && e[1] === 'purchase');
    assert(purchase && purchase[2].transaction_id === 'T-1001' && purchase[2].currency === 'JOD' && purchase[2].value > 0 && purchase[2].items[0].item_id === 'airtag', 'the order is measured as a purchase');
    assert(ordered.some((e) => e[0] === 'event' && e[1] === 'conversion' && e[2].send_to === 'AW-123456789/orderLabel1' && e[2].transaction_id === 'T-1001'), 'the Ads order conversion fires');
    const orderedText = JSON.stringify(ordered);
    for (const secret of ['Measured Customer', '0791112233', '791112233', 'Secret Street']) assert(!orderedText.includes(secret), `no customer data in dataLayer (${secret})`);
    assert.deepEqual(errors, []); await context.close();
  }
  // 4. Invalid IDs never reach the page (the server refuses them; the store normalises them away).
  tracking = { gaId: '<script>', adsId: 'AW-x' };
  {
    const { context, p, google } = await page();
    await p.goto(`${base}/#/`); await settle(p);
    assert.equal(await p.locator('#consent-banner').count(), 0, 'invalid IDs: no banner');
    assert.equal(google.length, 0); await context.close();
  }
  console.log('measurement browser checks passed: no IDs → nothing, banner, No thanks remembered, footer reopens, no admin banner, Accept loads gtag, consent mode, lead + Ads conversion, no personal data, invalid IDs ignored');
} finally { await browser.close(); server.close(); }
