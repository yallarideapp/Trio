import { Env, HttpError, str, isStr } from './util';
// @ts-ignore shared plain-JS modules (also used by the storefront)
import seed from '../../shared/catalog.js';
// @ts-ignore
import { conditions, notes as noteLabels, warranties } from '../../shared/labels.js';
// @ts-ignore
import { validPrice, validStockQuantity, validOfferPrice } from '../../shared/pricing.js';
// @ts-ignore verified bilingual device profiles
import deviceSpecifications from '../../shared/device-specs.js';
// @ts-ignore shared home showcase ordering
import { validHomePriority } from '../../shared/home-placement.js';

export interface Published { version: number; content: any; fromSeed: boolean }

let cache: { at: number; value: Published } | null = null;

export async function getContent(env: Env, { fresh = false } = {}): Promise<Published> {
  if (!fresh && cache && Date.now() - cache.at < 5000) return cache.value;
  const row = await env.DB.prepare('SELECT version, body FROM content WHERE id = 1').first<{ version: number; body: string }>();
  const value: Published = row ? { version: row.version, content: JSON.parse(row.body), fromSeed: false } : { version: 0, content: seed, fromSeed: true };
  cache = { at: Date.now(), value };
  return value;
}
export function dropCache() { cache = null; }

// The public copy leaves out hidden devices.
export function publicCopy(content: any) {
  return { ...content, products: (content.products || []).filter((p: any) => !p.hidden) };
}

const pair = (v: any, max: number) => ({ ar: str(v?.ar, max), en: str(v?.en, max) });
const httpsUrl = (v: unknown, max = 400) => { const s = str(v, max); if (!s) return ''; try { const u = new URL(s); return u.protocol === 'https:' ? u.toString() : ''; } catch { return ''; } };
const ID = /^[a-z0-9][a-z0-9-]{0,59}$/;
const KEY = /^[a-z0-9][a-z0-9-]{0,29}$/;
const PHOTO = /^[a-f0-9]{32}$/;
const IMAGE = /^assets\/devices\/[a-z0-9-]{1,60}\.(webp|png|jpg)$/;

