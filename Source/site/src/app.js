import deviceSpecifications from '../../shared/device-specs.js';
import { api, local, MODE, ApiError } from './store.js';
import { renderAccount, loadAccount, bindAccount, accountLabel, customerProfile } from './account.js';
import { priceLines, fromPrice, formatJD, toFils, variantId, splitVariantId, visibleProducts, normaliseMobile, MAX_QTY, MAX_LINES, validPrice } from '../../shared/pricing.js';
import { conditions, conditionShort, notes as noteLabels, warranties, governorates } from '../../shared/labels.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  language: local.read('trio-language') === 'en' ? 'en' : 'ar',
  content: null, source: 'seed', saved: new Set(), bag: [], route: { name: 'home' },
  category: 'all', query: '', brand: 'all', sort: 'featured', cond: 'all',
  heroCategory: 'phones', selected: {}, checkoutToken: '', checkoutSignature: '', checkoutStarted: 0, lastOrder: null, busy: false,
};

const words = {
  ar: {
    title: 'TRIO Mobile | تريو موبايل', home: 'الرئيسية', shop: 'الأجهزة', offers: 'العروض', saved: 'المفضلة', bag: 'السلة',
    maintenance: 'الصيانة', tradein: 'التبديل', contact: 'زورونا', switchLang: 'Switch to English', menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة',
    heroLine1: 'إحنا اللعبة', heroLine2: 'الجديدة.', heroOffers: 'شوف عروض تريو', browse: 'تصفّح الأجهزة', heroChoose: 'اختار نوع الجهاز',
    from: 'من', view: 'شوف الجهاز', choose: 'اختار السعة', add: 'أضف للسلة', added: 'انضاف للسلة', soldOut: 'نفد', unavailable: 'غير متوفر حالياً',
    save: 'حفظ الجهاز', unsave: 'إلغاء الحفظ', savedNow: 'انحفظ بالمفضلة.', unsavedNow: 'انشال من المفضلة.',
    categories: 'شو عم تدوّر عليه؟', allDevices: 'شوف كل الأجهزة', featuredTitle: 'مختارات من تريو', offersAll: 'كل العروض',
    count: (n) => n === 2 ? 'جهازين' : `${n} ${n === 1 ? 'جهاز' : n <= 10 ? 'أجهزة' : 'جهاز'}`,
    trust: [['اعثر على جهازك', 'ابحث حسب الماركة ونوع الجهاز'], ['قارن الخيارات', 'السعة والحالة في مكان واحد'], ['احفظ مفضلتك', 'ارجع للأجهزة اللي عجبتك'], ['بيع · شراء · تبديل', 'وصيانة احترافية بالمحل']],
    servicesTitle: 'بيع، شراء، تبديل وصيانة', servicesText: 'جهازك القديم ممكن يكون بداية جهازك الجديد. احكيلنا عنه، أو جيبه للصيانة.', repairCta: 'احكي معنا عن الصيانة', tradeCta: 'اسأل عن التبديل',
    aboutTitle: 'مش بس محل موبايلات.', aboutText: 'بيع وشراء وتبديل الأجهزة، وصيانة احترافية في خلدا، عمّان.', followTitle: 'تابع الجديد من تريو', follow: 'افتح إنستغرام',
    collection: 'تشكيلة تريو', shopIntro: 'تصفّح الأجهزة وقارن المواصفات والسعات والحالات.', offersTitle: 'عروض تريو', offersIntro: 'اكتشف العروض واختر الجهاز اللي بناسبك.',
    search: 'ابحث عن جهاز', searchPlaceholder: 'اسم الجهاز أو الماركة…', brand: 'الماركة', allBrands: 'كل الماركات', sort: 'الترتيب', featured: 'الترتيب المقترح',
    priceLow: 'السعر: من الأقل', priceHigh: 'السعر: من الأعلى', nameSort: 'حسب الاسم', condAll: 'كل الحالات', condNew: 'جديد', condUsed: 'مستعمل',
    filters: 'فلترة وترتيب', clear: 'امسح البحث والفلاتر', noResults: 'ما لقينا أجهزة بهالبحث.', noResultsText: 'جرّب كلمة ثانية أو امسح الفلاتر.',
    savedIntro: 'الأجهزة اللي عجبتك، كلها بمكان واحد.', noSaved: 'لسه ما حفظت أجهزة.', noSavedText: 'اضغط القلب على أي جهاز ليرجع يظهر هون.',
    details: 'المواصفات التقنية', configuration: 'التهيئة', condition: 'الحالة', warranty: 'الكفالة', options: 'الخيارات', related: 'من نفس القسم', backCategory: 'كل أجهزة القسم',
    askWhatsapp: 'اسأل على واتساب', call: 'اتصل بتريو', ask: 'اسألنا على إنستغرام', source: 'شوف المنشور على إنستغرام', imageCard: 'صورة الجهاز قريباً',
    notFound: 'الجهاز مش موجود بهالقائمة.', notFoundText: 'ارجع للأجهزة لتشوف تشكيلة تريو.',
    bagTitle: 'السلة', bagEmpty: 'السلة فاضية.', bagEmptyText: 'اختار جهاز وأضفه للسلة.', remove: 'شيل', qty: 'العدد', subtotal: 'المجموع', delivery: 'التوصيل', deliveryValue: 'نأكده معك بالاتصال',
    total: 'المجموع', bagFull: 'السلة فيها أكبر عدد أجهزة لطلب واحد.', checkout: 'أكمل الطلب', checkoutLive: 'أكمل الطلب', keepShopping: 'كمّل تسوّق', bagFixed: 'في جهاز بالسلة صار غير متوفر وانشال.',
    checkoutTitle: 'تفاصيل الطلب', checkoutIntro: 'أكمل بيانات التواصل والاستلام.', name: 'الاسم', mobile: 'رقم الموبايل', mobileHint: 'مثال: 0791234567', fulfilment: 'الاستلام', deliveryOpt: 'توصيل', pickupOpt: 'استلام من المحل',
    governorate: 'المحافظة', address: 'العنوان', addressHint: 'المنطقة، الشارع، أقرب معلم', notes: 'ملاحظات (اختياري)', placeOrder: 'تأكيد الطلب', sending: 'عم نرسل…',
    payCash: 'راجع الأجهزة والخيارات اللي اخترتها قبل إكمال الطلب.', privacy: 'نستخدم اسمك ورقمك وعنوانك بس لتأكيد الطلب وتوصيله.', ordersOff: 'لإكمال تفاصيل طلبك، انتقل لصفحة زورونا.',
    sendWhatsapp: 'ابعت الطلب على واتساب', doneTitle: 'تم استلام طلبك', doneText: 'رقم طلبك', doneNext: 'تم تسجيل طلبك لدى تريو. سيتواصل معك المحل لتأكيد الأجهزة وتفاصيل الاستلام.', receiptMissing: 'لا يوجد تأكيد طلب محفوظ هنا.', receiptMissingText: 'يظهر التأكيد بعد إرسال الطلب بنجاح. ارجع للسلة لإكمال طلبك.',
    demoNote: 'نسخة عرض: الطلب انحفظ على هالمتصفح بس، وما انبعت للمحل.',
    demoDone: 'تم تأكيد الطلب التجريبي', demoNext: 'طلبك التجريبي محفوظ ويظهر في لوحة الطلبات على هذا المتصفح. لم يُرسل للمحل ولم يتم تحصيل أي دفعة.', myOrders: 'شوف طلباتي', signInCheckout: 'سجّل الدخول لحفظ الطلب في حسابك، أو كمّل كضيف.', demoDelivery: 'لا تُحصّل في العرض التجريبي', demoPrivacy: 'استخدم بيانات تجريبية؛ تُحفظ على هذا المتصفح فقط.',
    errors: { 'bad-name': 'اكتب اسمك (حرفين على الأقل).', 'bad-mobile': 'اكتب رقم موبايل أردني صحيح، مثل 0791234567.', 'bad-governorate': 'اختار المحافظة.', 'bad-address': 'اكتب العنوان للتوصيل.',
      'price-changed': 'تغيّر سعر جهاز بالسلة. راجع السلة وجرّب مرة ثانية.', 'sold-out': 'جهاز بالسلة نفد. راجع السلة.', unknown: 'جهاز بالسلة ما عاد موجود. راجع السلة.', 'orders-off': 'الطلب من الموقع متوقف حالياً.',
      'rate-limited': 'طلبات كثيرة من نفس الجهاز. جرّب بعد شوي أو ابعت على واتساب.', network: 'ما قدرنا نوصل للموقع. تأكد من الإنترنت وجرّب مرة ثانية.', 'too-fast': 'خذ ثانية وراجع البيانات، وبعدين أرسل.', generic: 'صار خطأ. جرّب مرة ثانية أو ابعت على واتساب.' },
    serviceTitle: 'صيانة احترافية', serviceText: 'الصيانة من خدمات تريو. احكيلنا عن جهازك والمشكلة، ونأكد معك التفاصيل والتكلفة.',
    serviceSteps: [['احكيلنا عن جهازك', 'جهّز اسم الموديل ووصف المشكلة.'], ['تواصل مع تريو', 'اتصل أو ابعت رسالة على إنستغرام.'], ['زور المحل', 'احكي مع المحل عن الفحص والصيانة.']],
    tradeTitle: 'حاب تبدّل جهازك؟', tradeText: 'البيع والشراء والتبديل من خدمات تريو. احكيلنا عن موديل جهازك وحالته، ونعطيك التقييم والخيارات.',
    tradeNote: 'تقييم الجهاز وتفاصيل التبديل نأكدها معك مباشرة.',
    contactTitle: 'بنستناكم بتريو.', contactIntro: 'للأسعار والتفاصيل اتصل أو ابعت رسالة، أو زورنا بالمحل.', phone: 'اتصال', storeLocation: 'موقع المحل', map: 'افتح الخريطة', social: 'تابع تريو', whatsapp: 'واتساب',
    postedOn: 'سعر منشور بتاريخ', waHello: 'مرحبا تريو،', waAsk: 'بسأل عن', waOrder: 'بدي أطلب:', waTotal: 'المجموع', waNumber: 'رقم الطلب', photoNote: 'صور الأجهزة مأخوذة من منشورات تريو.',
  },
  en: {
    title: 'TRIO Mobile | Amman', home: 'Home', shop: 'Devices', offers: 'Offers', saved: 'Saved', bag: 'Bag',
    maintenance: 'Repair', tradein: 'Trade in', contact: 'Visit us', switchLang: 'التبديل إلى العربية', menuOpen: 'Open menu', menuClose: 'Close menu',
    heroLine1: 'A whole', heroLine2: 'new game.', heroOffers: 'Explore Trio offers', browse: 'Browse devices', heroChoose: 'Choose a device type',
    from: 'from', view: 'View device', choose: 'Choose option', add: 'Add to bag', added: 'Added to bag', soldOut: 'Sold out', unavailable: 'Not available right now',
    save: 'Save device', unsave: 'Remove from saved', savedNow: 'Saved.', unsavedNow: 'Removed from saved.',
    categories: 'What are you looking for?', allDevices: 'View all devices', featuredTitle: 'Picks from Trio', offersAll: 'All offers',
    count: (n) => `${n} ${n === 1 ? 'device' : 'devices'}`,
    trust: [['Find your device', 'Search by brand and category'], ['Compare options', 'Storage and condition together'], ['Save your favorites', 'Keep the devices you like'], ['Buy · Sell · Trade in', 'And professional repair in store']],
    servicesTitle: 'Buy, sell, trade in and repair', servicesText: 'Your old device can be the start of your new one. Tell us about it, or bring it in for repair.', repairCta: 'Ask about a repair', tradeCta: 'Ask about trade-in',
    aboutTitle: 'More than a mobile store.', aboutText: 'Buy, sell and trade in devices, with professional repair in Khalda, Amman.', followTitle: 'Catch the latest from Trio', follow: 'Open Instagram',
    collection: 'THE TRIO COLLECTION', shopIntro: 'Explore devices and compare specifications, storage and condition.', offersTitle: 'Trio offers', offersIntro: 'Explore offers and find your next device.',
    search: 'Search devices', searchPlaceholder: 'Device name or brand…', brand: 'Brand', allBrands: 'All brands', sort: 'Sort', featured: 'Featured',
    priceLow: 'Price: low to high', priceHigh: 'Price: high to low', nameSort: 'Name A–Z', condAll: 'Any condition', condNew: 'New', condUsed: 'Used',
    filters: 'Filters', clear: 'Clear search and filters', noResults: 'No devices match this search.', noResultsText: 'Try another word or clear the filters.',
    savedIntro: 'The devices you like, all in one place.', noSaved: 'Nothing saved yet.', noSavedText: 'Tap the heart on a device to save it here.',
    details: 'Technical specifications', configuration: 'Configuration', condition: 'Condition', warranty: 'Warranty', options: 'Options', related: 'More in this category', backCategory: 'Back to category',
    askWhatsapp: 'Ask on WhatsApp', call: 'Call Trio', ask: 'Ask us on Instagram', source: 'See the post on Instagram', imageCard: 'Photo coming soon',
    notFound: 'This device is not in the collection.', notFoundText: 'Browse devices to explore Trio’s collection.',
    bagTitle: 'Your bag', bagEmpty: 'Your bag is empty.', bagEmptyText: 'Pick a device and add it to your bag.', remove: 'Remove', qty: 'Qty', subtotal: 'Subtotal', delivery: 'Delivery', deliveryValue: 'Confirmed by phone',
    total: 'Total', bagFull: 'Your bag holds the most devices one order can take.', checkout: 'Checkout', checkoutLive: 'Checkout', keepShopping: 'Keep shopping', bagFixed: 'A device in your bag is no longer available and was removed.',
    checkoutTitle: 'Order details', checkoutIntro: 'Complete your contact and collection details.', name: 'Name', mobile: 'Mobile number', mobileHint: 'e.g. 0791234567', fulfilment: 'Delivery or pickup', deliveryOpt: 'Delivery', pickupOpt: 'Pick up in store',
    governorate: 'Governorate', address: 'Address', addressHint: 'Area, street, nearest landmark', notes: 'Notes (optional)', placeOrder: 'Place order', sending: 'Sending…',
    payCash: 'Review your selected devices and configurations before continuing.', privacy: 'We use your name, number and address only to confirm and deliver your order.', ordersOff: 'Continue to Visit us to complete your request.',
    sendWhatsapp: 'Send order on WhatsApp', doneTitle: 'Order received', doneText: 'Your order number', doneNext: 'Your order has been recorded with Trio. The store will contact you to confirm the devices and collection details.', receiptMissing: 'No saved order confirmation here.', receiptMissingText: 'A confirmation appears after your order is sent successfully. Return to your bag to complete your order.',
    demoNote: 'Demo copy: the order was saved in this browser only and not sent to the store.',
    demoDone: 'Demo order confirmed', demoNext: 'Your demo order is saved in the Orders panel on this browser. It was not sent to the store and no payment was collected.', myOrders: 'View my orders', signInCheckout: 'Sign in to save this order to your account, or continue as a guest.', demoDelivery: 'Not charged in this demo', demoPrivacy: 'Use sample details; they are saved on this browser only.',
    errors: { 'bad-name': 'Enter your name (at least 2 letters).', 'bad-mobile': 'Enter a valid Jordanian mobile number, like 0791234567.', 'bad-governorate': 'Choose a governorate.', 'bad-address': 'Enter the delivery address.',
      'price-changed': 'A price in your bag changed. Check your bag and try again.', 'sold-out': 'A device in your bag sold out. Check your bag.', unknown: 'A device in your bag is no longer listed. Check your bag.', 'orders-off': 'Ordering on the site is paused.',
      'rate-limited': 'Too many orders from this device. Try again later or use WhatsApp.', network: 'We could not reach the site. Check your connection and try again.', 'too-fast': 'Take a second to check your details, then send.', generic: 'Something went wrong. Try again or use WhatsApp.' },
    serviceTitle: 'Professional repair', serviceText: 'Repair is one of Trio’s services. Tell us about your device and the issue, and we confirm the details and cost with you.',
    serviceSteps: [['Tell us about your device', 'Have the model name and a description of the issue ready.'], ['Talk to Trio', 'Call, or message us on Instagram.'], ['Visit the store', 'Discuss inspection and repair with the store.']],
    tradeTitle: 'Thinking of trading in?', tradeText: 'Buying, selling and trade-ins are Trio services. Tell us your device model and condition, and we give you a valuation and options.',
    tradeNote: 'Valuation and trade-in terms are confirmed with you directly.',
    contactTitle: 'See you at Trio.', contactIntro: 'For prices and details, call or message us, or visit the store.', phone: 'Call', storeLocation: 'Store location', map: 'Open the map', social: 'Follow Trio', whatsapp: 'WhatsApp',
    postedOn: 'Price posted on', waHello: 'Hello Trio,', waAsk: 'I’m asking about', waOrder: 'I’d like to order:', waTotal: 'Total', waNumber: 'Order number', photoNote: 'Device photos are taken from Trio’s posts.',
  },
};

