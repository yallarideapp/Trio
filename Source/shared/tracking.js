// Google measurement IDs, set in the admin (Contact & delivery → Google measurement).
// Empty means off. The same rules run in the Worker, the preview store and the admin.
export const TRACKING_KEYS = ['gaId', 'adsId', 'adsOrderLabel', 'adsContactLabel'];
const PATTERNS = { gaId: /^G-[A-Z0-9]{4,20}$/, adsId: /^AW-[0-9]{5,20}$/, adsOrderLabel: /^[A-Za-z0-9_-]{4,64}$/, adsContactLabel: /^[A-Za-z0-9_-]{4,64}$/ };
export const validTrackingValue = (key, value) => value === '' || (typeof value === 'string' && PATTERNS[key].test(value));
export function validTracking(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).every((key) => TRACKING_KEYS.includes(key)) && TRACKING_KEYS.every((key) => value[key] === undefined || validTrackingValue(key, value[key]));
}
export const normalizeTracking = (value) => Object.fromEntries(TRACKING_KEYS.map((key) => [key, validTracking(value) && typeof value?.[key] === 'string' ? value[key] : '']));
export const trackingOn = (settings) => Boolean(settings?.tracking?.gaId || settings?.tracking?.adsId);
