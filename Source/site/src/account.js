import { api } from './store.js';
import { accountCopy, siteText } from '../../shared/site-text.js';
import { formatJD } from '../../shared/pricing.js';
import { forwardArrow } from '../../shared/navigation.js';

const copy = accountCopy;
let textSettings = {};
export function setAccountText(settings = {}) { textSettings = settings; }
const state = { loaded: false, configured: false, demo: false, customer: null, tab: 'signin', orders: [], nextBefore: null, error: '', historyError: '', message: '', busy: false, signingOut: false };
let generation = 0;
let operation = '';
let language = 'ar';
let update = () => {};
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (key) => siteText(textSettings, 'account.' + key, language, copy[language][key] || copy[language].generic);
const signedOut = (error) => error?.code === 'signed-out' || error?.status === 401;
function clearCustomer() { state.customer = null; state.orders = []; state.nextBefore = null; state.historyError = ''; }
function endSession() {
  generation++;
  clearCustomer(); state.configured = true; state.loaded = true; state.busy = false; state.signingOut = false; operation = ''; state.message = ''; state.error = 'signed-out'; update();
}
function setCustomer(customer) {
  if (state.customer?.id !== customer?.id) { state.orders = []; state.nextBefore = null; state.historyError = ''; }
  state.customer = customer;
}
async function fetchOrders(request, more = false) {
  const owner = state.customer?.id;
  if (!owner) return;
  try {
    const result = await api.account.orders(more ? state.nextBefore : undefined);
    if (request !== generation || state.customer?.id !== owner) return;
    const orders = more ? [...state.orders, ...(result.orders || [])] : result.orders || [];
    state.orders = [...new Map(orders.map((order) => [order.number, order])).values()];
    state.nextBefore = result.nextBefore || null; state.historyError = '';
  } catch (error) {
    if (request !== generation || state.customer?.id !== owner) return;
    if (signedOut(error)) endSession(); else state.historyError = 'network';
  }
}
export const customerProfile = () => state.customer;
export const accountLabel = (lang) => siteText(textSettings, 'account.' + (state.customer ? 'title' : 'signin'), lang);
const field = (key, { type = 'text', value = '', auto = '', required = true, min = '', max = 100 } = {}) => `<label class="field"><span>${esc(t(key))}</span><input name="${key}" type="${type}" value="${esc(value)}"${auto ? ` autocomplete="${auto}"` : ''}${required ? ' required' : ''}${min ? ` minlength="${min}"` : ''} maxlength="${max}"${type === 'email' || type === 'tel' ? ' dir="ltr"' : ''}></label>`;