Object.assign(words.ar.errors, { 'storage-full': 'مساحة المتصفح غير كافية لحفظ الطلب.', 'storage-unavailable': 'تخزين المتصفح غير متاح. فعّله وحاول مجدداً.', 'storage-invalid': 'تعذّر قراءة بيانات العرض المحفوظة في هذا المتصفح.', 'orders-full': 'وصل سجل العرض إلى الحد الأقصى من الطلبات.', 'token-conflict': 'تغيّر الحساب أو تفاصيل الطلب. راجع البيانات وحاول مجدداً.', 'signed-out': 'تغيّرت جلسة الحساب. راجع بياناتك وحاول مجدداً.', generic: 'تعذّر حفظ الطلب. حاول مجدداً.' });
Object.assign(words.en.errors, { 'storage-full': 'Your browser does not have enough space to save the order.', 'storage-unavailable': 'Browser storage is unavailable. Enable it and try again.', 'storage-invalid': 'Could not read the saved demo data in this browser.', 'orders-full': 'The demo order history is full.', 'token-conflict': 'Your account or order details changed. Review checkout and try again.', 'signed-out': 'Your account session changed. Review checkout and try again.', generic: 'Could not save your order. Please try again.' });
const t = (key) => words[state.language][key];
const L = (value) => (value && typeof value === 'object' ? value[state.language] || value.ar || value.en || '' : String(value || ''));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = 'target="_blank" rel="noopener noreferrer"';
const arrow = '<span class="direction-arrow" aria-hidden="true">↗</span>';
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
const money = (fils) => formatJD(fils, state.language);
const num = (n) => new Intl.NumberFormat(state.language === 'ar' ? 'ar-JO' : 'en').format(n);
const S = () => state.content.settings;
const ordersEnabled = () => S().ordersOn === true;
const visitorKey = (name) => `trio-${state.source === 'preview' ? 'preview-' : ''}${name}`;
const offersHeading = () => L(S().offersTitle) || t('offersTitle');
const products = () => visibleProducts(state.content);
const categoryIds = () => state.content.categories.map((c) => c.id).filter((id) => products().some((p) => p.category === id));
const homeCategoryOrder = ['phones', 'laptops', 'watches', 'audio'];
const homeCategoryIds = () => homeCategoryOrder.filter((id) => categoryIds().includes(id));
const homeProducts = () => products().filter((product) => homeCategoryOrder.includes(product.category));
const instagramAllowed = (routeName) => ['maintenance', 'contact'].includes(routeName);
const specification = (product) => product.technical || deviceSpecifications[product.id];
const categoryName = (id) => L((state.content.categories.find((c) => c.id === id) || {}).name) || id;
const legacyIds = { 'apple-watch-s11': 'apple-watch-s11', 'airpods-max': 'airpods-max-2', 'macbook-pro': 'macbook-pro-16-m5-pro', 'macbook-air': 'macbook-air-15-m5', 'ipad-a16': 'ipad-a16' };
const productUrl = (product) => `#/p/${encodeURIComponent(product.id)}`;
const categoryUrl = (id) => (id === 'all' ? '#/shop' : `#/shop/${encodeURIComponent(id)}`);
const phoneHref = () => { const phone = normaliseMobile(S().phone); return phone ? `tel:+962${phone.slice(1)}` : '#/contact'; };
const phoneText = () => (normaliseMobile(S().phone) || String(S().phone || '')).replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
const waHref = (text) => S().whatsapp ? `https://wa.me/${String(S().whatsapp).replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '#/contact';

function availableVariants(product) { return (product.variants || []).filter((v) => !v.soldOut && validPrice(v.price)); }
function defaultVariant(product) {
  const chosen = state.selected[product.id] && product.variants.find((v) => v.key === state.selected[product.id]);
  if (chosen) return chosen;
  const avail = availableVariants(product);
  return (avail.length ? avail : product.variants).slice().sort((a, b) => toFils(a.price) - toFils(b.price))[0];
}
function variantLabel(variant, { short = false } = {}) {
  const cond = L((short ? conditionShort : conditions)[variant.condition || '']);
  return [variant.storage, cond].filter(Boolean).join(' · ');
}

function imageSrc(product) {
  if (product.photo) { const url = api.photoUrl(product.photo); if (url) return url; }
  return product.image || '';
}
function media(product, { eager = false } = {}) {
  const src = imageSrc(product);
  const name = esc(L(product.name));
  if (!src) return `<span class="name-card"><span class="name-card-brand" dir="ltr">${esc(product.brand)}</span><span class="name-card-name" dir="ltr">${name}</span><span class="name-card-note">${esc(t('imageCard'))}</span></span>`;
  return `<img src="${esc(src)}" alt="${name}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" draggable="false" data-device-image>`;
}
function saveButton(product, extra = '') {
  const saved = state.saved.has(product.id);
  return `<button class="save-product ${extra}" type="button" data-save="${esc(product.id)}" aria-pressed="${saved}" aria-label="${esc(`${t(saved ? 'unsave' : 'save')}: ${L(product.name)}`)}">${icon('heart')}</button>`;
}
function priceTag(product) {
  const low = fromPrice(product);
  if (low === null) return `<span class="price-tag is-out">${esc(t('soldOut'))}</span>`;
  const several = new Set(availableVariants(product).map((v) => toFils(v.price))).size > 1;
  return `<span class="price-tag">${several ? `<small>${esc(t('from'))}</small> ` : ''}<bdi>${esc(money(low))}</bdi></span>`;
}
function conditionChips(product) {
  const set = [...new Set(availableVariants(product).map((v) => v.condition).filter(Boolean))];
  return set.length ? `<span class="cond-chips">${set.map((c) => `<span class="cond-chip cond-${esc(c)}">${esc(L(conditionShort[c]))}</span>`).join('')}</span>` : '';
}
function cardAction(product) {
  const avail = availableVariants(product);
  if (!avail.length) return `<span class="card-button is-disabled" aria-disabled="true">${esc(t('soldOut'))}</span>`;
  if (product.variants.length === 1) return `<button class="card-button" type="button" data-add="${esc(variantId(product.id, avail[0].key))}">${icon('bag')}<span>${esc(t('add'))}</span></button>`;
  return `<a class="card-button is-outline" href="${productUrl(product)}">${esc(t('choose'))}</a>`;
}
function productCard(product) {
  const name = esc(L(product.name));
  return `<article class="product-card" data-product="${esc(product.id)}"><div class="product-visual"><a class="product-image device-media" href="${productUrl(product)}" aria-label="${esc(`${t('view')}: ${L(product.name)}`)}">${media(product)}</a>${saveButton(product)}${product.offer ? `<span class="offer-badge">${esc(t('offers'))}</span>` : ''}</div><div class="product-body"><p class="product-brand" dir="ltr">${esc(product.brand)}</p><h3 class="product-name" dir="auto"><a href="${productUrl(product)}">${name}</a></h3><p class="product-caption">${esc(L(specification(product)?.specs[0]?.value))}</p>${conditionChips(product)}<div class="product-buy">${priceTag(product)}${cardAction(product)}</div></div></article>`;
}
function sectionHeading(title, href, label = t('allDevices'), eyebrow = '') {
  return `<div class="section-heading"><div>${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h2>${esc(title)}</h2></div>${href ? `<a class="text-link" href="${esc(href)}">${esc(label)}${arrow}</a>` : ''}</div>`;
}
function contactActions({ instagram = false } = {}) {
  const destination = instagram ? S().instagram : '#/contact';
  const label = instagram ? t('ask') : t('contact');
  return `<div class="contact-actions"><a class="button button-primary" href="${esc(destination)}"${instagram ? ` ${external}` : ''}>${esc(label)}</a><a class="button button-outline" href="${esc(phoneHref())}">${icon('phone')}${esc(t('call'))}</a></div>`;
}

// ---------- home ----------
function heroProduct() {
  const list = homeProducts();
  return list.find((p) => p.category === state.heroCategory && p.featured && imageSrc(p)) || list.find((p) => p.category === state.heroCategory && imageSrc(p)) || list[0];
}
function categoryArtwork(id, { eager = false } = {}) {
  const picture = id === 'watches'
    ? ['assets/devices/huawei-watch-gt6.webp', 'Huawei Watch GT 6']
    : id === 'audio'
      ? ['assets/categories/airpods-pro.png', 'AirPods']
      : null;
  if (!picture) return '';
  const [src, alt] = picture;
  return `<span class="category-artwork ${id}"><img src="${src}" alt="${alt}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" draggable="false"></span>`;
}
function heroShowcase() {
  const product = heroProduct();
  if (!product) return '';
  const low = fromPrice(product);
  const artwork = categoryArtwork(state.heroCategory, { eager: true });
  const title = artwork ? categoryName(state.heroCategory) : L(product.name);
  const caption = artwork ? `<span class="hero-price">${arrow}</span>` : low !== null ? `<span class="hero-price"><small>${esc(t('from'))}</small> <bdi>${esc(money(low))}</bdi></span>` : '';
  return `<a class="hero-product" href="${artwork ? categoryUrl(state.heroCategory) : productUrl(product)}" aria-label="${esc(`${artwork ? t('browse') : t('view')}: ${title}`)}"><div class="device-media hero-device">${artwork || media(product, { eager: true })}</div><div class="hero-product-caption"><div><p class="product-brand" dir="ltr">${esc(artwork ? 'TRIO COLLECTION' : product.brand)}</p><p class="hero-product-name" dir="auto">${esc(title)}</p></div>${caption}</div></a><div class="hero-tabs" role="group" aria-label="${esc(t('heroChoose'))}">${homeCategoryIds().map((id) => `<button type="button" data-hero-category="${esc(id)}" aria-pressed="${id === state.heroCategory}">${esc(categoryName(id))}</button>`).join('')}</div>`;
}
function offersRow(list) {
  return `<div class="offer-row" data-scroller><div class="offer-track">${list.map((product) => `<div class="offer-slide">${productCard(product)}</div>`).join('')}</div><div class="row-controls" aria-hidden="true"><button type="button" class="row-button" data-scroll="-1" tabindex="-1">${icon('chevron')}</button><button type="button" class="row-button is-next" data-scroll="1" tabindex="-1">${icon('chevron')}</button></div></div>`;
}
function renderHome() {
  const list = homeProducts();
  const offers = list.filter((p) => p.offer && availableVariants(p).length);
  const rest = list.filter((p) => !p.offer && availableVariants(p).length);
  const featured = [...rest.filter((p) => p.featured), ...rest.filter((p) => !p.featured)].slice(0, rest.length >= 8 ? 8 : rest.length >= 4 ? 4 : rest.length);
  const cats = homeCategoryIds().map((id) => {
    const inCat = list.filter((p) => p.category === id);
    const rep = inCat.find((p) => p.featured && imageSrc(p)) || inCat.find((p) => imageSrc(p)) || inCat[0];
    const lows = inCat.map(fromPrice).filter((n) => n !== null);
    return `<a class="category-card" href="${categoryUrl(id)}"><div class="category-picture device-media">${categoryArtwork(id) || media(rep)}</div><h3>${esc(categoryName(id))}</h3><span class="category-count">${esc(t('count')(inCat.length))}${lows.length ? ` · ${esc(t('from'))} <bdi>${esc(money(Math.min(...lows)))}</bdi>` : ''}</span></a>`;
  }).join('');
  const trust = t('trust').map(([title, text], i) => `<li class="trust-item"><span class="trust-icon" aria-hidden="true">${icon(['search', 'box', 'heart', 'swap'][i])}</span><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span></li>`).join('');
  return `<section class="hero"><div class="container hero-grid"><div class="hero-copy"><h1><span>${esc(t('heroLine1'))}</span> <span>${esc(t('heroLine2'))}</span></h1><form id="home-search-form" class="home-search" role="search">${icon('search')}<label class="sr-only" for="home-search">${esc(t('search'))}</label><input id="home-search" name="q" type="search" placeholder="${esc(t('searchPlaceholder'))}" autocomplete="off" enterkeyhint="search"></form><div class="hero-buttons"><a class="button button-dark" href="#/offers">${esc(t('heroOffers'))}${arrow}</a><a class="button button-outline" href="#/shop">${esc(t('browse'))}</a></div></div><div id="hero-showcase" class="hero-showcase">${heroShowcase()}</div></div></section>
  <div class="home-content">
    ${offers.length ? `<section class="container offers-section">${sectionHeading(offersHeading(), '#/offers', t('offersAll'))}${offersRow(offers)}</section>` : ''}
    <section class="container"><ul class="trust-strip">${trust}</ul></section>
    <section class="container categories-section">${sectionHeading(t('categories'), '#/shop')}<div class="category-grid">${cats}</div></section>
    ${featured.length ? `<section class="container featured-section">${sectionHeading(t('featuredTitle'), '#/shop')}<div class="product-grid">${featured.map(productCard).join('')}</div></section>` : ''}
    <section class="container services-section"><div class="service-panel"><div><p class="eyebrow" dir="ltr">TRIO MOBILE</p><h2>${esc(t('servicesTitle'))}</h2><p>${esc(t('servicesText'))}</p></div><div class="service-actions"><a class="button button-primary" href="#/maintenance">${esc(t('repairCta'))}${arrow}</a><a class="button button-outline" href="#/trade-in">${esc(t('tradeCta'))}${arrow}</a></div></div></section>
    <section class="container story-section"><div class="story-panel"><a class="story-image" href="#/contact"><img src="assets/instagram/store.jpg" alt="${esc(state.language === 'ar' ? 'داخل محل تريو موبايل' : 'Inside Trio Mobile')}" width="1179" height="1572" loading="lazy"></a><div class="story-copy"><p class="eyebrow" dir="ltr">THIS IS TRIO.</p><h2>${esc(t('aboutTitle'))}</h2><p>${esc(t('aboutText'))}</p><a class="text-link" href="#/contact">${esc(t('contact'))}${arrow}</a></div></div></section>

  </div>`;
}

// ---------- catalog ----------
function normalize(value) {
  return String(value).toLocaleLowerCase().normalize('NFKD').replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
}
function baseProducts() {
  const r = state.route.name;
  return products().filter((p) => (r !== 'saved' || state.saved.has(p.id)) && (r !== 'offers' || p.offer) && (state.category === 'all' || p.category === state.category));
}
function filteredProducts() {
  const query = normalize(state.query);
  const rows = baseProducts().filter((p) => {
    if (state.brand !== 'all' && p.brand !== state.brand) return false;
    if (state.cond !== 'all') {
      const used = (v) => ['like-new', 'used', 'used-agency'].includes(v.condition);
      if (!availableVariants(p).some((v) => (state.cond === 'used' ? used(v) : !used(v)))) return false;
    }
    if (!query) return true;
    const hay = normalize([p.name.ar, p.name.en, p.brand, L(p.tagline), p.about?.ar, p.about?.en, categoryName(p.category), (p.variants || []).map((v) => v.storage).join(' '), p.brand === 'Apple' && /iphone/i.test(p.name.en) ? 'ايفون آيفون' : '', p.brand === 'Samsung' ? 'سامسونج جالكسي' : '', p.brand === 'Huawei' ? 'هواوي' : '', /macbook/i.test(p.name.en) ? 'ماك ماكبوك لابتوب' : '', /ipad/i.test(p.name.en) ? 'ايباد تابلت' : '', /watch/i.test(p.name.en) ? 'ساعه ساعة' : '', /airpods/i.test(p.name.en) ? 'ايربودز سماعه' : ''].join(' '));
    return query.split(/\s+/).every((word) => hay.includes(word));
  });
  const low = (p) => fromPrice(p) ?? Infinity;
  if (state.sort === 'price-asc') rows.sort((a, b) => low(a) - low(b));
  else if (state.sort === 'price-desc') rows.sort((a, b) => low(b) - low(a));
  else if (state.sort === 'name') rows.sort((a, b) => L(a.name).localeCompare(L(b.name), state.language));
  return rows;
}
function categoryTabs() {
  const r = state.route.name;
  const base = r === 'saved' ? `saved` : r === 'offers' ? 'offers' : 'shop';
  const avail = products().filter((p) => (r !== 'saved' || state.saved.has(p.id)) && (r !== 'offers' || p.offer));
  return `<nav class="catalog-tabs" aria-label="${esc(t('heroChoose'))}">${['all', ...categoryIds()].map((id) => {
    const count = avail.filter((p) => id === 'all' || p.category === id).length;
    if (id !== 'all' && !count) return '';
    const href = `#/${base}${id === 'all' ? '' : `/${id}`}`;
    const label = id === 'all' ? (state.language === 'ar' ? 'الكل' : 'All') : categoryName(id);
    return `<a class="filter-button ${id === state.category ? 'active' : ''}" href="${href}"${id === state.category ? ' aria-current="page"' : ''}>${esc(label)}<span>${esc(num(count))}</span></a>`;
  }).join('')}</nav>`;
}
function renderCatalog() {
  const r = state.route.name;
  const brands = [...new Set(baseProducts().map((p) => p.brand))].sort();
  if (!brands.includes(state.brand)) state.brand = 'all';
  const heading = r === 'saved' ? t('saved') : r === 'offers' ? offersHeading() : state.category === 'all' ? t('shop') : categoryName(state.category);
  const intro = r === 'saved' ? t('savedIntro') : r === 'offers' ? t('offersIntro') : t('shopIntro');
  const opt = (value, label, current) => `<option value="${value}"${current === value ? ' selected' : ''}>${esc(label)}</option>`;
  return `<div class="container page-shell catalog-page"><div class="page-heading"><p class="eyebrow">${esc(t('collection'))}</p><h1>${esc(heading)}</h1><p class="page-intro">${esc(intro)}</p></div>${categoryTabs()}
  <div class="catalog-controls"><label class="search-field">${icon('search')}<span class="sr-only">${esc(t('search'))}</span><input id="product-search" type="search" value="${esc(state.query)}" placeholder="${esc(t('searchPlaceholder'))}" autocomplete="off"></label>
  <details class="catalog-filter-panel"${window.matchMedia?.('(min-width: 641px)').matches ? ' open' : ''}><summary class="catalog-filter-summary">${icon('swap')}<span>${esc(t('filters'))}</span></summary><div class="catalog-filter-fields">
  <label class="control-field"><span>${esc(t('brand'))}</span><select id="brand-filter">${opt('all', t('allBrands'), state.brand)}${brands.map((b) => opt(b, b, state.brand)).join('')}</select></label>
  <label class="control-field"><span>${esc(t('condition'))}</span><select id="cond-filter">${opt('all', t('condAll'), state.cond)}${opt('new', t('condNew'), state.cond)}${opt('used', t('condUsed'), state.cond)}</select></label>
  <label class="control-field"><span>${esc(t('sort'))}</span><select id="sort-order">${opt('featured', t('featured'), state.sort)}${opt('price-asc', t('priceLow'), state.sort)}${opt('price-desc', t('priceHigh'), state.sort)}${opt('name', t('nameSort'), state.sort)}</select></label></div></details></div>
  <div id="catalog-results"></div></div>`;
}
function renderProductResults(rows) {
  const groupByCategory = state.route.name === 'shop' && state.category === 'all' && !state.query.trim()
    && state.brand === 'all' && state.cond === 'all' && state.sort === 'featured' && !state.route.params?.has('sort');
  if (!groupByCategory) return `<div id="product-grid" class="product-grid">${rows.map(productCard).join('')}</div>`;
  const groups = state.content.categories.map((category) => {
    const items = rows.filter((product) => product.category === category.id);
    if (!items.length) return '';
    const label = L(category.name);
    const headingId = `catalog-category-${category.id}`;
    return `<section class="catalog-group" aria-labelledby="${esc(headingId)}" data-category-group="${esc(category.id)}"><div class="catalog-group-heading"><div><h2 id="${esc(headingId)}">${esc(label)}</h2><p class="catalog-group-count">${esc(t('count')(items.length))}</p></div><a class="text-link" href="${categoryUrl(category.id)}">${esc(state.language === 'ar' ? `كل ${label}` : `View ${label.toLocaleLowerCase()}`)}${arrow}</a></div><div class="product-grid">${items.map(productCard).join('')}</div></section>`;
  }).join('');
  return `<div id="product-grid" class="catalog-groups">${groups}</div>`;
}
function updateResults() {
  const box = $('#catalog-results');
  if (!box) return;
  const activeFilters = [state.brand !== 'all', state.cond !== 'all', state.sort !== 'featured'].filter(Boolean).length;
  const panel = $('.catalog-filter-panel');
  panel?.classList.toggle('has-filters', activeFilters > 0);
  const filterLabel = $('.catalog-filter-summary span');
  if (filterLabel) filterLabel.textContent = `${t('filters')}${activeFilters ? ` · ${num(activeFilters)}` : ''}`;
  const rows = filteredProducts();
  const filtered = Boolean(state.query || state.brand !== 'all' || state.cond !== 'all' || state.sort !== 'featured');
  const emptySaved = state.route.name === 'saved' && !state.saved.size;
  box.innerHTML = `<div class="results-bar"><p id="result-count" role="status" aria-live="polite">${esc(t('count')(rows.length))}</p>${filtered ? `<button type="button" class="text-link" id="reset-filters">${esc(t('clear'))}</button>` : ''}</div>${rows.length ? renderProductResults(rows) : `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${emptySaved ? '♡' : '⌕'}</span><h2>${esc(t(emptySaved ? 'noSaved' : 'noResults'))}</h2><p>${esc(t(emptySaved ? 'noSavedText' : 'noResultsText'))}</p><a class="button button-primary" href="#/shop">${esc(t('browse'))}${arrow}</a></div>`}`;
}

// ---------- product ----------
function variantNotes(variant) {
  const rows = [];
  if (variant.condition) rows.push([t('condition'), L(conditions[variant.condition])]);
  for (const n of variant.notes || []) if (noteLabels[n]) rows.push(['', L(noteLabels[n])]);
  if (variant.warranty && warranties[variant.warranty]) rows.push([t('warranty'), L(warranties[variant.warranty])]);
  return rows;
}
function renderSpecifications(product, variant) {
  const data = specification(product);
  const rows = [...(variant.storage ? [{ label: { ar: t('configuration'), en: t('configuration') }, value: { ar: variant.storage, en: variant.storage } }] : []), ...(data?.specs || [])];
  return `<section class="device-specs" id="device-specs"><h2>${esc(t('details'))}</h2><dl>${rows.map((row) => `<div class="device-spec-row"><dt>${esc(L(row.label))}</dt><dd dir="auto">${esc(L(row.value))}</dd></div>`).join('')}</dl></section>`;
}
function renderDetail(id) {
  const product = products().find((p) => p.id === id);
  if (!product) return `<div class="container page-shell"><div class="empty-state"><h1>${esc(t('notFound'))}</h1><p>${esc(t('notFoundText'))}</p><a class="button button-primary" href="#/shop">${esc(t('browse'))}</a></div></div>`;
  const variant = defaultVariant(product);
  const related = products().filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const chips = product.variants.length > 1 ? `<fieldset class="variant-picker"><legend>${esc(t('options'))}</legend><div class="variant-list">${product.variants.map((v) => `<button type="button" class="variant-chip" data-variant="${esc(v.key)}" data-product-id="${esc(product.id)}" aria-pressed="${v.key === variant.key}"${v.soldOut ? ' disabled' : ''}><span class="variant-name" dir="auto">${esc(variantLabel(v, { short: true }) || L(product.name))}</span><span class="variant-price"><bdi>${esc(v.soldOut ? t('soldOut') : money(toFils(v.price)))}</bdi></span></button>`).join('')}</div></fieldset>` : '';
  const rows = variantNotes(variant).map(([label, value]) => `<li>${label ? `<span>${esc(label)}</span>` : ''}<strong dir="auto">${esc(value)}</strong></li>`).join('');
  const canBuy = !variant.soldOut && validPrice(variant.price);
  return `<div class="container page-shell product-page"><nav class="breadcrumbs" aria-label="${esc(state.language === 'ar' ? 'مسار التصفح' : 'Breadcrumb')}"><a href="#/">${esc(t('home'))}</a><span aria-hidden="true">/</span><a href="${categoryUrl(product.category)}">${esc(categoryName(product.category))}</a><span aria-hidden="true">/</span><span dir="auto">${esc(L(product.name))}</span></nav>
  <div class="product-detail"><div class="detail-visual"><div class="detail-image device-media">${media(product, { eager: true })}</div>${product.imageNote && !product.photo ? `<p class="detail-photo-note">${esc(L(product.imageNote))}</p>` : ''}</div>
  <div class="detail-copy"><div class="detail-top"><div><p class="product-brand" dir="ltr">${esc(product.brand)}</p><h1 dir="auto">${esc(L(product.name))}</h1></div>${saveButton(product, 'detail-save-button')}</div><p class="detail-tagline">${esc(L(specification(product)?.summary))}</p>
  ${chips}
  <div class="detail-buy" id="detail-buy"><p class="detail-price"><bdi>${esc(canBuy ? money(toFils(variant.price)) : t('soldOut'))}</bdi></p>${variant.storage ? `<p class="detail-variant" dir="auto">${esc(variant.storage)}</p>` : ''}${rows ? `<ul class="spec-list">${rows}</ul>` : ''}
  <div class="detail-actions">${canBuy ? `<span class="mobile-buy-price"><bdi>${esc(money(toFils(variant.price)))}</bdi></span><button type="button" class="button button-primary button-wide" data-add="${esc(variantId(product.id, variant.key))}">${icon('bag')}${esc(t('add'))}</button>` : `<span class="button button-wide is-disabled">${esc(t('unavailable'))}</span>`}</div></div>
  ${renderSpecifications(product, variant)}</div></div>
  ${related.length ? `<section class="related-section">${sectionHeading(t('related'), categoryUrl(product.category), t('backCategory'))}<div class="product-grid">${related.map(productCard).join('')}</div></section>` : ''}</div>`;
}

// ---------- bag ----------
function loadBag() {
  const raw = local.read(visitorKey('bag'), []);
  const lines = Array.isArray(raw) ? raw.filter((l) => l && typeof l.id === 'string' && Number.isInteger(l.qty)) : [];
  return lines.map((l) => ({ id: l.id, qty: Math.min(MAX_QTY, Math.max(1, l.qty)) }));
}
function saveBag() { local.write(visitorKey('bag'), state.bag); updateCounts(); }
function cleanBag() {
  const before = state.bag.length;
  state.bag = state.bag.filter((l) => { const [pid, key] = splitVariantId(l.id); const p = products().find((x) => x.id === pid); const v = p && p.variants.find((x) => x.key === key); return v && !v.soldOut && validPrice(v.price); });
  if (state.bag.length !== before) { saveBag(); return true; }
  return false;
}
function bagPriced() { return state.bag.length ? priceLines(state.content, state.bag) : { ok: true, lines: [], totalFils: 0 }; }
function bagCount() { return state.bag.reduce((s, l) => s + l.qty, 0); }
function addToBag(id) {
  const [pid, key] = splitVariantId(id);
  const p = products().find((x) => x.id === pid); const v = p && p.variants.find((x) => x.key === key);
  if (!v || v.soldOut) return;
  const line = state.bag.find((l) => l.id === id);
  if (!line && state.bag.length >= MAX_LINES) { toast(t('bagFull'), '#/bag', t('bag')); return; }
  if (line) line.qty = Math.min(MAX_QTY, line.qty + 1); else state.bag.push({ id, qty: 1 });
  saveBag();
  toast(`${t('added')}: ${L(p.name)}${v.storage ? ` · ${v.storage}` : ''}`, '#/bag', t('bag'));
}
function bagLine(line) {
  const p = line.product; const v = line.variant;
  return `<li class="bag-line"><a class="bag-thumb device-media" href="${productUrl(p)}">${media(p)}</a><div class="bag-info"><a class="bag-name" href="${productUrl(p)}" dir="auto">${esc(L(p.name))}</a><p class="bag-variant" dir="auto">${esc(variantLabel(v))}</p><div class="bag-row"><div class="qty" role="group" aria-label="${esc(t('qty'))}"><button type="button" data-qty="${esc(line.id)}" data-delta="-1" aria-label="−"${line.qty <= 1 ? ' disabled' : ''}>−</button><output>${line.qty}</output><button type="button" data-qty="${esc(line.id)}" data-delta="1" aria-label="+"${line.qty >= MAX_QTY ? ' disabled' : ''}>+</button></div><strong class="bag-price"><bdi>${esc(money(line.totalFils))}</bdi></strong></div><button type="button" class="bag-remove" data-remove="${esc(line.id)}">${esc(t('remove'))}</button></div></li>`;
}
function summary(priced, withButton) {
  return `<aside class="bag-summary"><dl><div><dt>${esc(t('subtotal'))}</dt><dd><bdi>${esc(money(priced.totalFils))}</bdi></dd></div><div><dt>${esc(t('delivery'))}</dt><dd>${esc(t(MODE === 'pages' ? 'demoDelivery' : 'deliveryValue'))}</dd></div><div class="is-total"><dt>${esc(t('total'))}</dt><dd><bdi>${esc(money(priced.totalFils))}</bdi></dd></div></dl><p class="summary-note">${esc(t('payCash'))}</p>${withButton ? `<a class="button button-primary button-wide" href="#/checkout">${esc(t('checkoutLive'))}${arrow}</a><a class="text-link" href="#/shop">${esc(t('keepShopping'))}</a>` : ''}</aside>`;
}
function renderBag() {
  const fixed = cleanBag();
  const priced = bagPriced();
  if (!priced.ok || !priced.lines.length) return `<div class="container page-shell"><div class="page-heading"><h1>${esc(t('bagTitle'))}</h1></div><div class="empty-state"><span class="empty-icon" aria-hidden="true">${icon('bag')}</span><h2>${esc(t('bagEmpty'))}</h2><p>${esc(t('bagEmptyText'))}</p><a class="button button-primary" href="#/shop">${esc(t('browse'))}${arrow}</a></div></div>`;
  return `<div class="container page-shell bag-page"><div class="page-heading"><h1>${esc(t('bagTitle'))}</h1>${fixed ? `<p class="form-alert" role="status">${esc(t('bagFixed'))}</p>` : ''}</div><div class="bag-layout"><ul class="bag-lines">${priced.lines.map(bagLine).join('')}</ul>${summary(priced, true)}</div></div>`;
}
function orderText(priced, number = '') {
  const lines = priced.lines.map((l) => `• ${L(l.product.name)}${l.variant.storage || l.variant.condition ? ` — ${variantLabel(l.variant)}` : ''} × ${l.qty} = ${money(l.totalFils)}`);
  return [t('waHello'), t('waOrder'), ...lines, `${t('waTotal')}: ${money(priced.totalFils)}`, number ? `${t('waNumber')}: ${number}` : ''].filter(Boolean).join('\n');
}
function renderInquiry() {
  return `<div class="container page-shell inquiry-page"><div class="page-heading"><h1>${esc(t('checkoutTitle'))}</h1><p class="page-intro">${esc(t('ordersOff'))}</p></div><div class="contact-actions"><a class="button button-primary" href="#/contact">${esc(t('contact'))}${arrow}</a><a class="button button-outline" href="#/bag">${esc(t('bag'))}</a></div></div>`;
}
function renderCheckout() {
  if (!ordersEnabled()) return renderInquiry();
  cleanBag();
  const priced = bagPriced();
  if (!priced.ok || !priced.lines.length) { location.replace('#/bag'); return ''; }
  if (!state.checkoutToken) { state.checkoutToken = randomToken(); state.checkoutStarted = Date.now(); }
  const draft = { name: customerProfile()?.name || '', mobile: customerProfile()?.mobile || '', ...(local.read(checkoutKey(), {}) || {}) };
  const gov = governorates.map(([id, ar, en]) => `<option value="${id}"${(draft.governorate || 'amman') === id ? ' selected' : ''}>${esc(state.language === 'ar' ? ar : en)}</option>`).join('');
  const pickup = draft.fulfilment === 'pickup';
  return `<div class="container page-shell checkout-page"><div class="page-heading"><h1>${esc(t('checkoutTitle'))}</h1><p class="page-intro">${esc(t('checkoutIntro'))}</p>${!customerProfile() ? `<a class="checkout-signin" href="#/account">${esc(t('signInCheckout'))}</a>` : ''}</div><div class="bag-layout">
  <form id="checkout-form" class="checkout-form" novalidate><p class="form-alert" id="form-alert" role="alert" hidden></p>
  <label class="field"><span>${esc(t('name'))}</span><input name="name" autocomplete="name" minlength="2" maxlength="60" required value="${esc(draft.name || '')}"></label>
  <label class="field"><span>${esc(t('mobile'))}</span><input name="mobile" type="tel" inputmode="tel" dir="ltr" autocomplete="tel" maxlength="20" placeholder="${esc(t('mobileHint'))}" required value="${esc(draft.mobile || '')}"></label>
  <fieldset class="field choice"><legend>${esc(t('fulfilment'))}</legend><label><input type="radio" name="fulfilment" value="delivery"${pickup ? '' : ' checked'}><span>${esc(t('deliveryOpt'))}</span></label><label><input type="radio" name="fulfilment" value="pickup"${pickup ? ' checked' : ''}><span>${esc(t('pickupOpt'))}</span></label></fieldset>
  <div class="delivery-fields"${pickup ? ' hidden' : ''}><label class="field"><span>${esc(t('governorate'))}</span><select name="governorate"${pickup ? ' disabled' : ' required'}>${gov}</select></label>
  <label class="field"><span>${esc(t('address'))}</span><input name="address" autocomplete="street-address" minlength="4" maxlength="200"${pickup ? ' disabled' : ' required'} placeholder="${esc(t('addressHint'))}" value="${esc(draft.address || '')}"></label></div>
  <label class="field"><span>${esc(t('notes'))}</span><textarea name="notes" rows="3" maxlength="300">${esc(draft.notes || '')}</textarea></label>
  <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
  <p class="summary-note">${esc(t(MODE === 'pages' ? 'demoPrivacy' : 'privacy'))}</p>
  <button class="button button-primary button-wide" type="submit">${esc(t('placeOrder'))}</button></form>
  <div><ul class="bag-lines is-compact">${priced.lines.map((l) => `<li class="bag-line"><span class="bag-thumb device-media">${media(l.product)}</span><div class="bag-info"><span class="bag-name" dir="auto">${esc(L(l.product.name))} × ${l.qty}</span><p class="bag-variant" dir="auto">${esc(variantLabel(l.variant))}</p><strong class="bag-price"><bdi>${esc(money(l.totalFils))}</bdi></strong></div></li>`).join('')}</ul>${summary(priced, false)}</div></div></div>`;
}
function renderDone(number) {
  const order = state.lastOrder && state.lastOrder.number === number && state.lastOrder.channel === MODE ? state.lastOrder : null;
  if (!order) return `<div class="container page-shell done-page"><div class="done-card"><h1>${esc(t('receiptMissing'))}</h1><p>${esc(t('receiptMissingText'))}</p><a class="button button-primary" href="#/bag">${esc(t('bag'))}</a></div></div>`;
  const details = Array.isArray(order.lines) ? `<ul class="bag-lines is-compact">${order.lines.map((line) => `<li class="bag-line"><div class="bag-info"><span class="bag-name" dir="auto">${esc(L(line.name))} × ${line.qty}</span>${line.storage ? `<p class="bag-variant" dir="auto">${esc(line.storage)}</p>` : ''}<strong class="bag-price"><bdi>${esc(money(line.unitFils * line.qty))}</bdi></strong></div></li>`).join('')}</ul>` : '';
  return `<div class="container page-shell done-page"><div class="done-card"><span class="done-icon" aria-hidden="true">✓</span><h1>${esc(t(MODE === 'pages' ? 'demoDone' : 'doneTitle'))}</h1><p>${esc(t('doneText'))}</p><p class="order-number" dir="ltr">${esc(number)}</p><p>${esc(t(MODE === 'pages' ? 'demoNext' : 'doneNext'))}</p>${details}${Number.isInteger(order.totalFils) ? `<p class="total"><span>${esc(t('total'))}</span> <strong><bdi>${esc(money(order.totalFils))}</bdi></strong></p>` : ''}${MODE === 'demo' ? `<p class="form-alert">${esc(t('demoNote'))}</p>` : ''}<div class="contact-actions">${MODE === 'pages' ? `<a class="button button-primary" href="${customerProfile() ? '#/account' : '#/shop'}">${esc(t(customerProfile() ? 'myOrders' : 'keepShopping'))}</a>` : ''}${MODE !== 'pages' && S().whatsapp ? `<a class="button button-whatsapp" href="${esc(waHref(order.text || ''))}" ${external}>${icon('whatsapp')}${esc(t('sendWhatsapp'))}</a>` : ''}${MODE !== 'pages' ? `<a class="button button-outline" href="${esc(phoneHref())}">${icon('phone')}${esc(t('call'))}</a>` : ''}</div><a class="text-link" href="#/shop">${esc(t('keepShopping'))}</a></div></div>`;
}
function randomToken() {
  const bytes = new Uint8Array(16);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function showFormError(code) {
  const box = $('#form-alert');
  if (!box) return;
  box.textContent = t('errors')[code] || t('errors').generic;
  box.hidden = false;
  box.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
async function submitCheckout(form) {
  if (state.busy) return;
  if (!ordersEnabled()) { showFormError('orders-off'); return; }
  const data = Object.fromEntries(new FormData(form).entries());
  const draft = { name: (data.name || '').trim(), mobile: (data.mobile || '').trim(), fulfilment: data.fulfilment === 'pickup' ? 'pickup' : 'delivery', governorate: data.governorate || 'amman', address: (data.address || '').trim(), notes: (data.notes || '').trim() };
  local.write(checkoutKey(), { ...draft, notes: '' });
  if (draft.name.length < 2) return showFormError('bad-name');
  if (!normaliseMobile(draft.mobile)) return showFormError('bad-mobile');
  if (draft.fulfilment === 'delivery' && !governorates.some(([id]) => id === draft.governorate)) return showFormError('bad-governorate');
  if (draft.fulfilment === 'delivery' && draft.address.length < 4) return showFormError('bad-address');
  const priced = bagPriced();
  if (!priced.ok) return showFormError(priced.error);
  const accountId = customerProfile()?.id || 'guest';
  const signature = JSON.stringify({ lines: state.bag, totalFils: priced.totalFils, customer: draft, accountId });
  if (!state.checkoutToken || (state.checkoutSignature && state.checkoutSignature !== signature)) state.checkoutToken = randomToken();
  state.checkoutSignature = signature;
  const button = form.querySelector('[type=submit]');
  state.busy = true; button.disabled = true; button.textContent = t('sending');
  try {
    const order = { token: state.checkoutToken, lines: state.bag.map((l) => ({ id: l.id, qty: l.qty })), totalFils: priced.totalFils, customer: { name: draft.name, mobile: draft.mobile, governorate: draft.fulfilment === 'delivery' ? draft.governorate : '', address: draft.fulfilment === 'delivery' ? draft.address : '', notes: draft.notes }, fulfilment: draft.fulfilment, lang: state.language, website: data.website || '', elapsedMs: Date.now() - state.checkoutStarted };
    const result = await api.placeOrder(order);
    if (!result || typeof result.number !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(result.number) || !Number.isSafeInteger(result.totalFils) || result.totalFils <= 0) throw new ApiError('generic');
    if ((customerProfile()?.id || 'guest') !== accountId) return;
    state.lastOrder = { number: result.number, channel: MODE, totalFils: result.totalFils, text: orderText(priced, result.number), lines: priced.lines.map((line) => ({ name: line.product.name, storage: line.variant.storage, qty: line.qty, unitFils: line.unitFils })) };
    local.write(`trio-last-order-${accountId}`, state.lastOrder);
    state.bag = []; saveBag(); state.checkoutToken = ''; state.checkoutSignature = '';
    location.hash = `#/done/${encodeURIComponent(result.number)}`;
    loadAccount();
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'generic';
    if (code === 'price-changed' || code === 'sold-out' || code === 'unknown') { await refreshContent(); }
    if (code === 'token-conflict' || code === 'signed-out') await loadAccount();
    showFormError(code);
  } finally {
    state.busy = false;
    if (button.isConnected) { button.disabled = false; button.textContent = t('placeOrder'); }
  }
}

