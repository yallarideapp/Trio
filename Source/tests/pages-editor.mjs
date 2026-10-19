// The Pages editor creates an explicit, portable browser preview. It must not
// change an ordinary visitor's catalog. The owner demo has a separate local
// checkout/order store; it never contacts the future shared backend.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import seed from '../shared/catalog.js';
import deviceSpecifications from '../shared/device-specs.js';
import * as pricing from '../shared/pricing.js';
import { conditions, conditionGroup, conditionOptions, notes as noteLabels, warranties, orderStatuses, governorates } from '../shared/labels.js';
import { forwardArrow } from '../shared/navigation.js';
import { ApiError, local, withDefaults } from '../site/src/store.js';
import { pagesAdmin } from '../site/admin/src/pages-store.js';
import { PREVIEW_KEY, PHOTO_KEY, EDITOR_KEY } from '../site/src/pages-preview.js';
import { applyHomePlacement, nextHomePriority, validHomePriority } from '../shared/home-placement.js';

const copy = (value) => structuredClone(value);
const errorIs = (code, status) => (error) => error.code === code && error.status === status;

export async function verifyPagesEditor() {
  verifyHomeSelections();
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
    assert(initial.content.products.every((product) => product.technical?.summary.ar && product.technical?.summary.en && product.technical.specs.length >= 6), 'all shipped devices start with editable bilingual technical specifications');
    initial.content.products[0].name.en = 'Unsaved edit';
    assert.equal((await pagesAdmin.content()).content.products[0].name.en, seed.products[0].name.en, 'loading the editor returns independent copies');

    const draft = (await pagesAdmin.content()).content;
    const product = draft.products[0];
    product.name = { ar: 'جهاز المعاينة', en: 'Preview device' };
    product.variants[0].price = 123;
    product.variants[0].stockQuantity = 2;
    draft.products[1].variants[0].stockQuantity = 0;
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
    assert.deepEqual(snapshot(), savedSnapshot, 'export does not publish or change stored data');

    const invalidChanges = [
      (data) => { data.format = 'other'; },
      (data) => { data.schemaVersion = 2; },
      (data) => { delete data.photos[photo.id]; },
      (data) => { data.photos[photo.id] = 'https://example.com/remote.webp'; },
      (data) => { data.content.products[0].variants[0].price = -1; },
      ...[-1, 1.5, '2', pricing.MAX_STOCK_QUANTITY + 1, NaN, Infinity].map((quantity) => (data) => { data.content.products[0].variants[0].stockQuantity = quantity; }),
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
  const document = {
    querySelector: (selector) => selector === '#admin' ? root : null,
    querySelectorAll: () => [], addEventListener() {}, documentElement: {},
    body: { classList: { toggle() {} } },
  };
  const source = readFileSync(new URL('../site/admin/src/admin.js', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/\(async function start\(\) \{[\s\S]*$/, '');
  const context = vm.createContext({
    ...pricing, conditions, conditionGroup, conditionOptions, forwardArrow, noteLabels, warranties, orderStatuses, governorates, deviceSpecifications, applyHomePlacement,
    api, pagesAdmin, MODE: 'pages', ApiError, local, withDefaults, document,
    window: { addEventListener() {} }, console, setTimeout, clearTimeout, setInterval() {},
  });
  vm.runInContext(source + '\n globalThis.ui = { state, render, setLanguage: (value) => { lang = value; } };', context);
  const { ui } = context;
  ui.state.draft = copy(content);
  ui.state.published = copy(content);
  ui.state.orders = copy(orders);
  ui.state.legacyOrders = copy(legacyOrders);
  for (const language of ['ar', 'en']) {
    ui.setLanguage(language);
    for (const view of ['orders', 'devices', 'settings']) {
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
    assert(root.innerHTML.includes('name="technical.summary.en"') && root.innerHTML.includes('name="technical.summary.ar"'), `${language}: device summaries are editable in both languages`);
    assert(root.innerHTML.includes('class="stock-fields"') && root.innerHTML.includes('name="v.0.soldOut"'), `${language}: availability is a prominent separate control`);
    assert(root.innerHTML.includes('name="v.0.stockQuantity"') && root.innerHTML.includes('inputmode="numeric" min="0"'), `${language}: optional stock uses nonnegative whole numbers`);
    assert(root.innerHTML.includes(language === 'ar' ? 'الكمية المتوفرة (اختياري)' : 'Stock quantity (optional)'), `${language}: optional stock has a translated label`);
    assert(root.innerHTML.includes(language === 'ar' ? 'غير متوفر' : 'Out of stock'), `${language}: out-of-stock control has a translated label`);
    assert(root.innerHTML.includes('name="technical.0.label.en"') && root.innerHTML.includes('name="technical.0.value.ar"'), `${language}: specification labels and values are editable`);
    assert(root.innerHTML.includes(language === 'ar' ? 'آخر جهاز تختاره يتصدر قسمه في واجهة الرئيسية' : 'The latest selected device leads its category in the home showcase'), `${language}: home selection help explains the category showcase`);
    assert(root.innerHTML.includes(language === 'ar' ? 'احفظ المعاينة لتظهر اختياراتك في الرئيسية.' : 'Save preview to see your home selections.'), `${language}: home selections require an explicit preview save`);
  }
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
