import { categories, instagramUrl, products } from './catalog.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const productIds = new Set(products.map((product) => product.id));
const storage = {
  read(key) { try { return localStorage.getItem(key); } catch { return null; } },
  write(key, value) { try { localStorage.setItem(key, value); } catch { /* Browsing still works without storage. */ } },
};

function readSaved() {
  try {
    const value = JSON.parse(storage.read('trio-saved') || '[]');
    return new Set(Array.isArray(value) ? value.filter((id) => productIds.has(id)) : []);
  } catch { return new Set(); }
}

const state = {
  language: storage.read('trio-language') === 'en' ? 'en' : 'ar',
  category: 'all', query: '', sort: 'featured', savedOnly: false,
  saved: readSaved(), dialogProduct: null,
};

const messages = {
  ar: {
    view: 'اكتشف التفاصيل', save: 'حفظ', unsave: 'إلغاء حفظ',
    inquiry: 'اسألنا على إنستغرام', search: 'ابحث عن جهازك المفضّل…',
    count: (count) => `${new Intl.NumberFormat('ar-JO').format(count)} من المنتجات`,
    empty: 'لم نجد نتائج. جرّب كلمة أخرى أو تصنيفًا مختلفًا.',
    emptySaved: 'لا توجد منتجات محفوظة تطابق بحثك. احفظ ما يعجبك من الكتالوج.',
    note: 'الصور توضيحية. راسلنا لتأكيد الموديل والمواصفات والسعر والتوفّر قبل الطلب.',
    switch: 'Switch to English', menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة',
    close: 'إغلاق التفاصيل', title: 'TRIO Mobile | تكنولوجيا على ذوقك',
  },
  en: {
    view: 'Explore details', save: 'Save', unsave: 'Unsave',
    inquiry: 'Ask us on Instagram', search: 'Find your next favorite…',
    count: (count) => `${count} ${count === 1 ? 'product' : 'products'}`,
    empty: 'No matches yet. Try another search or category.',
    emptySaved: 'No saved products match your search. Save your favorites from the collection.',
    note: 'Images are illustrative. Message us to confirm the model, specifications, price and availability before ordering.',
    switch: 'التبديل إلى العربية', menuOpen: 'Open menu', menuClose: 'Close menu',
    close: 'Close details', title: 'TRIO Mobile | Your tech. Your way.',
  },
};

const t = (key) => messages[state.language][key];
const localized = (value) => value[state.language];
const brandName = (product) => state.language === 'ar' && product.brandAr ? product.brandAr : product.brand;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function heartIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '20');
  icon.setAttribute('height', '20');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '1.6');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z');
  icon.append(path);
  return icon;
}

function setArtwork(node, product) {
  node.style.backgroundImage = `url("${product.image}")`;
  node.style.setProperty('--art-x', product.x);
  node.style.setProperty('--art-y', product.y);
}

function updateSavedButton(button, product) {
  const saved = state.saved.has(product.id);
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', `${t(saved ? 'unsave' : 'save')}: ${localized(product.name)}`);
  button.title = button.getAttribute('aria-label');
}

function toggleSaved(product, button) {
  state.saved.has(product.id) ? state.saved.delete(product.id) : state.saved.add(product.id);
  storage.write('trio-saved', JSON.stringify([...state.saved]));
  updateSavedCounts();
  if (state.savedOnly) {
    renderProducts();
    $('#saved-only')?.focus();
  } else {
    updateSavedButton(button, product);
  }
}

function createCard(product) {
  const card = element('article', 'product-card');
  card.dataset.product = product.id;
  const visual = element('div', 'product-visual');
  const artwork = element('button', 'product-art');
  artwork.type = 'button';
  artwork.setAttribute('aria-label', `${t('view')}: ${localized(product.name)}`);
  setArtwork(artwork, product);
  artwork.addEventListener('click', () => openProduct(product));

  const save = element('button', 'save-product');
  save.type = 'button';
  save.dataset.save = product.id;
  updateSavedButton(save, product);
  save.append(heartIcon());
  save.addEventListener('click', () => toggleSaved(product, save));
  visual.append(artwork, save);

  const body = element('div', 'product-body');
  const brand = element('span', 'product-brand', brandName(product));
  const name = element('h3', 'product-name', localized(product.name));
  name.dir = 'auto';
  const caption = element('p', 'product-caption', localized(product.caption));
  const action = element('button', 'product-action', t('view'));
  action.type = 'button';
  action.setAttribute('aria-label', `${t('view')}: ${localized(product.name)}`);
  action.addEventListener('click', () => openProduct(product));
  body.append(brand, name, caption, action);
  card.append(visual, body);
  return card;
}

function normalize(value) {
  return value.toLocaleLowerCase().normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').trim();
}

function visibleProducts() {
  const query = normalize(state.query);
  const filtered = products.filter((product) => {
    const matchesCategory = state.category === 'all' || product.category === state.category;
    const matchesSaved = !state.savedOnly || state.saved.has(product.id);
    const text = [product.name.ar, product.name.en, product.brand, product.caption.ar,
      product.caption.en, product.keywords, categories[product.category].ar,
      categories[product.category].en].join(' ');
    const matchesQuery = !query || query.split(/\s+/).every((word) => normalize(text).includes(word));
    return matchesCategory && matchesSaved && matchesQuery;
  });
  if (state.sort === 'name') filtered.sort((a, b) => localized(a.name).localeCompare(localized(b.name), state.language));
  return filtered;
}