export function renderAccount(lang) {
  language = lang;
  const notices = `${state.error ? `<p class="form-alert" role="alert">${esc(t(state.error))}</p>` : ''}${state.message ? `<p class="account-success" role="status">${esc(t(state.message))}</p>` : ''}`;
  const demoNote = state.demo ? `<aside class="account-status"><strong>${esc(t('demoTitle'))}</strong><p>${esc(t('demoText'))}</p></aside>` : '';
  const heading = `<div class="page-heading"><h1>${esc(t('title'))}</h1></div>`;
  if (!state.loaded) return `<div class="container page-shell account-page">${heading}<p role="status">${esc(t('loading'))}</p></div>`;
  if (!state.customer) {
    const register = state.tab === 'create';
    return `<div class="container page-shell account-page">${heading}<div class="account-auth"><section class="account-card">${demoNote}${!state.configured ? `<aside class="account-status"><strong>${esc(t('unavailable'))}</strong><p>${esc(t('unavailableText'))}</p></aside>` : ''}<div class="account-tabs" role="group" aria-label="${esc(t('title'))}"><button type="button" data-account-tab="signin" aria-pressed="${!register}">${esc(t('signin'))}</button><button type="button" data-account-tab="create" aria-pressed="${register}">${esc(t('create'))}</button></div>${notices}${!state.configured && state.error ? `<button type="button" class="button button-outline" data-account-retry${state.busy ? ' disabled' : ''}>${esc(t('retry'))}</button>` : ''}<form data-account-form="${register ? 'register' : 'login'}"><fieldset${!state.configured || state.busy ? ' disabled' : ''}>${register ? field('name', { auto: 'name', min: 2, max: 80 }) : ''}${field('email', { type: 'email', auto: 'username', max: 254 })}${field('password', { type: 'password', auto: register ? 'new-password' : 'current-password', min: register ? 16 : '', max: 200 })}${register ? `${field('repeat', { type: 'password', auto: 'new-password', min: 16, max: 200 })}<p class="summary-note">${esc(t('passwordHint'))}</p>` : ''}<button class="button button-primary button-wide" type="submit">${esc(t(register ? 'create' : 'signin'))}</button></fieldset></form>${state.demo ? `<button class="button button-outline button-wide sample-account" type="button" data-account-sample${state.busy ? ' disabled' : ''}>${esc(t('sample'))}</button>` : ''}</section><div class="account-intro"><p class="eyebrow" dir="ltr">${esc(siteText(textSettings,'extra.brandName',language))} ${esc(siteText(textSettings,'extra.brandSubtitle',language))}</p><h2>${esc(t(register ? 'create' : 'signin'))}</h2><a class="text-link" href="#/shop">${esc(t('browse'))}${forwardArrow}</a></div></div></div>`;
  }
  const customer = state.customer;
  return `<div class="container page-shell account-page">${heading}${notices}${demoNote}<div class="account-layout"><section class="account-card"><div class="account-card-heading"><h2>${esc(t('profile'))}</h2><button class="text-link" type="button" data-account-logout${state.signingOut ? ' disabled' : ''}>${esc(t('signout'))}</button></div><p class="account-email" dir="ltr">${esc(customer.email)}</p><form data-account-form="profile"><fieldset${state.busy ? ' disabled' : ''}>${field('name', { value: customer.name, auto: 'name', min: 2, max: 80 })}${field('mobile', { value: customer.mobile, type: 'tel', auto: 'tel', required: false, max: 30 })}<button class="button button-primary" type="submit">${esc(t('save'))}</button></fieldset></form><details class="account-password"><summary>${esc(t('change'))}</summary><form data-account-form="password"><fieldset${state.busy ? ' disabled' : ''}>${field('current', { type: 'password', auto: 'current-password', max: 200 })}${field('newPassword', { type: 'password', auto: 'new-password', min: 16, max: 200 })}<p class="summary-note">${esc(t('passwordHint'))}</p><button class="button button-outline" type="submit">${esc(t('change'))}</button></fieldset></form></details></section><section class="account-card"><h2>${esc(t('orders'))}</h2>${state.historyError ? `<div class="account-history-error"><p class="form-alert" role="alert">${esc(t('ordersError'))}</p><button type="button" class="button button-outline" data-account-retry-orders${state.busy ? ' disabled' : ''}>${esc(t('retry'))}</button></div>` : ''}${state.orders.length ? `<ul class="account-orders">${state.orders.map((order) => `<li><div class="account-order-heading"><strong dir="ltr">${esc(order.number)}</strong><span>${esc(t(order.status))}</span></div><p class="account-order-date">${esc(new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'Asia/Amman' }).format(new Date(order.createdAt)))}</p>${(order.lines || []).map((line) => `<p dir="auto">${esc(lang === 'ar' ? line.nameAr || line.name : line.name)}${line.storage ? ` · ${esc(line.storage)}` : ''} × ${line.qty}</p>`).join('')}<strong><bdi>${esc(formatJD(order.totalFils, lang))}</bdi></strong></li>`).join('')}</ul>` : state.historyError ? '' : `<p class="account-empty">${esc(t('empty'))}</p>`}${state.nextBefore ? `<button type="button" class="button button-outline" data-account-more${state.busy ? ' disabled' : ''}>${esc(t('more'))}</button>` : ''}</section></div></div>`;
}

