import { variantQuantityLimit } from './pricing.js';

// A device can have several capacities/conditions with different availability.
export function availabilitySummary(product) {
  const variants = product?.variants || [];
  const available = variants.filter((variant) => variantQuantityLimit(variant) > 0).length;
  return { total: variants.length, available, unavailable: variants.length - available, state: !available ? 'out' : available === variants.length ? 'in' : 'partial' };
}

// Bulk controls use the existing per-option flag, so every purchase path agrees.
// Clearing the manual flag never invents stock for an option whose quantity is 0.
export function setDeviceSoldOut(product, soldOut) {
  for (const variant of product.variants || []) variant.soldOut = soldOut === true;
  return availabilitySummary(product);
}
