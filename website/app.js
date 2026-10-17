import { categories, facebookUrl, instagramUrl, mapsUrl, phoneUrl, products } from './catalog.js?v=2';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const productIds = new Set(products.map(({ id }) => id));
const categoryIds = Object.keys(categories).filter((id) => id !== 'all');
const storage = {
  read(key) { try { return localStorage.getItem(key); } catch { return null; } },
  write(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
};
function readSaved() {
  try {
    const value = JSON.parse(storage.read('trio-saved') || '[]');
    return new Set(Array.isArray(value) ? value.filter((id) => productIds.has(id)) : []);
  } catch { return new Set(); }
}
const state = {
  language: storage.read('trio-language') === 'en' ? 'en' : 'ar',
  saved: readSaved(), heroCategory: 'phones', route: null,
  category: 'all', query: '', brand: 'all', sort: 'featured',
};
const words = {
  ar: {
    title: 'TRIO Mobile | تريو موبايل — خلدا', home: 'الرئيسية', shop: 'الأجهزة', saved: 'المفضلة',
    maintenance: 'الصيانة', tradein: 'التبديل', contact: 'تواصل معنا', switch: 'Switch to English',
    menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة', view: 'شاهد الجهاز', save: 'حفظ الجهاز', unsave: 'إلغاء الحفظ',
    savedNow: 'تم حفظ الجهاز في المفضلة.', unsavedNow: 'تم حذف الجهاز من المفضلة.',
    storageNote: 'تم تحديث المفضلة لهذه الزيارة. تعذّر حفظها على هذا المتصفح.',
    search: 'ابحث عن جهاز', searchPlaceholder: 'اسم الجهاز أو الماركة…', brand: 'الماركة', allBrands: 'كل الماركات',
    sort: 'الترتيب', featured: 'الترتيب المقترح', nameSort: 'حسب الاسم', clear: 'امسح البحث والفلاتر',
    results: (n) => `${new Intl.NumberFormat('ar-JO').format(n)} ${n === 1 ? 'جهاز' : 'أجهزة'}`,
    collection: 'من تشكيلة تريو', shopIntro: 'اكتشف الأجهزة من منشورات تريو، واسألنا عن التفاصيل الحالية.',
    price: 'اسأل عن السعر', currentNote: 'تواصل مع تريو لتأكيد السعر، الحالة، السعة، اللون والتوفر الحالي.',
    photos: 'صور الأجهزة مستخرجة من منشورات تريو الأصلية. التفاصيل الظاهرة تخص المنشور؛ اسأل المحل عن الخيارات الحالية.',
    noResults: 'ما لقينا أجهزة بهالبحث.', noResultsText: 'جرّب كلمة ثانية أو امسح الفلاتر.',
    savedIntro: 'الأجهزة اللي عجبتك، كلها بمكان واحد.', noSaved: 'لسه ما حفظت أجهزة.',
    noSavedText: 'اضغط القلب على أي جهاز ليرجع يظهر هون.', browse: 'تصفّح الأجهزة',
    heroLine1: 'إحنا اللعبة', heroLine2: 'الجديدة.',
    heroText: 'مش بس محل موبايلات.. إحنا اللعبة الجديدة.', services: 'بيع | شراء | تبديل | صيانة احترافية',
    location: 'خلدا، أم السماق، بالقرب من دوار السكر — عمّان', locationShort: 'خلدا · عمّان',
    categories: 'شو عم تدوّر عليه؟', allDevices: 'شوف كل الأجهزة', heroChoose: 'اختار نوع الجهاز',
    featuredTitle: 'مختارات من تريو', source: 'شاهد المنشور الأصلي', sourceLabel: 'من منشور تريو على إنستغرام',
    ask: 'اسألنا على إنستغرام', call: 'اتصل بتريو', related: 'من نفس القسم', details: 'عن الجهاز',
    specTitle: 'كما ورد في منشور تريو', backCategory: 'كل أجهزة القسم', notFound: 'الجهاز مش موجود بهالقائمة.',
    notFoundText: 'ارجع للأجهزة لتشوف تشكيلة تريو.', originalNote: 'الأسعار والعروض داخل المنشور الأصلي تخص وقت النشر؛ تأكد من التفاصيل الحالية مباشرة مع تريو.',
    followTitle: 'تابع الجديد من تريو', follow: 'افتح إنستغرام', aboutTitle: 'مش بس محل موبايلات.',
    aboutText: 'بيع | شراء | تبديل | صيانة احترافية — من نبذة تريو الرسمية على إنستغرام.',
    serviceTitle: 'صيانة احترافية', serviceText: 'الصيانة من خدمات تريو المنشورة. احكي معنا عن نوع جهازك والمشكلة، وتأكد من التفاصيل والتكلفة مباشرة مع المحل.',
    serviceDevice: 'احكيلنا عن جهازك', serviceDeviceText: 'جهّز اسم الموديل ووصف المشكلة عند التواصل مع تريو.',
    serviceContact: 'تواصل مع تريو', serviceContactText: 'اتصل أو ابعت رسالة على إنستغرام لمناقشة الصيانة.',
    serviceVisit: 'زور المحل', serviceVisitText: 'خلدا، أم السماق، بالقرب من دوار السكر.',
    tradeTitle: 'حاب تبدّل جهازك؟', tradeText: 'البيع والشراء والتبديل من خدمات تريو المنشورة. احكي معنا عن موديل جهازك وحالته، واسأل المحل عن التقييم والخيارات الحالية.',
    tradeNote: 'تفاصيل التبديل وتقييم الجهاز يتم تأكيدها مباشرة مع تريو.',
    contactTitle: 'بنستناكم بتريو.', contactIntro: 'تواصل مباشرة مع المحل للسعر والتفاصيل الحالية، أو زورنا في خلدا.',
    phone: 'اتصال', address: 'موقع المحل', map: 'افتح الخريطة', social: 'تابع تريو', instagram: 'إنستغرام', facebook: 'فيسبوك',
    servicesTitle: 'بيع، شراء، تبديل وصيانة', servicesText: 'تعرف على خدمات تريو وتواصل مباشرة مع المحل.',
    repairCta: 'احكي معنا عن الصيانة', tradeCta: 'اسأل عن التبديل', photoUnavailable: 'صورة الجهاز غير متوفرة',
  },
  en: {
    title: 'TRIO Mobile | Khalda, Amman', home: 'Home', shop: 'Devices', saved: 'Favorites',
    maintenance: 'Repair', tradein: 'Trade in', contact: 'Contact', switch: 'التبديل إلى العربية',
    menuOpen: 'Open menu', menuClose: 'Close menu', view: 'View device', save: 'Save device', unsave: 'Unsave device',
    savedNow: 'Device saved to favorites.', unsavedNow: 'Device removed from favorites.',
    storageNote: 'Favorites updated for this visit. This browser could not save them.',
    search: 'Search devices', searchPlaceholder: 'Device name or brand…', brand: 'Brand', allBrands: 'All brands',
    sort: 'Sort', featured: 'Featured', nameSort: 'Name A–Z', clear: 'Clear search and filters',
    results: (n) => `${n} ${n === 1 ? 'device' : 'devices'}`,
    collection: 'THE TRIO COLLECTION', shopIntro: 'Explore devices from Trio’s posts and ask us about current details.',
    price: 'Ask for the price', currentNote: 'Contact Trio to confirm the current price, condition, storage, color and availability.',
    photos: 'Device images are extracted from Trio’s original posts. Pictured details reflect the post; ask the store about current options.',
    noResults: 'No devices match this search.', noResultsText: 'Try another word or clear your filters.',
    savedIntro: 'The devices you like, all in one place.', noSaved: 'No favorites yet.',
    noSavedText: 'Tap the heart on a device to save it here.', browse: 'Browse devices',
    heroLine1: 'A whole', heroLine2: 'new game.', heroText: 'More than a mobile store. A whole new game.',
    services: 'Buy · Sell · Trade in · Professional repair', location: 'Khalda, Umm Al Summaq, near Al Sukkar Circle — Amman',
    locationShort: 'KHALDA · AMMAN', categories: 'What are you looking for?', allDevices: 'View all devices', heroChoose: 'Choose a device type',
    featuredTitle: 'Picks from Trio', source: 'View original post', sourceLabel: 'From Trio’s Instagram post',
    ask: 'Ask us on Instagram', call: 'Call Trio', related: 'More in this category', details: 'About this device',
    specTitle: 'As shown in Trio’s post', backCategory: 'Back to category', notFound: 'This device is not in the collection.',
    notFoundText: 'Browse devices to explore Trio’s collection.', originalNote: 'Prices and offers in the original post refer to the time of posting. Confirm current details directly with Trio.',
    followTitle: 'Catch the latest from Trio', follow: 'Open Instagram', aboutTitle: 'More than a mobile store.',
    aboutText: 'Buy, sell, trade in and professional repair — from Trio’s official Instagram bio.',
    serviceTitle: 'Professional repair', serviceText: 'Repair is one of Trio’s published services. Tell us about your device and the issue, and confirm the details and cost directly with the store.',
    serviceDevice: 'Tell us about your device', serviceDeviceText: 'Have the model name and a description of the issue ready when contacting Trio.',
    serviceContact: 'Talk to Trio', serviceContactText: 'Call or send a message on Instagram to discuss the repair.',
    serviceVisit: 'Visit the store', serviceVisitText: 'Khalda, Umm Al Summaq, near Al Sukkar Circle.',
    tradeTitle: 'Thinking of trading in?', tradeText: 'Buying, selling and trade-ins are among Trio’s published services. Tell us your device model and condition, then ask the store about valuation and current options.',
    tradeNote: 'Trade-in terms and device valuation are confirmed directly with Trio.',
    contactTitle: 'See you at Trio.', contactIntro: 'Contact the store for current prices and details, or visit us in Khalda.',
    phone: 'Call', address: 'Store location', map: 'Open the map', social: 'Follow Trio', instagram: 'Instagram', facebook: 'Facebook',
    servicesTitle: 'Buy, sell, trade in and repair', servicesText: 'Explore Trio’s services and talk directly with the store.',
    repairCta: 'Ask about a repair', tradeCta: 'Ask about trade-in', photoUnavailable: 'Device image unavailable',
  },
};
const t = (key) => words[state.language][key];
const localized = (value) => value[state.language];
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const external = 'target="_blank" rel="noopener noreferrer"';
const routeUrl = (path = '') => `#/${path}`;
const productUrl = (product) => routeUrl(`p/${encodeURIComponent(product.id)}`);
const categoryUrl = (category) => routeUrl(category === 'all' ? 'shop' : `shop/${encodeURIComponent(category)}`);
const arrow = '<span class="direction-arrow" aria-hidden="true">↗</span>';
const heart = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const searchIcon = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';

function image(product, { eager = false, className = '' } = {}) {
  return `<img class="${escape(className)}" src="${escape(product.image)}" alt="${escape(localized(product.name))}" width="800" height="800" loading="${eager ? 'eager' : 'lazy'}" decoding="async" draggable="false" data-device-image>`;
}
function saveButton(product, extraClass = '') {
  const saved = state.saved.has(product.id);
  return `<button class="save-product ${extraClass}" type="button" data-save="${escape(product.id)}" aria-pressed="${saved}" aria-label="${escape(`${t(saved ? 'unsave' : 'save')}: ${localized(product.name)}`)}">${heart}</button>`;
}
function productCard(product) {
  const name = escape(localized(product.name));
  return `<article class="product-card" data-product="${escape(product.id)}"><div class="product-visual"><a class="product-image device-media" href="${productUrl(product)}" aria-label="${escape(`${t('view')}: ${localized(product.name)}`)}">${image(product)}</a>${saveButton(product)}</div><div class="product-body"><p class="product-brand">${escape(product.brand)}</p><h3 class="product-name" dir="auto"><a href="${productUrl(product)}">${name}</a></h3><p class="product-caption">${escape(localized(product.caption))}</p><a class="product-action" href="${productUrl(product)}">${escape(t('view'))}${arrow}</a></div></article>`;
}
function sectionHeading(title, href, label = t('allDevices')) {
  return `<div class="section-heading"><h2>${escape(title)}</h2>${href ? `<a class="text-link" href="${escape(href)}">${escape(label)}${arrow}</a>` : ''}</div>`;
}
function contactActions() {
  return `<div class="contact-actions"><a class="button button-primary" href="${phoneUrl}">${escape(t('call'))}${arrow}</a><a class="button button-outline" href="${instagramUrl}" ${external}>${escape(t('ask'))}${arrow}</a></div>`;
}
function banner() {
  return `<section class="container instagram-banner"><div><p class="eyebrow" dir="ltr">@TRIO_MOBILE.JO</p><h2>${escape(t('followTitle'))}</h2></div><a class="button button-dark" href="${instagramUrl}" ${external}>${escape(t('follow'))}${arrow}</a></section>`;
}
function heroShowcase() {
  const product = products.find((item) => item.category === state.heroCategory) || products[0];
  return `<a class="hero-product" href="${productUrl(product)}" aria-label="${escape(`${t('view')}: ${localized(product.name)}`)}"><div class="device-media hero-device">${image(product, { eager: true })}</div><div class="hero-product-caption"><div><p class="product-brand">${escape(product.brand)}</p><p class="hero-product-name" dir="auto">${escape(localized(product.name))}</p></div><span class="hero-product-link">${escape(t('view'))}${arrow}</span></div></a><div class="hero-tabs" role="group" aria-label="${escape(t('heroChoose'))}">${categoryIds.map((id) => `<button type="button" data-hero-category="${id}" aria-pressed="${id === state.heroCategory}">${escape(localized(categories[id]))}</button>`).join('')}</div>`;
}
function renderHome() {
  const categoryCards = categoryIds.map((id) => {
    const categoryProducts = products.filter((product) => product.category === id);
    const representative = categoryProducts[0];
    return `<a class="category-card" href="${categoryUrl(id)}"><div class="category-picture device-media">${image(representative)}</div><h3>${escape(localized(categories[id]))}</h3><span class="category-count">${escape(t('results')(categoryProducts.length))}</span></a>`;
  }).join('');
  return `<section class="hero"><div class="container hero-grid"><div class="hero-copy"><p class="eyebrow" dir="ltr">TRIO MOBILE · ${escape(t('locationShort'))}</p><h1><span>${escape(t('heroLine1'))}</span><span>${escape(t('heroLine2'))}</span></h1><p class="hero-description">${escape(t('heroText'))}</p><p class="hero-services">${escape(t('services'))}</p><div class="hero-buttons"><a class="button button-dark" href="#/shop">${escape(t('browse'))}${arrow}</a><a class="button button-outline" href="#/contact">${escape(t('contact'))}${arrow}</a></div><p class="hero-location">${escape(t('location'))}</p></div><div id="hero-showcase" class="hero-showcase">${heroShowcase()}</div></div></section><div class="home-content"><section class="container categories-section">${sectionHeading(t('categories'), '#/shop')}<div class="category-grid">${categoryCards}</div></section><section class="container featured-section">${sectionHeading(t('featuredTitle'), '#/shop')}<div class="product-grid">${products.slice(0, 8).map(productCard).join('')}</div></section><section class="container services-section"><div class="service-panel"><div><p class="eyebrow">TRIO MOBILE</p><h2>${escape(t('servicesTitle'))}</h2><p>${escape(t('servicesText'))}</p></div><div class="service-actions"><a class="button button-primary" href="#/maintenance">${escape(t('repairCta'))}${arrow}</a><a class="button button-outline" href="#/trade-in">${escape(t('tradeCta'))}${arrow}</a></div></div></section><section class="container story-section"><div class="story-panel"><a class="story-image" href="https://www.instagram.com/reel/DekDjiFKN3j/" ${external}><img src="assets/instagram/store.jpg" alt="${escape(state.language === 'ar' ? 'داخل محل تريو موبايل، من فيديو تريو' : 'Inside Trio Mobile, from Trio’s reel')}" width="1179" height="1572" loading="lazy"></a><div class="story-copy"><p class="eyebrow">THIS IS TRIO.</p><h2>${escape(t('aboutTitle'))}</h2><p>${escape(t('aboutText'))}</p><p class="story-location">${escape(t('location'))}</p><a class="text-link" href="#/contact">${escape(t('contact'))}${arrow}</a></div></div></section>${banner()}</div>`;
}
function normalize(value) {
  return String(value).toLocaleLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').trim();
}
function baseProducts() {
  return products.filter((product) => (state.route.name !== 'saved' || state.saved.has(product.id)) && (state.category === 'all' || product.category === state.category));
}
function filteredProducts() {
  const query = normalize(state.query);
  const result = baseProducts().filter((product) => {
    if (state.brand !== 'all' && product.brand !== state.brand) return false;
    const haystack = normalize([product.name.ar, product.name.en, product.brand, product.caption.ar, product.caption.en, product.description.ar, product.description.en, product.keywords, categories[product.category].ar, categories[product.category].en].join(' '));
    return !query || query.split(/\s+/).every((word) => haystack.includes(word));
  });
  return state.sort === 'name' ? result.sort((a, b) => localized(a.name).localeCompare(localized(b.name), state.language)) : result;
}
function categoryTabs() {
  const saved = state.route.name === 'saved';
  const available = products.filter((product) => !saved || state.saved.has(product.id));
  return `<nav class="catalog-tabs" aria-label="${escape(t('heroChoose'))}">${['all', ...categoryIds].map((id) => {
    const count = available.filter((product) => id === 'all' || product.category === id).length;
    const href = saved ? routeUrl(`saved${id === 'all' ? '' : `/${id}`}`) : categoryUrl(id);
    return `<a class="filter-button ${id === state.category ? 'active' : ''}" href="${href}"${id === state.category ? ' aria-current="page"' : ''}>${escape(localized(categories[id]))}<span>${escape(new Intl.NumberFormat(state.language === 'ar' ? 'ar-JO' : 'en').format(count))}</span></a>`;
  }).join('')}</nav>`;
}
function renderCatalog() {
  const saved = state.route.name === 'saved';
  const brands = [...new Set(baseProducts().map((product) => product.brand))].sort();
  if (!brands.includes(state.brand)) state.brand = 'all';
  const heading = saved ? t('saved') : state.category === 'all' ? t('shop') : localized(categories[state.category]);
  return `<div class="container page-shell catalog-page"><div class="page-heading"><p class="eyebrow">${escape(t('collection'))}</p><h1>${escape(heading)}</h1><p class="page-intro">${escape(t(saved ? 'savedIntro' : 'shopIntro'))}</p></div>${categoryTabs()}<div class="catalog-controls"><label class="search-field">${searchIcon}<span class="sr-only">${escape(t('search'))}</span><input id="product-search" type="search" value="${escape(state.query)}" placeholder="${escape(t('searchPlaceholder'))}" autocomplete="off"></label><label class="control-field"><span class="sr-only">${escape(t('brand'))}</span><select id="brand-filter"><option value="all">${escape(t('allBrands'))}</option>${brands.map((brand) => `<option value="${escape(brand)}"${state.brand === brand ? ' selected' : ''}>${escape(brand)}</option>`).join('')}</select></label><label class="control-field"><span class="sr-only">${escape(t('sort'))}</span><select id="sort-order"><option value="featured"${state.sort === 'featured' ? ' selected' : ''}>${escape(t('featured'))}</option><option value="name"${state.sort === 'name' ? ' selected' : ''}>${escape(t('nameSort'))}</option></select></label></div><div id="catalog-results"></div><p class="image-disclosure">${escape(t('photos'))}</p></div>`;
}
function updateResults() {
  const results = $('#catalog-results');
  if (!results) return;
  const rows = filteredProducts();
  const hasFilters = Boolean(state.query || state.brand !== 'all' || state.category !== 'all');
  const emptySaved = state.route.name === 'saved' && state.saved.size === 0;
  results.innerHTML = `<div class="results-bar"><p id="result-count" role="status" aria-live="polite">${escape(t('results')(rows.length))}</p>${hasFilters ? `<button type="button" class="text-link" id="reset-filters">${escape(t('clear'))}</button>` : ''}</div>${rows.length ? `<div id="product-grid" class="product-grid">${rows.map(productCard).join('')}</div>` : `<div id="empty-state" class="empty-state"><span class="empty-icon" aria-hidden="true">${emptySaved ? '♡' : '⌕'}</span><h2>${escape(t(emptySaved ? 'noSaved' : 'noResults'))}</h2><p>${escape(t(emptySaved ? 'noSavedText' : 'noResultsText'))}</p><a class="button button-primary" href="#/shop">${escape(t('browse'))}${arrow}</a></div>`}`;
}
function renderDetail(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return `<div class="container page-shell"><div class="empty-state"><h1>${escape(t('notFound'))}</h1><p>${escape(t('notFoundText'))}</p><a class="button button-primary" href="#/shop">${escape(t('browse'))}</a></div></div>`;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  return `<div class="container page-shell product-page"><nav class="breadcrumbs" aria-label="${escape(state.language === 'ar' ? 'مسار التصفح' : 'Breadcrumb')}"><a href="#/">${escape(t('home'))}</a><span aria-hidden="true">/</span><a href="${categoryUrl(product.category)}">${escape(localized(categories[product.category]))}</a><span aria-hidden="true">/</span><span dir="auto">${escape(localized(product.name))}</span></nav><div class="product-detail"><div class="detail-visual"><div class="detail-image device-media">${image(product, { eager: true })}</div><p class="detail-photo-note">${escape(t('sourceLabel'))}</p></div><div class="detail-copy"><p class="product-brand">${escape(product.brand)}</p><h1 dir="auto">${escape(localized(product.name))}</h1><div class="detail-save">${saveButton(product, 'detail-save-button')}<span>${escape(t('saved'))}</span></div><p class="detail-description">${escape(localized(product.description))}</p>${product.specs.length ? `<section class="detail-specs"><h2>${escape(t('specTitle'))}</h2><ul class="spec-list">${product.specs.map((spec) => `<li dir="auto">${escape(localized(spec))}</li>`).join('')}</ul></section>` : ''}<p class="detail-price">${escape(t('price'))}</p><p class="detail-note">${escape(t('currentNote'))}</p><div class="detail-actions">${contactActions()}</div><a class="detail-source text-link" href="${escape(product.source)}" ${external}>${escape(t('source'))}${arrow}</a><p class="original-post-note">${escape(t('originalNote'))}</p></div></div>${related.length ? `<section class="related-section">${sectionHeading(t('related'), categoryUrl(product.category), t('backCategory'))}<div class="product-grid">${related.map(productCard).join('')}</div></section>` : ''}</div>`;
}
function renderService(tradeIn = false) {
  return `<div class="container page-shell service-page"><div class="page-heading"><p class="eyebrow">TRIO MOBILE</p><h1>${escape(t(tradeIn ? 'tradeTitle' : 'serviceTitle'))}</h1><p class="page-intro">${escape(t(tradeIn ? 'tradeText' : 'serviceText'))}</p></div><div class="service-panel"><div><h2>${escape(t('contact'))}</h2><p>${escape(t(tradeIn ? 'tradeNote' : 'currentNote'))}</p></div>${contactActions()}</div>${tradeIn ? '' : `<div class="service-grid">${[['01','serviceDevice','serviceDeviceText'], ['02','serviceContact','serviceContactText'], ['03','serviceVisit','serviceVisitText']].map(([number,title,text]) => `<section class="service-card"><span class="service-number" aria-hidden="true">${number}</span><h2>${escape(t(title))}</h2><p>${escape(t(text))}</p></section>`).join('')}</div>`}<a class="text-link" href="${mapsUrl}" ${external}>${escape(t('map'))}${arrow}</a></div>`;
}
function renderContact() {
  return `<div class="container page-shell contact-page"><div class="page-heading"><p class="eyebrow">KHALDA · AMMAN</p><h1>${escape(t('contactTitle'))}</h1><p class="page-intro">${escape(t('contactIntro'))}</p></div><div class="contact-grid"><section class="contact-card"><span class="contact-symbol" aria-hidden="true">↗</span><h2>${escape(t('phone'))}</h2><a class="contact-phone" href="${phoneUrl}" dir="ltr">0796 999 292</a><p>${escape(t('services'))}</p><a class="button button-primary" href="${phoneUrl}">${escape(t('call'))}${arrow}</a></section><section class="contact-card"><span class="contact-symbol" aria-hidden="true">⌖</span><h2>${escape(t('address'))}</h2><p>${escape(t('location'))}</p><a class="button button-outline" href="${mapsUrl}" ${external}>${escape(t('map'))}${arrow}</a></section><section class="contact-card"><span class="contact-symbol" aria-hidden="true">@</span><h2>${escape(t('social'))}</h2><p dir="ltr">@trio_mobile.jo</p><a class="button button-outline" href="${instagramUrl}" ${external}>${escape(t('instagram'))}${arrow}</a><a class="text-link" href="${facebookUrl}" ${external}>${escape(t('facebook'))}${arrow}</a></section></div></div>`;
}
function readRoute() {
  const hash = location.hash.replace(/^#/, '');
  const legacy = { catalog: 'shop', about: '', categories: '', contact: 'contact' };
  const normalized = Object.hasOwn(legacy, hash) ? legacy[hash] : hash.replace(/^\/+/, '');
  const [path, query = ''] = normalized.split('?');
  const parts = path.split('/').filter(Boolean).map((part) => { try { return decodeURIComponent(part); } catch { return part; } });
  const allowed = ['shop', 'saved', 'p', 'maintenance', 'trade-in', 'contact'];
  const name = allowed.includes(parts[0]) ? parts[0] : 'home';
  return { name, id: parts[1], category: categoryIds.includes(parts[1]) ? parts[1] : 'all', params: new URLSearchParams(query) };
}
function syncFilterUrl() {
  const path = state.route.name === 'saved' ? `saved${state.category === 'all' ? '' : `/${state.category}`}` : state.category === 'all' ? 'shop' : `shop/${state.category}`;
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.brand !== 'all') params.set('brand', state.brand);
  if (state.sort !== 'featured') params.set('sort', state.sort);
  const query = params.toString();
  history.replaceState(null, '', routeUrl(`${path}${query ? `?${query}` : ''}`));
}
function setMenu(open) {
  const menu = $('#mobile-nav');
  const toggle = $('#menu-toggle');
  if (!menu || !toggle) return;
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
}
function updateSavedCounts() {
  $$('[data-saved-count]').forEach((node) => { node.textContent = new Intl.NumberFormat(state.language === 'ar' ? 'ar-JO' : 'en').format(state.saved.size); });
}
function updateSavedButtons() {
  $$('[data-save]').forEach((button) => {
    const product = products.find(({ id }) => id === button.dataset.save);
    if (!product) return;
    const saved = state.saved.has(product.id);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${t(saved ? 'unsave' : 'save')}: ${localized(product.name)}`);
  });
}
function announce(message) {
  let node = $('#app-status');
  if (!node) {
    node = document.createElement('p'); node.id = 'app-status'; node.className = 'sr-only';
    node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); document.body.append(node);
  }
  node.textContent = '';
  requestAnimationFrame(() => { node.textContent = message; });
}
function toggleSaved(id) {
  if (!productIds.has(id)) return;
  const saved = !state.saved.has(id);
  if (saved) state.saved.add(id); else state.saved.delete(id);
  const persisted = storage.write('trio-saved', JSON.stringify([...state.saved]));
  updateSavedCounts(); updateSavedButtons();
  if (state.route.name === 'saved') {
    const previous = $(`[data-save="${id}"]`);
    const index = previous ? $$('[data-save]').indexOf(previous) : 0;
    // Removing a favorite removes its card; return keyboard focus to the next result.
    const tabs = $('.catalog-tabs');
    if (tabs) tabs.outerHTML = categoryTabs();
    updateResults();
    const buttons = $$('[data-save]');
    (buttons[Math.min(index, buttons.length - 1)] || $('#product-search'))?.focus({ preventScroll: true });
  }
  announce(persisted ? t(saved ? 'savedNow' : 'unsavedNow') : t('storageNote'));
}
function translateShell() {
  const language = state.language;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  $$('[data-ar][data-en]').forEach((node) => { node.textContent = node.getAttribute(`data-${language}`); });
  for (const [key, attribute] of [['label', 'aria-label'], ['placeholder', 'placeholder'], ['title', 'title'], ['alt', 'alt']]) {
    $$(`[data-ar-${key}][data-en-${key}]`).forEach((node) => node.setAttribute(attribute, node.getAttribute(`data-${language}-${key}`)));
  }
  const button = $('#language-toggle');
  if (button) { button.textContent = language === 'ar' ? 'English' : 'عربي'; button.lang = language === 'ar' ? 'en' : 'ar'; button.setAttribute('aria-label', t('switch')); }
  $('#header-search')?.setAttribute('placeholder', t('search'));
  $('#header-search')?.setAttribute('aria-label', t('search'));
  $('#menu-toggle')?.setAttribute('aria-label', t($('#menu-toggle').getAttribute('aria-expanded') === 'true' ? 'menuClose' : 'menuOpen'));
  updateSavedCounts();
}
function renderRoute({ focus = false } = {}) {
  state.route = readRoute();
  state.category = state.route.category;
  state.query = state.route.params.get('q') || '';
  state.brand = state.route.params.get('brand') || 'all';
  state.sort = state.route.params.get('sort') === 'name' ? 'name' : 'featured';
  const main = $('#main');
  if (!main) return;
  let html;
  switch (state.route.name) {
    case 'shop': case 'saved': html = renderCatalog(); break;
    case 'p': html = renderDetail(state.route.id); break;
    case 'maintenance': html = renderService(); break;
    case 'trade-in': html = renderService(true); break;
    case 'contact': html = renderContact(); break;
    default: html = renderHome();
  }
  main.innerHTML = html;
  updateResults();
  const navName = state.route.name === 'p' ? 'shop' : state.route.name;
  $$('[data-nav]').forEach((link) => { if (link.dataset.nav === navName) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  const heading = main.querySelector('h1');
  document.title = state.route.name === 'home' ? t('title') : `${heading?.textContent || t('shop')} | TRIO Mobile`;
  const headerSearch = $('#header-search');
  if (headerSearch) headerSearch.value = ['shop', 'saved'].includes(state.route.name) ? state.query : '';
  setMenu(false);
  if (focus) requestAnimationFrame(() => { heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); });
}
function navigate(href) {
  if (location.hash === href) renderRoute({ focus: true }); else location.hash = href;
}

document.addEventListener('click', (event) => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    const main = $('#main'); main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true }); main.scrollIntoView({ block: 'start' });
    return;
  }
  const save = event.target.closest('[data-save]');
  if (save) { toggleSaved(save.dataset.save); return; }
  const hero = event.target.closest('[data-hero-category]');
  if (hero && categoryIds.includes(hero.dataset.heroCategory)) {
    state.heroCategory = hero.dataset.heroCategory;
    $('#hero-showcase').innerHTML = heroShowcase();
    $(`[data-hero-category="${state.heroCategory}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (event.target.closest('#reset-filters')) {
    state.query = ''; state.brand = 'all'; state.sort = 'featured';
    state.category = 'all';
    syncFilterUrl(); renderRoute(); $('#product-search')?.focus({ preventScroll: true });
  }
  if (event.target.closest('#mobile-nav a')) setMenu(false);
});
document.addEventListener('input', (event) => {
  if (event.target.id !== 'product-search') return;
  state.query = event.target.value;
  const headerSearch = $('#header-search'); if (headerSearch) headerSearch.value = state.query;
  syncFilterUrl(); updateResults();
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'brand-filter') state.brand = event.target.value;
  else if (event.target.id === 'sort-order') state.sort = event.target.value === 'name' ? 'name' : 'featured';
  else return;
  syncFilterUrl(); updateResults();
});
$('#header-search-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = $('#header-search')?.value.trim() || '';
  navigate(routeUrl(`shop${query ? `?q=${encodeURIComponent(query)}` : ''}`));
});
$('#language-toggle')?.addEventListener('click', () => {
  state.language = state.language === 'ar' ? 'en' : 'ar';
  storage.write('trio-language', state.language); translateShell(); renderRoute();
});
$('#menu-toggle')?.addEventListener('click', () => setMenu($('#menu-toggle').getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('#menu-toggle')?.getAttribute('aria-expanded') === 'true') { setMenu(false); $('#menu-toggle').focus(); }
});
document.addEventListener('error', (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.hasAttribute('data-device-image')) return;
  const placeholder = document.createElement('span');
  placeholder.className = 'device-fallback'; placeholder.textContent = `${image.alt} — ${t('photoUnavailable')}`;
  image.replaceWith(placeholder);
}, true);
window.addEventListener('hashchange', () => renderRoute({ focus: true }));
window.addEventListener('storage', (event) => {
  if (event.key === 'trio-saved' || event.key === null) {
    state.saved = readSaved(); updateSavedCounts(); updateSavedButtons();
    if (state.route.name === 'saved') {
      const tabs = $('.catalog-tabs');
      if (tabs) tabs.outerHTML = categoryTabs();
      updateResults();
    }
  }
});
document.documentElement.classList.toggle('reduced-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
translateShell();
renderRoute();
