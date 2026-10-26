// The public text editor stores sparse plain-text overrides without changing
// defaults or confusing an owner's preview with the public catalog.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import seed from '../shared/catalog.js';
import { storeCopy, accountCopy, siteTextEntries, siteText, resolvedCopy, shellTextId, validSiteText, normalizeSiteText, validHeroMode, SITE_TEXT_LIMIT, MAX_SITE_TEXT_TOTAL } from '../shared/site-text.js';
import { pagesAdmin } from '../site/admin/src/pages-store.js';
import { withDefaults } from '../site/src/store.js';
import { PREVIEW_KEY, PHOTO_KEY, EDITOR_KEY } from '../site/src/pages-preview.js';

export async function verifySiteText() {
  const ids = new Set(siteTextEntries.map((entry) => entry.id));
  assert.equal(ids.size, siteTextEntries.length, 'editable IDs are unique');
  for (const id of ['store.heroLine1', 'store.errors.stock-limit', 'store.serviceSteps.1.1', 'store.trust.3.1', 'store.offerSave', 'account.signin', 'account.storage-full', 'labels.conditions.new', 'labels.governorates.amman', 'extra.footerTrademark']) assert(ids.has(id), `${id} is editable`);
  assert(!ids.has('store.count'), 'function formatters are not exposed as text fields');
  assert.equal(storeCopy.en.count(2), '2 devices', 'original formatter functions remain callable');
  assert.equal(accountCopy.en.signin, 'Sign in');
  assert.equal(siteText({}, 'extra.countOne', 'ar'), '{count} جهاز');
  assert.equal(siteText({}, 'extra.countTwo', 'ar'), 'جهازين');
  assert.equal(siteText({}, 'extra.countFew', 'ar'), '{count} أجهزة');
  assert.equal(siteText({}, 'extra.countMany', 'ar'), '{count} جهاز');

  const overrides = {
    'store.heroLine1': { ar: 'عنوان المتجر', en: 'A storefront title' },
    'store.errors.stock-limit': { en: 'Choose fewer items.' },
    'store.trust.0.1': { en: 'An edited array label' },
    'account.signin': { en: 'Log in' },
    'labels.conditions.new': { en: 'Brand new' },
    'extra.footerTrademark': { ar: 'إشعار المتجر' },
  };
  assert(validSiteText(overrides));
  assert(validSiteText(vm.runInNewContext('({ "store.home": { en: "Start" } })')), 'an ordinary record from another browser realm is accepted');
  const settings = { siteText: overrides, heroMode: 'default' };
  const store = resolvedCopy(settings, 'store', 'en');
  assert.equal(store.heroLine1, 'A storefront title');
  assert.equal(store.errors['stock-limit'], 'Choose fewer items.');
  assert.equal(store.trust[0][1], 'An edited array label');
  assert.equal(store.count(3), '3 devices', 'resolving overrides retains count functions');
  assert.equal(resolvedCopy(settings, 'account', 'en').signin, 'Log in');
  assert.equal(resolvedCopy(settings, 'labels', 'en').conditions.new, 'Brand new');
  assert.equal(storeCopy.en.heroLine1, 'A whole', 'resolving never mutates built-in copy');
  assert.equal(resolvedCopy(settings, 'store', 'ar').errors['stock-limit'], storeCopy.ar.errors['stock-limit'], 'missing translations retain their own-language default');
  assert.equal(shellTextId('الرئيسية', 'Home'), 'store.home', 'matching shell text shares the storefront override');
  assert.equal(shellTextId('لوحة التحكم', 'Admin panel', 'label'), 'extra.adminPanel');
  assert(ids.has(shellTextId('ابحث عن جهاز…', 'Search devices…', 'placeholder')), 'the header placeholder is editable');
  assert.equal(siteText({ siteText: { 'store.home': { en: '  ' } } }, 'store.home', 'en'), 'Home', 'blank means use the built-in text');
  assert.equal(siteText({}, 'store.home', 'en', 'Caller fallback'), 'Caller fallback');
  assert.equal(siteText({ siteText: Object.create({ 'store.home': { en: 'Inherited' } }) }, 'store.home', 'en'), 'Home', 'inherited IDs cannot replace text');
  assert.deepEqual(normalizeSiteText({ 'store.home': { ar: '', en: 'Start' }, 'account.signin': { ar: '  ' } }), { 'store.home': { en: 'Start' } }, 'saving stays sparse');

  const invalid = [[], 'text', false, { unknown: { en: 'x' } }, { 'store.home': [] }, { 'store.home': { en: 1 } }, { 'store.home': { fr: 'Accueil' } }, { 'store.home': { en: 'x'.repeat(SITE_TEXT_LIMIT + 1) } }, JSON.parse('{"__proto__":{"en":"unsafe"}}')];
  const tooMuch = Object.fromEntries(siteTextEntries.slice(0, Math.floor(MAX_SITE_TEXT_TOTAL / SITE_TEXT_LIMIT) + 1).map(({ id }) => [id, { en: 'x'.repeat(SITE_TEXT_LIMIT) }]));
  invalid.push(tooMuch);
  for (const value of invalid) assert.equal(validSiteText(value), false, 'malformed, unknown or oversized copy is rejected');
  for (const value of [undefined, null, 'default', 'selected']) assert(validHeroMode(value));
  for (const value of ['', false, 'custom', {}, []]) assert.equal(validHeroMode(value), false);

  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) } });
  try {
    const draft = (await pagesAdmin.content()).content;
    draft.settings.siteText = overrides;
    draft.settings.heroMode = 'default';
    await pagesAdmin.publish(draft, 0);
    assert.deepEqual((await pagesAdmin.content()).content.settings.siteText, overrides, 'Pages saving retains all sparse translations');
    assert.equal((await pagesAdmin.content()).content.settings.heroMode, 'default');
    const backup = await pagesAdmin.exportDraft(draft);
    const imported = await pagesAdmin.importDraft(backup);
    assert.deepEqual(imported.settings.siteText, overrides, 'export/import retains text overrides');
    assert.equal(imported.settings.heroMode, 'default', 'export/import retains the default animation choice');
    assert.deepEqual(withDefaults({ settings: { siteText: overrides, heroMode: 'default' } }).settings.siteText, overrides, 'old-content defaults preserve new settings');
    assert.equal(seed.settings.siteText, undefined, 'preview text does not change shipped business copy');
    const before = [...values];
    for (const value of invalid) {
      const bad = structuredClone(draft); bad.settings.siteText = value;
      await assert.rejects(pagesAdmin.publish(bad, 1), (error) => error.code === 'invalid-draft');
      await assert.rejects(pagesAdmin.importDraft({ ...backup, content: bad }), (error) => error.code === 'invalid-draft');
      assert.deepEqual([...values], before, 'rejected text cannot partially save a preview or photo bank');
    }
    for (const value of ['', 'custom', false]) {
      const bad = structuredClone(draft); bad.settings.heroMode = value;
      await assert.rejects(pagesAdmin.publish(bad, 1), (error) => error.code === 'invalid-draft');
    }
    assert.equal(values.has(PREVIEW_KEY), true);
    assert.equal(values.has(PHOTO_KEY), true);
    assert.equal(values.has(EDITOR_KEY), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
  return { entries: siteTextEntries.length, scopes: [...new Set(siteTextEntries.map((entry) => entry.section))] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log('editable site text checks passed:', await verifySiteText());