// Rebuilds the content from known fields only, with length limits, so nothing
// unexpected is ever stored or served.
export function sanitizeContent(input: any): any {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'bad-content');
  const s = input.settings && typeof input.settings === 'object' ? input.settings : {};
  const settings = {
    phone: str(s.phone, 20).replace(/[^\d+]/g, ''),
    whatsapp: str(s.whatsapp, 20).replace(/\D/g, ''),
    instagram: httpsUrl(s.instagram), facebook: httpsUrl(s.facebook), maps: httpsUrl(s.maps),
    address: pair(s.address, 200), ordersOn: s.ordersOn === true,
    deliveryNote: pair(s.deliveryNote, 400), pricesNote: pair(s.pricesNote, 400), offersTitle: pair(s.offersTitle, 80),
  };
  if (Array.isArray(input)) throw new HttpError(400, 'bad-content');
  const cats = Array.isArray(input.categories) ? input.categories.slice(0, 12) : [];
  const categories = cats.map((c: any) => ({ id: str(c?.id, 30), name: pair(c?.name, 40) })).filter((c: any) => ID.test(c.id) && c.name.ar && c.name.en);
  if (!categories.length) throw new HttpError(400, 'bad-content', { field: 'categories' });
  const catIds = new Set(categories.map((c: any) => c.id));
  const list = Array.isArray(input.products) ? input.products : [];
  if (list.length > 300) throw new HttpError(400, 'bad-content', { field: 'products' });
  const ids = new Set<string>();
  const products = list.map((p: any, index: number) => {
    if (!p || typeof p !== 'object') throw new HttpError(400, 'bad-content', { field: 'product', index });
    const id = str(p.id, 60);
    if (!ID.test(id) || ids.has(id)) throw new HttpError(400, 'bad-content', { field: 'id', index });
    ids.add(id);
    const name = pair(p.name, 80);
    if (!name.ar || !name.en) throw new HttpError(400, 'bad-content', { field: 'name', id });
    const category = str(p.category, 30);
    if (!catIds.has(category)) throw new HttpError(400, 'bad-content', { field: 'category', id });
    const variantsIn = Array.isArray(p.variants) ? p.variants.slice(0, 20) : [];
    const keys = new Set<string>();
    const variants = variantsIn.map((v: any) => {
      if (!v || typeof v !== 'object') throw new HttpError(400, 'bad-content', { field: 'variant', id });
      const key = str(v.key, 30);
      if (!KEY.test(key) || keys.has(key)) throw new HttpError(400, 'bad-content', { field: 'variant-key', id });
      keys.add(key);
      const price = Number(v.price);
      if (!validPrice(price)) throw new HttpError(400, 'bad-content', { field: 'price', id });
      if (!validStockQuantity(v.stockQuantity)) throw new HttpError(400, 'bad-content', { field: 'stock-quantity', id });
      // Optional offer price: blank means none; when set it must be below the price.
      const offerPrice = v.offerPrice === undefined || v.offerPrice === null || v.offerPrice === '' ? null : Number(v.offerPrice);
      if (offerPrice !== null && !validOfferPrice({ price, offerPrice })) throw new HttpError(400, 'bad-content', { field: 'offer-price', id });
      const condition = isStr(v.condition) && Object.hasOwn(conditions, v.condition) ? v.condition : '';
      const warranty = isStr(v.warranty) && Object.hasOwn(warranties, v.warranty) ? v.warranty : '';
      const notes = Array.isArray(v.notes) ? [...new Set(v.notes.filter((n: any) => isStr(n) && Object.hasOwn(noteLabels, n)))] : [];
      return { key, storage: str(v.storage, 40), condition, notes, warranty, price: Math.round(price * 1000) / 1000, offerPrice: offerPrice === null ? null : Math.round(offerPrice * 1000) / 1000, soldOut: v.soldOut === true, stockQuantity: v.stockQuantity ?? null, posted: isStr(v.posted) && /^\d{4}-\d{2}-\d{2}$/.test(v.posted) ? v.posted : undefined };
    });
    if (!variants.length) throw new HttpError(400, 'bad-content', { field: 'variants', id });
    const image = isStr(p.image) && IMAGE.test(p.image) ? p.image : '';
    const photo = isStr(p.photo) && PHOTO.test(p.photo) ? p.photo : '';
    const specs = (Array.isArray(p.specs) ? p.specs.slice(0, 12) : []).map((x: any) => pair(x, 120)).filter((x: any) => x.ar || x.en);
    const imageNote = p.imageNote ? pair(p.imageNote, 160) : undefined;
    const profile = p.technical || deviceSpecifications[id] || { summary: { ar: '', en: '' }, specs: [] };
    if (typeof profile !== 'object' || !Array.isArray(profile.specs) || profile.specs.length > 60) throw new HttpError(400, 'bad-content', { field: 'technical', id });
    const technical = { summary: pair(profile.summary, 2000), specs: profile.specs.map((row: any) => ({ label: pair(row?.label, 200), value: pair(row?.value, 2000) })), sources: Array.isArray(profile.sources) ? profile.sources.slice(0, 12).map((url: unknown) => httpsUrl(url)).filter(Boolean) : [] };
    const homePriority = validHomePriority(p.homePriority) ? p.homePriority : 0;
    return { id, category, brand: str(p.brand, 30), name, image, photo, imageNote: imageNote && (imageNote.ar || imageNote.en) ? imageNote : undefined, hidden: p.hidden === true, offer: p.offer === true, featured: p.featured === true, homePriority, tagline: pair(p.tagline, 140), about: pair(p.about, 1200), specs, technical, source: httpsUrl(p.source, 300), variants };
  });
  return { settings, categories, products };
}
