// Data adapter. The live build talks to the Worker API on the same site; the demo
// build (opened from a folder, no server) keeps everything in this browser.
// Pages runs an owner demo; catalog drafts still require explicit preview selection.
// __MODE__ is replaced at build time with "live", "demo" or "pages".
import seedContent from '../../shared/catalog.js';
import { priceOrder, normaliseMobile } from '../../shared/pricing.js';
import { governorates } from '../../shared/labels.js';
import { PHOTO_KEY, previewRequested, readLocal, readPreview, validPhoto } from './pages-preview.js';
import { createBrowserShop } from './browser-shop.js';

export const MODE = typeof __MODE__ === 'string' ? __MODE__ : 'live';
const clone = (value) => JSON.parse(JSON.stringify(value));

export const local = {
  read(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      // Earlier Trio releases stored this preference without JSON quotes.
      if (key === 'trio-language' && (v === 'ar' || v === 'en')) return v;
      return JSON.parse(v);
    } catch { return fallback; }
  },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(code, status = 0, data = null) { super(code); this.code = code; this.status = status; this.data = data; }
}

// Fill gaps in a saved content file from the shipped defaults (new settings keys).
export function withDefaults(content) {
  const base = clone(seedContent);
  const result = { ...base, ...content };
  result.settings = { ...base.settings, ...(content.settings || {}) };
  for (const key of ['address', 'deliveryNote', 'pricesNote', 'offersTitle']) {
    result.settings[key] = { ...base.settings[key], ...((content.settings || {})[key] || {}) };
  }
  result.categories = Array.isArray(content.categories) && content.categories.length ? content.categories : base.categories;
  result.products = Array.isArray(content.products) ? content.products : base.products;
  result.heroSlots = Array.isArray(content.heroSlots) ? content.heroSlots : [];
  return result;
}

async function request(path, { method = 'GET', body, raw } = {}) {
  const headers = {};
  let payload;
  if (raw) { headers['Content-Type'] = raw.type || 'application/octet-stream'; payload = raw; }
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let response;
  try {
    response = await fetch(path, { method, headers, body: payload, credentials: 'same-origin', cache: 'no-store' });
  } catch {
    throw new ApiError('network');
  }
  let data = null;
  try { data = await response.json(); } catch { /* empty */ }
  if (!response.ok) throw new ApiError((data && data.error) || `http-${response.status}`, response.status, data);
  return data;
}

// ---------- GitHub Pages owner demonstration (this browser only) ----------
const accountUnavailable = async () => { throw new ApiError('accounts-unavailable', 503); };
const offlineAccounts = {
  async session() { return { configured: false, signedIn: false, customer: null }; },
  register: accountUnavailable, login: accountUnavailable, logout: accountUnavailable,
  profile: accountUnavailable, password: accountUnavailable, orders: accountUnavailable,
};
function createPages() {
  const browserShop = createBrowserShop({ ApiError, getContent: () => pages.loadContent() });
  const pages = {
    account: browserShop.account,
    demoOrders: browserShop.admin,
    async loadContent() {
      const saved = previewRequested() ? readPreview() : null;
      const content = withDefaults(clone(saved?.content || seedContent));
      content.settings.ordersOn = true;
      return { content, source: previewRequested() ? 'preview' : 'seed', version: saved?.version || 0 };
    },
    placeOrder: browserShop.placeOrder,
    photoUrl(id) {
      const value = previewRequested() ? readLocal(PHOTO_KEY, {})[id] : '';
      return validPhoto(value) ? value : '';
    },
  };
  return pages;
}

