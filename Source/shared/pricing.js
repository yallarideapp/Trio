// Shared by the storefront, the admin and the Worker, so a bag is priced the same
// way everywhere. Money is handled in fils (1 JD = 1000 fils) as integers.

export const MAX_QTY = 5;
export const MAX_LINES = 20; // keeps an order inside D1’s 50 queries per request
export const MAX_STOCK_QUANTITY = 999999;

export function validStockQuantity(value) {
  return value === undefined || value === null || (Number.isInteger(value) && value >= 0 && value <= MAX_STOCK_QUANTITY);
}

export function variantQuantityLimit(variant) {
  if (variant.soldOut === true || !validStockQuantity(variant.stockQuantity)) return 0;
  return Math.min(MAX_QTY, variant.stockQuantity ?? MAX_QTY);
}

export const toFils = (jd) => Math.round(Number(jd) * 1000);

// Optional offer price per option: when set, it must be below the option's price and is
// what the shopper pays. Blank (null) means no offer.
export function validOfferPrice(variant) {
  const offer = variant.offerPrice;
  return offer === undefined || offer === null || (validPrice(offer) && validPrice(variant.price) && toFils(offer) < toFils(variant.price));
}
export function variantHasOffer(variant) {
  return variant.offerPrice !== undefined && variant.offerPrice !== null && validOfferPrice(variant);
}
// The price charged, in fils.
export function variantFils(variant) {
  return toFils(variantHasOffer(variant) ? variant.offerPrice : variant.price);
}
// A device is in the offers when one of its options has an offer price, or when the
// store ticks "Show in offers" for it.
export function productHasOfferPrice(product) {
  return (product.variants || []).some(variantHasOffer);
}
export function inOffers(product) {
  return product.offer === true || productHasOfferPrice(product);
}

export function variantId(productId, key) {
  return `${productId}:${key}`;
}

export function splitVariantId(id) {
  const text = String(id || '');
  const at = text.lastIndexOf(':');
  return at > 0 ? [text.slice(0, at), text.slice(at + 1)] : [text, ''];
}

export function visibleProducts(content) {
  return (content.products || []).filter((product) => !product.hidden && (product.variants || []).length);
}

export function findVariant(content, productId, key) {
  const product = (content.products || []).find((item) => item.id === productId && !item.hidden);
  if (!product) return null;
  const variant = (product.variants || []).find((item) => item.key === key);
  return variant ? { product, variant } : null;
}

export function validPrice(price) {
  const n = Number(price);
  return Number.isFinite(n) && n > 0 && n < 100000 && Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6;
}

// lines: [{ id: 'product:key', qty }]
export function priceLines(content, lines) {
  if (!Array.isArray(lines) || !lines.length) return { ok: false, error: 'empty' };
  if (lines.length > MAX_LINES) return { ok: false, error: 'too-many-lines' };
  const seen = new Set();
  const out = [];
  let total = 0;
  for (const line of lines) {
    if (!line || typeof line !== 'object') return { ok: false, error: 'bad-line' };
    const qty = line.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: 'bad-qty' };
    const id = String(line.id || '');
    if (seen.has(id)) return { ok: false, error: 'duplicate' };
    seen.add(id);
    const [productId, key] = splitVariantId(id);
    const found = findVariant(content, productId, key);
    if (!found || !validPrice(found.variant.price) || !validOfferPrice(found.variant)) return { ok: false, error: 'unknown', id };
    const limit = variantQuantityLimit(found.variant);
    if (!limit) return { ok: false, error: 'sold-out', id };
    if (qty > limit) return { ok: false, error: 'stock-limit', id };
    const unit = variantFils(found.variant);
    total += unit * qty;
    out.push({ id, productId, key, qty, unitFils: unit, totalFils: unit * qty, product: found.product, variant: found.variant });
  }
  return { ok: true, lines: out, totalFils: total };
}

// Delivery fees in fils, set by the owner: one for Amman and one for the other governorates.
// 0 (or unset) means the fee is confirmed with the shop, as before. Pickup is always free.
export const DELIVERY_MAX_FILS = 100000;
export const validDeliveryFils = (value) => Number.isSafeInteger(value) && value >= 0 && value <= DELIVERY_MAX_FILS;
export function validDeliverySettings(value) {
  if (value === undefined || value === null) return true;
  return typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every((key) => ['amman', 'other'].includes(key)) && ['amman', 'other'].every((key) => value[key] === undefined || validDeliveryFils(value[key]));
}
export function deliveryFils(settings, fulfilment, governorate) {
  if (fulfilment !== 'delivery') return 0;
  const fees = settings?.deliveryFils || {};
  const value = governorate === 'amman' ? fees.amman : fees.other;
  return validDeliveryFils(value) ? value : 0;
}
export const hasDeliveryFees = (settings) => Boolean(deliveryFils(settings, 'delivery', 'amman') || deliveryFils(settings, 'delivery', 'other'));
// Devices plus the delivery fee. totalFils is what the customer pays.
export function priceOrder(content, lines, fulfilment, governorate) {
  const priced = priceLines(content, lines);
  if (!priced.ok) return priced;
  const fee = deliveryFils(content?.settings, fulfilment, governorate);
  return { ...priced, subtotalFils: priced.totalFils, deliveryFils: fee, totalFils: priced.totalFils + fee };
}

export function fromPrice(product) {
  const prices = (product.variants || []).filter((item) => variantQuantityLimit(item) > 0 && validPrice(item.price) && validOfferPrice(item)).map(variantFils);
  return prices.length ? Math.min(...prices) : null;
}

export function formatJD(fils, language = 'ar') {
  const jd = fils / 1000;
  const text = Number.isInteger(jd) ? String(jd) : jd.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return language === 'ar' ? `${text} د.أ` : `JD ${text}`;
}

export function normaliseMobile(value) {
  const digits = String(value || '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d+]/g, '');
  let local = digits;
  if (local.startsWith('+962')) local = '0' + local.slice(4);
  else if (local.startsWith('00962')) local = '0' + local.slice(5);
  else if (local.startsWith('962')) local = '0' + local.slice(3);
  if (local.startsWith('00')) local = local.slice(1);
  if (/^7\d{8}$/.test(local)) local = '0' + local;
  return /^07[789]\d{7}$/.test(local) ? local : null;
}
