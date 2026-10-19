// Exercise actual rendering functions against every bilingual catalog entry.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import seed from '../shared/catalog.js';
import deviceSpecifications from '../shared/device-specs.js';
import * as pricing from '../shared/pricing.js';
import { conditions, conditionShort, conditionGroup, notes, warranties, governorates } from '../shared/labels.js';
import { forwardArrow } from '../shared/navigation.js';

export function verifyStorefront() {
  const stored = new Map();
  const windowEvents = new Map();
  const document = { querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
  const location = { hash: '#/', replace(value) { this.hash = value; } };
  const context = vm.createContext({
    ...pricing, deviceSpecifications, conditions, conditionShort, conditionGroup, forwardArrow, noteLabels: notes, warranties, governorates,
    renderAccount: () => '<h1>My account</h1>', loadAccount: async () => {}, bindAccount: () => {}, accountLabel: () => 'Sign in', customerProfile: () => null,
    MODE: 'pages', api: { photoUrl: () => '' }, local: { read: (key, fallback = null) => stored.has(key) ? structuredClone(stored.get(key)) : fallback, write: (key, value) => { stored.set(key, structuredClone(value)); return true; } },
    document, location, crypto: webcrypto, window: { crypto: webcrypto, addEventListener: (name, listener) => windowEvents.set(name, listener) }, console, URLSearchParams, Intl, setTimeout, clearTimeout,
  });
  const source = readFileSync(new URL('../site/src/app.js', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/^start\(\);\s*$/m, '');
  vm.runInContext(source + '\n globalThis.ui = { state, conditionChips, renderHome, renderCatalog, renderProductResults, filteredProducts, readRoute, renderDetail, renderService, renderContact, renderBag, renderCheckout, renderDone, instagramAllowed, loadBag, saveBag, cleanBag, toggleSaved, phoneHref, phoneText };', context);
  const ui = context.ui;
  ui.state.content = structuredClone(seed);
  // Editing a local preview must not remove a public shopping bag item or
  // synchronize preview favorites back into the ordinary storefront.
  const publicBag = [{ id: 'airtag:one', qty: 1 }];
  stored.set('trio-bag', publicBag);
  stored.set('trio-preview-bag', [{ id: 'airtag:one', qty: 2 }]);
  stored.set('trio-saved', ['airtag']);
  stored.set('trio-preview-saved', ['iphone-17']);
  ui.state.source = 'preview';
  ui.state.bag = ui.loadBag();
  assert.equal(ui.state.bag[0].qty, 2, 'preview loads its own bag');
  ui.state.content.products.find((product) => product.id === 'airtag').hidden = true;
  assert.equal(ui.cleanBag(), true, 'preview cleans a device hidden in the draft');
  assert.deepEqual(stored.get('trio-bag'), publicBag, 'cleaning the preview bag preserves the public bag');
  assert.equal(stored.get('trio-preview-bag').length, 0, 'cleaning only changes the preview bag');
  ui.state.saved = new Set(['iphone-17']);
  ui.toggleSaved('iphone-17-pro');
  assert.deepEqual(stored.get('trio-saved'), ['airtag'], 'preview favorites preserve public favorites');
  assert(stored.get('trio-preview-saved').includes('iphone-17-pro'), 'preview favorites use their own key');
  stored.set('trio-preview-bag', [{ id: 'airtag:one', qty: 3 }]);
  windowEvents.get('storage')({ key: 'trio-bag' });
  assert.equal(ui.state.bag.length, 0, 'public bag storage events do not affect a preview');
  windowEvents.get('storage')({ key: 'trio-preview-bag' });
  assert.equal(ui.state.bag[0].qty, 3, 'preview bag storage events synchronize preview tabs');
  ui.state.source = 'seed';
  ui.state.bag = ui.loadBag();
  windowEvents.get('storage')({ key: 'trio-preview-bag' });
  assert.equal(ui.state.bag[0].qty, 1, 'preview bag storage events do not affect the public bag');
  windowEvents.get('storage')({ key: 'trio-preview-saved' });
  assert(ui.state.saved.has('iphone-17-pro'), 'unrelated preview favorite events are ignored by the public store');
  windowEvents.get('storage')({ key: 'trio-saved' });
  assert.deepEqual([...ui.state.saved], ['airtag'], 'public favorites still synchronize across public tabs');
  ui.state.content = structuredClone(seed);
  ui.state.bag = [];
  ui.state.saved = new Set();
  for (const phone of ['0791234567', '+962 79 123 4567', '00962791234567', '962791234567', '٠٧٩١٢٣٤٥٦٧', '+٩٦٢٧٩١٢٣٤٥٦٧', '۰۰۹۶۲۷۹۱۲۳۴۵۶۷']) {
    ui.state.content.settings.phone = phone;
    assert.equal(ui.phoneHref(), 'tel:+962791234567', `${phone}: normalized call link`);
    assert.equal(ui.phoneText(), '0791 234 567', `${phone}: readable local phone number`);
  }
  ui.state.content.settings.phone = 'invalid';
  assert.equal(ui.phoneHref(), '#/contact', 'invalid phone values do not produce malformed call links');
  ui.state.content = structuredClone(seed);
  const instagram = /https?:\/\/(?:www\.)?instagram\.com|إنستغرام|انستغرام|(?:>|\s)Instagram(?:<|\s|↗|$)/i;
  const commentary = /منشور|غير موثق|أكّد|أكد|historical|not documented|confirm|\bposted\b/i;
  const categoryCounts = { phones: 12, laptops: 4, tablets: 2, watches: 4, audio: 1, accessories: 1 };
  const homeCategories = ['phones', 'laptops', 'watches', 'audio'];
  const categoryMembers = {
    laptops: ['macbook-pro-16-m5-max', 'macbook-pro-16-m5-pro', 'macbook-pro-14-m5-pro', 'macbook-air-15-m5'],
    tablets: ['ipad-a16', 'ipad-pro-m5'],
    watches: ['apple-watch-s11', 'apple-watch-ultra-3', 'apple-watch-se-3', 'huawei-watch-gt6'],
    audio: ['airpods-max-2'],
  };
  assert.deepEqual(seed.categories.map((category) => category.id), Object.keys(categoryCounts), 'six separate device categories');
  for (const [id, count] of Object.entries(categoryCounts)) assert.equal(seed.products.filter((product) => product.category === id).length, count, `${id}: category count`);
  const cardIds = (html) => [...html.matchAll(/<article\b[^>]*\bdata-product="([^"]+)"/g)].map((match) => match[1]);
  const resetCatalog = () => Object.assign(ui.state, { route: { name: 'shop', params: new URLSearchParams() }, category: 'all', query: '', brand: 'all', cond: 'all', sort: 'featured' });
  let productViews = 0;
  for (const language of ['ar', 'en']) {
    ui.state.language = language;
    const conditionFixture = structuredClone(seed.products[0]);
    conditionFixture.variants = ['new-sealed', 'new', 'like-new', 'used-agency', 'used'].map((condition, index) => ({ ...conditionFixture.variants[0], key: 'condition-' + index, condition, soldOut: false }));
    const chips = ui.conditionChips(conditionFixture);
    assert.equal((chips.match(/class="cond-chip /g) || []).length, 2, language + ': legacy variants deduplicate into exactly two condition badges');
    assert(chips.includes(language === 'ar' ? 'مستعمل بحالة الجديد' : 'Used like new'), language + ': used condition uses requested wording');
    assert(!/Agency cond\.|Sealed|Used but unused|بحالة الوكالة|جديد مسكّر/.test(chips), language + ': old condition labels are absent');
    const originalOffersTitle = ui.state.content.settings.offersTitle;
    ui.state.content.settings.offersTitle = { ar: 'تشكيلة خاصة', en: 'Editor offer selection' };
    ui.state.route = { name: 'home' };
    const lookingFor = language === 'ar' ? 'شو عم تدوّر عليه؟' : 'What are you looking for?';
    const homeOffers = ui.renderHome().match(/<section class="container offers-section">([\s\S]*?)<\/section>/)?.[1] || '';
    assert(homeOffers.includes(`<h2>${lookingFor}</h2>`), `${language}: home uses the requested shopping heading even with an older editor offer title`);
    assert(!homeOffers.includes(ui.state.content.settings.offersTitle[language]), `${language}: the separate offers page heading does not replace the home shopping heading`);
    ui.state.route = { name: 'offers' };
    assert(ui.renderCatalog().includes(`<h1>${ui.state.content.settings.offersTitle[language]}</h1>`), `${language}: offers page uses the edited heading`);
    ui.state.content.settings.offersTitle = { ar: '', en: '' };
    assert(ui.renderCatalog().includes(`<h1>${language === 'ar' ? 'عروض تريو' : 'Trio offers'}</h1>`), `${language}: empty offers headings use the translated fallback`);
    ui.state.content.settings.offersTitle = originalOffersTitle;
    resetCatalog();
    const grouped = ui.renderProductResults(ui.filteredProducts());
    const groups = [...grouped.matchAll(/<section\b[^>]*\bdata-category-group="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
    assert.deepEqual(groups.map((match) => match[1]), Object.keys(categoryCounts), `${language}: all devices have six ordered sections`);
    assert.deepEqual(cardIds(grouped).sort(), seed.products.map((product) => product.id).sort(), `${language}: every device appears exactly once`);
    for (const [, categoryId, html] of groups) {
      const category = seed.categories.find((item) => item.id === categoryId);
      assert.equal(cardIds(html).length, categoryCounts[categoryId], `${language}/${categoryId}: section count`);
      assert.deepEqual(cardIds(html).sort(), seed.products.filter((product) => product.category === categoryId).map((product) => product.id).sort(), `${language}/${categoryId}: section contains only its devices`);
      assert.equal(html.match(/<h2\b[^>]*>([^<]+)<\/h2>/)?.[1], category.name[language], `${language}/${categoryId}: translated heading`);
      assert(html.includes(`href="#/shop/${categoryId}"`), `${language}/${categoryId}: category link`);
    }
    for (const [categoryId, expectedIds] of Object.entries(categoryMembers)) {
      ui.state.category = categoryId;
      const rows = ui.filteredProducts();
      assert.deepEqual(Array.from(rows, (product) => product.id).sort(), expectedIds.slice().sort(), `${language}/${categoryId}: separate filter membership`);
      const html = ui.renderProductResults(rows);
      assert.deepEqual(cardIds(html).sort(), expectedIds.slice().sort(), `${language}/${categoryId}: filter renders only selected category`);
      assert(!html.includes('data-category-group='), `${language}/${categoryId}: category results stay flat`);
    }
    resetCatalog();
    ui.state.sort = 'price-asc';
    const priceRows = ui.filteredProducts();
    assert.equal(priceRows[0].id, 'airtag', `${language}: global price sort starts with AirTag`);
    for (let index = 1; index < priceRows.length; index++) assert(pricing.fromPrice(priceRows[index - 1]) <= pricing.fromPrice(priceRows[index]), `${language}: globally ascending prices`);
    const sorted = ui.renderProductResults(priceRows);
    assert(!sorted.includes('data-category-group='), `${language}: price sorting stays flat across categories`);
    assert.deepEqual(cardIds(sorted), Array.from(priceRows, (product) => product.id), `${language}: rendered order follows global price order`);
    resetCatalog();
    ui.state.query = 'ipad';
    const searchRows = ui.filteredProducts();
    assert.deepEqual(Array.from(searchRows, (product) => product.id).sort(), categoryMembers.tablets.slice().sort(), `${language}: iPad search finds both tablets`);
    assert(!ui.renderProductResults(searchRows).includes('data-category-group='), `${language}: search results stay flat`);
    resetCatalog();
    ui.state.route.params.set('sort', 'featured');
    assert(!ui.renderProductResults(ui.filteredProducts()).includes('data-category-group='), `${language}: an explicit sort keeps flat results`);
    resetCatalog();
    for (const [oldId, newId] of [['computers', 'laptops'], ['wearables', 'watches']]) {
      location.hash = `#/shop/${oldId}?q=apple`;
      const route = ui.readRoute();
      assert.equal(route.category, newId, `${language}: legacy ${oldId} category route`);
      assert.equal(route.params.get('q'), 'apple', `${language}: legacy category keeps query`);
    }
    ui.state.route = { name: 'home' };
    const checkHome = (html) => {
      assert.deepEqual([...html.matchAll(/<a class="category-card" href="#\/shop\/([^"]+)"/g)].map((match) => match[1]), homeCategories, `${language}: home category tiles contain only phones, laptops, watches and audio in order`);
      assert.deepEqual([...html.matchAll(/data-hero-category="([^"]+)"/g)].map((match) => match[1]), homeCategories, `${language}: home hero offers the same four category choices`);
      assert(!/#\/shop\/(?:tablets|accessories)(?:["?]|$)/.test(html), `${language}: home has no tablet or accessory category links`);
      for (const id of cardIds(html)) assert(homeCategories.includes(seed.products.find((product) => product.id === id)?.category), `${language}/${id}: home product sections use only the four home categories`);
      const productLinks = [...html.matchAll(/href="#\/p\/([^"]+)"/g)].map((match) => match[1]);
      assert(productLinks.length, `${language}: home retains working device links`);
      for (const id of productLinks) assert(homeCategories.includes(seed.products.find((product) => product.id === id)?.category), `${language}/${id}: home device links exclude tablets and accessories`);
      assert(!instagram.test(html), `${language}: home has no Instagram copy or links`);
    };
    for (const category of homeCategories) {
      ui.state.heroCategory = category;
      const home = ui.renderHome();
      checkHome(home);
      assert(home.includes(`data-hero-category="${category}" aria-pressed="true"`), `${language}/${category}: selected home hero choice remains active`);
    }
    // Home selections include offers and all selected cards, without an eight-
    // device cap. A later selection leads without clearing previous choices.
    const beforeSelections = ui.state.content;
    try {
      ui.state.content = structuredClone(seed);
      const candidates = ui.state.content.products.filter((product) => homeCategories.includes(product.category));
      candidates.forEach((product, index) => { product.featured = index < 11; product.homePriority = index + 1; });
      const newest = candidates.find((product) => product.id === 'iphone-17-pro');
      newest.featured = true; newest.offer = true; newest.homePriority = 99999;
      ui.state.heroCategory = 'phones';
      const html = ui.renderHome();
      const picks = html.match(/<section class="container featured-section">([\s\S]*?)<\/section>/)?.[1] || '';
      const selected = candidates.filter((product) => product.featured);
      assert.deepEqual(cardIds(picks).sort(), selected.map((product) => product.id).sort(), `${language}: every selected device appears in Picks, including offers`);
      assert.equal(cardIds(picks)[0], newest.id, `${language}: newest selection leads Picks`);
      assert(html.includes(`class="hero-product" href="#/p/${newest.id}"`), `${language}: newly selected phone leads showcase while other devices remain selected`);
      newest.hidden = true;
      assert(!cardIds(ui.renderHome()).includes(newest.id), `${language}: an explicitly hidden selection stays hidden`);
      const watch = candidates.find((product) => product.category === 'watches');
      watch.featured = true; watch.homePriority = 100000;
      ui.state.heroCategory = 'watches';
      assert(ui.renderHome().includes(`class="hero-product" href="#/p/${watch.id}"`), `${language}: selected watch displays the chosen device instead of static category artwork`);
    } finally { ui.state.content = beforeSelections; ui.state.heroCategory = 'phones'; }
    // Category restrictions must hold even when excluded devices lead the
    // catalog and are promoted into both offers and featured products.
    const contentBeforeHomeCheck = ui.state.content;
    try {
      ui.state.content = structuredClone(seed);
      const excluded = ui.state.content.products.filter((product) => !homeCategories.includes(product.category));
      excluded.forEach((product, index) => { product.offer = index % 2 === 0; product.featured = true; });
      ui.state.content.products = [...excluded, ...ui.state.content.products.filter((product) => homeCategories.includes(product.category))];
      for (const category of ['tablets', 'accessories']) {
        ui.state.heroCategory = category;
        checkHome(ui.renderHome());
      }
    } finally {
      ui.state.content = contentBeforeHomeCheck;
      ui.state.heroCategory = 'phones';
    }
    for (const name of ['shop', 'offers', 'saved']) {
      ui.state.route = { name };
      assert(!instagram.test(ui.renderCatalog()), `${language}: ${name} has no Instagram copy`);
    }
    for (const product of seed.products) {
      const data = deviceSpecifications[product.id];
      assert(data && data.summary.ar && data.summary.en, `${product.id}: bilingual description`);
      assert(data.specs.length >= 6, `${product.id}: useful hardware specifications`);
      assert(data.sources.length && data.sources.every((url) => /^https:\/\/(?:[a-z0-9-]+\.)*(?:apple|samsung|huawei)\.com\//.test(url)), `${product.id}: manufacturer sources`);
      for (const row of data.specs) for (const lang of ['ar', 'en']) assert(row.label[lang] && row.value[lang], `${product.id}: complete specification row`);
      ui.state.route = { name: 'p', id: product.id };
      const html = ui.renderDetail(product.id);
      assert(!instagram.test(html), `${product.id}/${language}: no Instagram references`);
      assert(!html.includes('class="name-card"'), `${product.id}/${language}: device photos replace name-only cards`);
      assert(!commentary.test(html.replace(/<[^>]*>/g, ' ')), `${product.id}/${language}: no editorial disclaimer`);
      assert(!/href="(?:tel:|https?:\/\/wa\.me)/i.test(html), `${product.id}/${language}: no contact actions`);
      assert(!/class="(?:detail-note|detail-source|posted-note|contact-actions)"/.test(html), `${product.id}/${language}: no source/contact sections`);
      assert((html.match(/class="device-spec-row"/g) || []).length >= 6, `${product.id}/${language}: rendered specification table`);
      assert(html.includes('data-add="'), `${product.id}/${language}: bag action retained`);
      productViews++;
    }
    for (const product of seed.products) for (const variant of product.variants) {
      ui.state.selected[product.id] = variant.key;
      const html = ui.renderDetail(product.id);
      assert(html.includes(`${pricing.formatJD(pricing.toFils(variant.price), language)}`), `${product.id}/${variant.key}: selected price`);
      if (variant.storage) assert(html.includes(variant.storage.replaceAll('&', '&amp;').replaceAll('"', '&quot;')), `${product.id}/${variant.key}: selected configuration`);
    }
    ui.state.route = { name: 'trade-in' };
    assert(!instagram.test(ui.renderService(true)), `${language}: trade-in has no Instagram links`);
    ui.state.content.settings.ordersOn = true;
    ui.state.bag = [{ id: 'airtag:one', qty: 2 }];
    ui.state.route = { name: 'bag' };
    const bag = ui.renderBag();
    assert(bag.includes('href="#/checkout"'), `${language}: shopping bag offers normal checkout`);
    assert(!/Ask Trio about your bag|تواصل لتأكيد الأجهزة/.test(bag), `${language}: bag checkout does not ask the shopper to contact Trio`);
    assert(bag.includes(language === 'ar' ? 'أكمل الطلب' : 'Checkout'), `${language}: bag uses the normal checkout action`);
    ui.state.route = { name: 'checkout' };
    const checkout = ui.renderCheckout();
    assert(checkout.includes('id="checkout-form"'), `${language}: Pages renders the checkout form`);
    for (const field of ['name', 'mobile', 'fulfilment', 'governorate', 'address', 'notes']) assert(checkout.includes(`name="${field}"`), `${language}: checkout includes ${field}`);
    assert(checkout.includes(pricing.formatJD(56000, language)), `${language}: checkout displays the exact selected-device total`);
    ui.state.lastOrder = { number: 'DEMO-1001', channel: 'pages', demo: true, totalFils: 56000, lines: [{ name: { ar: 'إيرتاغ', en: 'AirTag' }, storage: '', qty: 2, unitFils: 28000 }] };
    const receipt = ui.renderDone('DEMO-1001');
    assert(receipt.includes('DEMO-1001'), `${language}: demo checkout has a receipt number`);
    assert(receipt.includes(pricing.formatJD(56000, language)), `${language}: receipt shows the saved total`);
    assert(/demo|عرض|تجريبي/i.test(receipt), `${language}: receipt explains browser demo behavior`);
    assert(!ui.renderDone('DEMO-9999').includes('class="order-number"'), `${language}: arbitrary receipt URLs cannot manufacture a successful order`);
    ui.state.lastOrder = null;
    for (const name of ['bag', 'checkout', 'done']) {
      ui.state.route = { name };
      const html = name === 'bag' ? ui.renderBag() : name === 'checkout' ? ui.renderCheckout() : ui.renderDone('old-order');
      assert(!instagram.test(html), `${language}: ${name} has no Instagram reference`);
    }
    ui.state.bag = [];
    assert(instagram.test(ui.renderService()), `${language}: repair retains Instagram`);
    assert(instagram.test(ui.renderContact()), `${language}: visit-us retains Instagram`);
  }
  for (const name of ['home', 'shop', 'offers', 'saved', 'p', 'bag', 'checkout', 'done', 'trade-in']) assert(!ui.instagramAllowed(name), `${name}: footer social link hidden`);
  for (const name of ['maintenance', 'contact']) assert(ui.instagramAllowed(name), `${name}: footer social link allowed`);
  console.log(`storefront checks passed: four home categories, six separate catalog categories, grouped catalog, global search/sort, ${productViews} bilingual device views, selected options, browser checkout/receipts, and route-specific contact rules`);
}
