// The Pages editor creates an explicit, portable browser preview. It must not
// change an ordinary visitor's catalog. The owner demo has a separate local
// checkout/order store; it never contacts the future shared backend.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import seed from '../shared/catalog.js';
import deviceSpecifications from '../shared/device-specs.js';
import * as pricing from '../shared/pricing.js';
import { validBatteryHealth, validBatteryCycles } from '../shared/battery.js';
import { conditions, conditionGroup, conditionOptions, notes as noteLabels, warranties, orderStatuses, governorates } from '../shared/labels.js';
import { forwardArrow } from '../shared/navigation.js';
import { ApiError, local, withDefaults } from '../site/src/store.js';
import { pagesAdmin } from '../site/admin/src/pages-store.js';
import { PREVIEW_KEY, PHOTO_KEY, EDITOR_KEY } from '../site/src/pages-preview.js';
import { applyHomePlacement, nextHomePriority, validHomePriority } from '../shared/home-placement.js';
import { MAX_CATEGORIES, CATEGORY_NAME_LIMIT, validCategoryId, validCategoryName, validCategoryImage } from '../shared/categories.js';
import { orderAlerts, orderAlertText, whatsappNumber } from '../site/src/order-alerts.js';
import { siteTextEntries, siteText, SITE_TEXT_LIMIT, validSiteText, validHeroMode } from '../shared/site-text.js';
import { categoryArtworkSource } from '../shared/home-artwork.js';
import { availabilitySummary, setDeviceSoldOut } from '../shared/availability.js';

const copy = (value) => structuredClone(value);
const errorIs = (code, status) => (error) => error.code === code && error.status === status;

