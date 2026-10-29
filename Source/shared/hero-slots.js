// The four home banner (hero) tabs. For each one the owner can pick a device or
// upload a picture; an empty slot keeps the automatic choice.
export const HERO_SLOT_IDS = ['phones', 'laptops', 'watches', 'audio'];
const DEVICE = /^[a-z0-9][a-z0-9-]{0,59}$/;
// Live uploads have 32 hex characters; the browser preview's own uploads start with p.
const PHOTO = /^(?:[a-f0-9]{32}|p[a-z0-9-]{1,80})$/;

export function validHeroSlots(value) {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value) || value.length > HERO_SLOT_IDS.length) return false;
  const seen = new Set();
  return value.every((slot) => {
    if (!slot || typeof slot !== 'object' || !HERO_SLOT_IDS.includes(slot.id) || seen.has(slot.id)) return false;
    seen.add(slot.id);
    const device = slot.device ?? '', photo = slot.photo ?? '';
    if (typeof device !== 'string' || (device && !DEVICE.test(device))) return false;
    if (typeof photo !== 'string' || (photo && !PHOTO.test(photo))) return false;
    return !(device && photo);
  });
}
// Only slots with a choice are kept, in tab order.
export function normalizeHeroSlots(value) {
  if (!validHeroSlots(value) || !value) return [];
  return HERO_SLOT_IDS.map((id) => value.find((slot) => slot.id === id)).filter((slot) => slot && (slot.device || slot.photo)).map((slot) => ({ id: slot.id, device: slot.device || '', photo: slot.photo || '' }));
}
export const heroSlot = (content, id) => (content?.heroSlots || []).find((slot) => slot.id === id) || null;
