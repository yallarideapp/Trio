// Saved catalog updates must reach other preview tabs without replacing forms,
// losing another editor's draft, or exposing owner drafts on public visits.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const PREVIEW_KEY = 'trio-pages-preview-v1';
const clone = (value) => structuredClone(value);
const content = (version, soldOut = false) => ({ version, categories: [{ id: 'phones' }], settings: {}, products: [{ id: 'phone', variants: [{ soldOut }] }] });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

function environment() {
  const events = { window: new Map(), document: new Map() };
  const elements = new Map();
  const notices = [];
  const main = { insertAdjacentHTML: (position, html) => notices.push({ position, html }) };
  elements.set('#main', main); elements.set('main.wrap', main);
  const listen = (group) => (name, callback) => {
    const callbacks = events[group].get(name) || [];
    events[group].set(name, [...callbacks, callback]);
  };
  const document = { visibilityState: 'visible', addEventListener: listen('document') };
  return {
    elements, notices, document,
    globals: { document, window: { addEventListener: listen('window') }, PREVIEW_KEY, JSON, console, clone, $: (selector) => elements.get(selector) || null },
    async emit(group, name, event = {}) { for (const callback of events[group].get(name) || []) await callback(event); await settle(); },
  };
}

function storefront() {
  const env = environment();
  const calls = { loads: 0, renders: 0, shells: 0, account: 0, announcements: [] };
  let incoming = { content: content(1), source: 'preview' };
  let loader = async () => clone(incoming);
  const state = { content: content(1), source: 'preview', route: { name: 'shop' }, heroCategory: 'phones', busy: false };
  const source = readFileSync(new URL('../site/src/app.js', import.meta.url), 'utf8');
  const helpers = source.slice(source.indexOf('let contentRequest = 0;'), source.indexOf("document.addEventListener('click',", source.indexOf('let contentRequest = 0;')));
  const listeners = source.slice(source.indexOf("window.addEventListener('storage',"), source.indexOf('async function start()', source.indexOf("window.addEventListener('storage',")));
  assert(helpers.includes('async function syncSavedPreview()'), 'storefront sync helper is exercised from actual source');
  const context = vm.createContext({
    ...env.globals, state, MODE: 'pages',
    api: { loadContent: () => { calls.loads++; return loader(); } },
    homeCategoryIds: () => state.content.categories.map((category) => category.id),
    translateShell: () => calls.shells++, renderRoute: () => calls.renders++,
    esc: (value) => String(value), t: (key) => key, arrow: '→', announce: (text) => calls.announcements.push(text),
    loadAccount: () => calls.account++, visitorKey: (key) => 'trio-preview-' + key,
    loadBag: () => [], updateCounts: () => {}, local: { read: () => [] }, updateSavedButtons: () => {},
  });
  vm.runInContext(helpers + '\n' + listeners + '\nglobalThis.sync = syncSavedPreview;', context);
  return { ...env, state, calls, sync: context.sync, setIncoming: (value) => { incoming = value; }, setLoader: (value) => { loader = value; } };
}

function admin() {
  const env = environment();
  const calls = { loads: 0, renders: 0, reads: 0, orders: 0 };
  let incoming = { content: content(1), version: 1 };
  let loader = async () => clone(incoming);
  const state = { signedIn: true, draft: content(1), published: content(1), version: 1, dirty: false, editing: null, addingCategory: null, orderOpen: null };
  const source = readFileSync(new URL('../site/admin/src/admin.js', import.meta.url), 'utf8');
  const helpers = source.slice(source.indexOf('let savedPreviewRequest = 0;'), source.indexOf('(async function start()', source.indexOf('let savedPreviewRequest = 0;')));
  assert(helpers.includes('async function syncSavedPreview()'), 'admin sync helper is exercised from actual source');
  const context = vm.createContext({
    ...env.globals, state, IS_PAGES: true, lang: 'en',
    adminApi: { content: () => { calls.loads++; return loader(); } },
    editableContent: clone, readCurrentForm: () => calls.reads++, render: () => calls.renders++,
    esc: (value) => String(value), t: (value) => value, pollOrders: () => calls.orders++,
  });
  vm.runInContext(helpers + '\nglobalThis.sync = syncSavedPreview;', context);
  return { ...env, state, calls, sync: context.sync, setIncoming: (value) => { incoming = value; }, setLoader: (value) => { loader = value; } };
}