// ---------- service pages ----------
function renderService(trade = false) {
  const steps = trade ? '' : `<div class="service-grid">${t('serviceSteps').map(([title, text], i) => `<section class="service-card"><span class="service-number" aria-hidden="true">0${i + 1}</span><h2>${esc(title)}</h2><p>${esc(text)}</p></section>`).join('')}</div>`;
  return `<div class="container page-shell service-page"><div class="page-heading"><p class="eyebrow" dir="ltr">TRIO MOBILE</p><h1>${esc(t(trade ? 'tradeTitle' : 'serviceTitle'))}</h1><p class="page-intro">${esc(t(trade ? 'tradeText' : 'serviceText'))}</p></div><div class="service-panel"><div><h2>${esc(t('contact'))}</h2><p>${esc(trade ? t('tradeNote') : L(S().address))}</p></div>${contactActions({ instagram: !trade })}</div>${steps}<a class="text-link" href="${esc(S().maps)}" ${external}>${esc(t('map'))}${arrow}</a></div>`;
}
function renderContact() {
  return `<div class="container page-shell contact-page"><div class="page-heading"><p class="eyebrow" dir="ltr">KHALDA · AMMAN</p><h1>${esc(t('contactTitle'))}</h1><p class="page-intro">${esc(t('contactIntro'))}</p></div><div class="contact-grid">
  <section class="contact-card"><span class="contact-symbol" aria-hidden="true">${icon('phone')}</span><h2>${esc(t('phone'))}</h2><a class="contact-phone" href="${esc(phoneHref())}" dir="ltr">${esc(phoneText())}</a><div class="contact-actions"><a class="button button-primary" href="${esc(phoneHref())}">${esc(t('call'))}</a>${S().whatsapp ? `<a class="button button-whatsapp" href="${esc(waHref(t('waHello')))}" ${external}>${icon('whatsapp')}${esc(t('whatsapp'))}</a>` : ''}</div></section>
  <section class="contact-card"><span class="contact-symbol" aria-hidden="true">${icon('location')}</span><h2>${esc(t('storeLocation'))}</h2><p>${esc(L(S().address))}</p><a class="button button-outline" href="${esc(S().maps)}" ${external}>${esc(t('map'))}${arrow}</a></section>
  <section class="contact-card is-wide"><span class="contact-symbol" aria-hidden="true">@</span><h2>${esc(t('social'))}</h2><p dir="ltr">@trio_mobile.jo</p><div class="contact-actions"><a class="button button-outline" href="${esc(S().instagram)}" ${external}>Instagram${arrow}</a>${S().facebook ? `<a class="button button-outline" href="${esc(S().facebook)}" ${external}>Facebook${arrow}</a>` : ''}</div></section></div></div>`;
}

