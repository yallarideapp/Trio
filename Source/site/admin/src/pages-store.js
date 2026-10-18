// Browser-only catalog editor and manual order records. No remote publication.
import seed from '../../../shared/catalog.js';
import specifications from '../../../shared/device-specs.js';
import { validPrice } from '../../../shared/pricing.js';
import { conditions, notes, warranties } from '../../../shared/labels.js';
import { ApiError, withDefaults } from '../../src/store.js';
import { PREVIEW_KEY, PHOTO_KEY, EDITOR_KEY, readLocal, readPreview, validPhoto } from '../../src/pages-preview.js';
import { localOrders } from './pages-orders.js';
const clone = (value) => JSON.parse(JSON.stringify(value));
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { throw new ApiError('storage-full', 507); }
};
const editable = (content) => {
  const result = withDefaults(clone(content));
  result.settings.ordersOn = false;
  for (const product of result.products) product.technical ||= clone(specifications[product.id] || { summary: { ar: '', en: '' }, specs: [] });
  return result;
};
const allPhotos = () => readLocal(PHOTO_KEY, {});
function referencedPhotos(contents, bank = allPhotos()) {
  const photos = {};
  for (const content of contents) for (const product of content?.products || []) if (product.photo && validPhoto(bank[product.photo])) photos[product.photo] = bank[product.photo];
  return photos;
}
const retainedPhotos = () => referencedPhotos([readPreview()?.content, readLocal(EDITOR_KEY)?.content]);
const invalid = () => { throw new ApiError('invalid-draft', 400); };
const text = (value, limit) => typeof value === 'string' && value.length <= limit;
const pair = (value, limit) => value && text(value.ar, limit) && text(value.en, limit);

// Validate before any import writes; keep backup size bounded and media local.
function validate(content, photos) {
  if (!content || !Array.isArray(content.products) || content.products.length > 200 || !content.settings || !Array.isArray(content.categories)) invalid();
  const categories = new Set(seed.categories.map((category) => category.id));
  if (content.categories.length !== categories.size || new Set(content.categories.map((category) => category.id)).size !== categories.size || content.categories.some((category) => !categories.has(category.id) || !pair(category.name, 100))) invalid();
  const ids = new Set();
  for (const product of content.products) {
    if (!product || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(product.id) || ids.has(product.id) || !categories.has(product.category) || !pair(product.name, 200) || !product.name.ar.trim() || !product.name.en.trim() || !text(product.brand, 100)) invalid();
    ids.add(product.id);
    if (product.image && (!/^assets\/[a-zA-Z0-9_./-]+\.(?:webp|jpg|jpeg|png)$/.test(product.image) || product.image.includes('..'))) invalid();
    if (product.photo && (!/^p[a-z0-9-]{1,80}$/.test(product.photo) || !validPhoto(photos[product.photo]))) invalid();
    if (!Array.isArray(product.variants) || !product.variants.length || product.variants.length > 40) invalid();
    const keys = new Set();
    for (const variant of product.variants) {
      if (!variant || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(variant.key) || keys.has(variant.key) || !validPrice(variant.price) || !text(variant.storage, 200) || !Object.hasOwn(conditions, variant.condition || '') || !Object.hasOwn(warranties, variant.warranty || '') || !Array.isArray(variant.notes) || variant.notes.some((note) => !Object.hasOwn(notes, note))) invalid();
      keys.add(variant.key);
    }
    const technical = product.technical;
    if (technical && (!pair(technical.summary, 5000) || !Array.isArray(technical.specs) || technical.specs.length > 60 || technical.specs.some((row) => !pair(row.label, 200) || !pair(row.value, 2000)))) invalid();
  }
  for (const key of ['phone', 'whatsapp']) if (!text(content.settings[key] || '', 40) || !/^[+\d\s()-]*$/.test(content.settings[key] || '')) invalid();
  for (const key of ['instagram', 'facebook', 'maps']) {
    const value = content.settings[key];
    if (value && (!text(value, 2000) || !/^https:\/\//i.test(value))) invalid();
  }
  for (const key of ['address', 'deliveryNote', 'pricesNote', 'offersTitle']) if (!pair(content.settings[key], 5000)) invalid();
  if (JSON.stringify({ content, photos }).length > 20000000) invalid();
}
function packageDraft(content) {
  const current = editable(content);
  const bank = allPhotos();
  const photos = {};
  for (const product of current.products) if (product.photo) photos[product.photo] = bank[product.photo];
  validate(current, photos);
  return { format: 'trio-catalog-draft', schemaVersion: 1, exportedAt: new Date().toISOString(), content: current, photos };
}
export const pagesAdmin = {
  orders: localOrders.orders,
  updateOrder: localOrders.updateOrder,
  exportOrders: localOrders.exportOrders,
  async createOrder(order) { return localOrders.createOrder(order, (await pagesAdmin.content()).content); },
  async content() {
    const saved = readPreview();
    return { content: editable(saved?.content || seed), version: saved?.version || 0 };
  },
  async publish(content, baseVersion) {
    const currentVersion = readPreview()?.version || 0;
    if (baseVersion !== currentVersion) throw new ApiError('conflict', 409);
    const data = packageDraft(content);
    const version = currentVersion + 1;
    data.content.version = version;
    // Photos have one bank; saving a preview never duplicates their bytes.
    save(PREVIEW_KEY, { content: data.content, version });
    try { save(PHOTO_KEY, referencedPhotos([data.content, readLocal(EDITOR_KEY)?.content])); } catch { /* pruning can retry on the next save */ }
    return { ok: true, version };
  },
  photoUrl(id) { const value = allPhotos()[id]; return validPhoto(value) ? value : ''; },
  async uploadPhoto(blob) {
    if (blob.type !== 'image/webp' || blob.size > 1024 * 1024) throw new ApiError('too-large', 413);
    const value = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
    });
    if (!validPhoto(value)) throw new ApiError('invalid-photo', 400);
    const id = `p${crypto.randomUUID().replaceAll('-', '')}`;
    save(PHOTO_KEY, { ...retainedPhotos(), [id]: value });
    return { id };
  },
  async exportDraft(content) { return packageDraft(content); },
  async importDraft(data) {
    if (!data || data.format !== 'trio-catalog-draft' || data.schemaVersion !== 1 || !data.photos || typeof data.photos !== 'object' || Array.isArray(data.photos)) invalid();
    validate(data.content, data.photos);
    const content = editable(data.content);
    const photos = retainedPhotos();
    const remapped = new Map();
    for (const product of content.products) if (product.photo) {
      const original = product.photo;
      const value = data.photos[original];
      if (!remapped.has(original)) remapped.set(original, photos[original] && photos[original] !== value ? `p${crypto.randomUUID().replaceAll('-', '')}` : original);
      product.photo = remapped.get(original);
      photos[product.photo] = value;
    }
    save(PHOTO_KEY, photos);
    return content;
  },
  async reset() {
    localStorage.removeItem(PREVIEW_KEY);
    localStorage.removeItem(PHOTO_KEY);
    localStorage.removeItem(EDITOR_KEY);
  },
};