function renderProducts() {
  const grid = $('#product-grid');
  if (!grid) return;
  const visible = visibleProducts();
  grid.replaceChildren(...visible.map(createCard));
  const count = $('#result-count');
  if (count) count.textContent = t('count')(visible.length);
  const empty = $('#empty-state');
  if (empty) {
    empty.hidden = visible.length > 0;
    const text = empty.querySelector('p') || empty;
    text.textContent = t(state.savedOnly ? 'emptySaved' : 'empty');
  }
  $$('[data-filter]').forEach((button) => {
    const selected = button.dataset.filter === state.category;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('active', selected);
  });
}

function updateSavedCounts() {
  $$('[data-saved-count]').forEach((node) => {
    node.textContent = new Intl.NumberFormat(state.language === 'ar' ? 'ar-JO' : 'en').format(state.saved.size);
  });
}

function renderDialog(product) {
  const content = $('#dialog-content');
  if (!content) return;
  const wrapper = element('div', 'dialog-product');
  const artwork = element('div', 'product-art');
  artwork.setAttribute('role', 'img');
  artwork.setAttribute('aria-label', localized(product.name));
  setArtwork(artwork, product);
  const details = element('div', 'dialog-details');
  const brand = element('p', 'product-brand', brandName(product));
  const title = element('h2', '', localized(product.name));
  title.id = 'dialog-product-title';
  title.dir = 'auto';
  const description = element('p', 'dialog-description', localized(product.description));
  const note = element('p', 'dialog-note', t('note'));
  const link = element('a', 'button button-primary', t('inquiry'));
  link.href = instagramUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${t('inquiry')}: ${localized(product.name)}`);
  details.append(brand, title, description, note, link);
  wrapper.append(artwork, details);
  content.replaceChildren(wrapper);
}

function openProduct(product) {
  const dialog = $('#product-dialog');
  if (!dialog) return;
  state.dialogProduct = product;
  renderDialog(product);
  dialog.setAttribute('aria-labelledby', 'dialog-product-title');
  if (!dialog.open) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  document.body.classList.add('dialog-open');
}

function closeDialog() {
  const dialog = $('#product-dialog');
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  document.body.classList.remove('dialog-open');
  state.dialogProduct = null;
}

function setMenu(open) {
  const menu = $('#mobile-nav');
  const toggle = $('#menu-toggle');
  if (!menu || !toggle) return;
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
}

function applyLanguage() {
  const language = state.language;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.title = t('title');
  $$('[data-ar][data-en]').forEach((node) => { node.textContent = node.dataset[language]; });
  const attributes = [['label', 'aria-label'], ['placeholder', 'placeholder'], ['title', 'title']];
  attributes.forEach(([key, attribute]) => {
    $$(`[data-ar-${key}][data-en-${key}]`).forEach((node) => {
      node.setAttribute(attribute, node.getAttribute(`data-${language}-${key}`));
    });
  });
  const toggle = $('#language-toggle');
  if (toggle) {
    toggle.replaceChildren(document.createTextNode(language === 'ar' ? 'English' : 'عربي'), element('span', 'symbol-arrow', '↗'));
    toggle.lang = language === 'ar' ? 'en' : 'ar';
    toggle.setAttribute('aria-label', t('switch'));
  }
  const search = $('#product-search');
  if (search) search.placeholder = t('search');
  $$('[data-close-dialog]').forEach((node) => { node.setAttribute('aria-label', t('close')); });
  const menuToggle = $('#menu-toggle');
  if (menuToggle) menuToggle.setAttribute('aria-label', t(menuToggle.getAttribute('aria-expanded') === 'true' ? 'menuClose' : 'menuOpen'));
  updateSavedCounts();
  renderProducts();
  if (state.dialogProduct) renderDialog(state.dialogProduct);
}

$$('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!Object.hasOwn(categories, button.dataset.filter)) return;
    state.category = button.dataset.filter;
    renderProducts();
  });
});

$$('[data-category-link]').forEach((link) => {
  link.addEventListener('click', () => {
    const category = link.dataset.categoryLink;
    if (!Object.hasOwn(categories, category)) return;
    state.category = category;
    state.query = '';
    state.savedOnly = false;
    const search = $('#product-search');
    if (search) search.value = '';
    $('#saved-only')?.setAttribute('aria-pressed', 'false');
    renderProducts();
  });
});

$('#product-search')?.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderProducts();
});

$('#sort-order')?.addEventListener('change', (event) => {
  state.sort = event.target.value === 'name' ? 'name' : 'featured';
  renderProducts();
});

const savedOnly = $('#saved-only');
if (savedOnly) {
  const isCheckbox = savedOnly.matches('input[type="checkbox"]');
  savedOnly.addEventListener(isCheckbox ? 'change' : 'click', () => {
    state.savedOnly = isCheckbox ? savedOnly.checked : !state.savedOnly;
    if (!isCheckbox) savedOnly.setAttribute('aria-pressed', String(state.savedOnly));
    savedOnly.classList.toggle('is-active', state.savedOnly);
    renderProducts();
  });
}

$('#language-toggle')?.addEventListener('click', () => {
  state.language = state.language === 'ar' ? 'en' : 'ar';
  storage.write('trio-language', state.language);
  applyLanguage();
});

$('#menu-toggle')?.addEventListener('click', () => {
  setMenu($('#menu-toggle').getAttribute('aria-expanded') !== 'true');
});

$$('#mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('#menu-toggle')?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    $('#menu-toggle').focus();
  }
});

$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', closeDialog));
const dialog = $('#product-dialog');
dialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  state.dialogProduct = null;
});
dialog?.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
});

// CSS owns motion; expose the preference for any future optional interactions.
document.documentElement.classList.toggle('reduced-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
applyLanguage();
