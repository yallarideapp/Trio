// The Pages editor creates an explicit, portable browser preview. It must not
// change an ordinary visitor's catalog or simulate authentication and orders.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import seed from '../shared/catalog.js';
import * as pricing from '../shared/pricing.js';
import { conditions, notes as noteLabels, warranties, orderStatuses, governorates } from '../shared/labels.js';
import { ApiError, local, withDefaults } from '../site/src/store.js';
import { pagesAdmin } from '../site/admin/src/pages-store.js';
import { PREVIEW_KEY, PHOTO_KEY, EDITOR_KEY } from '../site/src/pages-preview.js';

const copy = (value) => structuredClone(value);
const errorIs = (code, status) => (error) => error.code === code && error.status === status;

export async function verifyPagesEditor() {
  const original = Object.fromEntries(['fetch', 'localStorage', 'location', 'FileReader'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values = new Map();
  let reads = 0;
  let network = 0;
  let storageFull = false;
  const snapshot = () => [...values];
  try {
    globalThis.fetch = () => { network++; throw new Error('The browser editor must not contact a backend'); };
    globalThis.location = { search: '' };
    globalThis.localStorage = {
      getItem(key) { reads++; return values.get(key) ?? null; },
      setItem(key, value) { if (storageFull) throw new Error('QuotaExceededError'); values.set(key, String(value)); },
      removeItem(key) { values.delete(key); },
    };
    globalThis.FileReader = class {
      readAsDataURL(blob) {
        blob.arrayBuffer().then((bytes) => {
          this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString('base64')}`;
          this.onload();
        }).catch((error) => this.onerror(error));
      }
    };

    const adapterUrl = new URL('../site/src/store.js', import.meta.url);
    const source = readFileSync(adapterUrl, 'utf8')
      .replace(/\b__MODE__\b/g, JSON.stringify('pages'))
      .replace(/from '([^']+)'/g, (_, ref) => `from ${JSON.stringify(new URL(ref, adapterUrl).href)}`);
    const { api, MODE } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    assert.equal(MODE, 'pages');
    assert(!Object.hasOwn(api, 'admin'), 'the public catalog has no admin API');
    for (const name of ['status', 'setup', 'login', 'logout', 'password', 'orders', 'updateOrder']) assert(!Object.hasOwn(pagesAdmin, name), `browser editor has no ${name} operation`);

    const initial = await pagesAdmin.content();
    assert.equal(initial.version, 0, 'an untouched editor starts at version zero');
    assert.equal(initial.content.settings.ordersOn, false);
    assert(initial.content.products.every((product) => product.technical?.summary.ar && product.technical?.summary.en && product.technical.specs.length >= 6), 'all shipped devices start with editable bilingual technical specifications');
    initial.content.products[0].name.en = 'Unsaved edit';
    assert.equal((await pagesAdmin.content()).content.products[0].name.en, seed.products[0].name.en, 'loading the editor returns independent copies');

    const draft = (await pagesAdmin.content()).content;
    const product = draft.products[0];
    product.name = { ar: 'جهاز المعاينة', en: 'Preview device' };
    product.variants[0].price = 123;
    product.technical = { summary: { ar: 'ملخص خاص بالمعاينة', en: 'Preview technical summary' }, specs: [{ label: { ar: 'شاشة', en: 'Display' }, value: { ar: 'قيمة المعاينة', en: 'Preview specification' } }] };
    draft.settings.phone = '0791112222';
    draft.settings.ordersOn = true;
    const photoBlob = new Blob([Buffer.from('RIFF0000WEBPVP8 ', 'ascii')], { type: 'image/webp' });
    const photo = await pagesAdmin.uploadPhoto(photoBlob);
    product.photo = photo.id;
    const photoData = pagesAdmin.photoUrl(photo.id);
    assert.match(photoData, /^data:image\/webp;base64,/, 'uploaded photos use portable local data URLs');
    assert.equal(api.photoUrl(photo.id), '', 'ordinary visits do not use editor uploads');
    await assert.rejects(pagesAdmin.uploadPhoto(new Blob(['bad'], { type: 'image/png' })), errorIs('too-large', 413));
    await assert.rejects(pagesAdmin.uploadPhoto(new Blob([new Uint8Array(1024 * 1024 + 1)], { type: 'image/webp' })), errorIs('too-large', 413));

    const saved = await pagesAdmin.publish(draft, 0);
    assert.deepEqual(saved, { ok: true, version: 1 });
    assert(!Object.hasOwn(JSON.parse(values.get(PREVIEW_KEY)), 'photos'), 'saved preview metadata does not duplicate the photo bank');
    assert(!values.get(PREVIEW_KEY).includes(photoData), 'uploaded photo bytes are stored only once');
    assert.deepEqual(JSON.parse(values.get(PHOTO_KEY)), { [photo.id]: photoData });
    const savedSnapshot = snapshot();
    await assert.rejects(pagesAdmin.publish(draft, 0), errorIs('conflict', 409), 'another tab cannot overwrite the same saved version');
    assert.deepEqual(snapshot(), savedSnapshot, 'a version conflict preserves storage');
    assert.equal((await pagesAdmin.content()).content.settings.ordersOn, false, 'saving a preview always disables orders');

    for (const search of ['', '?preview=other', '?unrelated=draft']) {
      globalThis.location.search = search;
      const readsBefore = reads;
      const publicCatalog = await api.loadContent();
      assert.equal(publicCatalog.source, 'seed');
      assert.deepEqual(publicCatalog.content.products, seed.products, 'ordinary visits retain the published device list');
      assert.equal(publicCatalog.content.settings.phone, seed.settings.phone, 'ordinary visits ignore edited contact details');
      assert.equal(publicCatalog.content.settings.ordersOn, false);
      assert.equal(api.photoUrl(photo.id), '');
      assert.equal(reads, readsBefore, 'ordinary visits never read a stored browser preview');
    }
    globalThis.location.search = '?preview=draft';
    const preview = await api.loadContent();
    assert.equal(preview.source, 'preview');
    assert.equal(preview.version, 1);
    assert.equal(preview.content.products[0].name.en, product.name.en);
    assert.equal(preview.content.products[0].variants[0].price, 123);
    assert.deepEqual(preview.content.products[0].technical, product.technical, 'explicit previews retain edited technical specifications');
    assert.equal(preview.content.settings.phone, draft.settings.phone);
    assert.equal(preview.content.settings.ordersOn, false);
    assert.equal(api.photoUrl(photo.id), photoData);
    assert.equal(api.photoUrl('missing-photo'), '');
    preview.content.products[0].name.en = 'Mutated load';
    assert.equal((await api.loadContent()).content.products[0].name.en, product.name.en, 'preview loads are independent copies');
    await assert.rejects(api.placeOrder({}), errorIs('orders-off', 403), 'preview mode cannot place simulated orders');

    const exported = await pagesAdmin.exportDraft(draft);
    assert.equal(exported.format, 'trio-catalog-draft');
    assert.equal(exported.schemaVersion, 1);
    assert.equal(exported.photos[photo.id], photoData, 'export includes the uploaded image itself');
    assert.deepEqual(Object.keys(exported.photos), [photo.id], 'export includes only referenced photos');
    assert.equal(exported.content.settings.ordersOn, false);
    assert.deepEqual(snapshot(), savedSnapshot, 'export does not publish or change stored data');

    const invalidChanges = [
      (data) => { data.format = 'other'; },
      (data) => { data.schemaVersion = 2; },
      (data) => { delete data.photos[photo.id]; },
      (data) => { data.photos[photo.id] = 'https://example.com/remote.webp'; },
      (data) => { data.content.products[0].variants[0].price = -1; },
      (data) => { data.content.products[0].image = 'assets/../secret.png'; },
      (data) => { data.content.products[0].category = 'unknown'; },
      (data) => { data.content.products[0].technical.summary = { en: 'Missing Arabic' }; },
      (data) => { data.content.products.push(copy(data.content.products[0])); },
      (data) => { data.content.settings.maps = 'javascript:alert(1)'; },
    ];
    for (const mutate of invalidChanges) {
      const invalid = copy(exported);
      mutate(invalid);
      const before = snapshot();
      await assert.rejects(pagesAdmin.importDraft(invalid), errorIs('invalid-draft', 400));
      assert.deepEqual(snapshot(), before, 'invalid imports leave the saved preview and photos intact');
    }

    const beforeFull = snapshot();
    storageFull = true;
    await assert.rejects(pagesAdmin.publish(draft, 1), errorIs('storage-full', 507));
    await assert.rejects(pagesAdmin.importDraft(exported), errorIs('storage-full', 507));
    await assert.rejects(pagesAdmin.uploadPhoto(photoBlob), errorIs('storage-full', 507));
    assert.deepEqual(snapshot(), beforeFull, 'storage failures preserve the previous preview');
    storageFull = false;

    values.set(EDITOR_KEY, JSON.stringify({ unfinished: true }));
    values.set('trio-language', JSON.stringify('en'));
    await pagesAdmin.reset();
    for (const key of [PREVIEW_KEY, PHOTO_KEY, EDITOR_KEY]) assert(!values.has(key), `reset removes ${key}`);
    assert.equal(values.get('trio-language'), '"en"', 'reset preserves visitor preferences');
    assert.equal((await pagesAdmin.content()).version, 0);
    const imported = await pagesAdmin.importDraft(copy(exported));
    assert.equal(imported.products[0].photo, photo.id);
    assert.deepEqual(imported.products[0].technical, product.technical);
    assert.equal(pagesAdmin.photoUrl(photo.id), photoData, 'an exported photo survives import into a cleared browser');
    assert(!values.has(PREVIEW_KEY), 'import creates an editable draft without saving the storefront preview');
    assert.equal((await api.loadContent()).content.products[0].name.en, seed.products[0].name.en, 'import alone does not alter even the explicit preview');
    await pagesAdmin.publish(imported, 0);
    assert.equal((await api.loadContent()).content.products[0].name.en, product.name.en);
    assert.equal(api.photoUrl(photo.id), photoData, 'saving the imported draft completes photo portability');

    // Replaced uploads should not accumulate, while photos used by an active
    // preview or an unfinished editor draft must survive cleanup.
    const makePhoto = (text) => new Blob([`RIFF${text}WEBPVP8 `], { type: 'image/webp' });
    const unused = await pagesAdmin.uploadPhoto(makePhoto('unused'));
    const unfinishedPhoto = await pagesAdmin.uploadPhoto(makePhoto('unfinished'));
    assert.equal(pagesAdmin.photoUrl(unused.id), '', 'a later upload prunes an unreferenced earlier upload');
    assert.equal(api.photoUrl(photo.id), photoData, 'upload cleanup retains the active preview photo');
    const unfinished = (await pagesAdmin.content()).content;
    unfinished.products[1].photo = unfinishedPhoto.id;
    values.set(EDITOR_KEY, JSON.stringify({ baseVersion: 1, content: unfinished }));
    const abandoned = await pagesAdmin.uploadPhoto(makePhoto('abandoned'));
    const bankWithDraft = JSON.parse(values.get(PHOTO_KEY));
    assert.deepEqual(Object.keys(bankWithDraft).sort(), [photo.id, unfinishedPhoto.id, abandoned.id].sort(), 'upload cleanup retains the preview and unfinished editor references');
    const active = await pagesAdmin.content();
    await pagesAdmin.publish(active.content, active.version);
    assert.equal(pagesAdmin.photoUrl(abandoned.id), '', 'saving a preview prunes abandoned uploads');
    assert(pagesAdmin.photoUrl(unfinishedPhoto.id), 'saving retains a photo referenced by the unfinished editor draft');
    values.delete(EDITOR_KEY);
    const afterPrune = await pagesAdmin.content();
    await pagesAdmin.publish(afterPrune.content, afterPrune.version);
    assert.equal(pagesAdmin.photoUrl(unfinishedPhoto.id), '', 'saving prunes photos after their last draft reference is removed');
    assert.deepEqual(Object.keys(JSON.parse(values.get(PHOTO_KEY))), [photo.id], 'only active preview photos remain');

    // A portable backup may reuse a photo ID with different bytes. Import must
    // preserve the current preview until the user explicitly saves the draft.
    const collision = copy(exported);
    const collisionData = `data:image/webp;base64,${Buffer.from('RIFFdifferentWEBPVP8 ').toString('base64')}`;
    collision.photos[photo.id] = collisionData;
    collision.content.products[1].photo = photo.id;
    const previewBeforeImport = values.get(PREVIEW_KEY);
    const collidingDraft = await pagesAdmin.importDraft(collision);
    const remappedId = collidingDraft.products[0].photo;
    assert.notEqual(remappedId, photo.id, 'import remaps colliding IDs when the image bytes differ');
    assert.equal(collidingDraft.products[1].photo, remappedId, 'all imported references to the same image share its remapped ID');
    assert.equal(values.get(PREVIEW_KEY), previewBeforeImport, 'import preserves active preview metadata');
    assert.equal((await api.loadContent()).content.products[0].photo, photo.id, 'import preserves the active device photo reference');
    assert.equal(api.photoUrl(photo.id), photoData, 'import preserves active preview image bytes');
    assert.equal(pagesAdmin.photoUrl(remappedId), collisionData, 'the imported draft resolves its distinct image');
    const collisionExport = await pagesAdmin.exportDraft(collidingDraft);
    assert.deepEqual(collisionExport.photos, { [remappedId]: collisionData }, 'export packages exactly the imported draft references and their bytes');
    const current = await pagesAdmin.content();
    await pagesAdmin.publish(collidingDraft, current.version);
    assert.equal((await api.loadContent()).content.products[0].photo, remappedId, 'saving explicitly activates the imported image reference');
    assert.equal(api.photoUrl(remappedId), collisionData, 'saving activates the imported image bytes');
    assert.equal(api.photoUrl(photo.id), '', 'saving prunes the replaced active image');
    assert(!values.get(PREVIEW_KEY).includes(collisionData), 'subsequent saves still keep image bytes only in the photo bank');

    verifyEditorViews((await pagesAdmin.content()).content);
    assert.equal(network, 0, 'editing, previews, imports, exports, and photos require no API calls');
    assert(![...values.keys()].some((key) => /orders|session|password/.test(key)), 'the editor creates no simulated orders or authentication records');
    console.log('Pages editor checks passed: isolated explicit previews, editable specs, version conflicts, portable photos, photo cleanup and collision isolation, validated imports, quota errors, reset, and bilingual editor views');
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

function verifyEditorViews(content) {
  const root = { innerHTML: '' };
  const document = {
    querySelector: (selector) => selector === '#admin' ? root : null,
    querySelectorAll: () => [], addEventListener() {}, documentElement: {},
    body: { classList: { toggle() {} } },
  };
  const source = readFileSync(new URL('../site/admin/src/admin.js', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/\(async function start\(\) \{[\s\S]*$/, '');
  const context = vm.createContext({
    ...pricing, conditions, noteLabels, warranties, orderStatuses, governorates,
    api: {}, pagesAdmin, MODE: 'pages', ApiError, local, withDefaults, document,
    console, setTimeout, clearTimeout,
  });
  vm.runInContext(source + '\n globalThis.ui = { state, render, setLanguage: (value) => { lang = value; } };', context);
  const { ui } = context;
  ui.state.draft = copy(content);
  for (const language of ['ar', 'en']) {
    ui.setLanguage(language);
    for (const view of ['devices', 'settings']) {
      ui.state.view = view;
      ui.state.editing = null;
      ui.render();
      const html = root.innerHTML;
      assert.equal(document.documentElement.lang, language);
      assert.equal(document.documentElement.dir, language === 'ar' ? 'rtl' : 'ltr');
      assert(html.includes(language === 'ar' ? 'معاينة في هذا المتصفح فقط' : 'Browser-only preview'), `${language}: editor explicitly labels browser-only changes`);
      assert(html.includes(language === 'ar' ? 'احفظ المعاينة' : 'Save preview'), `${language}: editor calls the action saving a preview`);
      assert(html.includes('href="../index.html?preview=draft#/"'), 'preview link opts into local changes');
      assert(html.includes('href="../index.html#/"'), 'public store link excludes the preview parameter');
      for (const id of ['export-draft', 'import-draft', 'reset-preview']) assert(html.includes(`id="${id}"`), `${language}: ${id} is accessible`);
      assert(!/data-view="orders"|id="(?:sign-form|password-form|logout|order-form)"|name="ordersOn"/.test(html), `${language}: no orders or authentication controls are shown`);
    }
    ui.state.view = 'devices';
    ui.state.editing = { index: 0 };
    ui.render();
    assert(root.innerHTML.includes('name="technical.summary.en"') && root.innerHTML.includes('name="technical.summary.ar"'), `${language}: device summaries are editable in both languages`);
    assert(root.innerHTML.includes('name="technical.0.label.en"') && root.innerHTML.includes('name="technical.0.value.ar"'), `${language}: specification labels and values are editable`);
  }
}
