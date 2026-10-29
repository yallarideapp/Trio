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
import * as homeArtwork from '../shared/home-artwork.js';
import { conditionListings, catalogListings } from '../shared/listings.js';
import { heroSlot, validHeroSlots, normalizeHeroSlots } from '../shared/hero-slots.js';
import { existsSync, statSync } from 'node:fs';

export function verifyStorefront() {
  const stored = new Map();
  const windowEvents = new Map();
  const document = { documentElement: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
  const location = { hash: '#/', replace(value) { this.hash = value; } };
  const context = vm.createContext({
    ...pricing, ...battery, ...siteCopy, ...homeArtwork, heroSlot, conditionListings, catalogListings, deviceSpecifications, conditions, conditionShort, conditionGroup, forwardArrow, noteLabels: notes, warranties, governorates, PREVIEW_KEY: 'trio-pages-preview-v1',
    playHeroMotion: () => {},
    renderAccount: () => '<h1>My account</h1>', loadAccount: async () => {}, bindAccount: () => {}, accountLabel: () => 'Sign in', customerProfile: () => null, setAccountText: () => {},
    MODE: 'pages', api: { photoUrl: () => '' }, local: { read: (key, fallback = null) => stored.has(key) ? structuredClone(stored.get(key)) : fallback, write: (key, value) => { stored.set(key, structuredClone(value)); return true; } },
    document, location, crypto: webcrypto, window: { crypto: webcrypto, addEventListener: (name, listener) => windowEvents.set(name, listener) }, console, URLSearchParams, Intl, setTimeout, clearTimeout,
  });
  const source = readFileSync(new URL('../site/src/app.js', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/^start\(\);\s*$/m, '');
  vm.runInContext(source + '\n globalThis.ui = { state, translateShell, batterySummary, conditionChips, productCard, renderHome, renderCatalog, renderProductResults, filteredProducts, readRoute, renderDetail, renderService, renderContact, renderBag, renderCheckout, renderDone, instagramAllowed, loadBag, saveBag, cleanBag, addToBag, toggleSaved, phoneHref, phoneText };', context);
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
  const listingCounts = { ...categoryCounts, phones: 15 };
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
  const cards = (html) => [...html.matchAll(/<article\b[^>]*\bdata-product="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)].map((match) => ({ id: match[1], html: match[0], condition: match[2].match(/href="#\/p\/[^"?]+\?cond=(new|used)"/)?.[1] || '' }));
  const cardIdentities = (html) => cards(html).map((card) => `${card.id}:${card.condition}`);
  // Listing membership follows condition rather than availability. No stored ids,
  // option keys or uploaded media are changed when a model becomes two cards.
  {
    const mixed = structuredClone(seed.products.find((product) => product.id === 'iphone-17'));
    mixed.photo = 'uploaded-photo'; mixed.variants.reverse();
    const before = JSON.stringify(mixed);
    const listings = conditionListings(mixed);
    assert.deepEqual(listings.map((product) => product.conditionFilter), ['new', 'used'], 'mixed models have stable New then Used listings');
    for (const listing of listings) {
      assert.equal(listing.id, mixed.id, 'condition cards preserve the model id');
      assert.equal(listing.photo, mixed.photo, 'condition cards preserve uploaded photos');
      assert.equal(listing.featured, mixed.featured, 'condition cards preserve home selection');
      assert.equal(listing.offer, mixed.offer, 'condition cards preserve offer flags');
      assert.deepEqual(conditionListings(listing), [listing], 'already restricted listings are idempotent');
    }
    assert.deepEqual(listings.map((product) => product.variants.map((variant) => variant.key)), [['256-new'], ['256-used']], 'condition cards preserve the original option keys');
    assert.equal(JSON.stringify(mixed), before, 'creating listings never changes catalog data');
    mixed.variants.forEach((variant) => { variant.soldOut = true; });
    assert.deepEqual(conditionListings(mixed).map((product) => product.conditionFilter), ['new', 'used'], 'all sold-out condition cards remain present in the same order');
    const unknown = { ...mixed, variants: [{ ...mixed.variants[0], condition: '', key: 'unspecified' }, { ...mixed.variants[0], condition: 'unrecognized', key: 'future' }] };
    const unspecified = conditionListings(unknown);
    assert.equal(unspecified.length, 1, 'unclassified options retain their own listing');
    assert.equal(unspecified[0].conditionFilter, '', 'an unspecified condition is never invented as New');
    assert.deepEqual(unspecified[0].variants.map((variant) => variant.key), ['unspecified', 'future'], 'unclassified option identities are retained');
    assert.deepEqual(conditionListings({ ...mixed, conditionFilter: 'used', variants: [mixed.variants.find((variant) => conditionGroup(variant.condition) === 'new')] }), [], 'a restricted input cannot restore an excluded condition');
    assert.equal(catalogListings(seed.products).length, 27, 'the shipped catalog has 27 condition listings for 24 models');
  }
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
    const unfilteredPhones = ui.filteredProducts().filter((product) => product.id === 'iphone-17');
    assert.deepEqual(Array.from(unfilteredPhones, (product) => product.conditionFilter), ['new', 'used'], `${language}: ordinary catalog has separate New and Used cards for a mixed model`);
    const unfilteredCards = cards(ui.renderProductResults(unfilteredPhones));
    assert.deepEqual(unfilteredCards.map((card) => card.condition), ['new', 'used'], `${language}: each card links to its own condition`);
    for (const card of unfilteredCards) {
      const key = card.condition === 'new' ? '256-new' : '256-used';
      assert(card.html.includes(`data-add="iphone-17:${key}"`), `${language}/${card.condition}: card actions use only the displayed condition`);
      assert.equal((card.html.match(/class="cond-chip /g) || []).length, 1, `${language}/${card.condition}: each card has exactly one condition badge`);
      const opposite = card.condition === 'new' ? 'Used like new' : 'New';
      if (language === 'en') assert(!card.html.includes(`>${opposite}</span>`), `${language}/${card.condition}: a card never combines the opposite label`);
    }
    const grouped = ui.renderProductResults(ui.filteredProducts());
    assert.deepEqual(cardIdentities(ui.renderProductResults(seed.products)), cardIdentities(grouped), `${language}: rendering raw models or expanded listings produces the same cards without duplicates`);
    const groups = [...grouped.matchAll(/<section\b[^>]*\bdata-category-group="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
    assert.deepEqual(groups.map((match) => match[1]), Object.keys(categoryCounts), `${language}: all devices have six ordered sections`);
    assert.deepEqual(cardIdentities(grouped).sort(), catalogListings(seed.products).map((product) => `${product.id}:${product.conditionFilter}`).sort(), `${language}: every model and condition appears exactly once`);
    assert.equal(cardIds(grouped).length, 27, `${language}: grouped catalog counts condition listings`);
    for (const [, categoryId, html] of groups) {
      const category = seed.categories.find((item) => item.id === categoryId);
      assert.equal(cardIds(html).length, listingCounts[categoryId], `${language}/${categoryId}: section count includes separate conditions`);
      assert.deepEqual(cardIdentities(html).sort(), catalogListings(seed.products.filter((product) => product.category === categoryId)).map((product) => `${product.id}:${product.conditionFilter}`).sort(), `${language}/${categoryId}: section contains only its model conditions`);
      assert.equal(html.match(/<h2\b[^>]*>([^<]+)<\/h2>/)?.[1], category.name[language], `${language}/${categoryId}: translated heading`);
      assert(html.includes(`href="#/shop/${categoryId}"`), `${language}/${categoryId}: category link`);
    }
    const tabs = ui.renderCatalog().match(/<nav class="catalog-tabs"[\s\S]*?<\/nav>/)?.[0] || '';
    const countNumber = (value) => new Intl.NumberFormat(language === 'ar' ? 'ar-JO' : 'en').format(value);
    assert(tabs.includes(`<span>${countNumber(27)}</span>`) && tabs.includes(`<span>${countNumber(15)}</span>`), `${language}: catalog category counts match rendered condition listings`);
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
    // Banner slots from the admin: a picked device or an uploaded picture wins for that tab only.
    const beforeSlots = ui.state.content; const slotPhotoUrl = context.api.photoUrl;
    try {
      ui.state.content = structuredClone(beforeSlots);
      const laptop = ui.state.content.products.find((product) => product.category === 'laptops' && !product.hidden);
      ui.state.content.heroSlots = [{ id: 'laptops', device: laptop.id, photo: '' }, { id: 'audio', device: '', photo: 'pbanner' }];
      context.api.photoUrl = (id) => id === 'pbanner' ? 'data:image/webp;base64,YmFubmVy' : '';
      ui.state.heroCategory = 'laptops';
      assert(ui.renderHome().includes(`class="hero-product" href="#/p/${laptop.id}`), `${language}: a banner slot shows the device the owner picked`);
      ui.state.heroCategory = 'audio';
      assert(ui.renderHome().includes('data:image/webp;base64,YmFubmVy'), `${language}: a banner slot shows the uploaded picture`);
      assert(validHeroSlots(ui.state.content.heroSlots) && !validHeroSlots([{ id: 'audio', device: 'x', photo: 'pbanner' }]) && !validHeroSlots([{ id: 'tablets', device: 'x' }]), 'banner slots refuse both choices at once and unknown tabs');
      assert.deepEqual(normalizeHeroSlots([{ id: 'audio' }, { id: 'phones', device: 'a' }]), [{ id: 'phones', device: 'a', photo: '' }], 'empty banner slots are dropped');
    } finally { ui.state.content = beforeSlots; context.api.photoUrl = slotPhotoUrl; ui.state.heroCategory = 'phones'; }
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
      assert(tabletTile.includes(`src="${homeArtwork.defaultCategoryImage('tablets')}"`), `${language}: promoting another tablet preserves the independent category picture`);
      for (const category of ['tablets', 'accessories']) {
        ui.state.heroCategory = category;
        checkHome(ui.renderHome());
      }
    } finally {
      ui.state.content = contentBeforeHomeCheck;
      ui.state.heroCategory = 'phones';
    }
    const beforeArtworkCheck = ui.state.content;
    const beforeArtworkPhotoUrl = context.api.photoUrl;
    try {
      ui.state.content = structuredClone(seed);
      const expectedPictures = seed.categories.map((category) => [category.id, homeArtwork.defaultCategoryImage(category.id)]);
      const tilePictures = () => [...ui.renderHome().matchAll(/<a class="category-card" href="#\/shop\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
        .map((match) => [match[1], match[2].match(/<img src="([^"]+)"/)?.[1] || '']);
      for (const [id, path] of expectedPictures) assert(existsSync(new URL('../site/' + path, import.meta.url)), `${language}/${id}: independent category artwork exists`);
      assert.deepEqual(tilePictures(), expectedPictures, `${language}: every default category has its own fixed picture`);
      context.api.photoUrl = (id) => id === 'pdevice' ? 'data:image/webp;base64,ZGV2aWNl' : id === 'pcategory' ? 'data:image/webp;base64,Y2F0ZWdvcnk=' : '';
      for (const product of ui.state.content.products) {
        product.photo = 'pdevice'; product.image = 'assets/devices/iphone-17e.png';
        product.featured = true; product.homePriority = 100000;
      }
      assert.deepEqual(tilePictures(), expectedPictures, `${language}: device photos and home selections do not change category pictures`);
      ui.state.content.products.reverse();
      ui.state.content.products.forEach((product) => { product.hidden = true; });
      assert.deepEqual(tilePictures(), expectedPictures, `${language}: hiding or reordering devices does not change category pictures`);
      const phones = ui.state.content.categories.find((category) => category.id === 'phones');
      phones.image = 'assets/devices/ipad.webp'; phones.photo = 'pcategory';
      assert.equal(tilePictures()[0][1], 'data:image/webp;base64,Y2F0ZWdvcnk=', `${language}: an explicit category upload overrides the default and category image`);
      phones.photo = '';
      assert.equal(tilePictures()[0][1], phones.image, `${language}: a category's saved image overrides only its own tile`);
      phones.image = '';
      assert.deepEqual(tilePictures(), expectedPictures, `${language}: resetting a category picture restores its fixed default`);
      ui.state.content.categories.push({ id: 'gaming', name: { ar: 'ألعاب', en: 'Gaming' } });
      ui.state.content.products[0].category = 'gaming'; ui.state.content.products[0].hidden = false;
      assert.equal(tilePictures().at(-1)[1], '', `${language}: a new category keeps a placeholder until its own image is supplied`);
    } finally { ui.state.content = beforeArtworkCheck; context.api.photoUrl = beforeArtworkPhotoUrl; }
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
    // A sold-out Used device must stay visible beside its available New card.
    // Stock changes may change the selected capacity, never the card condition.
    const beforeMixedStock = { content: ui.state.content, saved: ui.state.saved };
    try {
      ui.state.content = structuredClone(seed);
      const model = ui.state.content.products.find((product) => product.id === 'iphone-17');
      const used = model.variants.find((variant) => conditionGroup(variant.condition) === 'like-new');
      const fresh = model.variants.find((variant) => conditionGroup(variant.condition) === 'new');
      used.batteryHealth = 97; used.batteryCycles = 333;
      const modelCards = () => cards(ui.renderProductResults(ui.filteredProducts())).filter((card) => card.id === model.id);
      const identities = () => modelCards().map((card) => `${card.id}:${card.condition}`);
      resetCatalog(); ui.state.category = 'phones';
      const originalIdentities = identities();
      assert.deepEqual(originalIdentities, ['iphone-17:new', 'iphone-17:used'], `${language}: both condition cards exist before changing stock`);
      used.soldOut = true;
      let rendered = modelCards();
      const usedCard = rendered.find((card) => card.condition === 'used').html;
      const newCard = rendered.find((card) => card.condition === 'new').html;
      assert(usedCard.includes('stock-badge') && usedCard.includes('aria-disabled="true"') && !usedCard.includes('data-add='), `${language}: sold-out Used card stays visible and cannot be bought`);
      assert(usedCard.includes(language === 'ar' ? 'غير متوفر' : 'Out of stock'), `${language}: sold-out Used has a visible translated status`);
      const reading = (value) => new Intl.NumberFormat(language === 'ar' ? 'ar-JO' : 'en').format(value);
      assert(usedCard.includes(`<bdi>${reading(97)}%</bdi>`) && usedCard.includes(`<bdi>${reading(333)}</bdi>`), `${language}: owner's sold-out Used listing retains its 97% health and 333 cycles`);
      assert(newCard.includes('data-add="iphone-17:256-new"') && newCard.includes(pricing.formatJD(655000, language)) && !newCard.includes('stock-badge'), `${language}: New remains available at its own price`);
      assert(!newCard.includes('battery-summary'), `${language}: the New card never borrows Used battery readings`);
      assert.deepEqual(identities(), originalIdentities, `${language}: disabling Used never replaces it with another New card`);
      const home = cards(ui.renderHome()).filter((card) => card.id === model.id);
      assert.deepEqual(home.map((card) => card.condition), ['new', 'used'], `${language}: home offers retain both conditions after Used sells out`);
      assert(home.find((card) => card.condition === 'used').html.includes('stock-badge'), `${language}: home Used offer reflects its stock`);
      const related = cards(ui.renderDetail('iphone-17-pro-max')).filter((card) => card.id === model.id);
      assert.deepEqual(related.map((card) => card.condition), ['new', 'used'], `${language}: related devices also show separate conditions`);
      assert(related.find((card) => card.condition === 'used').html.includes('stock-badge') && related.find((card) => card.condition === 'new').html.includes('data-add="iphone-17:256-new"'), `${language}: related devices keep Used unavailable and New purchasable`);
      ui.state.cond = 'used';
      assert.equal(modelCards().length, 1, `${language}: Used filter retains the sold-out listing`);
      assert(modelCards()[0].html.includes('stock-badge'), `${language}: filtered Used card remains sold out`);
      ui.state.cond = 'new';
      assert.equal(modelCards().length, 1, `${language}: New filter retains only New`);
      assert(modelCards()[0].html.includes('data-add="iphone-17:256-new"'), `${language}: New filter remains purchasable`);
      resetCatalog(); ui.state.route.name = 'saved'; ui.state.saved = new Set([model.id]);
      assert.deepEqual(identities(), originalIdentities, `${language}: favorites preserve both conditions for the saved model`);
      resetCatalog(); ui.state.category = 'phones';
      fresh.soldOut = true;
      assert.deepEqual(identities(), originalIdentities, `${language}: all-sold-out model retains both listing identities`);
      assert(modelCards().every((card) => card.html.includes('stock-badge') && !card.html.includes('data-add=')), `${language}: both condition cards reflect all sold out`);
      used.soldOut = false; used.stockQuantity = 0;
      assert(modelCards().find((card) => card.condition === 'used').html.includes('stock-badge'), `${language}: zero Used quantity also keeps its card unavailable`);
      used.stockQuantity = null;
      assert.deepEqual(identities(), originalIdentities, `${language}: restocking Used preserves the same identities and order`);
      assert(modelCards().find((card) => card.condition === 'used').html.includes('data-add="iphone-17:256-used"'), `${language}: restocking Used restores only its own purchase action`);
      const capacities = ui.state.content.products.find((product) => product.id === 'iphone-17-pro-max');
      capacities.variants.find((variant) => variant.key === '256-like').soldOut = true;
      const capacityCards = cards(ui.renderProductResults(ui.filteredProducts())).filter((card) => card.id === capacities.id);
      assert.equal(capacityCards.length, 2, `${language}: several capacities still produce only one card per condition`);
      assert(capacityCards.find((card) => card.condition === 'used').html.includes(pricing.formatJD(859000, language)), `${language}: Used starts at the cheapest available Used capacity`);
      assert(capacityCards.find((card) => card.condition === 'new').html.includes(pricing.formatJD(839000, language)), `${language}: New starts at its own cheapest available capacity`);
      model.offer = false; used.offerPrice = 500; fresh.soldOut = false;
      resetCatalog(); ui.state.route.name = 'offers';
      assert.deepEqual(modelCards().map((card) => card.condition), ['used'], `${language}: a Used-only offer does not put New in offers`);
      const discountedHome = cards(ui.renderHome()).filter((card) => card.id === model.id);
      assert.deepEqual(discountedHome.map((card) => card.condition), ['used'], `${language}: home offers also respect the condition with the offer price`);
    } finally { ui.state.content = beforeMixedStock.content; ui.state.saved = beforeMixedStock.saved; resetCatalog(); }
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
  console.log(`storefront checks passed: 27 stable condition listings, independent New/Used stock, six home category tiles, four hero choices, six catalog categories, global search/sort, ${productViews} bilingual device views, browser checkout/receipts, and route-specific contact rules`);
}