// ---------- shell ----------
function readRoute() {
  const hash = location.hash.replace(/^#/, '');
  const legacy = { catalog: '/shop', about: '/', categories: '/shop', contact: '/contact' };
  const path0 = Object.hasOwn(legacy, hash) ? legacy[hash] : hash;
  const [path, query = ''] = path0.replace(/^\/+/, '').split('?');
  const parts = path.split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
  const allowed = ['shop', 'offers', 'saved', 'p', 'bag', 'checkout', 'done', 'maintenance', 'trade-in', 'contact', 'account'];
  const name = allowed.includes(parts[0]) ? parts[0] : 'home';
  const categoryAliases = { computers: 'laptops', wearables: 'watches' };
  const category = categoryAliases[parts[1]] || parts[1];
  return { name, id: name === 'p' ? (legacyIds[parts[1]] || parts[1]) : parts[1], category: state.content && categoryIds().includes(category) ? category : 'all', params: new URLSearchParams(query) };
}
function syncFilterUrl() {
  const r = state.route.name;
  const base = r === 'saved' ? 'saved' : r === 'offers' ? 'offers' : 'shop';
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.brand !== 'all') params.set('brand', state.brand);
  if (state.cond !== 'all') params.set('cond', state.cond);
  if (state.sort !== 'featured') params.set('sort', state.sort);
  const q = params.toString();
  history.replaceState(null, '', `#/${base}${state.category === 'all' ? '' : `/${state.category}`}${q ? `?${q}` : ''}`);
}
function setMenu(open) {
  const menu = $('#mobile-nav'); const toggle = $('#menu-toggle');
  if (!menu || !toggle) return;
  menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
}
function updateCounts() {
  $$('[data-saved-count]').forEach((n) => { n.textContent = num(state.saved.size); n.hidden = !state.saved.size; });
  $$('[data-bag-count]').forEach((n) => { n.textContent = num(bagCount()); n.hidden = !state.bag.length; });
}
function updateSavedButtons() {
  $$('[data-save]').forEach((b) => {
    const p = products().find((x) => x.id === b.dataset.save); if (!p) return;
    const saved = state.saved.has(p.id);
    b.setAttribute('aria-pressed', String(saved)); b.setAttribute('aria-label', `${t(saved ? 'unsave' : 'save')}: ${L(p.name)}`);
  });
}
function announce(message) { const n = $('#app-status'); if (!n) return; n.textContent = ''; requestAnimationFrame(() => { n.textContent = message; }); }
let toastTimer = 0;
function toast(message, href = '', label = '') {
  const box = $('#toast'); if (!box) return;
  box.innerHTML = `<span>${esc(message)}</span>${href ? `<a href="${esc(href)}">${esc(label)}${arrow}</a>` : ''}`;
  box.hidden = false; box.classList.add('is-on'); announce(message);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { box.classList.remove('is-on'); setTimeout(() => { box.hidden = true; }, 250); }, 3200);
}
function toggleSaved(id) {
  if (!products().some((p) => p.id === id)) return;
  const saved = !state.saved.has(id);
  if (saved) state.saved.add(id); else state.saved.delete(id);
  local.write(visitorKey('saved'), [...state.saved]);
  updateCounts(); updateSavedButtons();
  if (state.route.name === 'saved') { const tabs = $('.catalog-tabs'); if (tabs) tabs.outerHTML = categoryTabs(); updateResults(); }
  announce(t(saved ? 'savedNow' : 'unsavedNow'));
}
function translateShell() {
  const lang = state.language;
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-ar][data-en]').forEach((n) => { n.textContent = n.getAttribute(`data-${lang}`); });
  for (const [key, attr] of [['label', 'aria-label'], ['placeholder', 'placeholder']]) $$(`[data-ar-${key}][data-en-${key}]`).forEach((n) => n.setAttribute(attr, n.getAttribute(`data-${lang}-${key}`)));
  const b = $('#language-toggle'); if (b) { b.textContent = lang === 'ar' ? 'English' : 'عربي'; b.lang = lang === 'ar' ? 'en' : 'ar'; b.setAttribute('aria-label', t('switchLang')); }
  $$('[data-account-link]').forEach((link) => { link.textContent = accountLabel(lang); });
  $$('[data-phone-link]').forEach((a) => { a.href = phoneHref(); }); $$('[data-phone-text]').forEach((a) => { a.textContent = phoneText(); });
  $$('[data-address]').forEach((n) => { n.textContent = L(S().address); });
  $$('[data-wa-link]').forEach((a) => { a.hidden = !S().whatsapp; if (S().whatsapp) a.href = waHref(t('waHello')); else a.removeAttribute('href'); });
  $$('[data-maps-link]').forEach((a) => { a.href = S().maps; });
  updateCounts();
}
function renderRoute({ focus = false } = {}) {
  state.route = readRoute();
  document.body.dataset.route = state.route.name;
  state.category = state.route.category;
  const p = state.route.params;
  state.query = p.get('q') || ''; state.brand = p.get('brand') || 'all';
  state.cond = ['new', 'used'].includes(p.get('cond')) ? p.get('cond') : 'all';
  state.sort = ['price-asc', 'price-desc', 'name'].includes(p.get('sort')) ? p.get('sort') : 'featured';
  const main = $('#main'); if (!main) return;
  let html;
  switch (state.route.name) {
    case 'shop': case 'saved': case 'offers': html = renderCatalog(); break;
    case 'p': html = renderDetail(state.route.id); break;
    case 'bag': html = renderBag(); break;
    case 'checkout': html = renderCheckout(); break;
    case 'done': html = renderDone(state.route.id || ''); break;
    case 'maintenance': html = renderService(); break;
    case 'trade-in': html = renderService(true); break;
    case 'contact': html = renderContact(); break;
    case 'account': html = renderAccount(state.language); break;
    default: html = renderHome();
  }
  main.innerHTML = html;
  $$('[data-instagram-slot]').forEach((element) => {
    const allowed = instagramAllowed(state.route.name);
    element.hidden = !allowed;
    element.innerHTML = allowed ? `<a href="${esc(S().instagram)}" ${external}>Instagram ↗</a>` : '';
  });
  $$('[data-contact-block]').forEach((element) => { element.hidden = state.route.name === 'p'; });
  $('.site-footer')?.classList.toggle('is-device-page', state.route.name === 'p');
  updateResults();
  const nav = state.route.name === 'p' ? 'shop' : state.route.name === 'checkout' || state.route.name === 'done' ? 'bag' : state.route.name;
  $$('[data-nav]').forEach((a) => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const heading = main.querySelector('h1');
  document.title = state.route.name === 'home' ? t('title') : `${heading?.textContent || t('shop')} | TRIO Mobile`;
  const hs = $('#header-search'); if (hs) hs.value = ['shop', 'saved', 'offers'].includes(state.route.name) ? state.query : '';
  setMenu(false);
  if (focus) requestAnimationFrame(() => { heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); });
}
function updateDetailBuy(product) {
  const html = renderDetail(product.id);
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const fresh = $('#detail-buy', tmp); const now = $('#detail-buy');
  if (fresh && now) now.replaceWith(fresh);
  const specs = $('#device-specs'); const freshSpecs = $('#device-specs', tmp);
  if (specs && freshSpecs) specs.replaceWith(freshSpecs);
  $$('[data-variant]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.variant === state.selected[product.id])));
}
async function refreshContent() {
  const loaded = await api.loadContent();
  state.content = loaded.content; state.source = loaded.source;
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest('.skip-link')) { event.preventDefault(); const m = $('#main'); m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); m.scrollIntoView({ block: 'start' }); return; }
  const save = target.closest('[data-save]'); if (save) { toggleSaved(save.dataset.save); return; }
  const add = target.closest('[data-add]'); if (add) { addToBag(add.dataset.add); return; }
  const variant = target.closest('[data-variant]');
  if (variant && !variant.disabled) { const product = products().find((x) => x.id === variant.dataset.productId); if (product) { state.selected[product.id] = variant.dataset.variant; updateDetailBuy(product); } return; }
  const qty = target.closest('[data-qty]');
  if (qty) { const line = state.bag.find((l) => l.id === qty.dataset.qty); if (line) { line.qty = Math.min(MAX_QTY, Math.max(1, line.qty + Number(qty.dataset.delta))); saveBag(); renderRoute(); $(`[data-qty="${CSS.escape(line.id)}"][data-delta="${qty.dataset.delta}"]`)?.focus(); } return; }
  const rm = target.closest('[data-remove]'); if (rm) { state.bag = state.bag.filter((l) => l.id !== rm.dataset.remove); saveBag(); renderRoute(); return; }
  const hero = target.closest('[data-hero-category]');
  if (hero) { state.heroCategory = hero.dataset.heroCategory; const box = $('#hero-showcase'); box.classList.add('is-switching'); setTimeout(() => { box.innerHTML = heroShowcase(); box.classList.remove('is-switching'); $(`[data-hero-category="${CSS.escape(state.heroCategory)}"]`)?.focus({ preventScroll: true }); }, 160); return; }
  const scroll = target.closest('[data-scroll]');
  if (scroll) { const track = scroll.closest('[data-scroller]')?.querySelector('.offer-track'); if (track) { const dir = Number(scroll.dataset.scroll) * (document.documentElement.dir === 'rtl' ? -1 : 1); track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' }); } return; }
  if (target.closest('#reset-filters')) { state.query = ''; state.brand = 'all'; state.sort = 'featured'; state.cond = 'all'; syncFilterUrl(); renderRoute(); $('#product-search')?.focus({ preventScroll: true }); return; }
  if (target.closest('#mobile-nav a')) setMenu(false);
});
document.addEventListener('input', (event) => {
  if (event.target.id === 'product-search') { state.query = event.target.value; syncFilterUrl(); updateResults(); }
  if (event.target.name === 'mobile') { const v = event.target.value; const w = v.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); if (w !== v) event.target.value = w; }
});
document.addEventListener('change', (event) => {
  const id = event.target.id;
  if (id === 'brand-filter') state.brand = event.target.value;
  else if (id === 'sort-order') state.sort = event.target.value;
  else if (id === 'cond-filter') state.cond = event.target.value;
  else if (event.target.name === 'fulfilment') { const box = $('.delivery-fields'); if (box) { const pickup = event.target.value === 'pickup'; box.hidden = pickup; $$('input,select', box).forEach((field) => { field.disabled = pickup; field.required = !pickup; }); } return; }
  else return;
  syncFilterUrl(); updateResults();
});
document.addEventListener('submit', (event) => {
  if (event.target.id === 'checkout-form') { event.preventDefault(); submitCheckout(event.target); }
  if (['header-search-form', 'mobile-search-form', 'home-search-form'].includes(event.target.id)) { event.preventDefault(); const q = (event.target.querySelector('input[type=search]')?.value || '').trim(); location.hash = `#/shop${q ? `?q=${encodeURIComponent(q)}` : ''}`; }
});
$('#language-toggle')?.addEventListener('click', () => { state.language = state.language === 'ar' ? 'en' : 'ar'; local.write('trio-language', state.language); translateShell(); renderRoute(); });
$('#menu-toggle')?.addEventListener('click', () => setMenu($('#menu-toggle').getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && $('#menu-toggle')?.getAttribute('aria-expanded') === 'true') { setMenu(false); $('#menu-toggle').focus(); } });
document.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.hasAttribute('data-device-image')) return;
  const card = document.createElement('span'); card.className = 'name-card';
  card.innerHTML = `<span class="name-card-name" dir="ltr">${esc(img.alt)}</span>`;
  img.replaceWith(card);
}, true);
window.addEventListener('hashchange', () => { renderRoute({ focus: true }); if (state.route.name === 'account') loadAccount(); });
window.matchMedia?.('(min-width: 641px)').addEventListener('change', (event) => { $('.catalog-filter-panel')?.toggleAttribute('open', event.matches); });
window.addEventListener('storage', (event) => {
  if (MODE === 'pages' && event.key === 'trio-browser-shop-v1') loadAccount();
  if (event.key === visitorKey('bag')) { state.bag = loadBag(); updateCounts(); if (['bag', 'checkout'].includes(state.route.name)) renderRoute(); }
  if (event.key === visitorKey('saved')) { state.saved = new Set(local.read(visitorKey('saved'), [])); updateCounts(); updateSavedButtons(); }
});