export async function verifyPreviewSync() {
  const view = storefront();
  view.setIncoming({ content: content(2, true), source: 'preview' });
  await view.emit('window', 'storage', { key: PREVIEW_KEY });
  assert.equal(view.state.content.products[0].variants[0].soldOut, true, 'saving stock in another tab refreshes an open owner preview');
  assert.equal(view.calls.renders, 1, 'catalog routes redraw updated stock');
  await view.emit('window', 'focus');
  assert.equal(view.calls.renders, 1, 'focus with unchanged content does not redraw');
  view.state.source = 'seed';
  const publicLoads = view.calls.loads;
  await view.emit('window', 'storage', { key: PREVIEW_KEY });
  await view.emit('window', 'focus');
  assert.equal(view.calls.loads, publicLoads, 'ordinary public visits never load local preview changes');

  for (const route of ['checkout', 'account']) {
    const form = storefront();
    form.state.route.name = route;
    const unfinished = { name: 'Customer typing', address: 'An unfinished address' };
    form.elements.set('#' + route + '-form', unfinished);
    form.setIncoming({ content: content(2, true), source: 'preview' });
    await form.emit('window', 'focus');
    assert.equal(form.calls.renders, 0, `${route}: saved stock does not redraw unfinished fields`);
    assert.equal(form.elements.get('#' + route + '-form'), unfinished, `${route}: keeps the current form instance`);
    assert.equal(unfinished.address, 'An unfinished address', `${route}: customer input is retained`);
    assert.equal(form.state.content.products[0].variants[0].soldOut, true, `${route}: order validation still receives current stock`);
    assert(form.notices[0].html.includes('catalog-update-notice') && form.notices[0].html.includes('#/bag'), `${route}: shows a persistent notice with a bag review link`);
  }
  const hidden = storefront();
  hidden.document.visibilityState = 'hidden';
  hidden.setIncoming({ content: content(2, true), source: 'preview' });
  await hidden.emit('window', 'storage', { key: PREVIEW_KEY });
  assert.equal(hidden.calls.loads, 0, 'hidden preview defers its update');
  hidden.document.visibilityState = 'visible';
  await hidden.emit('document', 'visibilitychange');
  assert.equal(hidden.state.content.version, 2, 'returning to the preview applies a missed storage update');
  hidden.setIncoming({ content: content(0), source: 'preview' });
  await hidden.emit('window', 'storage', { key: null });
  assert.equal(hidden.state.content.version, 0, 'resetting the saved preview updates an already open preview');

  for (const make of [storefront, admin]) {
    const race = make(); const slow = deferred(); const fresh = deferred(); let count = 0;
    race.setLoader(() => (++count === 1 ? slow.promise : fresh.promise));
    const first = race.sync(); const second = race.sync();
    fresh.resolve({ content: content(3, true), version: 3, source: 'preview' }); await second;
    slow.resolve({ content: content(2), version: 2, source: 'preview' }); await first;
    assert.equal(race.state.content?.version || race.state.draft.version, 3, 'a slow old request cannot overwrite newer stock');
    assert.equal(race.calls.renders, 1, 'only the latest saved response redraws');
  }

  const editor = admin();
  editor.setIncoming({ content: content(2, true), version: 2 });
  await editor.emit('window', 'storage', { key: PREVIEW_KEY });
  assert.equal(editor.state.draft.products[0].variants[0].soldOut, true, 'clean admin list adopts the saved stock');
  assert.equal(editor.state.version, 2, 'clean admin list adopts the saved version');
  assert.equal(editor.calls.reads, 0, 'background refresh never invokes form saving or deletes another tab cached draft');
  assert.notEqual(editor.state.draft, editor.state.published, 'saved and editable content remain separate objects');
  await editor.emit('window', 'focus');
  assert.equal(editor.calls.renders, 1, 'unchanged focus preserves a clean admin list');
  editor.setIncoming({ content: content(0), version: 0 });
  await editor.emit('document', 'visibilitychange');
  assert.equal(editor.state.version, 0, 'admin also adopts a saved-preview reset');

  for (const guard of ['dirty', 'editing', 'addingCategory', 'orderOpen', 'upload']) {
    const other = admin();
    if (guard === 'dirty') { other.state.dirty = true; other.state.draft.products[0].name = 'Unsaved owner edit'; }
    else if (guard === 'upload') other.elements.set('[data-category-photo]:disabled', {});
    else other.state[guard] = { index: 0 };
    const original = other.state.draft;
    other.setIncoming({ content: content(2, true), version: 2 });
    await other.emit('window', 'storage', { key: PREVIEW_KEY });
    assert.equal(other.state.draft, original, `${guard}: another admin tab cannot replace the active draft or form`);
    assert.equal(other.state.version, 1, `${guard}: original version remains for safe conflict detection`);
    assert.equal(other.calls.renders, 0, `${guard}: no destructive redraw`);
    assert(other.notices[0].html.includes('data-reload-published') && other.notices[0].html.includes('Export a copy'), `${guard}: explains the conflict and provides an explicit reload`);
  }
  const retry = admin(); let attempts = 0;
  retry.setLoader(async () => { if (++attempts === 1) throw new Error('temporarily unavailable'); return { content: content(2), version: 2 }; });
  await retry.sync();
  assert.equal(retry.state.version, 1, 'failed refresh preserves existing editor content');
  await retry.emit('window', 'focus');
  assert.equal(retry.state.version, 2, 'focus retries a failed refresh');
  console.log('preview synchronization checks passed');
}
