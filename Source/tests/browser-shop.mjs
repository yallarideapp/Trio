// Real WebCrypto and serialized browser storage, with no backend or mock orders.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import seed from '../shared/catalog.js';
import { ApiError } from '../site/src/store.js';
import { priceLines, MAX_QTY, MAX_LINES } from '../shared/pricing.js';
import { createBrowserShop, BROWSER_SHOP_KEY } from '../site/src/browser-shop.js';

const clone = (value) => structuredClone(value);
const token = () => randomBytes(16).toString('hex');
const isError = (code, status) => (error) => error.code === code && error.status === status;

export async function verifyBrowserShop() {
  const descriptors = Object.fromEntries(['navigator', 'localStorage', 'fetch', 'dispatchEvent', 'CustomEvent'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values = new Map([['unrelated-site-data', 'preserved'], ['trio-pages-editor-draft-v1', 'preserved-editor']]);
  const queues = new Map();
  let quotaFull = false; let network = 0; let events = 0;
  const current = () => JSON.parse(values.get(BROWSER_SHOP_KEY));
  const raw = () => values.get(BROWSER_SHOP_KEY);
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request(name, options, callback) {
      assert.equal(options.mode, 'exclusive');
      const result = (queues.get(name) || Promise.resolve()).then(callback);
      queues.set(name, result.catch(() => {})); return result;
    } } } });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => values.get(key) ?? null, setItem(key, value) { if (quotaFull) throw new Error('QuotaExceededError'); values.set(key, String(value)); } } });
    globalThis.fetch = () => { network++; throw new Error('Browser shop cannot call a backend'); };
    Object.defineProperty(globalThis, 'CustomEvent', { configurable: true, value: class { constructor(type) { this.type = type; } } });
    Object.defineProperty(globalThis, 'dispatchEvent', { configurable: true, value(event) { assert.equal(event.type, 'trio-browser-shop-change'); events++; } });
    const content = clone(seed); content.settings.ordersOn = true;
    const getContent = async () => ({ content: clone(content) });
    const shop = createBrowserShop({ ApiError, getContent });
    const secondTab = createBrowserShop({ ApiError, getContent });
    assert.deepEqual(await shop.account.session(), { configured: true, signedIn: false, customer: null, demo: true });
    assert.equal(values.has(BROWSER_SHOP_KEY), false, 'reading an untouched session does not write storage');
    const password = 'a-strong-browser-demo-password';
    const aliceBody = { name: 'Alice Example', email: 'ALICE@example.test', password };
    const signup = await Promise.allSettled([shop.account.register(aliceBody), secondTab.account.register(aliceBody)]);
    assert.equal(signup.filter((result) => result.status === 'fulfilled').length, 1, 'concurrent duplicate registration creates exactly one account');
    assert(signup.some((result) => result.status === 'rejected' && result.reason.code === 'email-in-use'));
    assert.equal(current().customers.length, 1);
    const alice = (await shop.account.session()).customer;
    assert.equal(alice.email, 'alice@example.test');
    assert(!raw().includes(password), 'no plaintext password is persisted');
    assert.match(current().customers[0].passwordHash, /^[a-f0-9]{64}$/);
    assert.match(current().customers[0].salt, /^[a-f0-9]{32}$/);
    assert(!('passwordHash' in alice) && !('salt' in alice), 'public profiles never expose credentials');
    await assert.rejects(shop.account.register({ ...aliceBody, email: 'invalid' }), isError('bad-email', 400));
    await assert.rejects(shop.account.register({ ...aliceBody, email: 'short@example.test', password: 'short' }), isError('weak-password', 400));
    await assert.rejects(shop.account.login({ email: alice.email, password: 'incorrect' }), isError('bad-credentials', 403));
    const updated = await shop.account.profile({ name: 'Updated Alice', mobile: '+٩٦٢٧٩١٢٣٤٥٦٧', email: 'ignored@example.test', id: 'other' });
    assert.equal(updated.customer.id, alice.id); assert.equal(updated.customer.email, alice.email); assert.equal(updated.customer.mobile, '0791234567');
    await assert.rejects(shop.account.profile({ mobile: '123' }), isError('bad-mobile', 400));
    await shop.account.password({ current: password, password: 'a-new-strong-demo-password' });
    await shop.account.logout();
    await assert.rejects(shop.account.login({ email: alice.email, password }), isError('bad-credentials', 403));
    await shop.account.login({ email: alice.email, password: 'a-new-strong-demo-password' });
    assert.equal((await secondTab.account.session()).customer.id, alice.id, 'another tab reads the same committed session');
    const request = (overrides = {}) => {
      const lines = [{ id: 'airtag:one', qty: 1 }];
      return { token: token(), lines, totalFils: priceLines(content, lines).totalFils, fulfilment: 'pickup', lang: 'en', customer: { name: 'Checkout customer', mobile: '+962791234567', notes: '' }, ...overrides };
    };
    const firstBody = request();
    const paired = await Promise.all([shop.placeOrder(firstBody), secondTab.placeOrder(clone(firstBody))]);
    assert.equal(paired[0].number, 'DEMO-1001'); assert.deepEqual(paired[0], paired[1]);
    assert.equal(current().orders.length, 1); assert.equal(current().nextOrder, 1001);
    const beforeRetry = raw();
    assert.deepEqual(await shop.placeOrder(clone(firstBody)), paired[0]);
    assert.equal(raw(), beforeRetry, 'idempotent retries do not rewrite storage or consume a counter');
    await assert.rejects(shop.placeOrder({ ...firstBody, customer: { ...firstBody.customer, name: 'Different customer' } }), isError('token-conflict', 409));
    const owned = (await shop.account.orders()).orders;
    assert.equal(owned.length, 1); assert.equal(owned[0].number, 'DEMO-1001'); assert.equal(owned[0].lines[0].unitFils, 28000);
    await shop.admin.updateOrder('DEMO-1001', { status: 'confirmed', note: 'Private shop note' });
    const ownOrder = (await shop.account.orders()).orders[0];
    assert.equal(ownOrder.status, 'confirmed'); assert(!JSON.stringify(ownOrder).includes('Private shop note')); assert(!('customer' in ownOrder));
    const snapshot = clone(ownOrder.lines[0]);
    content.products.find((product) => product.id === 'airtag').variants[0].price = 29;
    assert.deepEqual(await shop.placeOrder(clone(firstBody)), paired[0], 'completed order retries survive later catalog prices');
    assert.deepEqual((await shop.account.orders()).orders[0].lines[0], snapshot, 'saved orders keep immutable product and price snapshots');
    await assert.rejects(shop.placeOrder({ ...firstBody, token: token() }), isError('price-changed', 409));
    content.products.find((product) => product.id === 'airtag').variants[0].price = 28;
    const beforeInvalid = raw();
    for (const [code, status, change] of [
      ['bad-token', 400, (body) => { body.token = 'invalid'; }], ['bad-qty', 400, (body) => { body.lines[0].qty = MAX_QTY + 1; }],
      ['duplicate', 400, (body) => { body.lines.push(clone(body.lines[0])); }], ['too-many-lines', 400, (body) => { body.lines = Array.from({ length: MAX_LINES + 1 }, () => clone(body.lines[0])); }],
      ['bad-mobile', 400, (body) => { body.customer.mobile = 'invalid'; }], ['bad-fulfilment', 400, (body) => { body.fulfilment = 'invalid'; }],
      ['bad-governorate', 400, (body) => { body.fulfilment = 'delivery'; body.customer.governorate = 'invalid'; }], ['bad-address', 400, (body) => { body.fulfilment = 'delivery'; body.customer.governorate = 'amman'; body.customer.address = 'x'; }],
      ['unknown', 409, (body) => { body.lines[0].id = 'unknown:option'; }], ['price-changed', 409, (body) => { body.totalFils++; }],
    ]) {
      const body = request(); change(body); await assert.rejects(shop.placeOrder(body), isError(code, status));
      assert.equal(raw(), beforeInvalid, `${code}: validation cannot change storage`);
    }
    const delivery = request({ fulfilment: 'delivery', customer: { name: 'Delivery customer', mobile: '0791234567', governorate: 'amman', address: 'Test street address', notes: 'Delivery note' } });
    await shop.placeOrder(delivery);
    await shop.account.logout();
    const guest = await shop.placeOrder(request());
    await assert.rejects(shop.account.orders(), isError('signed-out', 401));
    const bobResult = await shop.account.register({ name: 'Bob Example', email: 'bob@example.test', password });
    assert.equal((await shop.account.orders()).orders.length, 0, 'new customers cannot inherit guest or other customer orders');
    await assert.rejects(shop.placeOrder(firstBody), isError('token-conflict', 409), 'an old account token cannot become another customer receipt');
    const commonPassword = 'a-new-strong-demo-password';
    await shop.account.password({ current: password, password: commonPassword });
    const bobBeforeRace = clone(current().customers.find((customer) => customer.id === bobResult.customer.id));
    await shop.account.login({ email: alice.email, password: commonPassword });
    const orderCountBeforeRace = current().orders.length;
    // All four calls start as Alice while Bob's earlier login waits/runs under
    // the shared lock. None may acquire Bob's authority after that login commits.
    const switched = await Promise.allSettled([
      secondTab.account.login({ email: bobResult.customer.email, password: commonPassword }),
      shop.account.profile({ name: 'Alice edit must not rename Bob' }),
      shop.account.password({ current: commonPassword, password: 'must-not-change-bobs-password' }),
      shop.placeOrder(request()),
      shop.account.logout(),
    ]);
    assert.equal(switched[0].status, 'fulfilled');
    for (const index of [1, 2, 4]) { assert.equal(switched[index].status, 'rejected'); assert(isError('signed-out', 401)(switched[index].reason)); }
    assert.equal(switched[3].status, 'rejected'); assert(isError('token-conflict', 409)(switched[3].reason));
    assert.equal((await shop.account.session()).customer.id, bobResult.customer.id, 'Alice logout cannot log out the newly signed-in Bob');
    const bobAfterRace = current().customers.find((customer) => customer.id === bobResult.customer.id);
    assert.equal(bobAfterRace.name, bobBeforeRace.name); assert.equal(bobAfterRace.passwordHash, bobBeforeRace.passwordHash);
    assert.equal(current().orders.length, orderCountBeforeRace, 'queued checkout does not become Bob’s order');
    await shop.account.logout();
    const guestSwitch = await Promise.allSettled([secondTab.account.login({ email: alice.email, password: commonPassword }), shop.placeOrder(request())]);
    assert.equal(guestSwitch[0].status, 'fulfilled'); assert.equal(guestSwitch[1].status, 'rejected'); assert(isError('token-conflict', 409)(guestSwitch[1].reason));
    assert.equal(current().orders.length, orderCountBeforeRace, 'guest checkout does not inherit a queued login');
    await shop.account.login({ email: bobResult.customer.email, password: commonPassword });
    const generationRace = await Promise.allSettled([shop.account.password({ current: commonPassword, password: 'bobs-final-valid-demo-password' }), secondTab.account.profile({ name: 'Stale generation edit' })]);
    assert.equal(generationRace[0].status, 'fulfilled'); assert.equal(generationRace[1].status, 'rejected'); assert(isError('signed-out', 401)(generationRace[1].reason));
    assert.equal((await shop.account.session()).customer.name, bobBeforeRace.name, 'a queued edit cannot cross a password/session generation change');
    const all = (await shop.admin.orders()).orders;
    assert.equal(all.length, 3); assert.equal(all[0].number, guest.number);
    assert(all.find((order) => order.number === 'DEMO-1001').note === 'Private shop note');
    assert(all.find((order) => order.fulfilment === 'delivery').customer.address === delivery.customer.address);
    assert.equal((await shop.admin.orders('confirmed')).orders.length, 1);
    await assert.rejects(shop.admin.updateOrder(guest.number, { status: 'invalid' }), isError('bad-status', 400));
    const exported = await shop.admin.exportOrders();
    assert.equal(exported.orders.length, 3); assert(!JSON.stringify(exported).includes('passwordHash')); assert(!JSON.stringify(exported).includes(firstBody.token));
    for (let index = 0; index < 52; index++) await shop.placeOrder(request());
    const page = await shop.account.orders(); assert.equal(page.orders.length, 50); assert(page.nextBefore);
    const older = await shop.account.orders(page.nextBefore); assert.equal(older.orders.length, 2); assert.equal(older.nextBefore, null);
    assert(!page.orders.some((order) => order.number === guest.number));
    await assert.rejects(shop.account.orders('invalid'), isError('bad-cursor', 400));
    assert.equal(current().session.customerId, bobResult.customer.id);
    const beforeQuota = raw(); quotaFull = true;
    await assert.rejects(shop.account.register({ name: 'Quota Customer', email: 'quota@example.test', password }), isError('storage-full', 507));
    await assert.rejects(shop.placeOrder(request()), isError('storage-full', 507));
    await assert.rejects(shop.account.logout(), isError('storage-full', 507));
    assert.equal(raw(), beforeQuota, 'quota failures preserve customers, sessions, order numbers and snapshots atomically'); quotaFull = false;
    const sample = await shop.account.sample(); const sampleAgain = await secondTab.account.sample();
    assert.equal(sample.customer.id, sampleAgain.customer.id); assert.equal(sample.customer.sample, true); assert.equal(sample.customer.email, 'sample@trio.example');
    assert.equal(current().customers.filter((customer) => customer.sample).length, 1, 'sample access reuses one explicitly marked demo account');
    assert.equal((await shop.account.orders()).orders.length, 0);
    const saved = raw(); values.set(BROWSER_SHOP_KEY, '{broken');
    await assert.rejects(shop.account.session(), isError('storage-invalid', 500));
    await assert.rejects(shop.account.logout(), isError('storage-invalid', 500)); assert.equal(raw(), '{broken', 'corrupt storage is not silently replaced'); values.set(BROWSER_SHOP_KEY, saved);
    const fullCustomers = current(); const template = fullCustomers.customers[0];
    fullCustomers.customers = Array.from({ length: 100 }, (_, index) => ({ ...template, id: index.toString(16).padStart(32, '0'), email: `customer${index}@example.test` })); values.set(BROWSER_SHOP_KEY, JSON.stringify(fullCustomers));
    await assert.rejects(shop.account.register({ name: 'Over limit', email: 'limit@example.test', password }), isError('accounts-full', 507)); values.set(BROWSER_SHOP_KEY, saved);
    const fullOrders = current(); const orderTemplate = fullOrders.orders[0]; fullOrders.nextOrder = 1500;
    fullOrders.orders = Array.from({ length: 500 }, (_, index) => ({ ...orderTemplate, seq: 1001 + index, number: `DEMO-${1001 + index}`, token: index.toString(16).padStart(32, '0') })); values.set(BROWSER_SHOP_KEY, JSON.stringify(fullOrders));
    await assert.rejects(shop.placeOrder(request()), isError('orders-full', 507)); values.set(BROWSER_SHOP_KEY, saved);
    const expired = current(); expired.session.expiresAt = 1; values.set(BROWSER_SHOP_KEY, JSON.stringify(expired));
    assert.equal((await shop.account.session()).signedIn, false); await assert.rejects(shop.account.profile({ name: 'Expired customer' }), isError('signed-out', 401));
    assert.equal(values.get('unrelated-site-data'), 'preserved'); assert.equal(values.get('trio-pages-editor-draft-v1'), 'preserved-editor');
    assert.equal(network, 0); assert(events > 50);
    console.log('Browser shop passed: real password crypto, serialized signup/session/orders, sample account, immutable pricing, idempotency conflicts, own history, guest/admin records, pagination, validation, quota atomicity and zero network calls');
  } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) await verifyBrowserShop();