export async function verifyPagesEditor() {
  verifyHomeSelections();
  for (const value of [null, undefined, 0, 100]) assert(validBatteryHealth(value), 'battery health accepts unknown or a whole percentage');
  for (const value of [null, undefined, 0, Number.MAX_SAFE_INTEGER]) assert(validBatteryCycles(value), 'battery cycles accepts unknown or a safe nonnegative whole count');
  for (const value of [-1, 101, 99.5, '95', NaN, Infinity, true]) assert.equal(validBatteryHealth(value), false, 'battery health rejects invalid measurements');
  for (const value of [-1, 1.5, '12', Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, true]) assert.equal(validBatteryCycles(value), false, 'battery cycles rejects invalid measurements');
  const original = Object.fromEntries(['fetch', 'localStorage', 'location', 'FileReader', 'navigator'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values = new Map();
  let reads = 0;
  let network = 0;
  let storageFull = false;
  const snapshot = () => [...values];
  try {
    globalThis.fetch = () => { network++; throw new Error('The browser editor must not contact a backend'); };
    globalThis.location = { search: '' };
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request: async (_name, _options, change) => change() } } });
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
    for (const name of ['status', 'setup', 'login', 'logout', 'password']) assert(!Object.hasOwn(pagesAdmin, name), `browser editor has no ${name} operation`);

    const initial = await pagesAdmin.content();
    assert.equal(initial.version, 0, 'an untouched editor starts at version zero');
    assert.equal(initial.content.settings.ordersOn, false);
    assert(initial.content.products.every((product) => product.variants.every((variant) => variant.stockQuantity === null)), 'legacy catalog options have no quantity limit until one is supplied');
    assert(initial.content.products.every((product) => product.variants.every((variant) => variant.batteryHealth === null && variant.batteryCycles === null)), 'legacy device options have unknown battery measurements');
    assert(initial.content.products.every((product) => product.technical?.summary.ar && product.technical?.summary.en && product.technical.specs.length >= 6), 'all shipped devices start with editable bilingual technical specifications');
    initial.content.products[0].name.en = 'Unsaved edit';
    assert.equal((await pagesAdmin.content()).content.products[0].name.en, seed.products[0].name.en, 'loading the editor returns independent copies');

    const draft = (await pagesAdmin.content()).content;
    const product = draft.products[0];
    product.name = { ar: 'جهاز المعاينة', en: 'Preview device' };
    product.variants[0].price = 123;
    product.variants[0].stockQuantity = 2;
    product.variants[0].batteryHealth = 0;
    product.variants[0].batteryCycles = 0;
    draft.products[1].variants[0].stockQuantity = 0;
    draft.products[1].variants[0].batteryHealth = 100;
    draft.products[1].variants[0].batteryCycles = Number.MAX_SAFE_INTEGER;
    draft.products[1].variants[0].soldOut = false;
    draft.products[2].variants[0].stockQuantity = pricing.MAX_STOCK_QUANTITY;
    draft.products[2].variants[0].soldOut = true;
    product.homePriority = 123456;
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
      assert.equal(publicCatalog.content.settings.ordersOn, true, 'owner demo checkout is available without publishing a draft');
      assert.equal(api.photoUrl(photo.id), '');
      assert.equal(reads, readsBefore, 'ordinary visits never read a stored browser preview');
    }
    globalThis.location.search = '?preview=draft';
    const preview = await api.loadContent();
    assert.equal(preview.source, 'preview');
    assert.equal(preview.version, 1);
    assert.equal(preview.content.products[0].name.en, product.name.en);
    assert.equal(preview.content.products[0].variants[0].price, 123);
    assert.equal(preview.content.products[0].variants[0].stockQuantity, 2, 'saving a preview retains an optional quantity');
    assert.equal(preview.content.products[0].variants[0].batteryHealth, 0, 'saving retains zero battery health as a supplied measurement');
    assert.equal(preview.content.products[0].variants[0].batteryCycles, 0, 'saving retains a zero cycle count');
    assert.equal(preview.content.products[1].variants[0].batteryHealth, 100, 'saving retains the maximum battery health');
    assert.equal(preview.content.products[1].variants[0].batteryCycles, Number.MAX_SAFE_INTEGER, 'saving retains an exact safe cycle count');
    assert.equal(preview.content.products[2].variants[0].batteryHealth, null, 'unknown battery health remains unknown');
    assert.equal(preview.content.products[2].variants[0].batteryCycles, null, 'unknown cycle count remains unknown');
    assert.equal(preview.content.products[1].variants[0].stockQuantity, 0, 'zero quantity survives saving without becoming an absent value');
    assert.equal(preview.content.products[1].variants[0].soldOut, false, 'zero stock does not rewrite the independent out-of-stock toggle');
    assert.equal(preview.content.products[2].variants[0].stockQuantity, pricing.MAX_STOCK_QUANTITY, 'the maximum quantity is retained');
    assert.equal(preview.content.products[2].variants[0].soldOut, true, 'a quantity does not clear the manual out-of-stock toggle');
    assert.deepEqual(preview.content.products[0].technical, product.technical, 'explicit previews retain edited technical specifications');
    assert.equal(preview.content.products[0].homePriority, 123456, 'preview saves preserve the selected home showcase priority');
    assert.equal(preview.content.settings.phone, draft.settings.phone);
    assert.equal(preview.content.settings.ordersOn, true, 'explicit previews also support the owner checkout demonstration');
    assert.equal(api.photoUrl(photo.id), photoData);
    assert.equal(api.photoUrl('missing-photo'), '');
    preview.content.products[0].name.en = 'Mutated load';
    assert.equal((await api.loadContent()).content.products[0].name.en, product.name.en, 'preview loads are independent copies');
    await assert.rejects(api.placeOrder({}), 'invalid demo checkout is rejected');

    const exported = await pagesAdmin.exportDraft(draft);
    assert.equal(exported.format, 'trio-catalog-draft');
    assert.equal(exported.schemaVersion, 1);
    assert.equal(exported.photos[photo.id], photoData, 'export includes the uploaded image itself');
    assert.deepEqual(Object.keys(exported.photos), [photo.id], 'export includes only referenced photos');
    assert.equal(exported.content.settings.ordersOn, false);
    assert.equal(exported.content.products[0].homePriority, 123456, 'portable exports preserve home selections and priority');
    assert.equal(exported.content.products[0].variants[0].stockQuantity, 2, 'portable backups retain the stock quantity');
    assert.equal(exported.content.products[0].variants[0].batteryHealth, 0, 'portable backups retain zero battery health');
    assert.equal(exported.content.products[0].variants[0].batteryCycles, 0, 'portable backups retain zero battery cycles');
    assert.deepEqual(snapshot(), savedSnapshot, 'export does not publish or change stored data');

    const invalidChanges = [
      (data) => { data.format = 'other'; },
      (data) => { data.schemaVersion = 2; },
      (data) => { delete data.photos[photo.id]; },
      (data) => { data.photos[photo.id] = 'https://example.com/remote.webp'; },
      (data) => { data.content.products[0].variants[0].price = -1; },
      ...[-1, 1.5, '2', pricing.MAX_STOCK_QUANTITY + 1, NaN, Infinity].map((quantity) => (data) => { data.content.products[0].variants[0].stockQuantity = quantity; }),
      ...[-1, 101, 99.5, '95', NaN, Infinity].map((value) => (data) => { data.content.products[0].variants[0].batteryHealth = value; }),
      ...[-1, 1.5, '12', Number.MAX_SAFE_INTEGER + 1, NaN, Infinity].map((value) => (data) => { data.content.products[0].variants[0].batteryCycles = value; }),
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

    for (const quantity of [-1, 1.5, '2', pricing.MAX_STOCK_QUANTITY + 1, NaN, Infinity]) {
      const invalid = copy(draft);
      invalid.products[0].variants[0].stockQuantity = quantity;
      const before = snapshot();
      await assert.rejects(pagesAdmin.publish(invalid, 1), errorIs('invalid-draft', 400));
      assert.deepEqual(snapshot(), before, 'invalid quantities cannot replace the saved preview');
    }
    for (const [field, value] of [
      ...[-1, 101, 99.5, '95', NaN, Infinity].map((value) => ['batteryHealth', value]),
      ...[-1, 1.5, '12', Number.MAX_SAFE_INTEGER + 1, NaN, Infinity].map((value) => ['batteryCycles', value]),
    ]) {
      const invalid = copy(draft);
      invalid.products[0].variants[0][field] = value;
      const before = snapshot();
      await assert.rejects(pagesAdmin.publish(invalid, 1), errorIs('invalid-draft', 400));
      await assert.rejects(pagesAdmin.exportDraft(invalid), errorIs('invalid-draft', 400));
      assert.deepEqual(snapshot(), before, 'invalid battery values cannot replace the saved preview or become an export');
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
    assert.equal(imported.products[0].homePriority, 123456, 'imported selections retain their home showcase priority');
    assert.equal(imported.products[0].variants[0].stockQuantity, 2, 'imported backups retain numeric quantities');
    assert.equal(imported.products[0].variants[0].batteryHealth, 0, 'imported backups retain zero battery health');
    assert.equal(imported.products[0].variants[0].batteryCycles, 0, 'imported backups retain zero cycle counts');
    assert.equal(imported.products[1].variants[0].batteryHealth, 100, 'imported backups retain the maximum whole battery percentage');
    assert.equal(imported.products[1].variants[0].batteryCycles, Number.MAX_SAFE_INTEGER, 'imported backups retain exact safe cycle counts');
    assert.equal(imported.products[1].variants[0].stockQuantity, 0, 'imported backups retain zero quantity');
    assert.equal(imported.products[3].variants[0].stockQuantity, null, 'imported backups retain optional unlimited stock');
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

    const localOrders = await verifyLocalOrders(api, values, (full) => { storageFull = full; });
    const demoOrders = await verifyDemoCheckoutOrders(api, values);
    await verifyEditorViews((await pagesAdmin.content()).content, demoOrders, localOrders, api);
    await verifyCategoryDrafts(api, values);
    assert.equal(network, 0, 'editing, previews, imports, exports, photos and local order records require no API calls');
    assert(![...values.keys()].some((key) => /session|password/.test(key)), 'the editor creates no simulated authentication records');
    console.log('Pages editor checks passed: isolated explicit previews, editable specs, version conflicts, portable photos, photo cleanup and collision isolation, validated imports, quota errors, reset, local orders, and bilingual editor views');
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

async function verifyCategoryDrafts(api, values) {
  const previous = [...values];
  try {
    values.clear();
    const content = (await pagesAdmin.content()).content;
    content.categories.reverse();
    content.categories[0].name = { ar: 'إكسسوارات وألعاب', en: 'Accessories and gaming' };
    const category = { id: 'gaming', name: { ar: 'ألعاب', en: 'Gaming' }, image: 'assets/categories/airpods-pro.png' };
    content.categories.unshift(category);
    content.products[0].category = category.id;
    const makePhoto = (label) => new Blob([`RIFF${label}WEBPVP8 `], { type: 'image/webp' });
    category.photo = (await pagesAdmin.uploadPhoto(makePhoto('category'))).id;
    values.set(EDITOR_KEY, JSON.stringify({ baseVersion: 0, content }));
    content.products[0].photo = (await pagesAdmin.uploadPhoto(makePhoto('device'))).id;
    values.set(EDITOR_KEY, JSON.stringify({ baseVersion: 0, content }));
    await pagesAdmin.publish(content, 0);
    const expectedCategories = copy(content.categories);
    assert.deepEqual(withDefaults(copy(content)).categories, expectedCategories, 'defaults preserve added categories, their order, names and images');
    assert.deepEqual((await pagesAdmin.content()).content.categories, expectedCategories, 'saving retains dynamic categories and their uploaded photo references');
    globalThis.location.search = '?preview=draft';
    const saved = await api.loadContent();
    assert.deepEqual(saved.content.categories, expectedCategories, 'explicit storefront previews load the edited category order and media');
    assert.equal(saved.content.products[0].category, category.id, 'devices retain their newly assigned category');
    const backup = await pagesAdmin.exportDraft(content);
    assert.deepEqual(Object.keys(backup.photos).sort(), [category.photo, content.products[0].photo].sort(), 'exports include both category and product photos');
    const categoryData = backup.photos[category.photo];
    assert.equal(api.photoUrl(category.photo), categoryData, 'category uploads use the same explicit-preview media resolver');
    globalThis.location.search = '';
    assert.deepEqual((await api.loadContent()).content.categories, seed.categories, 'public visits keep the shipped categories instead of local category edits');
    assert.equal(api.photoUrl(category.photo), '', 'public visits do not load local category uploads');
    globalThis.location.search = '?preview=draft';

    const invalidCategoryChanges = [
      (draft) => { draft.categories = []; },
      (draft) => { draft.categories.push(copy(draft.categories[0])); },
      (draft) => { draft.categories = Array.from({ length: MAX_CATEGORIES + 1 }, (_, index) => ({ id: `category-${index}`, name: { ar: 'فئة', en: 'Category' } })); },
      (draft) => { draft.categories[0].id = 'all'; },
      (draft) => { draft.categories[0].id = 'invalid/id'; },
      (draft) => { draft.categories[0].id = 'a'.repeat(31); },
      (draft) => { draft.categories[0].name.ar = '  '; },
      (draft) => { draft.categories[0].name.en = 'a'.repeat(101); },
      (draft) => { draft.categories[0].image = 'https://example.com/photo.webp'; },
      (draft) => { draft.categories[0].image = 'assets/categories/../photo.webp'; },
      (draft) => { draft.categories[0].image = 'assets/categories/picture.svg'; },
      (draft) => { draft.categories[0].photo = 'punknown'; },
      (draft) => { draft.categories[0].photo = false; },
      (draft) => { draft.categories = draft.categories.filter((item) => item.id !== draft.products[0].category); },
    ];
    for (const mutate of invalidCategoryChanges) {
      const invalid = copy(content);
      mutate(invalid);
      const before = [...values];
      await assert.rejects(pagesAdmin.publish(invalid, 1), errorIs('invalid-draft', 400));
      await assert.rejects(pagesAdmin.exportDraft(invalid), errorIs('invalid-draft', 400));
      await assert.rejects(pagesAdmin.importDraft({ ...copy(backup), content: invalid }), errorIs('invalid-draft', 400));
      assert.deepEqual([...values], before, 'invalid categories cannot replace the preview or photo bank');
    }

    // A category-only photo must survive upload cleanup and portable backups.
    values.delete(EDITOR_KEY);
    const unused = await pagesAdmin.uploadPhoto(makePhoto('unused'));
    assert.equal(pagesAdmin.photoUrl(category.photo), categoryData, 'cleanup retains an uploaded picture referenced only by a category');
    const current = await pagesAdmin.content();
    await pagesAdmin.publish(current.content, current.version);
    assert.equal(pagesAdmin.photoUrl(unused.id), '', 'unreferenced uploads are pruned without dropping category media');

    // An unfinished category upload has the same lifetime as a device upload.
    const pendingPhoto = await pagesAdmin.uploadPhoto(makePhoto('pending-category'));
    const pendingDraft = copy(content);
    pendingDraft.categories[1].photo = pendingPhoto.id;
    values.set(EDITOR_KEY, JSON.stringify({ baseVersion: 2, content: pendingDraft }));
    await pagesAdmin.uploadPhoto(makePhoto('temporary'));
    assert(pagesAdmin.photoUrl(pendingPhoto.id), 'upload cleanup retains category media referenced only by an unfinished editor draft');
    values.delete(EDITOR_KEY);

    // Category and device references to one colliding ID must remap together.
    const collision = copy(backup);
    const replacement = `data:image/webp;base64,${Buffer.from('RIFFreplacement-categoryWEBPVP8 ').toString('base64')}`;
    collision.photos[category.photo] = replacement;
    collision.content.products[0].photo = category.photo;
    const imported = await pagesAdmin.importDraft(collision);
    const remapped = imported.categories[0].photo;
    assert.notEqual(remapped, category.photo, 'import remaps a category photo ID when an active preview owns different bytes');
    assert.equal(imported.products[0].photo, remapped, 'category and device references share the same remapped upload');
    assert.equal(pagesAdmin.photoUrl(category.photo), categoryData, 'import leaves the active category picture intact until save');
    assert.equal(pagesAdmin.photoUrl(remapped), replacement, 'the imported category resolves its distinct picture');
    assert.deepEqual((await pagesAdmin.exportDraft(imported)).photos, { [remapped]: replacement }, 're-export includes exactly the remapped category and device picture');

    await pagesAdmin.reset();
    const restored = await pagesAdmin.importDraft(backup);
    assert.deepEqual(restored.categories, expectedCategories, 'imports restore edited labels, category IDs, order and pictures in a cleared browser');
    assert.equal(pagesAdmin.photoUrl(restored.categories[0].photo), categoryData, 'category photo bytes survive an export/import round trip');
    await pagesAdmin.publish(restored, 0);
    assert.deepEqual((await api.loadContent()).content.categories, expectedCategories, 'saving an imported draft restores its category preview');
    while (restored.categories.length < MAX_CATEGORIES) restored.categories.push({ id: `extra-${restored.categories.length}`, name: { ar: 'فئة جديدة', en: 'Additional category' } });
    const atLimit = await pagesAdmin.content();
    await pagesAdmin.publish(restored, atLimit.version);
    assert.equal((await pagesAdmin.content()).content.categories.length, MAX_CATEGORIES, 'the supported maximum category count is retained without truncation');
  } finally {
    values.clear();
    for (const [key, value] of previous) values.set(key, value);
    globalThis.location.search = '?preview=draft';
  }
}

async function verifyLocalOrders(api, values, setStorageFull) {
  const key = 'trio-pages-orders-v1';
  assert.deepEqual(await pagesAdmin.orders(), { orders: [] }, 'the local order book starts empty');
  const { content } = await pagesAdmin.content();
  const device = content.products[0];
  const lines = [{ id: `${device.id}:${device.variants[0].key}`, qty: 1 }, { id: 'airtag:one', qty: 2 }];
  const expected = pricing.priceLines(content, lines);
  assert(expected.ok);
  const payload = {
    customer: { name: 'Test customer', mobile: '+962 79 123 4567', notes: 'Manual record' },
    fulfilment: 'pickup', lines, lang: 'en', token: 'test-local-order-0001', totalFils: expected.totalFils,
  };
  const first = await pagesAdmin.createOrder(payload);
  assert.deepEqual(first, { number: 'LOCAL-1001', totalFils: expected.totalFils }, 'local order numbers are distinguishable and totals use the saved preview catalog');
  assert.equal(expected.lines[0].unitFils, 123000, 'the local order uses the edited preview price');
  const afterFirst = values.get(key);
  assert.deepEqual(await pagesAdmin.createOrder(copy(payload)), first, 'retrying a token returns the original record');
  assert.equal(values.get(key), afterFirst, 'a retried token creates no duplicate or counter change');
  const second = await pagesAdmin.createOrder({ ...copy(payload), token: 'test-local-order-0002', customer: { name: 'Second customer', mobile: '' }, fulfilment: 'delivery' });
  const withoutToken = copy(payload);
  delete withoutToken.token;
  const third = await pagesAdmin.createOrder(withoutToken);
  assert.deepEqual([first.number, second.number, third.number], ['LOCAL-1001', 'LOCAL-1002', 'LOCAL-1003'], 'new manual records get unique persistent local numbers');
  let rows = (await pagesAdmin.orders()).orders;
  assert.equal(rows.length, 3);
  const saved = rows.find((order) => order.number === first.number);
  assert.equal(saved.customer.mobile, '0791234567', 'optional Jordanian mobile numbers are normalized');
  assert.equal(saved.customer.name, payload.customer.name);
  assert.equal(saved.customer.notes, payload.customer.notes);
  assert.equal(saved.status, 'new');
  assert.equal(saved.totalFils, expected.totalFils);
  assert.equal(saved.lines.reduce((sum, line) => sum + line.unitFils * line.qty, 0), expected.totalFils, 'stored line snapshots add up exactly in fils');
  assert.deepEqual(saved.lines.map((line) => [line.id, line.qty, line.unitFils]), expected.lines.map((line) => [line.id, line.qty, line.unitFils]), 'saved line quantities and prices match catalog pricing');
  saved.customer.name = 'Mutated list result';
  assert.equal((await pagesAdmin.orders()).orders.find((order) => order.number === first.number).customer.name, payload.customer.name, 'reading orders returns independent records');

  const invalidCases = [
    ['bad-name', 400, (data) => { data.customer.name = 'x'; }],
    ['bad-mobile', 400, (data) => { data.customer.mobile = '123'; }],
    ['bad-note', 400, (data) => { data.customer.notes = 'n'.repeat(1001); }],
    ['bad-fulfilment', 400, (data) => { data.fulfilment = 'other'; }],
    ['bad-token', 400, (data) => { data.token = 'short'; }],
    ['bad-qty', 400, (data) => { data.lines[0].qty = 0; }],
    ['bad-qty', 400, (data) => { data.lines[0].qty = pricing.MAX_QTY + 1; }],
    ['bad-qty', 400, (data) => { data.lines[0].qty = 1.5; }],
    ['unknown', 400, (data) => { data.lines[0].id = 'missing:option'; }],
    ['duplicate', 400, (data) => { data.lines.push(copy(data.lines[0])); }],
    ['empty', 400, (data) => { data.lines = []; }],
    ['too-many-lines', 400, (data) => { data.lines = Array.from({ length: pricing.MAX_LINES + 1 }, () => copy(data.lines[0])); }],
    ['price-changed', 409, (data) => { data.totalFils++; }],
  ];
  for (const [code, status, mutate] of invalidCases) {
    const invalid = copy(payload);
    delete invalid.token;
    mutate(invalid);
    const before = values.get(key);
    await assert.rejects(pagesAdmin.createOrder(invalid), errorIs(code, status));
    assert.equal(values.get(key), before, `${code}: invalid local records leave the order book intact`);
  }
  for (const status of orderStatuses) {
    assert.deepEqual(await pagesAdmin.updateOrder(first.number, { status, note: `Reviewed: ${status}` }), { ok: true });
    const current = (await pagesAdmin.orders(status)).orders;
    assert(current.some((order) => order.number === first.number), `${status}: updated orders appear in the matching filter`);
    assert(current.every((order) => order.status === status), `${status}: filters exclude other order states`);
    assert.equal(current.find((order) => order.number === first.number).note, `Reviewed: ${status}`);
  }
  const beforeInvalidUpdates = values.get(key);
  await assert.rejects(pagesAdmin.updateOrder(first.number, { status: 'unknown' }), errorIs('bad-status', 400));
  await assert.rejects(pagesAdmin.updateOrder(first.number, { note: 'n'.repeat(501) }), errorIs('bad-note', 400));
  await assert.rejects(pagesAdmin.updateOrder('LOCAL-missing', { status: 'new' }), errorIs('not-found', 404));
  assert.equal(values.get(key), beforeInvalidUpdates, 'invalid order updates preserve saved records');

  const exported = await pagesAdmin.exportOrders();
  assert.equal(exported.format, 'trio-local-orders');
  assert.equal(exported.schemaVersion, 1);
  assert(Number.isFinite(Date.parse(exported.exportedAt)));
  assert.deepEqual(exported.orders, (await pagesAdmin.orders()).orders, 'export includes current local records and status notes');
  const beforeQuota = values.get(key);
  setStorageFull(true);
  try {
    await assert.rejects(pagesAdmin.createOrder(withoutToken), errorIs('storage-full', 507));
    await assert.rejects(pagesAdmin.updateOrder(first.number, { status: 'confirmed' }), errorIs('storage-full', 507));
  } finally { setStorageFull(false); }
  assert.equal(values.get(key), beforeQuota, 'quota failures do not change saved local orders');
  const capacity = { next: 1500, orders: Array.from({ length: 500 }, (_, index) => ({ ...copy(exported.orders[0]), number: `LOCAL-${index + 1001}` })) };
  values.set(key, JSON.stringify(capacity));
  await assert.rejects(pagesAdmin.createOrder(withoutToken), errorIs('orders-full', 507));
  assert.equal(JSON.parse(values.get(key)).orders.length, 500, 'reaching capacity never drops existing records');
  values.set(key, beforeQuota);

  const privateSnapshot = values.get(key);
  values.delete(key);
  assert.deepEqual(await pagesAdmin.orders(), { orders: [] }, 'a different browser has an empty independent order book');
  values.set(key, privateSnapshot);
  await pagesAdmin.reset();
  assert.equal(values.get(key), privateSnapshot, 'resetting the catalog preview preserves local order records');
  assert.equal((await pagesAdmin.orders()).orders.length, 3);
  globalThis.location.search = '';
  const beforePublic = [...values];
  assert.equal((await api.loadContent()).source, 'seed');
  assert.equal((await api.loadContent()).content.settings.ordersOn, true, 'public owner demo checkout is enabled');
  assert.equal((await api.demoOrders.orders()).orders.length, 0, 'earlier manual records do not appear as demo checkout orders');
  assert.deepEqual([...values], beforePublic, 'public browsing cannot alter earlier manual order records');
  globalThis.location.search = '?preview=draft';
  return (await pagesAdmin.orders()).orders;
}

async function verifyDemoCheckoutOrders(api, values) {
  globalThis.location.search = '';
  const { content } = await api.loadContent();
  const product = content.products.find((item) => !item.hidden && item.variants.some((variant) => !variant.soldOut && pricing.validPrice(variant.price)));
  const variant = product.variants.find((item) => !item.soldOut && pricing.validPrice(item.price));
  const lines = [{ id: pricing.variantId(product.id, variant.key), qty: 2 }];
  const priced = pricing.priceLines(content, lines);
  assert(priced.ok);
  const legacy = values.get('trio-pages-orders-v1');
  const result = await api.placeOrder({ token: '1234567890abcdef1234567890abcdef', lines, totalFils: priced.totalFils, customer: { name: 'Owner demo checkout', mobile: '0791234567', notes: 'From the storefront' }, fulfilment: 'pickup', lang: 'en', website: '', elapsedMs: 3500 });
  assert.match(result.number, /^DEMO-\d+$/, 'demo checkout uses a clearly distinguishable order number');
  assert.equal(result.totalFils, priced.totalFils);
  let rows = (await api.demoOrders.orders()).orders;
  const order = rows.find((row) => row.number === result.number);
  assert(order, 'storefront checkout automatically appears in demo admin orders');
  assert.equal(order.customer.name, 'Owner demo checkout');
  assert.equal(order.lines[0].qty, 2);
  assert.equal(order.lines[0].unitFils * 2, priced.totalFils);
  assert.equal(values.get('trio-pages-orders-v1'), legacy, 'demo checkout never alters legacy manual records');
  await api.demoOrders.updateOrder(order.number, { status: 'confirmed', note: 'Owner reviewed demo' });
  rows = (await api.demoOrders.orders('confirmed')).orders;
  assert.equal(rows.find((row) => row.number === order.number).note, 'Owner reviewed demo', 'demo admin updates status and notes');
  const exported = await api.demoOrders.exportOrders();
  assert(exported.orders.some((row) => row.number === order.number && row.status === 'confirmed'), 'demo export includes current checkout records');
  globalThis.location.search = '?preview=draft';
  return (await api.demoOrders.orders()).orders;
}

async function verifyEditorViews(content, orders, legacyOrders, api) {
  const root = { innerHTML: '' };
  const listeners = {};
  const document = {
    querySelector: (selector) => selector === '#admin' ? root : null,
    querySelectorAll: () => [], addEventListener(type, listener) { listeners[type] = listener; }, documentElement: {},
    body: { classList: { toggle() {} } },
  };
  const source = readFileSync(new URL('../site/admin/src/admin.js', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/\(async function start\(\) \{[\s\S]*$/, '');
  const context = vm.createContext({
    ...pricing, validBatteryHealth, validBatteryCycles, conditions, conditionGroup, conditionOptions, forwardArrow, noteLabels, warranties, orderStatuses, governorates, deviceSpecifications, applyHomePlacement, MAX_CATEGORIES, CATEGORY_NAME_LIMIT, validCategoryId, validCategoryName, validCategoryImage, siteTextEntries, siteText, SITE_TEXT_LIMIT, validSiteText, validHeroMode, categoryArtworkSource, availabilitySummary, setDeviceSoldOut, orderAlerts, PREVIEW_KEY,
    api, pagesAdmin, MODE: 'pages', ApiError, local, withDefaults, document,
    window: { addEventListener() {} }, history: { replaceState() {} }, Element: class {}, console, setTimeout, clearTimeout, setInterval() {},
  });
  vm.runInContext(source + '\n globalThis.ui = { state, render, readWebsiteTexts, textValue, selectedTextEntries, textEntryTitle, validate, setLanguage: (value) => { lang = value; } };', context);
  const { ui } = context;
  ui.state.draft = copy(content);
  ui.state.published = copy(content);
  ui.state.orders = copy(orders);
  ui.state.legacyOrders = copy(legacyOrders);
  for (const language of ['ar', 'en']) {
    ui.setLanguage(language);
    for (const view of ['orders', 'devices', 'categories', 'texts', 'contact', 'settings']) {
      ui.state.view = view;
      ui.state.editing = null;
      ui.render();
      const html = root.innerHTML;
      assert.equal(document.documentElement.lang, language);
      assert.equal(document.documentElement.dir, language === 'ar' ? 'rtl' : 'ltr');
      const localNotice = view === 'orders' ? (language === 'ar' ? 'عرض لصاحب المحل · في هذا المتصفح فقط' : 'Owner demo · this browser only') : (language === 'ar' ? 'معاينة في هذا المتصفح فقط' : 'Browser-only preview');
      assert(html.includes(localNotice), `${language}: editor explicitly labels browser-only changes`);
      assert(html.includes(language === 'ar' ? 'احفظ المعاينة' : 'Save preview'), `${language}: editor calls the action saving a preview`);
      assert(html.includes('href="../index.html?preview=draft#/"'), 'preview link opts into local changes');
      assert(html.includes('href="../index.html#/"'), 'public store link excludes the preview parameter');
      if (view !== 'orders') for (const id of ['export-draft', 'import-draft', 'reset-preview']) assert(html.includes(`id="${id}"`), `${language}: ${id} is accessible`);
      if (view === 'devices') {
        for (let index = 0; index < content.products.length; index++) assert(html.includes(`data-stock-edit="${index}"`), `${language}: stock is reachable directly from the device list`);
        assert(html.includes('stock-flag'), `${language}: the device overview shows availability`);
        assert(!html.includes('data-home-device'), `${language}: home selection lives in the device form, not the list`);
        for (let index = 0; index < content.products.length; index++) for (const action of ['data-toggle-visible', 'data-edit', 'data-list-duplicate', 'data-list-delete']) assert(html.includes(`${action}="${index}"`), `${language}: ${action} is on every listed device`);
        assert(html.includes(language === 'ar' ? 'ظاهر' : 'Shown'), `${language}: visibility is labelled`);
      }
      if (view === 'settings') {
        assert(!html.includes('data-text-entry=') && !html.includes('name="siteText.'), `${language}: website texts have their own tab, apart from settings`);
        assert(!html.includes('name="phone"') && html.includes('data-hero-mode="default"') && html.includes('data-hero-mode="selected"'), `${language}: the default animation choice stays in settings; contact moved to its own tab`);
      }
      if (view === 'contact') {
        for (const name of ['phone', 'whatsapp', 'instagram', 'maps', 'address.ar', 'fee.amman', 'fee.other']) assert(html.includes(`name="${name}"`), `${language}: contact & delivery has ${name}`);
        assert(html.includes('id="alerts-form"') && html.includes('data-alert-find') && html.includes('name="tgToken"') && html.includes('name="waKey"'), `${language}: preview order alerts can be set up`);
        assert(!html.includes('data-hero-mode'), `${language}: contact & delivery holds only contact, delivery and alerts`);
      }
      if (view === 'texts') {
        assert(!html.includes('name="phone"') && !html.includes('class="card home-presentation"'), `${language}: the texts tab holds only website texts`);
        assert(!html.includes('id="site-text-search"') && !html.includes('id="site-text-area"') && !html.includes('data-text-advanced'), `${language}: the first screen does not require a page or message selector`);
        assert(html.includes('data-text-mode="more"'), `${language}: other website text controls remain available on request`);
        assert.equal((html.match(/data-text-entry=/g) || []).length, 7, `${language}: the first screen shows only seven important headings and introductions`);
        for (const id of ['store.heroLine1', 'store.heroLine2', 'store.lookingFor', 'store.offersTitle', 'store.shopIntro', 'store.serviceText', 'store.contactIntro']) for (const locale of ['ar', 'en']) assert(html.includes(`name="siteText.${id}.${locale}"`), `${language}: important website texts remain bilingual`);
        assert.equal((html.match(/name="siteText\.store\.heroLine1\.ar"/g) || []).length, 1, `${language}: a text has only one mounted editor`);
        assert(html.includes(language === 'ar' ? 'عنوان الرئيسية — السطر الأول' : 'Hero title — first line'), `${language}: fields explain their purpose`);
        assert(html.includes('value="A whole"') && html.includes('value="new game."'), `${language}: the actual English default title is visible in editable fields`);
        assert(!html.includes('name="siteText.store.errors.network.ar"') && !html.includes('name="siteText.account.password.ar"'), `${language}: unrelated forms and error messages stay off the first screen`);
        assert(html.includes('data-reset-text="store.offersTitle"') && !html.includes('data-reset-all-text'), `${language}: the important-text screen restores individual texts without a broad reset`);
        assert(!html.includes('name="offersTitle.ar"'), `${language}: offers heading has one editor rather than conflicting duplicate controls`);
        assert(html.includes(language === 'ar' ? 'النصوص المهمة في الموقع' : 'Main website text'), `${language}: the important-text card title is translated`);
      }
      if (view === 'categories') {
        assert(html.includes('data-add-category'), `${language}: categories can be added without editing a device`);
        for (const category of content.categories) {
          assert(html.includes(`data-category-form="${category.id}"`), `${language}: category names are directly editable`);
          assert(html.includes(`data-category-photo="${category.id}"`), `${language}: each category has its own photo upload`);
          for (const product of content.products.filter((product) => product.image || product.photo)) assert(html.includes(`data-category-device="${category.id}" data-device="${product.id}"`), `${language}: any device's picture can be used for a category`);
          const deletion = html.match(new RegExp(`<button[^>]*data-category-delete="${category.id}"[^>]*>`))?.[0] || '';
          if (content.products.some((product) => product.category === category.id)) assert(deletion.includes(' disabled'), `${language}: deleting a populated category is blocked`);
        }
        assert(html.includes(language === 'ar' ? 'أضف قسماً' : 'Add category'), `${language}: category controls are translated`);
      }
      assert(html.includes('data-view="orders"'), `${language}: local orders are reachable from the editor tabs`);
      assert(!/id="(?:sign-form|password-form|logout)"|name="ordersOn"/.test(html), `${language}: no authentication or public checkout controls are shown`);
      if (view === 'orders') {
        assert(html.includes(language === 'ar' ? 'تظهر طلبات تجربة الشراء هنا تلقائياً.' : 'Demo checkout orders appear here automatically.'), `${language}: the page explains automatic demo checkout orders`);
        assert(html.includes(language === 'ar' ? 'لا تُرسل إلى المحل ولا تظهر في متصفحات أخرى.' : 'They are not sent to the store or shared with other browsers.'), `${language}: demo order boundaries remain clear`);
        assert(!html.includes('data-new-order') && !html.includes('id="new-order-form"'), `${language}: Pages cannot create records that look like customer checkout`);
        assert(html.includes('data-export-orders'), `${language}: existing browser records remain exportable`);
        assert(html.includes('data-export-legacy-orders'), `${language}: old manual records have a separate export`);
        for (const order of orders) assert(html.includes(`data-open-order="${order.number}"`), `${language}: storefront demo order is reachable`);
        for (const order of legacyOrders) assert(!html.includes(`data-open-order="${order.number}"`), `${language}: old manual records are excluded from demo checkout orders`);
      }
    }
    ui.state.view = 'orders';
    ui.state.orderOpen = orders[0].number;
    ui.render();
    assert(root.innerHTML.includes('id="order-form"') && root.innerHTML.includes('name="status"') && root.innerHTML.includes('name="note"'), `${language}: local order details allow status and private note updates`);
    assert(root.innerHTML.includes(orders[0].number), `${language}: order details identify the selected record`);
    ui.state.orderOpen = null;
    ui.state.orders = [];
    ui.render();
    assert(root.innerHTML.includes(language === 'ar' ? 'لا توجد طلبات تجريبية بعد.' : 'No demo orders yet.'), `${language}: an empty page invites a storefront checkout demonstration`);
    assert(!root.innerHTML.includes('data-new-order') && !root.innerHTML.includes('id="new-order-form"'), `${language}: an empty Pages order book offers no manual creation`);
    ui.state.orders = copy(orders);
    ui.state.view = 'texts';
    ui.state.textMode = 'more';
    const reachedTexts = new Set();
    for (const area of ['home', 'navigation', 'devices', 'services', 'checkout', 'account']) {
      ui.state.textArea = area; ui.state.textAdvanced = false; ui.render();
      assert((root.innerHTML.match(/data-text-entry=/g) || []).length <= 12, `${language}: ${area} starts with a short set of common fields`);
      assert(root.innerHTML.includes('id="site-text-search"') && root.innerHTML.includes('id="site-text-area"'), `${language}: the optional full editor offers page selection and search`);
      assert(root.innerHTML.includes('data-text-mode="main"') && root.innerHTML.includes('data-reset-all-text'), `${language}: the full editor can return to important texts or restore all defaults`);
      ui.state.textAdvanced = true; ui.render();
      for (const entry of ui.selectedTextEntries()) {
        reachedTexts.add(entry.id);
        assert(ui.textEntryTitle(entry).length <= 56, `${language}: field headings stay short, including long messages`);
        for (const locale of ['ar', 'en']) assert(root.innerHTML.includes(`name="siteText.${entry.id}.${locale}"`), `${language}: additional ${area} text is editable in ${locale}`);
      }
    }
    assert.equal(reachedTexts.size, siteTextEntries.length, `${language}: every registered text is reachable through its page`);
    ui.state.textArea = 'home'; ui.state.textAdvanced = false; ui.state.textQuery = 'browser does not have enough space'; ui.render();
    assert(ui.selectedTextEntries().some((entry) => entry.id === 'store.errors.storage-full'), `${language}: search reaches additional messages outside the current page`);
    assert(!root.innerHTML.includes('name="siteText.store.heroLine1.ar"'), `${language}: search mounts only its results`);
    ui.state.textQuery = ''; ui.state.textArea = 'home'; ui.state.textAdvanced = false; ui.state.textMode = 'main';
    ui.state.view = 'devices';
    ui.state.editing = { index: 0 };
    ui.render();
    const conditionChoices = [...root.innerHTML.matchAll(/<fieldset class="condition-choice">([\s\S]*?)<\/fieldset>/g)];
    assert.equal(conditionChoices.length, content.products[0].variants.length, language + ': each option has its own visible condition choice');
    assert(root.innerHTML.indexOf('class="card device-options"') < root.innerHTML.indexOf('name="name.ar"'), language + ': condition choices appear before device details and specifications');
    for (const [index, [, options]] of conditionChoices.entries()) {
      assert.equal((options.match(/type="radio"/g) || []).length, 2, language + ': condition offers exactly two visible choices');
      assert(options.includes('value="' + conditionGroup(content.products[0].variants[index].condition) + '" checked'), language + ': legacy saved condition checks the matching group');
      assert(options.includes(`name="v.${index}.condition"`), language + ': each option uses an independent radio group');
      assert(!options.includes('value="new-sealed"') && !options.includes('value="used-agency"') && !options.includes('value="used"'), language + ': legacy labels are not selectable');
      for (const label of Object.values(conditionOptions)) assert(options.includes(label[language]), language + ': both condition labels are visible without opening a dropdown');
    }
    const batteryFields = [...root.innerHTML.matchAll(/<fieldset class="battery-fields" data-battery-fields="(\d+)"([^>]*)>([\s\S]*?)<\/fieldset>/g)];
    assert.equal(batteryFields.length, content.products[0].variants.length, `${language}: each device option has independent battery fields`);
    for (const [, optionIndex, attributes, fields] of batteryFields) {
      const variant = content.products[0].variants[Number(optionIndex)];
      const used = conditionGroup(variant.condition) === 'like-new';
      assert.equal(/\bhidden\b/.test(attributes), !used, `${language}: battery fields appear only for a used option`);
      assert.equal(/\bdisabled\b/.test(attributes), !used, `${language}: a new option cannot submit battery measurements`);
      const healthInput = fields.match(/<input\b[^>]*name="v\.\d+\.batteryHealth"[^>]*>/)?.[0];
      const cyclesInput = fields.match(/<input\b[^>]*name="v\.\d+\.batteryCycles"[^>]*>/)?.[0];
      for (const [input, key, maximum] of [[healthInput, 'batteryHealth', 100], [cyclesInput, 'batteryCycles', Number.MAX_SAFE_INTEGER]]) {
        assert(input, `${language}: ${key} is editable for each option`);
        assert(input.includes(`name="v.${optionIndex}.${key}"`) && input.includes('type="number"') && input.includes('inputmode="numeric"') && input.includes('min="0"') && input.includes(`max="${maximum}"`) && input.includes('step="1"'), `${language}: ${key} accepts only a bounded nonnegative whole measurement`);
        assert(!/\brequired\b/.test(input), `${language}: ${key} is optional`);
        assert(input.includes(`value="${variant[key] ?? ''}"`), `${language}: ${key} preserves a known zero and leaves unknown readings blank`);
      }
      for (const label of language === 'ar' ? ['حالة البطارية', 'صحة البطارية (%) (اختياري)', 'عدد دورات شحن البطارية (اختياري)'] : ['Battery condition', 'Battery health (%) (optional)', 'Battery cycles (optional)']) assert(fields.includes(label), `${language}: battery measurements have translated labels`);
    }
    assert(root.innerHTML.includes('name="technical.summary.en"') && root.innerHTML.includes('name="technical.summary.ar"'), `${language}: device summaries are editable in both languages`);
    assert(root.innerHTML.includes('class="stock-fields"') && root.innerHTML.includes('name="v.0.soldOut"'), `${language}: availability is a prominent separate control`);
    assert(root.innerHTML.includes('name="v.0.stockQuantity"') && root.innerHTML.includes('inputmode="numeric" min="0"'), `${language}: optional stock uses nonnegative whole numbers`);
    assert(root.innerHTML.includes(language === 'ar' ? 'الكمية المتوفرة (اختياري)' : 'Stock quantity (optional)'), `${language}: optional stock has a translated label`);
    assert(root.innerHTML.includes(language === 'ar' ? 'غير متوفر' : 'Out of stock'), `${language}: out-of-stock control has a translated label`);
    assert(root.innerHTML.includes('name="technical.0.label.en"') && root.innerHTML.includes('name="technical.0.value.ar"'), `${language}: specification labels and values are editable`);
    assert(root.innerHTML.includes(language === 'ar' ? 'آخر جهاز تختاره يتصدر قسمه في واجهة الرئيسية' : 'The latest selected device leads its category in the home showcase'), `${language}: home selection help explains the category showcase`);
    assert(root.innerHTML.includes(language === 'ar' ? 'احفظ المعاينة لتظهر اختياراتك في الرئيسية.' : 'Save preview to see your home selections.'), `${language}: home selections require an explicit preview save`);
  }
  ui.state.view = 'devices';
  ui.state.editing = null;
  ui.state.draft = copy(content);
  const [first, second] = ui.state.draft.products.filter((product) => product.category === 'phones');
  Object.assign(first, { featured: true, homePriority: 100 });
  Object.assign(second, { featured: false, hidden: true });
  ui.state.published = copy(ui.state.draft);
  ui.state.category = 'phones';
  ui.state.query = second.name.en;
  ui.state.draft.products.reverse();
  const optionsBefore = copy(second.variants);
  const previewBefore = copy((await pagesAdmin.content()).content);
  const changeHome = (id, checked) => listeners.change({ target: { dataset: { homeDevice: id }, checked, closest: () => null } });
  ui.state.draft.settings.heroMode = 'default';
  await changeHome(second.id, true);
  assert.equal(ui.state.draft.settings.heroMode, 'selected', 'selecting a home device activates custom device presentation');
  assert(first.featured && second.featured, 'quick home selection preserves earlier selected devices');
  assert(second.homePriority > first.homePriority && !second.hidden, 'quick home selection promotes and unhides the actual product after filtering/reordering');
  assert.equal(ui.state.query, second.name.en, 'quick selections preserve search');
  assert.equal(ui.state.category, 'phones', 'quick selections preserve category');
  assert.equal(ui.state.editing, null, 'quick home selection does not open the editor');
  assert(ui.state.dirty, 'quick home selection requires Save preview');
  const stored = local.read('trio-pages-editor-draft-v1');
  assert(stored.content.products.find((product) => product.id === second.id).featured, 'quick home selection persists in the pending editor draft');
  assert.deepEqual((await pagesAdmin.content()).content, previewBefore, 'quick selection does not publish or replace the saved preview');
  await changeHome(second.id, false);
  assert(first.featured && !second.featured && !second.hidden, 'unchecking changes only this device selection and does not hide it');
  assert.deepEqual(second.variants, optionsBefore, 'quick selection preserves prices and device options');
  const textFields = Object.fromEntries(siteTextEntries.flatMap((entry) => ['ar', 'en'].map((language) => [`siteText.${entry.id}.${language}`, { value: ui.textValue(entry, language) }])));
  textFields['siteText.store.home.ar'].value = '<strong>واجهة جديدة</strong>';
  textFields['siteText.store.home.en'].value = 'A new home';
  ui.readWebsiteTexts({ elements: textFields });
  assert.equal(ui.state.draft.settings.siteText['store.home'].ar, '<strong>واجهة جديدة</strong>', 'the text editor stores literal text for escaped storefront rendering');
  assert.equal(ui.state.draft.settings.siteText['store.home'].en, 'A new home', 'the text editor preserves independent bilingual edits');
  assert.equal(Object.keys(ui.state.draft.settings.siteText).length, 1, 'unchanged defaults are not expanded into hundreds of overrides');
  ui.state.draft.settings.siteText['store.heroLine1'] = { ar: 'عنوان محفوظ', en: 'Saved title' };
  ui.state.draft.settings.siteText['account.title'] = { ar: 'حساب العميل', en: 'Customer profile' };
  ui.readWebsiteTexts({ elements: { 'siteText.store.heroLine1.ar': { value: 'عنوان جديد' } } });
  assert.equal(ui.state.draft.settings.siteText['store.heroLine1'].en, 'Saved title', 'editing one language keeps its unmounted translation');
  assert.equal(ui.state.draft.settings.siteText['account.title'].en, 'Customer profile', 'switching text pages keeps overrides on other pages');
  ui.readWebsiteTexts({ elements: { 'siteText.store.heroLine1.ar': { value: '' } } });
  assert(!ui.state.draft.settings.siteText['store.heroLine1'].ar && ui.state.draft.settings.siteText['store.heroLine1'].en === 'Saved title', 'clearing a mounted translation restores only that language');
  ui.state.textMode = 'more'; ui.state.textQuery = 'Customer profile';
  assert(ui.selectedTextEntries().some((entry) => entry.id === 'account.title'), 'search includes saved custom text as well as default text');
  ui.state.textQuery = '';
  const preservedProducts = copy(ui.state.draft.products);
  const preservedCategories = copy(ui.state.draft.categories);
  const preservedPhone = ui.state.draft.settings.phone;
  const clickControl = async (selector, dataset = {}) => {
    const target = new context.Element();
    target.closest = (value) => value === selector ? { dataset } : null;
    await listeners.click({ target });
  };
  const savedTextOverrides = copy(ui.state.draft.settings.siteText);
  await clickControl('[data-text-mode]', { textMode: 'main' });
  assert.equal(ui.state.textMode, 'main', 'returning to important texts closes the full editor');
  assert.equal(ui.selectedTextEntries().length, 7, 'returning shows only the seven important texts');
  assert.deepEqual(copy(ui.state.draft.settings.siteText), savedTextOverrides, 'changing text editor mode preserves hidden overrides and translations');
  await clickControl('[data-text-mode]', { textMode: 'more' });
  assert.equal(ui.state.textMode, 'more', 'the full text editor is reachable from the important-text screen');
  ui.state.textQuery = 'Customer profile';
  assert(ui.selectedTextEntries().some((entry) => entry.id === 'account.title'), 'the full editor keeps custom messages reachable after switching modes');
  ui.state.textQuery = '';
  await clickControl('[data-view]', { view: 'texts' });
  assert.equal(ui.state.textMode, 'main', 'opening Website texts always starts with important texts');
  assert.deepEqual(copy(ui.state.draft.settings.siteText), savedTextOverrides, 'opening Website texts preserves less-used saved text');
  const stockTarget = ui.state.draft.products[0];
  const originalVariants = copy(stockTarget.variants);
  await clickControl('[data-set-device-stock]', { setDeviceStock: stockTarget.id, soldOut: 'true' });
  assert(stockTarget.variants.every((variant) => variant.soldOut === true), 'the device control disables every option');
  ui.state.view = 'devices'; ui.state.editing = null; ui.state.query = ''; ui.state.category = 'all'; ui.render();
  assert(root.innerHTML.includes('stock-flag is-out'), 'the list reflects device unavailability outside the edit form');
  assert.deepEqual((await pagesAdmin.content()).content, previewBefore, 'stock edits do not silently publish an unsaved draft');
  await clickControl('[data-set-device-stock]', { setDeviceStock: stockTarget.id, soldOut: 'false' });
  assert(stockTarget.variants.every((variant) => variant.soldOut === false), 'clearing manual flags affects all options');
  stockTarget.variants = originalVariants;
  await clickControl('[data-hero-mode]', { heroMode: 'default' });
  assert.equal(ui.state.draft.settings.heroMode, 'default', 'the default-animation control changes only the presentation mode');
  assert.deepEqual(ui.state.draft.products, preservedProducts, 'restoring default animation keeps products, uploaded photo references and home selections');
  assert.deepEqual(ui.state.draft.categories, preservedCategories, 'restoring default animation keeps category names, photos and order');
  await clickControl('[data-reset-text]', { resetText: 'store.home' });
  assert(!ui.state.draft.settings.siteText?.['store.home'], 'per-text reset removes just that text override');
  ui.state.draft.settings.siteText = { 'store.home': { en: 'Edited home' }, 'store.offersTitle': { ar: 'عرض معدل' } };
  await clickControl('[data-reset-all-text]');
  assert(!ui.state.draft.settings.siteText, 'reset all removes the sparse text overrides');
  assert(!ui.state.draft.settings.offersTitle, 'reset all also clears the legacy offers heading fallback');
  assert.equal(ui.state.draft.settings.phone, preservedPhone, 'text reset keeps public contact details');
  assert.deepEqual(ui.state.draft.products, preservedProducts, 'text reset never removes device content or prices');
  ui.state.category = 'removed-category';
  ui.render();
  assert.equal(ui.state.category, 'all', 'replacing a category draft clears stale device filters before adding another device');
}

function verifyHomeSelections() {
  const first = { id: 'first', category: 'phones', featured: true, hidden: false, homePriority: 100 };
  const second = { id: 'second', category: 'phones', featured: false, hidden: true };
  const products = [first, second];
  assert(applyHomePlacement(second, products, { category: 'phones', featured: true, hidden: true }, 100));
  assert.equal(first.featured, true, 'selecting another home device never clears an existing selection');
  assert.equal(second.featured, true);
  assert.equal(second.hidden, false, 'selecting a hidden device makes it visible on the site');
  assert(second.homePriority > first.homePriority, 'a newer selection leads a previously selected device even when timestamps match');
  const priority = second.homePriority;
  assert.equal(applyHomePlacement(second, products, { category: 'phones', featured: true, hidden: false }, 200), false);
  assert.equal(second.homePriority, priority, 'editing unrelated fields does not change home priority');
  applyHomePlacement(second, products, { category: 'phones', featured: true, hidden: true }, 201);
  assert.equal(second.hidden, true, 'an explicit later Hide action remains available');
  applyHomePlacement(second, products, { category: 'laptops', featured: true, hidden: true }, 50);
  assert(second.homePriority > priority, 'moving a selected device to another category promotes it despite a backwards clock');
  assert.equal(second.hidden, false, 'moving a selected device into a category makes its new home placement visible');
  applyHomePlacement(second, products, { category: 'laptops', featured: false, hidden: false }, 202);
  const beforeReselect = second.homePriority;
  applyHomePlacement(second, products, { category: 'laptops', featured: true, hidden: false }, 50);
  assert(second.homePriority > beforeReselect, 'reselecting a device gives it a fresh priority');
  const added = { id: 'new', category: 'audio', featured: true, hidden: true, _new: true };
  applyHomePlacement(added, [...products, added], { category: 'audio', featured: true, hidden: true }, 10);
  assert(validHomePriority(added.homePriority) && added.homePriority > second.homePriority, 'a new selected device receives a valid leading priority');
  assert.equal(added.hidden, false);
  assert.equal(nextHomePriority([{ homePriority: Infinity }, { homePriority: -2 }, { homePriority: '999' }], 123), 123, 'invalid imported ranks cannot control a new selection');
  for (const invalid of [-1, 1.5, Infinity, NaN, '123', null]) assert.equal(validHomePriority(invalid), false, 'only safe nonnegative integer ranks are retained');
}
