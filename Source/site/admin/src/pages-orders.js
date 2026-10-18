// Manual local records for the editor. No checkout or remote submission.
import { ApiError } from '../../src/store.js';
import { readLocal } from '../../src/pages-preview.js';
import { normaliseMobile, priceLines } from '../../../shared/pricing.js';
import { orderStatuses } from '../../../shared/labels.js';
const ORDER_KEY = 'trio-pages-orders-v1';
const clone = (value) => JSON.parse(JSON.stringify(value));
const records = () => {
  const saved = readLocal(ORDER_KEY);
  return saved && Number.isSafeInteger(saved.next) && saved.next >= 1000 && Array.isArray(saved.orders) ? saved : { next: 1000, orders: [] };
};
const save = (value) => {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(value)); } catch { throw new ApiError('storage-full', 507); }
};
const writeLocked = (change) => typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.locks?.request
  ? navigator.locks.request('trio-local-orders-write', change)
  : Promise.resolve().then(change);
export const localOrders = {
  async orders(status = '') {
    if (status && !orderStatuses.includes(status)) throw new ApiError('bad-status', 400);
    const { orders } = records();
    return { orders: clone(status ? orders.filter((order) => order.status === status) : orders) };
  },
  async createOrder(order, content) {
    return writeLocked(() => {
    if (!order || typeof order !== 'object') throw new ApiError('bad-order', 400);
    const current = records();
    if (order.token !== undefined && (typeof order.token !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(order.token))) throw new ApiError('bad-token', 400);
    const existing = order.token && current.orders.find((item) => item.token === order.token);
    if (existing) return { number: existing.number, totalFils: existing.totalFils };
    const customer = order.customer;
    if (!customer || typeof customer.name !== 'string' || customer.name.trim().length < 2 || customer.name.trim().length > 100) throw new ApiError('bad-name', 400);
    if (customer.mobile !== undefined && typeof customer.mobile !== 'string') throw new ApiError('bad-mobile', 400);
    const mobile = (customer.mobile || '').trim() ? normaliseMobile(customer.mobile) : '';
    if (mobile === null) throw new ApiError('bad-mobile', 400);
    if (customer.notes !== undefined && (typeof customer.notes !== 'string' || customer.notes.length > 1000)) throw new ApiError('bad-note', 400);
    if (!['pickup', 'delivery'].includes(order.fulfilment)) throw new ApiError('bad-fulfilment', 400);
    const priced = priceLines(content, order.lines);
    if (!priced.ok) throw new ApiError(priced.error, 400);
    if (order.totalFils !== undefined && order.totalFils !== priced.totalFils) throw new ApiError('price-changed', 409);
    if (current.orders.length >= 500) throw new ApiError('orders-full', 507);
    const next = current.next + 1;
    const saved = {
      number: `LOCAL-${next}`, token: order.token || '', source: 'browser-local', createdAt: new Date().toISOString(),
      status: 'new', note: '', lang: order.lang === 'ar' ? 'ar' : 'en', fulfilment: order.fulfilment,
      customer: { name: customer.name.trim(), mobile, notes: (customer.notes || '').trim(), address: '', governorate: '' },
      totalFils: priced.totalFils,
      lines: priced.lines.map((line) => ({ id: line.id, name: line.product.name.en, nameAr: line.product.name.ar, storage: line.variant.storage, condition: line.variant.condition, qty: line.qty, unitFils: line.unitFils })),
    };
    save({ next, orders: [saved, ...current.orders] });
    return { number: saved.number, totalFils: saved.totalFils };
    });
  },
  async updateOrder(number, patch) {
    return writeLocked(() => {
    if (!patch || typeof patch !== 'object') throw new ApiError('bad-order', 400);
    if (patch.status !== undefined && !orderStatuses.includes(patch.status)) throw new ApiError('bad-status', 400);
    if (patch.note !== undefined && (typeof patch.note !== 'string' || patch.note.length > 500)) throw new ApiError('bad-note', 400);
    const current = records();
    const order = current.orders.find((item) => item.number === number);
    if (!order) throw new ApiError('not-found', 404);
    if (patch.status !== undefined) order.status = patch.status;
    if (patch.note !== undefined) order.note = patch.note.trim();
    save(current);
    return { ok: true };
    });
  },
  async exportOrders() {
    return { format: 'trio-local-orders', schemaVersion: 1, exportedAt: new Date().toISOString(), orders: clone(records().orders) };
  },
};
