// Category order is the order shown in the storefront. IDs remain stable so
// editing a label or picture never disconnects its devices or category links.
export const MAX_CATEGORIES = 12;
export const CATEGORY_NAME_LIMIT = 100;
export const validCategoryId = (value) => typeof value === 'string' && value !== 'all' && /^[a-z0-9][a-z0-9-]{0,29}$/.test(value);
export const validCategoryName = (value) => value && ['ar', 'en'].every((lang) => typeof value[lang] === 'string' && value[lang].trim().length > 0 && value[lang].length <= CATEGORY_NAME_LIMIT);
export const validCategoryImage = (value) => value === undefined || value === null || value === '' || (typeof value === 'string' && value.length <= 240 && /^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/.test(value));

export function validCategories(value) {
  if (!Array.isArray(value) || !value.length || value.length > MAX_CATEGORIES) return false;
  const ids = new Set();
  return value.every((category) => {
    if (!category || !validCategoryId(category.id) || ids.has(category.id) || !validCategoryName(category.name) || !validCategoryImage(category.image)) return false;
    ids.add(category.id);
    return true;
  });
}

// Uploaded category and product pictures share the same media bank. Every path
// which retains, exports or remaps uploads must include both kinds of owner.
export const mediaOwners = (content) => [...(content?.products || []), ...(content?.categories || [])];
