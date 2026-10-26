import { conditionGroup } from './labels.js';

// A storefront listing represents one model in one condition. Keep sold-out
// options in their listing so changing stock never changes its identity.
export function conditionListings(product) {
  if (!product || !Array.isArray(product.variants)) return [];
  const selected = product.conditionFilter;
  const groups = selected === 'new' ? [['new', 'new']]
    : selected === 'used' ? [['like-new', 'used']]
      : [['new', 'new'], ['like-new', 'used'], ['', '']];
  return groups.flatMap(([group, conditionFilter]) => {
    const variants = product.variants.filter((variant) => conditionGroup(variant.condition) === group);
    return variants.length ? [{ ...product, conditionFilter, variants }] : [];
  });
}

export function catalogListings(products) {
  return (products || []).flatMap(conditionListings);
}
