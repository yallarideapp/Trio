import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { availabilitySummary, setDeviceSoldOut } from '../shared/availability.js';
import { fromPrice, priceLines } from '../shared/pricing.js';

export function verifyAvailability() {
  const product = { id: 'stock-test', name: { ar: 'جهاز', en: 'Device' }, variants: [
    { key: 'new', condition: 'new', price: 600, soldOut: false, stockQuantity: null },
    { key: 'used', condition: 'like-new', price: 500, soldOut: true, stockQuantity: 2 },
    { key: 'empty', condition: 'like-new', price: 450, soldOut: false, stockQuantity: 0 },
  ] };
  assert.deepEqual(availabilitySummary(product), { total: 3, available: 1, unavailable: 2, state: 'partial' });
  assert.equal(fromPrice(product), 600000, 'a sold-out option does not hide another available option');
  const prices = product.variants.map((v) => v.price);
  setDeviceSoldOut(product, true);
  assert.equal(availabilitySummary(product).state, 'out');
  assert.equal(fromPrice(product), null, 'bulk device unavailability reaches storefront pricing');
  for (const variant of product.variants) assert.equal(priceLines({ products: [product] }, [{ id: `${product.id}:${variant.key}`, qty: 1 }]).error, 'sold-out', 'all purchase paths refuse bulk-disabled options');
  setDeviceSoldOut(product, false);
  assert.deepEqual(availabilitySummary(product), { total: 3, available: 2, unavailable: 1, state: 'partial' });
  assert.equal(product.variants[2].stockQuantity, 0, 'clearing manual flags never invents missing stock');
  assert.deepEqual(product.variants.map((v) => v.price), prices, 'availability controls preserve prices');
  const restored = JSON.parse(JSON.stringify(product));
  assert.deepEqual(availabilitySummary(restored), availabilitySummary(product), 'stock summary survives persistence');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { verifyAvailability(); console.log('device availability checks passed'); }
