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
import { heroRigFor, heroMotionAssets } from '../site/src/hero-motion.js';
import * as battery from '../shared/battery.js';
import * as siteCopy from '../shared/site-text.js';
import { existsSync, statSync } from 'node:fs';

export function verifyStorefront() {
  const stored = new Map();
  const windowEvents = new Map();
  const document = { documentElement: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
  const location = { hash: '#/', replace(value) { this.hash = value; } };
  const context = vm.createContext({
    ...pricing, ...battery, ...siteCopy, deviceSpecifications, conditions, conditionShort, conditionGroup, forwardArrow, noteLabels: notes, warranties, governorates,
    playHeroMotion: () => {},
    renderAccount: () => '<h1>My account</h1>', loadAccount: async () => {}, bindAccount: () => {}, accountLabel: () => 'Sign in', customerProfile: () => null, setAccountText: () => {},
    MODE: 'pages', api: { photoUrl: () => '' }, local: { read: (key, fallback = null) => stored.has(key) ? structuredClone(stored.get(key)) : fallback, write: (key, value) => { stored.set(key, structuredClone(value)); return true; } },
    document, location, crypto: webcrypto, window: { crypto: webcrypto, addEventListener: (name, listener) => windowEvents.set(name, listener) }, console, URLSearchParams, Intl, setTimeout, clearTimeout,
  });
  const source = readFileSync(new URL('../site/src/app.js', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/^start\(\);\s*$/m, '');
  vm.runInContext(source + '\n globalThis.ui = { state, translateShell, batterySummary, conditionChips, renderHome, renderCatalog, renderProductResults, filteredProducts, readRoute, renderDetail, renderService, renderContact, renderBag, renderCheckout, renderDone, instagramAllowed, loadBag, saveBag, cleanBag, addToBag, toggleSaved, phoneHref, phoneText };', context);
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
  const homeTileCategories = seed.categories.map((category) => category.id);
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
    ui.translateShell();
    assert.equal(document.documentElement.lang, language, `${language}: shell initializes without DOM errors`);
    const conditionFixture = structuredClone(seed.products[0]);
    conditionFixture.variants = ['new-sealed', 'new', 'like-new', 'used-agency', 'used'].map((condition, index) => ({ ...conditionFixture.variants[0], key: 'condition-' + index, price: [100, 200, 90, 95, 110][index], condition, soldOut: false }));
    ui.state.selected[conditionFixture.id] = 'condition-1';
    const chips = ui.conditionChips(conditionFixture);
    assert.equal((chips.match(/class="cond-chip /g) || []).length, 1, language + ': a device card shows exactly one condition badge');
    assert(chips.includes(language === 'ar' ? 'مستعمل بحالة الجديد' : 'Used like new'), language + ': the badge matches the starting price rather than an earlier selected variant');
    assert(!/Agency cond\.|Sealed|Used but unused|بحالة الوكالة|جديد مسكّر/.test(chips), language + ': old condition labels are absent');
    const originalOffersTitle = ui.state.content.settings.offersTitle;
    ui.state.content.settings.offersTitle = { ar: 'تشكيلة خاصة', en: 'Editor offer selection' };
    ui.state.route = { name: 'home' };
    const lookingFor = language === 'ar' ? 'عن ماذا تبحث' : 'What are you looking for?';
    const updatedHome = ui.renderHome();
    const homeOffers = updatedHome.match(/<section class="container offers-section">([\s\S]*?)<\/section>/)?.[1] || '';
    const homeCategoriesSection = updatedHome.match(/<section class="container categories-section">([\s\S]*?)<\/section>/)?.[1] || '';
    assert(homeCategoriesSection.includes(`<h2>${lookingFor}</h2>`), `${language}: categories use the requested shopping heading`);
    assert(homeOffers.includes(`<h2>${language === 'ar' ? 'العروض' : 'Offers'}</h2>`), `${language}: offers have their own heading`);
    assert(updatedHome.indexOf('categories-section') < updatedHome.indexOf('offers-section'), `${language}: offers appear immediately below categories`);
    assert(!/featured-section|Picks from Trio|مختارات من تريو/.test(updatedHome), `${language}: Picks section is removed`);
    assert(!homeOffers.includes(ui.state.content.settings.offersTitle[language]), `${language}: the separate offers page heading does not replace the home shopping heading`);
    ui.state.route = { name: 'offers' };
    assert(ui.renderCatalog().includes(`<h1>${ui.state.content.settings.offersTitle[language]}</h1>`), `${language}: offers page uses the edited heading`);
    ui.state.content.settings.offersTitle = { ar: '', en: '' };
    assert(ui.renderCatalog().includes(`<h1>${language === 'ar' ? 'عروض تريو' : 'Trio offers'}</h1>`), `${language}: empty offers headings use the translated fallback`);
    ui.state.content.settings.offersTitle = originalOffersTitle;
    const catalogBeforeConditionFilter = JSON.stringify(ui.state.content);
    for (const [condition, price, key, label, opposite] of [
      ['new', 655000, '256-new', language === 'ar' ? 'جديد' : 'New', language === 'ar' ? 'مستعمل بحالة الجديد' : 'Used like new'],
      ['used', 555000, '256-used', language === 'ar' ? 'مستعمل بحالة الجديد' : 'Used like new', language === 'ar' ? 'جديد' : 'New'],
    ]) {
      resetCatalog();
      ui.state.cond = condition;
      const rows = ui.filteredProducts();
      const product = rows.find((row) => row.id === 'iphone-17');
      assert(product, `${language}/${condition}: mixed-condition device remains searchable`);
      assert.equal(pricing.fromPrice(product), price, `${language}/${condition}: filter uses the price of the matching condition`);
      assert(rows.every((row) => row.variants.every((variant) => conditionGroup(variant.condition) === (condition === 'new' ? 'new' : 'like-new'))), `${language}/${condition}: filter never includes the opposite or an unspecified condition`);
      const card = ui.renderProductResults([product]);
      assert.equal((card.match(/class="cond-chip /g) || []).length, 1, `${language}/${condition}: filtered card has one condition`);
      assert(card.includes(`href="#/p/iphone-17?cond=${condition}"`), `${language}/${condition}: device links carry the selected condition`);
      assert(card.includes(`data-add="iphone-17:${key}"`), `${language}/${condition}: direct add keeps the original option identity`);
      ui.state.selected['iphone-17'] = condition === 'new' ? '256-used' : '256-new';
      ui.state.route = { name: 'p', id: product.id, params: new URLSearchParams(`cond=${condition}`) };
      const detail = ui.renderDetail(product.id);
      const buy = detail.match(/id="detail-buy">([\s\S]*?)<div class="detail-actions">/)?.[1] || '';
      assert(detail.includes(`data-add="iphone-17:${key}"`) && buy.includes(pricing.formatJD(price, language)), `${language}/${condition}: detail rejects a stale opposite-condition selection`);
      assert(buy.includes(`<strong dir="auto">${label}</strong>`) && !buy.includes(`<strong dir="auto">${opposite}</strong>`), `${language}/${condition}: detail displays only the selected condition`);
      ui.state.bag = [{ id: `iphone-17:${key}`, qty: 1 }];
      assert(ui.renderBag().includes(`href="#/p/iphone-17?cond=${condition}"`), `${language}/${condition}: bag links retain the ordered condition`);
    }
    assert.equal(JSON.stringify(ui.state.content), catalogBeforeConditionFilter, `${language}: condition filtering never changes catalog data`);
    ui.state.bag = [];
    resetCatalog();
    const unfilteredPhone = ui.filteredProducts().find((product) => product.id === 'iphone-17');
    const unfilteredCard = ui.renderProductResults([unfilteredPhone]);
    assert(unfilteredCard.includes('href="#/p/iphone-17?cond=used"'), `${language}: ordinary card links preserve the condition shown with its starting price`);
    assert(unfilteredCard.includes('data-add="iphone-17:256-used"'), `${language}: ordinary card actions use the displayed condition`);
    assert.equal((unfilteredCard.match(/class="cond-chip /g) || []).length, 1, `${language}: ordinary mixed-option card has only one badge`);
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
      const tiles = [...html.matchAll(/<a class="category-card" href="#\/shop\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
      assert.deepEqual(tiles.map((match) => match[1]), homeTileCategories, `${language}: home category tiles contain all six categories in catalog order`);
      assert.deepEqual([...html.matchAll(/data-hero-category="([^"]+)"/g)].map((match) => match[1]), homeCategories, `${language}: home hero retains its four category choices`);
      for (const categoryId of ['tablets', 'accessories']) {
        const tile = tiles.find((match) => match[1] === categoryId)?.[2] || '';
        const category = seed.categories.find((item) => item.id === categoryId);
        const candidates = ui.state.content.products.filter((product) => product.category === categoryId && !product.hidden);
        assert(tile.includes(`<h3>${category.name[language]}</h3>`), `${language}/${categoryId}: added category tile has a translated heading and working category link`);
        assert(candidates.some((product) => tile.includes(`src="${product.image}"`)), `${language}/${categoryId}: added category tile shows a real device photo from its category`);
        assert(!tile.includes('class="name-card"'), `${language}/${categoryId}: added category tile is not a missing-photo placeholder`);
      }
      for (const id of cardIds(html)) assert(homeCategories.includes(seed.products.find((product) => product.id === id)?.category), `${language}/${id}: home product sections use only the four home categories`);
      const productLinks = [...html.matchAll(/href="#\/p\/([^"?]+)(?:\?[^"]*)?"/g)].map((match) => match[1]);
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
    // Home selections continue to control the category showcase after removal
    // of the separate Picks grid.
    const beforeSelections = ui.state.content;
    try {
      ui.state.content = structuredClone(seed);
      const candidates = ui.state.content.products.filter((product) => homeCategories.includes(product.category));
      candidates.forEach((product, index) => { product.featured = index < 11; product.homePriority = index + 1; });
      const newest = candidates.find((product) => product.id === 'iphone-17-pro');
      newest.featured = true; newest.offer = true; newest.homePriority = 99999;
      ui.state.heroCategory = 'phones';
      const html = ui.renderHome();
      assert(!html.includes('featured-section'), `${language}: selecting home devices does not restore Picks`);
      assert(html.includes(`class="hero-product" href="#/p/${newest.id}?cond=new"`), `${language}: newly selected phone leads showcase while other devices remain selected`);
      newest.hidden = true;
      assert(!cardIds(ui.renderHome()).includes(newest.id), `${language}: an explicitly hidden selection stays hidden`);
      const watch = candidates.find((product) => product.category === 'watches');
      watch.featured = true; watch.homePriority = 100000;
      ui.state.heroCategory = 'watches';
      assert(ui.renderHome().includes(`class="hero-product" href="#/p/${watch.id}?cond=new"`), `${language}: selected watch displays the chosen device instead of static category artwork`);
    } finally { ui.state.content = beforeSelections; ui.state.heroCategory = 'phones'; }
    // The hero and offers keep their four-category scope even when tablets and
    // accessories lead the catalog and are promoted into offers and home tiles.
    const contentBeforeHomeCheck = ui.state.content;
    try {
      ui.state.content = structuredClone(seed);
      const excluded = ui.state.content.products.filter((product) => !homeCategories.includes(product.category));
      excluded.forEach((product, index) => { product.offer = index % 2 === 0; product.featured = true; });
      ui.state.content.products = [...excluded, ...ui.state.content.products.filter((product) => homeCategories.includes(product.category))];
      const promotedTablet = ui.state.content.products.find((product) => product.id === 'ipad-pro-m5');
      promotedTablet.homePriority = 100001;
      const tabletTile = ui.renderHome().match(/<a class="category-card" href="#\/shop\/tablets"[^>]*>([\s\S]*?)<\/a>/)?.[1] || '';
      assert(tabletTile.includes(`src="${promotedTablet.image}"`), `${language}: newly selected tablet leads its category tile`);
      for (const category of ['tablets', 'accessories']) {
        ui.state.heroCategory = category;
        checkHome(ui.renderHome());
      }
    } finally {
      ui.state.content = contentBeforeHomeCheck;
      ui.state.heroCategory = 'phones';
    }
    const beforeCategoryEdits = ui.state.content;
    const oldPhotoUrl = context.api.photoUrl;
    try {
      ui.state.content = structuredClone(seed);
      const phones = ui.state.content.categories.find((category) => category.id === 'phones');
      phones.name = { ar: 'هواتف معدلة', en: 'Edited phones' };
      phones.image = 'assets/devices/ipad.webp';
      const selectedPhone = ui.state.content.products.find((product) => product.id === 'iphone-16-pro-max');
      selectedPhone.featured = true; selectedPhone.homePriority = 999999;
      const custom = { id: 'gaming', name: { ar: 'ألعاب', en: 'Gaming' }, photo: 'pcategorytest' };
      ui.state.content.categories.unshift(custom);
      context.api.photoUrl = (id) => id === custom.photo ? 'data:image/webp;base64,Y2F0ZWdvcnk=' : '';
      let html = ui.renderHome();
      const phoneTile = html.match(/<a class="category-card" href="#\/shop\/phones"[^>]*>([\s\S]*?)<\/a>/)?.[1] || '';
      assert(phoneTile.includes('src="assets/devices/ipad.webp"'), `${language}: category artwork is independent of selected home device`);
      assert(phoneTile.includes(phones.name[language]), `${language}: edited category names appear at home`);
      assert(html.indexOf('class="category-card" href="#/shop/gaming"') < html.indexOf('class="category-card" href="#/shop/phones"'), `${language}: home follows saved category order`);
      assert(html.includes('src="data:image/webp;base64,Y2F0ZWdvcnk="'), `${language}: category upload appears even before adding devices`);
      delete custom.photo;
      html = ui.renderHome();
      assert(html.includes('class="category-placeholder"'), `${language}: a new empty category has an intentional image state`);
      location.hash = '#/shop/gaming';
      assert.equal(ui.readRoute().category, 'gaming', `${language}: empty category links resolve to the selected category`);
      ui.state.content.categories.push({ id: 'computers', name: { ar: 'كمبيوتر', en: 'Computers' } });
      location.hash = '#/shop/computers';
      assert.equal(ui.readRoute().category, 'computers', `${language}: real custom categories take precedence over legacy route aliases`);
      ui.state.route = { name: 'shop' }; ui.state.category = 'gaming';
      assert(ui.renderCatalog().includes('href="#/shop/gaming"'), `${language}: an empty category remains reachable in catalog navigation`);
      ui.state.heroCategory = 'phones';
      assert(ui.renderHome().includes('src="assets/hero/iphone-16-pro-max-cutout.png"'), `${language}: selected iPhone uses standalone hero artwork`);
    } finally {
      ui.state.content = beforeCategoryEdits; context.api.photoUrl = oldPhotoUrl;
      ui.state.category = 'all'; location.hash = '#/'; ui.state.heroCategory = 'phones';
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
      const options = html.match(/<fieldset class="variant-picker">([\s\S]*?)<\/fieldset>/)?.[1] || '';
      for (const other of product.variants.filter((option) => conditionGroup(option.condition) !== conditionGroup(variant.condition))) {
        assert(!options.includes(`data-variant="${other.key}"`), `${product.id}/${variant.key}: direct device pages keep opposite conditions separate`);
      }
    }
    const beforeBatteryTest = { content: ui.state.content, selected: { ...ui.state.selected }, route: ui.state.route };
    try {
      ui.state.content = structuredClone(seed);
      const device = ui.state.content.products.find((product) => product.id === 'iphone-17-pro-max');
      const used = device.variants.filter((variant) => conditionGroup(variant.condition) === 'like-new');
      const fresh = device.variants.find((variant) => conditionGroup(variant.condition) === 'new');
      used[0].batteryHealth = 87; used[0].batteryCycles = 0;
      used[1].batteryHealth = 95; used[1].batteryCycles = 42;
      const cardBattery = ui.batterySummary({ ...device, variants: [used[0]] });
      assert(cardBattery.includes('87') || cardBattery.includes('٨٧'), `${language}: used-device cards show supplied battery health`);
      assert(cardBattery.includes('>0<') || cardBattery.includes('>٠<'), `${language}: used-device cards preserve zero cycles`);
      assert.equal(ui.batterySummary({ ...device, variants: [fresh] }), '', `${language}: new-device cards have no battery measurements`);
      const healthLabel = language === 'ar' ? 'صحة البطارية' : 'Battery health';
      const cycleLabel = language === 'ar' ? 'عدد دورات شحن البطارية' : 'Battery cycle count';
      const number = (value) => new Intl.NumberFormat(language === 'ar' ? 'ar-JO' : 'en').format(value);
      const healthRow = (value) => `<span>${healthLabel}</span><strong dir="auto">${number(value)}${language === 'ar' ? '٪' : '%'}</strong>`;
      const cycleRow = (value) => `<span>${cycleLabel}</span><strong dir="auto">${number(value)}</strong>`;
      ui.state.route = { name: 'p', id: device.id, params: new URLSearchParams('cond=used') };
      ui.state.selected[device.id] = used[0].key;
      for (const alias of ['like-new', 'used-agency', 'used']) {
        used[0].condition = alias;
        const html = ui.renderDetail(device.id);
        assert(html.includes(healthRow(87)) && html.includes(cycleRow(0)), `${language}/${alias}: used battery readings include zero cycles`);
      }
      ui.state.selected[device.id] = used[1].key;
      const second = ui.renderDetail(device.id);
      assert(second.includes(healthRow(95)) && second.includes(cycleRow(42)) && !second.includes(healthRow(87)), `${language}: readings follow the selected used option`);
      ui.state.selected[device.id] = used[0].key;
      used[0].batteryHealth = null;
      assert(!ui.renderDetail(device.id).includes(healthLabel) && ui.renderDetail(device.id).includes(cycleRow(0)), `${language}: one supplied reading does not invent the other`);
      used[0].batteryHealth = 0; used[0].batteryCycles = null;
      assert(ui.renderDetail(device.id).includes(healthRow(0)) && !ui.renderDetail(device.id).includes(cycleLabel), `${language}: zero health is distinct from a missing measurement`);
      used[0].batteryHealth = 101; used[0].batteryCycles = -1;
      assert(!ui.renderDetail(device.id).includes(healthLabel) && !ui.renderDetail(device.id).includes(cycleLabel), `${language}: invalid imported readings are not displayed`);
      delete used[0].batteryHealth; delete used[0].batteryCycles;
      assert(!ui.renderDetail(device.id).includes(healthLabel) && !ui.renderDetail(device.id).includes(cycleLabel), `${language}: legacy options have no invented battery readings`);
      fresh.batteryHealth = 100; fresh.batteryCycles = 12;
      ui.state.selected[device.id] = fresh.key;
      ui.state.route.params.set('cond', 'new');
      assert(!ui.renderDetail(device.id).includes(healthLabel) && !ui.renderDetail(device.id).includes(cycleLabel), `${language}: new devices never expose stale battery readings`);
    } finally { ui.state.content = beforeBatteryTest.content; ui.state.selected = beforeBatteryTest.selected; ui.state.route = beforeBatteryTest.route; }
    const beforeStockTest = ui.state.content;
    try {
      ui.state.content = structuredClone(seed);
      const device = ui.state.content.products.find((product) => product.id === 'iphone-17-pro');
      const option = device.variants[0];
      option.stockQuantity = 2;
      ui.state.bag = [];
      ui.addToBag('iphone-17-pro:256-new');
      ui.addToBag('iphone-17-pro:256-new');
      ui.addToBag('iphone-17-pro:256-new');
      assert.equal(ui.state.bag[0].qty, 2, `${language}: repeated adds stop at configured stock`);
      const stockBag = ui.renderBag();
      assert(stockBag.includes('data-delta="1" aria-label="+" disabled'), `${language}: bag increase is disabled at stock limit`);
      option.stockQuantity = 1;
      assert(ui.cleanBag() && ui.state.bag[0].qty === 1, `${language}: reducing stock clamps an existing bag`);
      option.stockQuantity = 0;
      ui.state.route = { name: 'p', id: device.id, params: new URLSearchParams('cond=new') };
      const outDetail = ui.renderDetail(device.id);
      assert(!outDetail.includes('data-add="iphone-17-pro:256-new"'), `${language}: zero stock removes the detail purchase action`);
      assert(outDetail.includes(language === 'ar' ? 'غير متوفر' : 'Out of stock'), `${language}: zero stock has a visible availability label`);
      const outCard = ui.renderProductResults([device]);
      assert(!outCard.includes('data-add=') && outCard.includes('aria-disabled="true"'), `${language}: out-of-stock card cannot be purchased`);
      assert(ui.renderHome().includes('data-product="iphone-17-pro"'), `${language}: out-of-stock offers remain visible on home`);
      resetCatalog(); ui.state.cond = 'new';
      assert(ui.filteredProducts().some((product) => product.id === device.id), `${language}: condition filters retain out-of-stock devices`);
      assert(ui.cleanBag() && !ui.state.bag.length, `${language}: zero stock removes the existing bag item`);
      option.stockQuantity = 2; option.soldOut = true;
      ui.addToBag('iphone-17-pro:256-new');
      assert.equal(ui.state.bag.length, 0, `${language}: manual out of stock overrides positive quantity`);
      option.soldOut = false; option.stockQuantity = null;
      for (let i = 0; i < pricing.MAX_QTY + 1; i++) ui.addToBag('iphone-17-pro:256-new');
      assert.equal(ui.state.bag[0].qty, pricing.MAX_QTY, `${language}: blank stock preserves the existing order limit`);
    } finally { ui.state.content = beforeStockTest; ui.state.bag = []; }
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
  // Offer prices: an option with an offer price puts its device in the offers, crosses out the
  // regular price, and the bag and checkout charge the offer price.
  {
    const content = structuredClone(seed);
    content.settings.ordersOn = true; // as the Pages demo loads it
    const home = ['phones', 'laptops', 'watches', 'audio'];
    const product = content.products.find((p) => !p.hidden && p.offer !== true && home.includes(p.category) && p.variants.some((v) => pricing.validPrice(v.price) && v.price > 60));
    assert(product, 'a home device without an offer flag exists');
    const variant = product.variants.slice().sort((a, b) => a.price - b.price)[0];
    variant.offerPrice = variant.price - 50;
    const regular = pricing.toFils(variant.price), offer = pricing.toFils(variant.offerPrice);
    ui.state.content = content; ui.state.bag = []; ui.state.selected = {}; ui.state.category = 'all'; ui.state.query = ''; ui.state.cond = 'all'; ui.state.brand = 'all';
    assert(pricing.inOffers(product) && pricing.productHasOfferPrice(product), 'an offer price puts the device in the offers');
    for (const language of ['ar', 'en']) {
      ui.state.language = language;
      ui.state.route = { name: 'home' };
      const homeHtml = ui.renderHome();
      const offersSection = homeHtml.slice(homeHtml.indexOf('offers-section'));
      assert(offersSection.includes(`data-product="${product.id}"`), `${language}: home offers include the device with an offer price`);
      ui.state.route = { name: 'offers' }; ui.state.sort = 'featured';
      const offersPage = ui.renderProductResults(ui.filteredProducts());
      const card = offersPage.slice(offersPage.indexOf(`data-product="${product.id}"`));
      assert(offersPage.includes(`data-product="${product.id}"`), `${language}: offers page lists the device`);
      assert(card.includes('offer-badge') && card.includes('price-was') && card.includes(pricing.formatJD(regular, language)) && card.includes(pricing.formatJD(offer, language)), `${language}: card shows the crossed-out price and the offer price`);
      ui.state.route = { name: 'p', id: product.id, params: new URLSearchParams() };
      ui.state.selected[product.id] = variant.key;
      const detail = ui.renderDetail(product.id);
      const buy = detail.slice(detail.indexOf('id="detail-buy"'));
      assert(buy.includes('price-was') && buy.includes(pricing.formatJD(offer, language)) && buy.includes(pricing.formatJD(regular - offer, language)), `${language}: device page shows the offer price and the saving`);
      ui.state.bag = [];
      ui.addToBag(pricing.variantId(product.id, variant.key));
      ui.state.route = { name: 'checkout' };
      assert(ui.renderCheckout().includes(pricing.formatJD(offer, language)), `${language}: checkout charges the offer price`);
    }
    const priced = pricing.priceLines(content, [{ id: pricing.variantId(product.id, variant.key), qty: 2 }]);
    assert(priced.ok && priced.totalFils === offer * 2, 'priced lines use the offer price');
    assert.equal(pricing.fromPrice(product), Math.min(offer, ...product.variants.filter((v) => pricing.variantQuantityLimit(v) > 0).map(pricing.variantFils)), 'from-price uses the offer price');
    variant.offerPrice = variant.price;
    assert(!pricing.variantHasOffer(variant) && !pricing.validOfferPrice(variant), 'an offer price equal to the price is not an offer');
    assert.equal(pricing.priceLines(content, [{ id: pricing.variantId(product.id, variant.key), qty: 1 }]).error, 'unknown', 'an invalid offer price cannot be ordered');
    for (const empty of [null, undefined]) { variant.offerPrice = empty; assert(pricing.validOfferPrice(variant) && !pricing.variantHasOffer(variant), `no offer for ${empty}`); }
    for (const bad of ['', 'x', -1, 0, Infinity, variant.price + 1]) { variant.offerPrice = bad; assert(!pricing.validOfferPrice(variant), `offer ${String(bad)} refused`); }
    ui.state.bag = []; ui.state.selected = {}; ui.state.content = structuredClone(seed);
  }
  // Text overrides reach real templates and remain plain text in both languages.
  for (const language of ['ar', 'en']) {
    ui.state.content = structuredClone(seed); ui.state.language = language; ui.state.heroCategory = 'phones';
    const marker = `${language} <edited & text>`;
    ui.state.content.settings.siteText = Object.fromEntries(['store.heroLine1', 'store.add', 'store.serviceText', 'store.serviceSteps.0.0', 'extra.storyEyebrow', 'store.trust.0.0'].map((key) => [key, { [language]: marker }]));
    const escaped = `${language} &lt;edited &amp; text&gt;`;
    assert(ui.renderHome().includes(escaped), `${language}: editable home copy is escaped`);
    assert(ui.renderService().includes(escaped), `${language}: service text and step overrides render`);
    ui.state.route = { name: 'p', params: new URLSearchParams('cond=new') };
    assert(ui.renderDetail('iphone-17-pro').includes(escaped), `${language}: purchase button text override renders`);
    assert(!ui.renderHome().includes(marker), `${language}: edits cannot inject HTML`);
    ui.state.content.settings.siteText = {};
    assert(!ui.renderHome().includes(escaped), `${language}: reset restores default copy`);
  }
  // Shell text, placeholders and labels use the same escaped text registry.
  {
    const node = (attributes = {}, dataset = {}) => ({ dataset, textContent: '', getAttribute: (key) => attributes[key] ?? null, setAttribute: (key, value) => { attributes[key] = value; } });
    const home = node({ 'data-ar': 'الرئيسية', 'data-en': 'Home' });
    const placeholder = node({ 'data-ar-placeholder': 'ابحث عن جهاز…', 'data-en-placeholder': 'Search devices…' });
    const corner = node({ 'data-ar-label': 'لوحة التحكم', 'data-en-label': 'Admin panel' });
    const brand = node({}, { siteText: 'brandName' });
    const queryAll = document.querySelectorAll;
    document.querySelectorAll = (selector) => ({ '[data-ar][data-en]': [home], '[data-ar-placeholder][data-en-placeholder]': [placeholder], '[data-ar-label][data-en-label]': [corner], '[data-site-text]': [brand] })[selector] || [];
    ui.state.content = structuredClone(seed);
    for (const language of ['ar', 'en']) {
      ui.state.language = language;
      ui.state.content.settings.siteText = {
        'store.home': { [language]: 'Edited home' },
        'extra.brandName': { [language]: 'Edited brand' },
        [siteCopy.shellTextId('ابحث عن جهاز…', 'Search devices…', 'placeholder')]: { [language]: 'Edited search' },
        [siteCopy.shellTextId('لوحة التحكم', 'Admin panel', 'label')]: { [language]: 'Edited admin label' },
      };
      ui.translateShell();
      assert.equal(home.textContent, 'Edited home', `${language}: navigation reflects edited text`);
      assert.equal(brand.textContent, 'Edited brand', `${language}: nested brand text is editable`);
      assert.equal(placeholder.getAttribute('placeholder'), 'Edited search', `${language}: search placeholder is editable`);
      assert.equal(corner.getAttribute('aria-label'), 'Edited admin label', `${language}: accessibility labels are editable`);
    }
    document.querySelectorAll = queryAll;
  }
  // Restore the four shipped animated images without changing selected devices.
  {
    ui.state.content = structuredClone(seed); ui.state.language = 'en';
    const selected = ui.state.content.products.find((p) => p.id === 'iphone-16-pro-max');
    selected.featured = true; selected.homePriority = 900000; selected.photo = 'custom-photo';
    const snapshot = JSON.stringify(ui.state.content.products);
    ui.state.content.settings.heroMode = 'default';
    for (const category of ['phones', 'laptops', 'watches', 'audio']) {
      ui.state.heroCategory = category;
      const html = ui.renderHome();
      const showcase = html.slice(html.indexOf('id="hero-showcase"'), html.indexOf('<div class="home-content"'));
      const src = showcase.match(/<img src="([^"]+)"/)[1];
      assert(heroRigFor(src), `${category}: default mode restores matching animated image`);
      assert(showcase.includes(`href="#/shop/${category}"`), `${category}: default artwork links to its category`);
      assert(!showcase.includes('JD '), `${category}: illustration does not claim a selected-device price`);
    }
    assert.equal(JSON.stringify(ui.state.content.products), snapshot, 'restoring default artwork leaves selections and photos intact');
    ui.state.content.settings.heroMode = 'selected'; ui.state.heroCategory = 'phones';
    assert(ui.renderHome().includes('iPhone 16 Pro Max'), 'selected devices remain available after default mode');
  }
  // Hero motion: each default hero photo (phones, laptops, watches, audio) has its animation layers.
  {
    ui.state.content = structuredClone(seed); ui.state.route = { name: 'home' }; ui.state.language = 'en';
    const kinds = {};
    for (const category of ['phones', 'laptops', 'watches', 'audio']) {
      ui.state.heroCategory = category;
      const html = ui.renderHome();
      const hero = html.slice(html.indexOf('id="hero-showcase"'));
      const src = (hero.match(/<img src="([^"]+)"/) || [])[1];
      const rig = heroRigFor(src);
      assert(rig, `${category}: the hero photo ${src} has its motion`);
      kinds[category] = rig.kind;
    }
    assert.deepEqual(kinds, { phones: 'screen', laptops: 'lid', watches: 'wake', audio: 'pods' }, 'hero motion per category');
    for (const asset of heroMotionAssets()) {
      const file = new URL(`../site/${asset}`, import.meta.url);
      assert(existsSync(file) && statSync(file).size > 1000, `hero motion layer ${asset} exists`);
      assert.equal(readFileSync(file).toString('ascii', 8, 12), 'WEBP', `${asset} is WebP`);
    }
    assert.equal(heroRigFor('api/photo/abc'), null, 'an uploaded photo keeps the simple fade');
  }
  for (const name of ['home', 'shop', 'offers', 'saved', 'p', 'bag', 'checkout', 'done', 'trade-in']) assert(!ui.instagramAllowed(name), `${name}: footer social link hidden`);
  for (const name of ['maintenance', 'contact']) assert(ui.instagramAllowed(name), `${name}: footer social link allowed`);
  console.log(`storefront checks passed: six home category tiles, four hero choices, six separate catalog categories, grouped catalog, global search/sort, ${productViews} bilingual device views, selected options, browser checkout/receipts, and route-specific contact rules`);
}