// ---------- live ----------
const live = {
  account: {
    session: () => request('/api/customer/session'),
    register: (body) => request('/api/customer/register', { method: 'POST', body }),
    login: (body) => request('/api/customer/login', { method: 'POST', body }),
    logout: () => request('/api/customer/logout', { method: 'POST', body: {} }),
    profile: (body) => request('/api/customer/profile', { method: 'PATCH', body }),
    password: (body) => request('/api/customer/password', { method: 'POST', body }),
    orders: (before = '') => request(`/api/customer/orders${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  },
  async loadContent() {
    try {
      const data = await request('/api/content');
      if (data && data.content) return { content: withDefaults(data.content), source: 'published', version: data.version };
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 404 && error.code !== 'network')) console.warn('content', error.code);
    }
    return { content: withDefaults(clone(seedContent)), source: 'seed', version: 0 };
  },
  placeOrder: (order) => request('/api/order', { method: 'POST', body: order }),
  photoUrl: (id) => `/api/photo/${encodeURIComponent(id)}`,
  admin: {
    status: () => request('/api/admin/status'),
    setup: (code, password) => request('/api/admin/setup', { method: 'POST', body: { code, password } }),
    login: (password) => request('/api/admin/login', { method: 'POST', body: { password } }),
    logout: () => request('/api/admin/logout', { method: 'POST', body: {} }),
    password: (current, password) => request('/api/admin/password', { method: 'POST', body: { current, password } }),
    content: () => request('/api/admin/content'),
    publish: (content, baseVersion) => request('/api/admin/content', { method: 'PUT', body: { content, baseVersion } }),
    uploadPhoto: (blob) => request('/api/admin/photo', { method: 'POST', raw: blob }),
    orders: (status = '', before = '') => { const params = new URLSearchParams(); if (status) params.set('status', status); if (before) params.set('before', before); return request(`/api/admin/orders${params.size ? `?${params}` : ''}`); },
    updateOrder: (number, patch) => request(`/api/admin/orders/${encodeURIComponent(number)}`, { method: 'PATCH', body: patch }),
  },
};

// ---------- demo (this browser only) ----------
const DEMO = { content: 'trio-demo-content', orders: 'trio-demo-orders', photos: 'trio-demo-photos', counter: 'trio-demo-counter' };
const demoContent = () => {
  const saved = local.read(DEMO.content);
  return saved && saved.content ? { content: withDefaults(saved.content), version: saved.version } : { content: withDefaults(clone(seedContent)), version: 0 };
};
const demo = {
  account: offlineAccounts,
  async loadContent() {
    const saved = local.read(DEMO.content);
    const current = demoContent();
    return { content: current.content, source: saved ? 'published' : 'seed', version: current.version };
  },
  async placeOrder(order) {
    const { content } = demoContent();
    if (!content.settings.ordersOn) throw new ApiError('orders-off', 403);
    const priced = priceOrder(content, order.lines, order.fulfilment, order.customer?.governorate);
    if (!priced.ok) throw new ApiError(priced.error, 400, { id: priced.id });
    if (priced.totalFils !== order.totalFils) throw new ApiError('price-changed', 409);
    const mobile = normaliseMobile(order.customer && order.customer.mobile);
    if (!mobile) throw new ApiError('bad-mobile', 400);
    const orders = local.read(DEMO.orders, []);
    const existing = orders.find((item) => item.token === order.token);
    if (existing) return { number: existing.number, totalFils: existing.totalFils };
    const next = (local.read(DEMO.counter, 1000) || 1000) + 1;
    local.write(DEMO.counter, next);
    const gov = governorates.find(([id]) => id === order.customer.governorate);
    const saved = {
      number: `T-${next}`, token: order.token, createdAt: new Date().toISOString(), status: 'new', note: '',
      customer: { ...order.customer, mobile, governorateName: gov ? gov[1] : '' }, fulfilment: order.fulfilment, lang: order.lang,
      totalFils: priced.totalFils, deliveryFils: priced.deliveryFils,
      lines: priced.lines.map((line) => ({ id: line.id, qty: line.qty, unitFils: line.unitFils, name: line.product.name.en, nameAr: line.product.name.ar, storage: line.variant.storage, condition: line.variant.condition })),
    };
    orders.unshift(saved);
    local.write(DEMO.orders, orders.slice(0, 200));
    return { number: saved.number, totalFils: saved.totalFils };
  },
  photoUrl(id) {
    const photos = local.read(DEMO.photos, {});
    return photos[id] || '';
  },
  admin: {
    async status() { return { setup: true, signedIn: true, demo: true }; },
    async setup() { return { ok: true }; },
    async login() { return { ok: true }; },
    async logout() { return { ok: true }; },
    async password() { return { ok: true }; },
    async content() { const c = demoContent(); return { content: c.content, version: c.version }; },
    async publish(content, baseVersion) {
      const current = demoContent();
      if (baseVersion !== current.version) throw new ApiError('conflict', 409);
      const version = current.version + 1;
      if (!local.write(DEMO.content, { content: { ...content, version }, version })) throw new ApiError('storage-full', 507);
      return { ok: true, version };
    },
    async uploadPhoto(blob) {
      if (blob.size > 1024 * 1024) throw new ApiError('too-large', 413);
      const url = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
      const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const photos = local.read(DEMO.photos, {});
      photos[id] = url;
      if (!local.write(DEMO.photos, photos)) throw new ApiError('storage-full', 507);
      return { id };
    },
    async orders(status = '') {
      const orders = local.read(DEMO.orders, []);
      return { orders: status ? orders.filter((item) => item.status === status) : orders };
    },
    async updateOrder(number, patch) {
      const orders = local.read(DEMO.orders, []);
      const order = orders.find((item) => item.number === number);
      if (!order) throw new ApiError('not-found', 404);
      if (patch.status) order.status = patch.status;
      if (typeof patch.note === 'string') order.note = patch.note.slice(0, 500);
      local.write(DEMO.orders, orders);
      return { ok: true };
    },
  },
};

// Compile-time conditions keep the real API client out of the Pages owner demo.
export const api = typeof __MODE__ === 'string' && __MODE__ === 'pages' ? createPages() : typeof __MODE__ === 'string' && __MODE__ === 'demo' ? demo : live;
