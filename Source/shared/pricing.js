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
    if (!found || !validPrice(found.variant.price)) return { ok: false, error: 'unknown', id };
    const limit = variantQuantityLimit(found.variant);
    if (!limit) return { ok: false, error: 'sold-out', id };
    if (qty > limit) return { ok: false, error: 'stock-limit', id };
    const unit = toFils(found.variant.price);
    total += unit * qty;
    out.push({ id, productId, key, qty, unitFils: unit, totalFils: unit * qty, product: found.product, variant: found.variant });
  }
  return { ok: true, lines: out, totalFils: total };
}

export function fromPrice(product) {
  const prices = (product.variants || []).filter((item) => variantQuantityLimit(item) > 0 && validPrice(item.price)).map((item) => toFils(item.price));
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
