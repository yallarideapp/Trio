// Run the actual Worker request handlers against SQLite and the real migration.
// The D1 adapter supplies prepared statements and atomic batches, not mock orders.
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import seed from '../shared/catalog.js';
import { MAX_LINES, MAX_QTY, MAX_STOCK_QUANTITY, priceLines } from '../shared/pricing.js';

class SQLiteD1 {
  constructor(file) { this.connection = new DatabaseSync(file); }
  prepare(sql) { return new SQLiteStatement(this, sql); }
  async batch(statements) {
    this.connection.exec('BEGIN IMMEDIATE');
    try {
      const results = statements.map((statement) => statement.execute());
      this.connection.exec('COMMIT');
      return results;
    } catch (error) {
      this.connection.exec('ROLLBACK');
      throw error;
    }
  }
  close() { this.connection.close(); }
}
class SQLiteStatement {
  constructor(db, sql, params = []) { Object.assign(this, { db, sql, params }); }
  bind(...params) { return new SQLiteStatement(this.db, this.sql, params); }
  async first(column) {
    const row = this.db.connection.prepare(this.sql).get(...this.params);
    return row ? (column ? row[column] : row) : null;
  }
  async all() { return this.execute(); }
  async run() {
    const result = this.db.connection.prepare(this.sql).run(...this.params);
    return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }
  execute() {
    const results = this.db.connection.prepare(this.sql).all(...this.params);
    const meta = this.db.connection.prepare('SELECT changes() AS changes, last_insert_rowid() AS last_row_id').get();
    return { success: true, results, meta: { changes: Number(meta.changes), last_row_id: Number(meta.last_row_id) } };
  }
}