export async function loadAccount() {
  // Route refreshes must not unlock a second login while the first response
  // can still change the HttpOnly session cookie.
  if (state.busy && operation !== 'load') return;
  const request = ++generation;
  operation = 'load';
  state.busy = true; state.error = ''; state.message = ''; state.signingOut = false;
  try {
    const session = await api.account.session();
    if (request !== generation) return;
    state.configured = session.configured === true;
    state.demo = session.demo === true;
    setCustomer(state.configured && session.signedIn ? session.customer : null);
    if (state.customer) await fetchOrders(request);
  } catch (error) {
    if (request !== generation) return;
    if (signedOut(error)) { endSession(); return; }
    clearCustomer(); state.error = 'network'; state.configured = false;
  } finally {
    if (request === generation) { state.loaded = true; state.busy = false; operation = ''; update(); }
  }
}

export function bindAccount(onUpdate) {
  update = onUpdate;
  document.addEventListener('click', async (event) => {
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest('[data-account-sample]') && state.demo && !state.busy) {
      const request = ++generation; operation = 'sample';
      state.busy = true; state.error = ''; state.message = ''; update();
      try {
        const result = await api.account.sample();
        if (request !== generation) return;
        setCustomer(result.customer); state.message = 'signedIn'; await fetchOrders(request);
      } catch (error) { if (request === generation) state.error = copy[language][error.code] ? error.code : 'generic'; }
      finally { if (request === generation) { state.busy = false; operation = ''; update(); } }
      return;
    }
    const tab = element?.closest('[data-account-tab]');
    if (tab) { state.tab = tab.dataset.accountTab; state.error = ''; state.message = ''; update(); return; }
    if (element?.closest('[data-account-retry]') && !state.busy) { await loadAccount(); return; }
    if (element?.closest('[data-account-logout]')) {
      if (state.signingOut) return;
      const request = ++generation;
      operation = 'logout';
      state.busy = true; state.signingOut = true; state.error = ''; state.message = ''; update();
      try {
        await api.account.logout();
        if (request === generation) clearCustomer();
      } catch (error) {
        if (request === generation) { if (signedOut(error)) clearCustomer(); else state.error = 'network'; }
      } finally {
        if (request === generation) { state.busy = false; state.signingOut = false; operation = ''; update(); }
      }
      return;
    }
    const more = element?.closest('[data-account-more]');
    if ((more || element?.closest('[data-account-retry-orders]')) && state.customer && !state.busy) {
      const request = ++generation;
      operation = 'history';
      state.busy = true; state.historyError = ''; update();
      try { await fetchOrders(request, !!more); }
      finally { if (request === generation) { state.busy = false; operation = ''; update(); } }
    }
  });
  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.dataset.accountForm) return;
    event.preventDefault();
    if (!state.configured || state.busy) return;
    const get = (name) => form.elements.namedItem(name)?.value || '';
    const action = form.dataset.accountForm;
    if (!['register', 'login', 'profile', 'password'].includes(action)) return;
    const body = action === 'register' ? { name: get('name'), email: get('email'), password: get('password') } : action === 'login' ? { email: get('email'), password: get('password') } : action === 'profile' ? { name: get('name'), mobile: get('mobile') } : { current: get('current'), password: get('newPassword') };
    if (action === 'register' && body.password !== get('repeat')) { state.error = 'mismatch'; update(); return; }
    const request = ++generation;
    operation = action;
    state.busy = true; state.error = ''; state.message = '';
    update();
    try {
      const result = await api.account[action](body);
      if (request !== generation) return;
      form.reset();
      if (result.customer) setCustomer(result.customer);
      state.message = action === 'register' ? 'created' : action === 'login' ? 'signedIn' : 'saved';
      if (action === 'register' || action === 'login') await fetchOrders(request);
    } catch (error) {
      if (request !== generation) return;
      if (signedOut(error)) { endSession(); return; }
      state.error = copy[language][error.code] ? error.code : 'generic';
    } finally {
      if (request === generation) { state.busy = false; operation = ''; update(); }
    }
  });
}
