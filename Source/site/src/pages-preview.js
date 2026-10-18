// Explicit browser previews. Ordinary storefront visits never read local drafts.
export const PREVIEW_KEY = 'trio-pages-preview-v1';
export const PHOTO_KEY = 'trio-pages-editor-photos-v1';
export const EDITOR_KEY = 'trio-pages-editor-draft-v1';
export const previewRequested = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('preview') === 'draft';
export function readLocal(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export const validPhoto = (value) => typeof value === 'string' && value.length <= 1400000 && /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
export function readPreview() {
  const saved = readLocal(PREVIEW_KEY);
  return saved && saved.content && Array.isArray(saved.content.products) && Number.isSafeInteger(saved.version) ? saved : null;
}
