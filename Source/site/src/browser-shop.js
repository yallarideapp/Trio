// Owner demo only: accounts, sessions and orders remain in this browser.
import { normaliseMobile, priceOrder, MAX_LINES, MAX_QTY } from '../../shared/pricing.js';
import { governorates, orderStatuses } from '../../shared/labels.js';

export const BROWSER_SHOP_KEY = 'trio-browser-shop-v1';
const LOCK = 'trio-browser-shop-v1-mutation';
const ITERATIONS = 100000;
const SESSION_SECONDS = 7 * 86400;
const SAMPLE_EMAIL = 'sample@trio.example';
const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => Math.floor(Date.now() / 1000);
const stamp = () => new Date().toISOString();
const encoder = new TextEncoder();
const hex = (value) => [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const randomHex = (bytes) => hex(crypto.getRandomValues(new Uint8Array(bytes)));
const digest = async (value) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt.match(/../g).map((pair) => parseInt(pair, 16))), iterations: ITERATIONS }, key, 256));
}
const equal = (left, right) => { let diff = left.length ^ right.length; for (let i = 0; i < Math.max(left.length, right.length); i++) diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0); return diff === 0; };
const publicCustomer = (customer) => ({ id: customer.id, name: customer.name, email: customer.email, mobile: customer.mobile, ...(customer.sample ? { sample: true } : {}) });
const orderLines = (order) => order.lines.map((line) => ({ id: line.id, name: line.name, nameAr: line.nameAr, storage: line.storage, condition: line.condition, qty: line.qty, unitFils: line.unitFils }));
const customerOrder = (order) => ({ number: order.number, createdAt: order.createdAt, status: order.status, fulfilment: order.fulfilment, totalFils: order.totalFils, lines: orderLines(order), demo: true });
const adminOrder = (order) => ({ ...customerOrder(order), source: 'browser-demo', note: order.note, lang: order.lang, customer: clone(order.customer) });
const receipt = (order) => ({ number: order.number, totalFils: order.totalFils, demo: true });

