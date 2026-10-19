// Every selected device remains featured. The most recently selected device
// takes priority in its category's home showcase.
export const validHomePriority = (value) => Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;

export function nextHomePriority(products, time = Date.now()) {
  const highest = products.reduce((value, product) => validHomePriority(product.homePriority) ? Math.max(value, product.homePriority) : value, 0);
  const timestamp = validHomePriority(time) ? time : 0;
  return Math.max(timestamp, highest + 1);
}

export function applyHomePlacement(product, products, { featured, category, hidden }, time = Date.now()) {
  const selected = featured === true;
  const promoted = selected && (product.featured !== true || product.category !== category || (product._new === true && !validHomePriority(product.homePriority)));
  product.featured = selected;
  product.category = category;
  product.hidden = hidden === true;
  if (promoted) {
    product.homePriority = nextHomePriority(products, time);
    product.hidden = false;
  }
  return promoted;
}