async function start() {
  document.documentElement.classList.toggle('reduced-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (MODE === 'demo') {
    document.documentElement.classList.add('is-demo');
    document.body.insertAdjacentHTML('beforeend', `<a class="demo-corner" href="admin/index.html" lang="${state.language}">${state.language === 'ar' ? 'نسخة عرض · لوحة التحكم' : 'Demo · Admin panel'}</a>`);
  }
  await refreshContent();
  const demoNotice = $('#owner-demo-notice'); if (demoNotice) demoNotice.hidden = MODE !== 'pages';
  if (state.source === 'preview') document.querySelector('#preview-notice').hidden = false;
  const ids = new Set(products().map((p) => p.id));
  const saved = local.read(visitorKey('saved'), []);
  state.saved = new Set(Array.isArray(saved) ? saved.map((id) => legacyIds[id] || id).filter((id) => ids.has(id)) : []);
  state.bag = loadBag();
  const firstCat = homeCategoryIds()[0]; if (firstCat && !homeCategoryIds().includes(state.heroCategory)) state.heroCategory = firstCat;
  translateShell();
  renderRoute();
  loadAccount();
  document.documentElement.classList.add('is-ready');
}
const checkoutKey = () => `trio-checkout-${customerProfile()?.id || 'guest'}`;
let accountIdentity;
bindAccount(() => {
  const identity = customerProfile()?.id || 'guest';
  const firstLoad = accountIdentity === undefined;
  const identityChanged = !firstLoad && accountIdentity !== identity;
  if (identityChanged) {
    // Contact drafts and receipts belong to one identity on shared devices.
    local.remove(`trio-checkout-${accountIdentity}`);
    local.remove(`trio-last-order-${accountIdentity}`);
    local.remove('trio-checkout');
    local.remove('trio-last-order');
    state.lastOrder = null; state.checkoutToken = ''; state.checkoutSignature = '';
  }
  if (accountIdentity === undefined) state.lastOrder = local.read(`trio-last-order-${identity}`);
  accountIdentity = identity;
  $$('[data-account-link]').forEach((link) => { link.textContent = accountLabel(state.language); });
  if (state.content && (state.route.name === 'account' || state.route.name === 'done' && (firstLoad || identityChanged) || state.route.name === 'checkout' && identityChanged)) renderRoute();
  // Background order updates must not replace an unfinished checkout form.
  if (state.route.name === 'checkout') {
    for (const key of ['name', 'mobile']) {
      const input = $(`#checkout-form [name="${key}"]`);
      if (input && !input.value) input.value = customerProfile()?.[key] || '';
    }
  }
});
start();