export function createBrowserShop({ ApiError, getContent }) {
  const error = (code, status = 400) => { throw new ApiError(code, status); };
  const fresh = () => ({ schemaVersion: 1, revision: 0, nextOrder: 1000, customers: [], session: null, orders: [] });
  function read() {
    let raw;
    try { raw = localStorage.getItem(BROWSER_SHOP_KEY); } catch { error('storage-unavailable', 503); }
    if (raw === null) return fresh();
    let data;
    try { data = JSON.parse(raw); } catch { error('storage-invalid', 500); }
    if (!data || data.schemaVersion !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 0 || !Number.isSafeInteger(data.nextOrder) || data.nextOrder < 1000 || !Array.isArray(data.customers) || data.customers.length > 100 || !Array.isArray(data.orders) || data.orders.length > 500) error('storage-invalid', 500);
    const ids = new Set(); const emails = new Set();
    for (const customer of data.customers) {
      if (!customer || !/^[a-f0-9]{32}$/.test(customer.id) || ids.has(customer.id) || typeof customer.email !== 'string' || emails.has(customer.email) || typeof customer.name !== 'string' || typeof customer.mobile !== 'string' || !/^[a-f0-9]{32}$/.test(customer.salt) || !/^[a-f0-9]{64}$/.test(customer.passwordHash) || customer.iterations !== ITERATIONS || !Number.isSafeInteger(customer.generation) || customer.generation < 1) error('storage-invalid', 500);
      ids.add(customer.id); emails.add(customer.email);
    }
    const numbers = new Set(); const tokens = new Set();
    for (const order of data.orders) {
      if (!order || !Number.isSafeInteger(order.seq) || order.seq < 1001 || order.seq > data.nextOrder || order.number !== `DEMO-${order.seq}` || numbers.has(order.number) || !/^[a-f0-9]{32}$/.test(order.token) || tokens.has(order.token) || !/^[a-f0-9]{64}$/.test(order.signature) || !orderStatuses.includes(order.status) || !order.customer || !Array.isArray(order.lines) || !Number.isSafeInteger(order.totalFils) || order.totalFils <= 0) error('storage-invalid', 500);
      numbers.add(order.number); tokens.add(order.token);
    }
    if (data.session !== null && (!data.session || typeof data.session.customerId !== 'string' || !Number.isSafeInteger(data.session.generation) || !Number.isSafeInteger(data.session.expiresAt))) error('storage-invalid', 500);
    return data;
  }
  async function mutate(change, identity, mismatch = 'signed-out') {
    const locks = globalThis.navigator?.locks;
    if (!locks || typeof locks.request !== 'function') error('storage-unavailable', 503);
    return locks.request(LOCK, { mode: 'exclusive' }, async () => {
      const current = read();
      if (identity && !sameIdentity(identity, captureIdentity(current))) error(mismatch, mismatch === 'token-conflict' ? 409 : 401);
      const data = clone(current); let changed = true;
      const result = await change(data, () => { changed = false; });
      if (changed) {
        data.revision = current.revision + 1;
        try { localStorage.setItem(BROWSER_SHOP_KEY, JSON.stringify(data)); } catch { error('storage-full', 507); }
        if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
          globalThis.dispatchEvent(new CustomEvent('trio-browser-shop-change'));
        }
      }
      return result;
    });
  }
  function currentCustomer(data) {
    const session = data.session;
    if (!session || session.expiresAt <= now()) return null;
    return data.customers.find((customer) => customer.id === session.customerId && customer.generation === session.generation) || null;
  }
  function captureIdentity(data) {
    const customer = currentCustomer(data);
    return { customerId: customer?.id || null, generation: customer?.generation || null, sessionId: customer ? data.session.id || null : null };
  }
  const sameIdentity = (left, right) => left.customerId === right.customerId && left.generation === right.generation && left.sessionId === right.sessionId;
  async function boundMutation(change, mismatch = 'signed-out') {
    // Capture before waiting for another tab's login/password change to finish.
    const identity = captureIdentity(read());
    return mutate(change, identity, mismatch);
  }
  const requiredCustomer = (data) => currentCustomer(data) || error('signed-out', 401);
  function openSession(data, customer) { data.session = { id: randomHex(16), customerId: customer.id, generation: customer.generation, expiresAt: now() + SESSION_SECONDS }; }
  function nameValue(value, max = 80) {
    if (typeof value !== 'string') error('bad-name');
    const name = value.trim(); const length = Array.from(name).length;
    if (length < 2 || length > max || /[\u0000-\u001f\u007f]/.test(name)) error('bad-name');
    return name;
  }
  function emailValue(value) {
    if (typeof value !== 'string') error('bad-email');
    const email = value.trim().toLowerCase(); const local = email.slice(0, email.indexOf('@'));
    if (email.length > 254 || local.length > 64 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(email) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) error('bad-email');
    return email;
  }
  function mobileValue(value, required = false) {
    if (typeof value !== 'string' || value.length > 40) error('bad-mobile');
    if (!value.trim() && !required) return '';
    return normaliseMobile(value) || error('bad-mobile');
  }
  function passwordValue(value) {
    if (typeof value !== 'string' || value.length < 16 || value.length > 200) error('weak-password');
    return value;
  }
  const bodyValue = (body) => body && typeof body === 'object' && !Array.isArray(body) ? body : error('bad-request');
  function cursorValue(before) {
    if (before === '' || before === undefined || before === null) return Number.MAX_SAFE_INTEGER;
    if (!/^[1-9]\d{0,15}$/.test(String(before)) || !Number.isSafeInteger(Number(before))) error('bad-cursor');
    return Number(before);
  }
  function history(orders, before, limit, convert) {
    const cursor = cursorValue(before);
    const rows = orders.filter((order) => order.seq < cursor).sort((left, right) => right.seq - left.seq);
    const page = rows.slice(0, limit);
    return { orders: page.map(convert), nextBefore: rows.length > limit ? page[page.length - 1].seq : null, demo: true };
  }
  async function newCustomer(data, body, sample = false) {
    const name = nameValue(body.name); const email = emailValue(body.email);
    if (data.customers.some((customer) => customer.email === email) || (!sample && email === SAMPLE_EMAIL)) error('email-in-use', 409);
    if (data.customers.length >= 100) error('accounts-full', 507);
    const password = passwordValue(body.password); const salt = randomHex(16);
    const customer = { id: randomHex(16), name, email, mobile: body.mobile === undefined ? '' : mobileValue(body.mobile), passwordHash: await hashPassword(password, salt), salt, iterations: ITERATIONS, generation: 1, createdAt: stamp(), updatedAt: stamp(), ...(sample ? { sample: true } : {}) };
    data.customers.push(customer); openSession(data, customer);
    return { ok: true, customer: publicCustomer(customer), demo: true };
  }
  const account = {
    async session() {
      const customer = currentCustomer(read());
      return { configured: true, signedIn: !!customer, customer: customer ? publicCustomer(customer) : null, demo: true };
    },
    register: (body) => mutate((data) => newCustomer(data, bodyValue(body))),
    sample: () => mutate(async (data) => {
      const existing = data.customers.find((customer) => customer.email === SAMPLE_EMAIL && customer.sample === true);
      if (existing) { openSession(data, existing); return { ok: true, customer: publicCustomer(existing), demo: true }; }
      return newCustomer(data, { name: 'Demo customer', email: SAMPLE_EMAIL, password: randomHex(32) }, true);
    }),
    login: (body) => mutate(async (data) => {
      bodyValue(body);
      let email = ''; try { email = emailValue(body.email); } catch { /* Generic credential error. */ }
      const customer = data.customers.find((entry) => entry.email === email);
      const valid = typeof body.password === 'string' && body.password.length <= 200;
      const hash = await hashPassword(valid ? body.password : '', customer?.salt || 'b17c9c74e2ba74975433898071bb7bea');
      if (!customer || !valid || !equal(hash, customer.passwordHash)) error('bad-credentials', 403);
      openSession(data, customer);
      return { ok: true, customer: publicCustomer(customer), demo: true };
    }),
    logout: () => boundMutation((data) => { data.session = null; return { ok: true, demo: true }; }),
    profile: (body) => boundMutation((data) => {
      bodyValue(body); const customer = requiredCustomer(data);
      if (body.name === undefined && body.mobile === undefined) error('nothing-to-change');
      if (body.name !== undefined) customer.name = nameValue(body.name);
      if (body.mobile !== undefined) customer.mobile = mobileValue(body.mobile);
      customer.updatedAt = stamp();
      return { customer: publicCustomer(customer), demo: true };
    }),
    password: (body) => boundMutation(async (data) => {
      bodyValue(body); const customer = requiredCustomer(data); const password = passwordValue(body.password);
      const valid = typeof body.current === 'string' && body.current.length <= 200;
      const current = await hashPassword(valid ? body.current : '', customer.salt);
      if (!valid || !equal(current, customer.passwordHash)) error('bad-credentials', 403);
      const salt = randomHex(16); customer.passwordHash = await hashPassword(password, salt); customer.salt = salt; customer.generation++; customer.updatedAt = stamp(); openSession(data, customer);
      return { ok: true, demo: true };
    }),
    async orders(before = '') {
      const data = read(); const customer = requiredCustomer(data);
      return history(data.orders.filter((order) => order.customerId === customer.id), before, 50, customerOrder);
    },
  };
  const admin = {
    async orders(status = '', before = '') {
      if (status && !orderStatuses.includes(status)) error('bad-status');
      return history(read().orders.filter((order) => !status || order.status === status), before, 300, adminOrder);
    },
    updateOrder: (number, patch) => mutate((data) => {
      bodyValue(patch); const order = data.orders.find((entry) => entry.number === number);
      if (!order) error('not-found', 404);
      if (patch.status !== undefined) { if (!orderStatuses.includes(patch.status)) error('bad-status'); order.status = patch.status; }
      if (patch.note !== undefined) { if (typeof patch.note !== 'string' || patch.note.length > 500) error('bad-note'); order.note = patch.note.trim(); }
      return { ok: true, demo: true };
    }),
    async exportOrders() { return { format: 'trio-owner-demo-orders', schemaVersion: 1, exportedAt: stamp(), orders: read().orders.slice().sort((left, right) => right.seq - left.seq).map(adminOrder), demo: true }; },
  };
  const placeOrder = (body) => boundMutation(async (data, unchanged) => {
    bodyValue(body);
    if (typeof body.token !== 'string' || !/^[a-f0-9]{32}$/.test(body.token)) error('bad-token');
    if (!Array.isArray(body.lines) || !body.lines.length) error('empty');
    if (body.lines.length > MAX_LINES) error('too-many-lines');
    const ids = new Set();
    const requestedLines = body.lines.map((line) => {
      if (!line || typeof line.id !== 'string' || line.id.length > 180) error('unknown');
      if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_QTY) error('bad-qty');
      if (ids.has(line.id)) error('duplicate'); ids.add(line.id);
      return { id: line.id, qty: line.qty };
    });
    if (!Number.isSafeInteger(body.totalFils) || body.totalFils <= 0) error('price-changed', 409);
    if (!['pickup', 'delivery'].includes(body.fulfilment)) error('bad-fulfilment');
    const c = bodyValue(body.customer);
    const customer = { name: nameValue(c.name, 60), mobile: mobileValue(c.mobile, true), governorate: '', address: '', notes: '' };
    if (body.fulfilment === 'delivery') {
      if (!governorates.some(([id]) => id === c.governorate)) error('bad-governorate');
      if (typeof c.address !== 'string' || c.address.trim().length < 4 || c.address.trim().length > 200) error('bad-address');
      customer.governorate = c.governorate; customer.address = c.address.trim();
    }
    if (c.notes !== undefined && (typeof c.notes !== 'string' || c.notes.length > 300)) error('bad-note');
    customer.notes = (c.notes || '').trim();
    const owner = currentCustomer(data)?.id || null;
    const signature = await digest(JSON.stringify({ owner, lines: requestedLines.slice().sort((left, right) => left.id.localeCompare(right.id)), totalFils: body.totalFils, customer, fulfilment: body.fulfilment }));
    const existing = data.orders.find((order) => order.token === body.token);
    if (existing) { if (!equal(existing.signature, signature)) error('token-conflict', 409); unchanged(); return receipt(existing); }
    if (data.orders.length >= 500) error('orders-full', 507);
    const loaded = await getContent(); const content = loaded?.content;
    if (!content || content.settings?.ordersOn === false) error('orders-off', 403);
    const priced = priceOrder(content, requestedLines, body.fulfilment, customer.governorate);
    if (!priced.ok) error(priced.error, ['unknown', 'sold-out', 'stock-limit'].includes(priced.error) ? 409 : 400);
    if (priced.totalFils !== body.totalFils) error('price-changed', 409);
    const seq = data.nextOrder + 1;
    const order = { seq, number: `DEMO-${seq}`, token: body.token, signature, customerId: owner, createdAt: stamp(), status: 'new', note: '', lang: body.lang === 'en' ? 'en' : 'ar', fulfilment: body.fulfilment, customer, totalFils: priced.totalFils, deliveryFils: priced.deliveryFils, lines: priced.lines.map((line) => ({ id: line.id, name: line.product.name.en, nameAr: line.product.name.ar, storage: line.variant.storage || '', condition: line.variant.condition || '', qty: line.qty, unitFils: line.unitFils })) };
    data.nextOrder = seq; data.orders.push(order);
    return receipt(order);
  }, 'token-conflict');
  return { account, placeOrder, admin };
}
