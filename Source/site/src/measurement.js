// Google Analytics and Google Ads conversions, only after the visitor agrees.
// Nothing from Google loads until the visitor taps Accept. With no IDs in the admin, or after
// "No thanks", the site makes no Google requests. Only the live site measures: never the
// GitHub Pages preview or the local demo. Only the order number, devices and total are sent:
// never a name, phone number or address.
import { trackingOn as idsSet } from '../../shared/tracking.js';

const CONSENT_KEY = 'trio-consent-v1';
const DENIED = { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
const GRANTED = { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied' };
const COPY = {
  ar: { text: 'نستخدم أدوات Google لمعرفة كيف يصل الزوّار إلى الموقع ولقياس نتائج إعلاناتنا، وذلك فقط بعد موافقتك. لا نرسل اسمك أو رقم هاتفك أو عنوانك.', accept: 'موافق', decline: 'لا، شكرًا', label: 'موافقة القياس' },
  en: { text: 'We use Google tools to see how people find the site and how our ads perform, only if you agree. Your name, number and address are never sent.', accept: 'Accept', decline: 'No thanks', label: 'Measurement consent' },
};

export function createMeasurement({ enabled, settings, language }) {
  const state = { loaded: false };
  const ids = () => { const g = settings()?.tracking || {}; return { ga: g.gaId || '', ads: g.adsId || '', orderLabel: g.adsOrderLabel || '', contactLabel: g.adsContactLabel || '' }; };
  const active = () => enabled && idsSet(settings());
  const choice = () => { try { return localStorage.getItem(CONSENT_KEY) || ''; } catch { return ''; } };
  const remember = (value) => { try { localStorage.setItem(CONSENT_KEY, value); } catch { /* private mode: asked again next visit */ } };
  function gtag() { window.dataLayer.push(arguments); } // eslint-disable-line prefer-rest-params
  function load() {
    if (state.loaded || !active()) return;
    const { ga, ads } = ids();
    window.dataLayer = window.dataLayer || [];
    gtag('consent', 'default', DENIED);
    gtag('consent', 'update', GRANTED);
    gtag('js', new Date());
    if (ga) gtag('config', ga);
    if (ads) gtag('config', ads);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga || ads)}`;
    document.head.appendChild(script);
    state.loaded = true;
  }
  function banner(show) {
    const old = document.getElementById('consent-banner');
    if (!show) { old?.remove(); return; }
    const copy = COPY[language()] || COPY.ar;
    if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'consent-banner'; box.className = 'consent-banner';
    box.setAttribute('role', 'region'); box.setAttribute('aria-label', copy.label);
    const text = document.createElement('p'); text.textContent = copy.text;
    const actions = document.createElement('div'); actions.className = 'consent-actions';
    for (const [value, label, kind] of [['granted', copy.accept, 'button-primary'], ['denied', copy.decline, 'button-outline']]) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = `button ${kind}`; button.dataset.consent = value; button.textContent = label;
      actions.appendChild(button);
    }
    box.append(text, actions);
    document.body.appendChild(box);
  }
  function afterRender() {
    const on = active();
    document.querySelectorAll('[data-consent-open]').forEach((element) => { element.hidden = !on; });
    if (!on) { banner(false); return; }
    const saved = choice();
    if (saved === 'granted') load();
    else if (!saved) banner(true);
  }
  function order(number, totalFils, lines) {
    if (!state.loaded) return;
    const { ads, orderLabel } = ids();
    const value = totalFils / 1000;
    gtag('event', 'purchase', { transaction_id: number, value, currency: 'JOD', items: lines.map((line) => ({ item_id: line.productId, item_name: line.product?.name?.en || line.productId, quantity: line.qty })) });
    if (ads && orderLabel) gtag('event', 'conversion', { send_to: `${ads}/${orderLabel}`, value, currency: 'JOD', transaction_id: number });
  }
  function click(event) {
    const picked = event.target.closest?.('[data-consent]');
    if (picked) {
      const value = picked.dataset.consent === 'granted' ? 'granted' : 'denied';
      remember(value); banner(false);
      if (value === 'granted') load();
      else if (state.loaded) gtag('consent', 'update', DENIED);
      return;
    }
    if (event.target.closest?.('[data-consent-open]')) { banner(true); return; }
    const link = event.target.closest?.('a[href]');
    if (!link || !state.loaded) return;
    const href = link.getAttribute('href') || '';
    const method = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href) ? 'whatsapp' : /^tel:/.test(href) ? 'phone' : '';
    if (!method) return;
    const { ads, contactLabel } = ids();
    gtag('event', 'generate_lead', { method });
    if (ads && contactLabel) gtag('event', 'conversion', { send_to: `${ads}/${contactLabel}` });
  }
  if (enabled && typeof document !== 'undefined') document.addEventListener('click', click);
  // Measurement must never break the shop.
  const safe = (fn) => (...args) => { try { return fn(...args); } catch (error) { console.error('measurement', error); return undefined; } };
  return { afterRender: safe(afterRender), order: safe(order) };
}