export async function verifyWorkerOrders() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'trio-worker-orders-'));
  const databaseFile = path.join(directory, 'orders.sqlite');
  let database = new SQLiteD1(databaseFile);
  const pending = [];
  const origin = 'https://trio.test';
  const token = () => randomBytes(16).toString('hex');
  const code = randomUUID();
  const password = `${randomUUID()}-${randomUUID()}`;
  try {
    const migrations = new URL('../migrations/', import.meta.url);
    for (const file of (await readdir(migrations)).filter((file) => file.endsWith('.sql')).sort()) database.connection.exec(await readFile(new URL(file, migrations), 'utf8'));
    const bundle = await build({
      entryPoints: [new URL('../worker/src/index.ts', import.meta.url).pathname],
      bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'silent',
    });
    const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
    const env = { DB: database, SETUP_CODE: code, PHOTOS: { async put() {}, async get() { return null; } }, ASSETS: { async fetch() { return new Response('Static asset'); } } };
    const context = { waitUntil(promise) { pending.push(promise); } };
    async function send(method, pathname, body, options = {}) {
      const headers = { 'CF-Connecting-IP': options.ip || '198.51.100.10', ...(options.headers || {}) };
      if (!['GET', 'HEAD'].includes(method) && options.origin !== null) headers.Origin = options.origin || origin;
      if (options.cookie) headers.Cookie = options.cookie;
      let requestBody;
      if (body !== undefined) {
        headers['Content-Type'] = options.type || 'application/json';
        requestBody = options.raw ? body : JSON.stringify(body);
      }
      const response = await worker.fetch(new Request(`${origin}${pathname}`, { method, headers, body: requestBody }), env, context);
      return { status: response.status, headers: response.headers, data: await response.json() };
    }
    const count = (table) => Number(database.connection.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
    const counter = () => Number(database.connection.prepare("SELECT value FROM counters WHERE name = 'order'").get().value);
    const expectError = (result, status, error) => { assert.equal(result.status, status); assert.equal(result.data.error, error); };
    const lines = [{ id: 'airtag:one', qty: 2 }, { id: 'iphone-17-pro-max:512-new', qty: 1 }];
    const total = priceLines(seed, lines).totalFils;
    const orderBody = () => ({
      token: token(), elapsedMs: 5000, website: '', lang: 'en', fulfilment: 'delivery', lines: structuredClone(lines), totalFils: total,
      customer: { name: 'Integration customer', mobile: '+962 79 123 4567', governorate: 'amman', address: 'Integration test street', notes: 'Test request' },
    });

    assert.deepEqual((await send('GET', '/api/admin/status')).data, { setup: false, signedIn: false });
    expectError(await send('GET', '/api/admin/orders'), 401, 'signed-out');
    expectError(await send('GET', '/api/content'), 404, 'not-published');
    expectError(await send('POST', '/api/order', orderBody()), 403, 'orders-off');
    assert.equal(count('orders'), 0);
    expectError(await send('POST', '/api/admin/setup', { code: 'incorrect', password }), 403, 'bad-code');
    const setup = await send('POST', '/api/admin/setup', { code, password });
    assert.equal(setup.status, 200);
    const setupCookie = setup.headers.get('Set-Cookie');
    assert.match(setupCookie, /Path=\/api\/admin; HttpOnly; Secure; SameSite=Strict;/, 'admin sessions use restricted HttpOnly cookies');
    const cookie = setupCookie.split(';')[0];
    assert.deepEqual((await send('GET', '/api/admin/status', undefined, { cookie })).data, { setup: true, signedIn: true });
    expectError(await send('POST', '/api/admin/login', { password: 'incorrect password' }), 403, 'bad-password');
    const login = await send('POST', '/api/admin/login', { password }, { ip: '198.51.100.11' });
    assert.equal(login.status, 200);
    const secondCookie = login.headers.get('Set-Cookie').split(';')[0];
    const published = structuredClone(seed);
    published.settings.ordersOn = true;
    published.products.find((product) => product.id === 'airtag').variants[0].stockQuantity = 2;
    published.products[1].variants[0].stockQuantity = 0;
    published.products[1].variants[0].soldOut = false;
    published.products[2].variants[0].stockQuantity = MAX_STOCK_QUANTITY;
    published.products[2].variants[0].soldOut = true;
    for (const quantity of [-1, 1.5, '2', MAX_STOCK_QUANTITY + 1]) {
      const invalidStock = structuredClone(published);
      invalidStock.products[0].variants[0].stockQuantity = quantity;
      const invalidPublish = await send('PUT', '/api/admin/content', { baseVersion: 0, content: invalidStock }, { cookie });
      expectError(invalidPublish, 400, 'bad-content');
      assert.equal(invalidPublish.data.field, 'stock-quantity');
      assert.equal(count('content'), 0, 'invalid stock cannot publish or advance the catalog version');
    }
    const publish = await send('PUT', '/api/admin/content', { baseVersion: 0, content: published }, { cookie });
    assert.deepEqual(publish.data, { ok: true, version: 1 });
    const publicCatalog = await send('GET', '/api/content');
    assert.equal(publicCatalog.status, 200);
    assert.equal(publicCatalog.data.content.settings.ordersOn, true, 'online ordering becomes available only after publishing it');
    assert.equal(publicCatalog.data.content.products.find((product) => product.id === 'airtag').variants[0].stockQuantity, 2, 'published content retains a numeric stock limit');
    assert.equal(publicCatalog.data.content.products[0].variants[0].stockQuantity, null, 'legacy options publish with an absent quantity');
    assert.equal(publicCatalog.data.content.products[1].variants[0].stockQuantity, 0, 'publishing preserves zero quantity');
    assert.equal(publicCatalog.data.content.products[1].variants[0].soldOut, false, 'zero quantity does not rewrite the manual availability flag');
    assert.equal(publicCatalog.data.content.products[2].variants[0].stockQuantity, MAX_STOCK_QUANTITY, 'publishing retains the supported maximum quantity');
    assert.equal(publicCatalog.data.content.products[2].variants[0].soldOut, true, 'positive stock does not clear a manual out-of-stock flag');

    const firstBody = orderBody();
    const first = await send('POST', '/api/order', firstBody);
    assert.equal(first.status, 201);
    assert.deepEqual(first.data, { number: 'T-1001', totalFils: total });
    assert.equal(count('orders'), 1);
    assert.equal(count('order_lines'), lines.length);
    assert.equal(counter(), 1001);
    const retry = await send('POST', '/api/order', structuredClone(firstBody));
    assert.equal(retry.status, 200);
    assert.deepEqual(retry.data, first.data, 'retries return the original stored order');
    assert.equal(count('orders'), 1);
    assert.equal(counter(), 1001, 'idempotent retries do not consume an order number');

    const racingBody = orderBody();
    const racing = await Promise.all([send('POST', '/api/order', structuredClone(racingBody)), send('POST', '/api/order', structuredClone(racingBody))]);
    assert.deepEqual(racing.map((result) => result.status).sort(), [200, 201]);
    assert(racing.every((result) => result.data.number === 'T-1002' && result.data.totalFils === total), 'parallel submissions with one token resolve to one order');
    assert.equal(count('orders'), 2);
    assert.equal(counter(), 1002, 'a rejected duplicate batch rolls back its counter increment');
    const distinct = await Promise.all([
      send('POST', '/api/order', orderBody(), { ip: '198.51.100.12' }),
      send('POST', '/api/order', orderBody(), { ip: '198.51.100.13' }),
    ]);
    assert(distinct.every((result) => result.status === 201));
    assert.deepEqual(distinct.map((result) => result.data.number).sort(), ['T-1003', 'T-1004'], 'parallel different customers receive separate durable orders');
    assert.equal(count('orders'), 4);
    assert.equal(count('order_lines'), 4 * lines.length);

    const adminList = await send('GET', '/api/admin/orders', undefined, { cookie: secondCookie });
    assert.equal(adminList.status, 200);
    assert.deepEqual(adminList.data.orders.map((order) => order.number), ['T-1004', 'T-1003', 'T-1002', 'T-1001'], 'another authenticated admin browser sees customer orders in newest-first order');
    const saved = adminList.data.orders.find((order) => order.number === first.data.number);
    assert.equal(saved.customer.mobile, '0791234567');
    assert.equal(saved.customer.governorate, 'amman');
    assert.equal(saved.customer.address, firstBody.customer.address);
    assert.equal(saved.customer.notes, firstBody.customer.notes);
    assert.equal(saved.totalFils, total);
    assert.equal(saved.status, 'new');
    assert.equal(saved.lines.reduce((sum, line) => sum + line.qty * line.unitFils, 0), total);
    assert.deepEqual(saved.lines.map((line) => [line.id, line.qty]), lines.map((line) => [line.id, line.qty]));
    expectError(await send('PATCH', `/api/admin/orders/${first.data.number}`, { status: 'confirmed' }), 401, 'signed-out');
    const updated = await send('PATCH', `/api/admin/orders/${first.data.number}`, { status: 'confirmed', note: 'Verified with the customer' }, { cookie });
    assert.deepEqual(updated.data, { ok: true });
    const confirmed = await send('GET', '/api/admin/orders?status=confirmed', undefined, { cookie: secondCookie });
    assert.equal(confirmed.data.orders.length, 1);
    assert.equal(confirmed.data.orders[0].number, first.data.number);
    assert.equal(confirmed.data.orders[0].note, 'Verified with the customer');
    assert.equal((await send('GET', '/api/admin/orders?status=new', undefined, { cookie })).data.orders.length, 3);

    const invalid = [
      [403, 'bad-origin', () => {}, { origin: 'https://unrelated.test' }],
      [403, 'bad-origin', () => {}, { origin: null }],
      [415, 'bad-type', () => {}, { type: 'text/plain' }],
      [400, 'bad-token', (body) => { body.token = 'invalid'; }],
      [400, 'too-fast', (body) => { body.elapsedMs = 0; }],
      [400, 'bad-request', (body) => { body.website = 'filled'; }],
      [400, 'bad-name', (body) => { body.customer.name = 'x'; }],
      [400, 'bad-mobile', (body) => { body.customer.mobile = '123'; }],
      [400, 'bad-governorate', (body) => { body.customer.governorate = 'invalid'; }],
      [400, 'bad-address', (body) => { body.customer.address = 'x'; }],
      [400, 'empty', (body) => { body.lines = []; }],
      [400, 'bad-qty', (body) => { body.lines[0].qty = 0; }],
      [400, 'bad-qty', (body) => { body.lines[0].qty = MAX_QTY + 1; }],
      [400, 'duplicate', (body) => { body.lines.push(structuredClone(body.lines[0])); }],
      [400, 'too-many-lines', (body) => { body.lines = Array.from({ length: MAX_LINES + 1 }, () => structuredClone(body.lines[0])); }],
      [409, 'unknown', (body) => { body.lines[0].id = 'unknown:option'; }],
      [409, 'stock-limit', (body) => { body.lines[0].qty = 3; }],
      [409, 'sold-out', (body) => { body.lines[0].id = `${published.products[1].id}:${published.products[1].variants[0].key}`; }],
      [409, 'price-changed', (body) => { body.totalFils--; }],
    ];
    for (const [status, error, mutate, options] of invalid) {
      const body = orderBody();
      mutate(body);
      expectError(await send('POST', '/api/order', body, options), status, error);
      assert.equal(count('orders'), 4, `${error}: invalid requests cannot create an order`);
      assert.equal(counter(), 1004, `${error}: invalid requests cannot advance the counter`);
    }
    expectError(await send('POST', '/api/order', '{broken', { raw: true }), 400, 'bad-json');
    expectError(await send('POST', '/api/order', { oversized: 'x'.repeat(17000) }), 413, 'too-large');
    expectError(await send('PATCH', '/api/admin/orders/T-1001', { status: 'unknown' }, { cookie }), 400, 'bad-status');
    expectError(await send('PATCH', '/api/admin/orders/T-9999', { status: 'confirmed' }, { cookie }), 404, 'not-found');

    const changed = structuredClone(published);
    changed.products.find((product) => product.id === 'airtag').variants[0].price++;
    assert.deepEqual((await send('PUT', '/api/admin/content', { baseVersion: 1, content: changed }, { cookie })).data, { ok: true, version: 2 });
    expectError(await send('POST', '/api/order', orderBody()), 409, 'price-changed');
    assert.deepEqual((await send('POST', '/api/order', firstBody)).data, first.data, 'a completed order remains idempotent after catalog prices change');
    assert.equal(count('orders'), 4);

    // Reopen the database through a new binding to prove the admin list and
    // sessions come from durable SQL rows rather than in-process mock state.
    database.close();
    database = new SQLiteD1(databaseFile);
    env.DB = database;
    const reopened = await send('GET', '/api/admin/orders', undefined, { cookie: secondCookie });
    assert.equal(reopened.status, 200);
    assert.equal(reopened.data.orders.length, 4);
    assert.equal(reopened.data.orders.find((order) => order.number === first.data.number).note, 'Verified with the customer');
    assert.equal(counter(), 1004);
    const afterRestartBody = orderBody();
    afterRestartBody.totalFils = priceLines(changed, lines).totalFils;
    const afterRestart = await send('POST', '/api/order', afterRestartBody, { ip: '198.51.100.14' });
    assert.equal(afterRestart.status, 201);
    assert.deepEqual(afterRestart.data, { number: 'T-1005', totalFils: afterRestartBody.totalFils });
    assert.equal((await send('GET', '/api/admin/orders', undefined, { cookie: secondCookie })).data.orders.length, 5);
    await verifyCustomerAccounts({ send, env, orderBody, content: changed, adminCookie: cookie, expectError });
    assert.deepEqual((await send('POST', '/api/admin/logout', {}, { cookie: secondCookie })).data, { ok: true });
    expectError(await send('GET', '/api/admin/orders', undefined, { cookie: secondCookie }), 401, 'signed-out');
    expectError(await send('GET', '/api/admin/orders'), 401, 'signed-out');
    await Promise.all(pending);
    console.log('Worker order integration passed: all SQLite migrations, automatic checkout → authenticated admin, concurrent token retries, exact totals, durable orders, shopper registration/profile/passwords and private order history');
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
}

async function verifyCustomerAccounts({ send, env, orderBody, content, adminCookie, expectError }) {
  const accountPassword = `${randomUUID()}-${randomUUID()}`;
  const nextPassword = `${randomUUID()}-${randomUUID()}`;
  const profile = (name, email) => ({ name, email, password: accountPassword });
  const session = (cookie) => send('GET', '/api/customer/session', undefined, { cookie });
  const rows = () => env.DB.connection.prepare('SELECT id, email, password_hash, salt FROM customers').all();
  assert.deepEqual((await session()).data, { configured: true, signedIn: false, customer: null });
  expectError(await send('GET', '/api/customer/orders'), 401, 'signed-out');
  expectError(await send('GET', '/api/customer/profile'), 401, 'signed-out');
  expectError(await send('POST', '/api/customer/register', profile('A', 'one@trio.test')), 400, 'bad-name');
  expectError(await send('POST', '/api/customer/register', profile('Shopper', 'invalid-email')), 400, 'bad-email');
  expectError(await send('POST', '/api/customer/register', { ...profile('Shopper', 'one@trio.test'), password: 'short' }), 400, 'weak-password');
  assert.equal(rows().length, 0, 'invalid registration does not create accounts');
  const registeredA = await send('POST', '/api/customer/register', profile('Shopper One', ' One@Trio.Test '));
  const registeredB = await send('POST', '/api/customer/register', profile('Shopper Two', 'two@trio.test'));
  assert.equal(registeredA.status, 201);
  assert.equal(registeredB.status, 201);
  assert.equal(registeredA.data.customer.email, 'one@trio.test');
  assert.equal(registeredB.data.customer.email, 'two@trio.test');
  const customerA = registeredA.data.customer;
  const customerB = registeredB.data.customer;
  assert.notEqual(customerA.id, customerB.id);
  assert.deepEqual(Object.keys(customerA).sort(), ['email', 'id', 'mobile', 'name']);
  const cookieA = registeredA.headers.get('Set-Cookie').split(';')[0];
  const cookieB = registeredB.headers.get('Set-Cookie').split(';')[0];
  assert.match(registeredA.headers.get('Set-Cookie'), /^trio_customer=[a-f0-9]{64}; Path=\/api; HttpOnly; Secure; SameSite=Strict;/);
  assert.equal((await session(cookieA)).data.signedIn, true);
  assert.equal((await session(cookieB)).data.customer.id, customerB.id);
  assert(rows().every((row) => row.password_hash !== accountPassword && /^[a-f0-9]{64}$/.test(row.password_hash) && /^[a-f0-9]{32}$/.test(row.salt)), 'database stores salted password hashes rather than passwords');
  expectError(await send('POST', '/api/customer/register', profile('Duplicate', 'ONE@TRIO.TEST')), 409, 'email-in-use');
  assert.equal(rows().length, 2, 'normalized email addresses are unique');
  expectError(await send('GET', '/api/admin/orders', undefined, { cookie: cookieA }), 401, 'signed-out');
  expectError(await send('GET', '/api/customer/orders', undefined, { cookie: adminCookie }), 401, 'signed-out');
  expectError(await send('POST', '/api/customer/login', { email: 'one@trio.test', password: 'incorrect password' }), 403, 'bad-credentials');
  expectError(await send('POST', '/api/customer/login', { email: 'unknown@trio.test', password: accountPassword }), 403, 'bad-credentials');

  const edited = await send('PATCH', '/api/customer/profile', { id: customerB.id, name: 'Updated Shopper', mobile: '+962 79 123 4567' }, { cookie: cookieA });
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.data.customer, { ...customerA, name: 'Updated Shopper', mobile: '0791234567' });
  assert.equal((await session(cookieB)).data.customer.name, 'Shopper Two', 'profile body IDs cannot select another account');
  expectError(await send('PATCH', '/api/customer/profile', { name: 'x' }, { cookie: cookieA }), 400, 'bad-name');
  expectError(await send('PATCH', '/api/customer/profile', { mobile: '123' }, { cookie: cookieA }), 400, 'bad-mobile');
  expectError(await send('PATCH', '/api/customer/profile', { name: 'Changed' }, { cookie: cookieA, origin: 'https://unrelated.test' }), 403, 'bad-origin');
  assert.equal((await session(cookieA)).data.customer.name, 'Updated Shopper');

  const ownedBody = () => {
    const body = orderBody();
    body.totalFils = priceLines(content, body.lines).totalFils;
    return body;
  };
  const bodyA = ownedBody();
  bodyA.customerId = customerB.id;
  bodyA.customer.id = customerB.id;
  const ownA = await send('POST', '/api/order', bodyA, { cookie: cookieA, ip: '198.51.100.21' });
  const ownB = await send('POST', '/api/order', ownedBody(), { cookie: cookieB, ip: '198.51.100.22' });
  const guestBody = ownedBody();
  guestBody.customerId = customerA.id;
  const guest = await send('POST', '/api/order', guestBody, { ip: '198.51.100.23' });
  for (const result of [ownA, ownB, guest]) assert.equal(result.status, 201);
  const ownership = (number) => env.DB.connection.prepare('SELECT customer_id FROM orders WHERE number = ?').get(number).customer_id;
  assert.equal(ownership(ownA.data.number), customerA.id, 'checkout ownership comes from the verified shopper session');
  assert.equal(ownership(ownB.data.number), customerB.id);
  assert.equal(ownership(guest.data.number), null, 'a guest cannot claim an account by sending its ID');
  assert.deepEqual((await send('POST', '/api/order', bodyA, { cookie: cookieB })).data, ownA.data);
  assert.equal(ownership(ownA.data.number), customerA.id, 'an idempotent retry cannot transfer order ownership');
  const historyA = await send('GET', '/api/customer/orders', undefined, { cookie: cookieA });
  const historyB = await send('GET', `/api/customer/orders?customer_id=${customerA.id}`, undefined, { cookie: cookieB });
  assert.equal(historyA.status, 200);
  assert.deepEqual(historyA.data.orders.map((order) => order.number), [ownA.data.number]);
  assert.deepEqual(historyB.data.orders.map((order) => order.number), [ownB.data.number], 'history ignores attempts to select another shopper');
  assert.equal(historyA.data.orders[0].lines.reduce((sum, line) => sum + line.unitFils * line.qty, 0), ownA.data.totalFils);
  assert.equal(historyA.data.nextBefore, null);
  expectError(await send('GET', '/api/customer/orders?before=invalid', undefined, { cookie: cookieA }), 400, 'bad-cursor');
  const ownSeq = env.DB.connection.prepare('SELECT seq FROM orders WHERE number = ?').get(ownA.data.number).seq;
  assert.deepEqual((await send('GET', `/api/customer/orders?before=${ownSeq}`, undefined, { cookie: cookieA })).data.orders, []);
  assert.equal((await send('GET', '/api/admin/orders', undefined, { cookie: adminCookie })).data.orders.length, 8, 'customer and guest checkout orders appear automatically in the shared admin list');
  await send('PATCH', `/api/admin/orders/${ownA.data.number}`, { status: 'confirmed', note: 'Shop private note' }, { cookie: adminCookie });
  const refreshedHistory = (await send('GET', '/api/customer/orders', undefined, { cookie: cookieA })).data.orders[0];
  assert.equal(refreshedHistory.status, 'confirmed');
  assert(!Object.hasOwn(refreshedHistory, 'note'), 'customer history excludes the shop administrator’s private notes');

  const login = await send('POST', '/api/customer/login', { email: 'ONE@TRIO.TEST', password: accountPassword });
  assert.equal(login.status, 200);
  const otherSessionA = login.headers.get('Set-Cookie').split(';')[0];
  expectError(await send('POST', '/api/customer/password', { current: accountPassword, password: 'short' }, { cookie: otherSessionA }), 400, 'weak-password');
  expectError(await send('POST', '/api/customer/password', { current: 'wrong password', password: nextPassword }, { cookie: otherSessionA }), 403, 'bad-credentials');
  const passwordChange = await send('POST', '/api/customer/password', { current: accountPassword, password: nextPassword }, { cookie: otherSessionA });
  assert.equal(passwordChange.status, 200);
  const replacementCookie = passwordChange.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await session(cookieA)).data.signedIn, false, 'changing a shopper password revokes previous browser sessions');
  assert.equal((await session(otherSessionA)).data.signedIn, false);
  assert.equal((await session(replacementCookie)).data.customer.id, customerA.id);
  assert.equal((await session(cookieB)).data.signedIn, true, 'password changes preserve other shoppers’ sessions');
  expectError(await send('POST', '/api/customer/login', { email: customerA.email, password: accountPassword }), 403, 'bad-credentials');
  assert.equal((await send('POST', '/api/customer/login', { email: customerA.email, password: nextPassword })).status, 200);
  assert.equal((await send('GET', '/api/customer/orders', undefined, { cookie: replacementCookie })).data.orders[0].number, ownA.data.number, 'password changes preserve private order history');
  assert.equal((await send('POST', '/api/customer/logout', {}, { cookie: replacementCookie })).status, 200);
  assert.equal((await session(replacementCookie)).data.signedIn, false);
  expectError(await send('GET', '/api/customer/orders', undefined, { cookie: replacementCookie }), 401, 'signed-out');
}

if (process.argv[1] && new URL(import.meta.url).pathname === path.resolve(process.argv[1])) await verifyWorkerOrders();
