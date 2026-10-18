// Shipped content for TRIO Mobile: used until the shop publishes from the admin,
// and as the starting point of the admin's first draft.
// Historical offers transcribed from Trio's public Instagram posts (links in
// `source`). Prices are in Jordanian dinars, not a statement of current stock or
// pricing. Confirm price, storage, condition and warranty directly with the shop.
// Ambiguous storage/price mappings are omitted; see Documents/SOURCES.md.

const P = {
  oct14a: 'https://www.instagram.com/p/DeeY6xFFQpS/', // #عروض_تريو لشهر ١٠ (8 slides)
  oct14b: 'https://www.instagram.com/p/DeeYoUZFZZL/', // October offers, part 2 (5 slides)
  oct8: 'https://www.instagram.com/p/DePAvISCpM6/', // iPhone collection (8 slides)
  oct11: 'https://www.instagram.com/p/DeW9T5hCrvs/', // Samsung (2 slides)
  oct7: 'https://www.instagram.com/p/DeMrVwtCino/', // Apple Watch (3 slides)
  oct4: 'https://www.instagram.com/p/DeEkfeJqfKw/', // Huawei Watch GT 6
  oct17: 'https://www.instagram.com/reel/DemNhmENpEF/', // AirPods Max 2 (caption)
  oct6: 'https://www.instagram.com/reel/DeKDsmlqxwu/', // MacBook Air M5 (caption)
  oct1: 'https://www.instagram.com/p/Dd9NX2lCtXe/', // MacBook Pro (5 slides)
  aug20: 'https://www.instagram.com/p/DcQLqhgFUXL/', // iPad (10 slides)
  sep30: 'https://www.instagram.com/p/Dd6o2o9Krho/', // AirTag
};

const v = (key, storage, condition, price, extra = {}) => ({ key, storage, condition, price, notes: [], warranty: '', soldOut: false, ...extra });

export const seed = {
  version: 0,
  settings: {
    phone: '0796999292',
    whatsapp: '',
    instagram: 'https://www.instagram.com/trio_mobile.jo/',
    facebook: 'https://www.facebook.com/906142119255608',
    maps: 'https://maps.app.goo.gl/ccgJ9DKUXMP6c3L39',
    address: { ar: 'خلدا، أم السماق، بالقرب من دوار السكر — عمّان', en: 'Khalda, Umm Al Summaq, near Al Sukkar Circle — Amman' },
    ordersOn: false,
    deliveryNote: { ar: 'لتأكيد خيارات الاستلام أو التوصيل وتكلفته وطريقة الدفع، تواصل مباشرة مع تريو بالهاتف أو إنستغرام.', en: 'Confirm collection or delivery options, delivery cost and payment methods directly with Trio by phone or Instagram.' },
    pricesNote: { ar: 'هذه أسعار عروض منشورة سابقاً، وليست تأكيداً للسعر أو التوفر الحالي. أكّد السعر والسعة والحالة والكفالة مباشرة مع تريو بالهاتف أو إنستغرام.', en: 'These are historical published offer prices, not confirmation of current price or availability. Confirm price, storage, condition and warranty directly with Trio by phone or Instagram.' },
    offersTitle: { ar: 'من عروض تريو المنشورة', en: 'From Trio’s published offers' },
  },
  categories: [
    { id: 'phones', name: { ar: 'هواتف', en: 'Phones' } },
    { id: 'computers', name: { ar: 'لابتوب وتابلت', en: 'Laptops & tablets' } },
    { id: 'wearables', name: { ar: 'ساعات وسماعات', en: 'Watches & audio' } },
    { id: 'accessories', name: { ar: 'إكسسوارات', en: 'Accessories' } },
  ],
  products: [
    {
      id: 'iphone-17-pro-max', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 17 Pro Max', en: 'iPhone 17 Pro Max' },
      image: 'assets/devices/iphone-17-pro-max.webp', offer: true, featured: true,
      tagline: { ar: 'جديد أو مستعمل بس مش مستخدم · حسب الخيار بالمنشور', en: 'New, or used-but-unused · as listed in the post' },
      about: { ar: 'عروض منشورة لـ iPhone 17 Pro Max بسعات من 256GB لحد 2TB. الجديد مذكور Active والمستعمل «بس مش مستخدم». كفالة تريو 3 سنوات مذكورة لخيارات عروض 14 تشرين الأول؛ كفالة خيار 1TB غير موثقة هنا. أكّد التفاصيل الحالية مع المحل.', en: 'Published iPhone 17 Pro Max offers from 256GB up to 2TB, listed as activated new or “used but unused”. A 3-year Trio warranty is stated for the 14 October options; the 1TB warranty is not documented here. Confirm current details with the shop.' },
      specs: [{ ar: 'شاشة 6.9 إنش', en: '6.9-inch display' }, { ar: 'شريحة A19 Pro', en: 'A19 Pro chip' }],
      source: P.oct14a,
      variants: [
        v('256-like', '256GB', 'like-new', 789, { warranty: 'trio3', posted: '2026-10-14' }),
        v('256-new', '256GB', 'new', 839, { warranty: 'trio3', notes: ['active'], posted: '2026-10-14', source: P.oct14b }),
        v('512-like', '512GB', 'like-new', 859, { warranty: 'trio3', posted: '2026-10-14' }),
        v('512-new', '512GB', 'new', 939, { warranty: 'trio3', notes: ['active'], posted: '2026-10-14' }),
        v('1tb-like', '1TB', 'like-new', 969, { posted: '2026-10-08', source: P.oct8 }),
        v('2tb-like', '2TB', 'like-new', 1039, { warranty: 'trio3', posted: '2026-10-14' }),
      ],
    },
    {
      id: 'iphone-17-pro', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 17 Pro', en: 'iPhone 17 Pro' },
      image: 'assets/devices/iphone-17-pro.jpg', offer: true,
      tagline: { ar: 'جديد بالكرتونة بحسب المنشور', en: 'New in box according to the post' },
      about: { ar: 'عرض منشور لـ iPhone 17 Pro بسعة 256GB، جديد بالكرتونة. مدة الكفالة لهذا الخيار غير موثقة هنا؛ أكّدها مع تريو.', en: 'Published offer for iPhone 17 Pro, 256GB, new in box. A warranty term for this option is not documented here; confirm it with Trio.' },
      specs: [], source: P.oct14a,
      variants: [v('256-new', '256GB', 'new', 829, { posted: '2026-10-14' })],
    },
    {
      id: 'iphone-17', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 17', en: 'iPhone 17' },
      image: 'assets/devices/iphone-17.webp', offer: true, featured: true,
      tagline: { ar: 'جديد مسكّر أو مستخدم بحالة الوكالة', en: 'Sealed new, or used in agency condition' },
      about: { ar: 'iPhone 17 بسعة 256GB: جديد مسكّر بالكرتونة No Active مع كفالة الوكيل سنة، أو مستخدم بحالة الوكالة.', en: 'iPhone 17, 256GB: sealed new and never activated with a 1-year agent warranty, or used in agency condition.' },
      specs: [{ ar: 'شاشة 6.3 إنش', en: '6.3-inch display' }, { ar: 'شريحة A19', en: 'A19 chip' }],
      source: P.oct14b,
      variants: [
        v('256-used', '256GB', 'used-agency', 555, { posted: '2026-10-14' }),
        v('256-new', '256GB', 'new-sealed', 655, { warranty: 'agent1', notes: ['noActive'], posted: '2026-10-14' }),
      ],
    },
    {
      id: 'iphone-17e', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 17e', en: 'iPhone 17e' },
      image: 'assets/devices/iphone-17e.png', offer: true,
      tagline: { ar: 'جديد مسكّر · كفالة الوكيل سنة', en: 'Sealed new · 1-year agent warranty' },
      about: { ar: 'iPhone 17e بسعة 256GB، جديد مسكّر بالكرتونة No Active، مع كفالة الوكيل لمدة سنة كاملة.', en: 'iPhone 17e, 256GB, sealed new and never activated, with a full 1-year agent warranty.' },
      specs: [], source: P.oct14a,
      variants: [v('256-new', '256GB', 'new-sealed', 500, { warranty: 'agent1', notes: ['noActive'], posted: '2026-10-14' })],
    },
    {
      id: 'iphone-16-pro', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 16 Pro', en: 'iPhone 16 Pro' },
      image: 'assets/devices/iphone-16-pro.jpg', offer: true,
      tagline: { ar: 'جديد مسكّر · كفالة Apple سنة', en: 'Sealed new · 1-year Apple warranty' },
      about: { ar: 'iPhone 16 Pro بسعة 512GB، جديد مسكّر بالكرتونة No Active، مع كفالة Apple لمدة سنة كاملة.', en: 'iPhone 16 Pro, 512GB, sealed new and never activated, with a full 1-year Apple warranty.' },
      specs: [], source: P.oct14a,
      variants: [v('512-new', '512GB', 'new-sealed', 749, { warranty: 'apple1', notes: ['noActive'], posted: '2026-10-14' })],
    },
    {
      id: 'iphone-16-pro-max', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 16 Pro Max', en: 'iPhone 16 Pro Max' },
      image: 'assets/devices/iphone-16-pro-max.jpg',
      tagline: { ar: 'مستعمل بس مش مستخدم · بحالة الجديد', en: 'Used but unused · like-new condition' },
      about: { ar: 'iPhone 16 Pro Max بسعة 256GB، مستعمل بس مش مستخدم وبحالة الجديد تماماً.', en: 'iPhone 16 Pro Max, 256GB, used but unused, in like-new condition.' },
      specs: [{ ar: 'شاشة 6.9 إنش', en: '6.9-inch display' }, { ar: 'شريحة A18 Pro', en: 'A18 Pro chip' }],
      source: P.oct8,
      variants: [v('256-like', '256GB', 'like-new', 639, { posted: '2026-10-08' })],
    },
    {
      id: 'iphone-16', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 16', en: 'iPhone 16' },
      image: 'assets/devices/iphone-16.jpg', offer: true,
      tagline: { ar: 'جديد مسكّر أو بحالة ممتازة كالجديد', en: 'Sealed new, or excellent like-new' },
      about: { ar: 'iPhone 16 بسعة 128GB: جديد مسكّر بالكرتونة No Active مع كفالة الوكيل سنة، أو مستعمل بحالة ممتازة كالجديد.', en: 'iPhone 16, 128GB: sealed new and never activated with a 1-year agent warranty, or used in excellent like-new condition.' },
      specs: [{ ar: 'شاشة 6.1 إنش', en: '6.1-inch display' }, { ar: 'شريحة A18', en: 'A18 chip' }],
      source: P.oct14a,
      variants: [
        v('128-like', '128GB', 'like-new', 459, { posted: '2026-10-08', source: P.oct8 }),
        v('128-new', '128GB', 'new-sealed', 559, { warranty: 'agent1', notes: ['noActive'], posted: '2026-10-14' }),
      ],
    },
    {
      id: 'iphone-15-pro-max', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 15 Pro Max', en: 'iPhone 15 Pro Max' },
      image: 'assets/devices/iphone-15-pro-max.jpg',
      tagline: { ar: 'جديد ومسكّر بالكرتونة', en: 'Brand new, sealed' },
      about: { ar: 'عرض منشور لـ iPhone 15 Pro Max جديد ومسكّر بالكرتونة بسعر 659 دينار. السعة مكتوبة في البوستر «255GB»؛ تُركت السعة غير محددة لحين تأكيدها من تريو.', en: 'Published offer for a brand-new, sealed iPhone 15 Pro Max at JD 659. The poster reads “255GB”; storage is left unspecified until Trio confirms it.' },
      specs: [{ ar: 'شاشة 6.7 إنش', en: '6.7-inch display' }, { ar: 'شريحة A17 Pro', en: 'A17 Pro chip' }],
      source: P.oct8,
      variants: [v('storage-unconfirmed', '', 'new-sealed', 659, { posted: '2026-10-08' })],
    },
    {
      id: 'iphone-15', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 15', en: 'iPhone 15' },
      image: 'assets/devices/iphone-15.jpg', offer: true,
      tagline: { ar: 'جديد مسكّر · كفالة الوكيل سنة', en: 'Sealed new · 1-year agent warranty' },
      about: { ar: 'iPhone 15 بسعة 128GB، جديد مسكّر بالكرتونة No Active، مع كفالة الوكيل لمدة سنة كاملة.', en: 'iPhone 15, 128GB, sealed new and never activated, with a full 1-year agent warranty.' },
      specs: [{ ar: 'شاشة 6.1 إنش', en: '6.1-inch display' }, { ar: 'شريحة A16 Bionic', en: 'A16 Bionic chip' }],
      source: P.oct14b,
      variants: [v('128-new', '128GB', 'new-sealed', 469, { warranty: 'agent1', notes: ['noActive'], posted: '2026-10-14' })],
    },
    {
      id: 'iphone-13', category: 'phones', brand: 'Apple', name: { ar: 'iPhone 13', en: 'iPhone 13' },
      image: 'assets/devices/iphone-13.jpg',
      tagline: { ar: 'مستعمل بس مش مستخدم', en: 'Used but unused' },
      about: { ar: 'iPhone 13 بسعة 128GB، مستعمل بس مش مستخدم.', en: 'iPhone 13, 128GB, used but unused.' },
      specs: [{ ar: 'شاشة 6.1 إنش', en: '6.1-inch display' }, { ar: 'شريحة A15 Bionic', en: 'A15 Bionic chip' }],
      source: P.oct8,
      variants: [v('128-used', '128GB', 'used', 229, { posted: '2026-10-08' })],
    },
    {
      id: 'galaxy-s26-plus', category: 'phones', brand: 'Samsung', name: { ar: 'Galaxy S26+', en: 'Galaxy S26+' },
      image: 'assets/devices/galaxy-s26-plus.png', featured: true,
      tagline: { ar: 'جديد مسكّر بالكرتونة', en: 'Sealed new in box' },
      about: { ar: 'Samsung Galaxy S26+ بسعة 512GB ورام 12GB، جديد مسكّر بالكرتونة.', en: 'Samsung Galaxy S26+ with 512GB storage and 12GB RAM, sealed new in box.' },
      specs: [{ ar: 'شاشة 6.7 إنش', en: '6.7-inch display' }, { ar: 'رام 12GB', en: '12GB RAM' }],
      source: P.oct11,
      variants: [v('512-new', '512GB', 'new-sealed', 549, { posted: '2026-10-11' })],
    },
    {
      id: 'galaxy-s25-fe', category: 'phones', brand: 'Samsung', name: { ar: 'Galaxy S25 FE', en: 'Galaxy S25 FE' },
      image: 'assets/devices/galaxy-s25-fe.webp',
      tagline: { ar: 'سامسونج إلها جوّها', en: 'Samsung has its own vibe' },
      about: { ar: 'Samsung Galaxy S25 FE بسعة 128GB ورام 8GB، جديد مسكّر بالكرتونة.', en: 'Samsung Galaxy S25 FE with 128GB storage and 8GB RAM, sealed new in box.' },
      specs: [{ ar: 'شاشة 6.7 إنش', en: '6.7-inch display' }, { ar: 'رام 8GB', en: '8GB RAM' }],
      source: P.oct11,
      variants: [v('128-new', '128GB', 'new-sealed', 299, { posted: '2026-10-11' })],
    },
    {
      id: 'apple-watch-s11', category: 'wearables', brand: 'Apple', name: { ar: 'Apple Watch Series 11', en: 'Apple Watch Series 11' },
      image: 'assets/devices/apple-watch.webp', featured: true,
      tagline: { ar: 'لكل يوم، ولكل ستايل', en: 'For every day, every style' },
      about: { ar: 'Apple Watch S11 جديدة مسكّرة بالكرتونة، بمقاسي 42mm و46mm.', en: 'Apple Watch S11, sealed new in box, in 42mm and 46mm.' },
      specs: [], source: P.oct7,
      variants: [
        v('42', '42mm', 'new-sealed', 269, { posted: '2026-10-07' }),
        v('46', '46mm', 'new-sealed', 279, { posted: '2026-10-07' }),
      ],
    },
    {
      id: 'apple-watch-ultra-3', category: 'wearables', brand: 'Apple', name: { ar: 'Apple Watch Ultra 3', en: 'Apple Watch Ultra 3' },
      image: 'assets/devices/apple-watch-ultra-3.png',
      tagline: { ar: 'أقوى. أذكى. أبعد.', en: 'Tougher. Smarter. Further.' },
      about: { ar: 'Apple Watch Ultra 3 جديدة مسكّرة بالكرتونة.', en: 'Apple Watch Ultra 3, sealed new in box.' },
      specs: [{ ar: 'مقاس 49mm', en: '49mm case' }], source: P.oct7,
      variants: [v('49', '49mm', 'new-sealed', 488, { posted: '2026-10-07' })],
    },
    {
      id: 'apple-watch-se-3', category: 'wearables', brand: 'Apple', name: { ar: 'Apple Watch SE 3', en: 'Apple Watch SE 3' },
      image: 'assets/devices/apple-watch-se-3.png',
      tagline: { ar: 'أكثر من مجرد ساعة', en: 'More than a watch' },
      about: { ar: 'Apple Watch SE 3 جديدة مسكّرة بالكرتونة، بمقاسي 40mm و44mm.', en: 'Apple Watch SE 3, sealed new in box, in 40mm and 44mm.' },
      specs: [], source: P.oct7,
      variants: [
        v('40', '40mm', 'new-sealed', 215, { posted: '2026-10-07' }),
        v('44', '44mm', 'new-sealed', 225, { posted: '2026-10-07' }),
      ],
    },
    {
      id: 'huawei-watch-gt6', category: 'wearables', brand: 'Huawei', name: { ar: 'Huawei Watch GT 6', en: 'Huawei Watch GT 6' },
      image: 'assets/devices/huawei-watch-gt6.webp',
      tagline: { ar: 'خيار جديد ليومك', en: 'A new choice for your day' },
      about: { ar: 'عرض منشور لـ Huawei Watch GT 6 جديدة ومسكّرة بالكرتونة. أكّد التوفر والتفاصيل الحالية مع تريو.', en: 'Published offer for a brand-new, sealed Huawei Watch GT 6. Confirm current availability and details with Trio.' },
      specs: [{ ar: 'شاشة AMOLED بقياس 1.47 إنش', en: '1.47-inch AMOLED display' }], source: P.oct4,
      variants: [v('one', '', 'new-sealed', 139, { posted: '2026-10-04' })],
    },
    {
      id: 'airpods-max-2', category: 'wearables', brand: 'Apple', name: { ar: 'AirPods Max 2', en: 'AirPods Max 2' },
      image: 'assets/devices/airpods-max.webp', featured: true,
      tagline: { ar: 'المنشور يذكر كل الألوان · كفالة Apple سنة', en: 'Post lists all colours · 1-year Apple warranty' },
      about: { ar: 'منشور تريو بتاريخ 17 تشرين الأول يذكر Apple AirPods Max 2 بجميع الألوان مع كفالة سنة من Apple. أكّد اللون والتوفر والكفالة الحالية مباشرة مع المحل.', en: 'Trio’s 17 October post lists Apple AirPods Max 2 in all colours with a 1-year Apple warranty. Confirm current colour, availability and warranty directly with the shop.' },
      specs: [], source: P.oct17,
      variants: [v('one', '', '', 339, { warranty: 'apple1', posted: '2026-10-17' })],
    },
    {
      id: 'macbook-pro-16-m5-max', category: 'computers', brand: 'Apple', name: { ar: 'MacBook Pro 16" M5 Max', en: 'MacBook Pro 16" M5 Max' },
      image: 'assets/devices/macbook-pro.webp',
      tagline: { ar: 'أقوى.. أسرع.. للمحترفين بلا حدود', en: 'Stronger, faster, for professionals' },
      about: { ar: 'MacBook Pro بقياس 16 إنش مع شريحة M5 Max، ذاكرة 64GB وسعة 2TB، جديد ومسكّر بالكرتونة.', en: '16-inch MacBook Pro with M5 Max, 64GB memory and 2TB storage, brand new and sealed.' },
      specs: [{ ar: 'شاشة Liquid Retina XDR بقياس 16 إنش', en: '16-inch Liquid Retina XDR display' }], source: P.oct1,
      variants: [v('64-2tb', '64GB · 2TB', 'new-sealed', 3999, { posted: '2026-10-01' })],
    },
    {
      id: 'macbook-pro-16-m5-pro', category: 'computers', brand: 'Apple', name: { ar: 'MacBook Pro 16" M5 Pro', en: 'MacBook Pro 16" M5 Pro' },
      image: 'assets/devices/macbook-pro.webp', featured: true,
      tagline: { ar: 'قوة أكبر.. لطموحات أكبر', en: 'More power for bigger plans' },
      about: { ar: 'MacBook Pro بقياس 16 إنش مع شريحة M5 Pro، جديد ومسكّر بالكرتونة، بثلاث سعات. وفي نسخة MDM (جهاز مُدار) بسعر أقل.', en: '16-inch MacBook Pro with M5 Pro, brand new and sealed, in three configurations, plus a lower-priced MDM (managed device) unit.' },
      specs: [{ ar: 'شاشة Liquid Retina XDR بقياس 16 إنش', en: '16-inch Liquid Retina XDR display' }], source: P.oct1,
      variants: [
        v('48-1tb-mdm', '48GB · 1TB', 'new-sealed', 1949, { notes: ['mdm'], posted: '2026-10-01' }),
        v('24-1tb', '24GB · 1TB', 'new-sealed', 2249, { posted: '2026-10-01' }),
        v('48-1tb', '48GB · 1TB', 'new-sealed', 2549, { posted: '2026-10-01' }),
        v('48-2tb', '48GB · 2TB', 'new-sealed', 2749, { posted: '2026-10-01' }),
      ],
    },
    {
      id: 'macbook-pro-14-m5-pro', category: 'computers', brand: 'Apple', name: { ar: 'MacBook Pro 14" M5 Pro', en: 'MacBook Pro 14" M5 Pro' },
      image: 'assets/devices/macbook-pro-14-m5-pro.png',
      tagline: { ar: 'أداء احترافي.. بحجم مثالي', en: 'Pro performance, ideal size' },
      about: { ar: 'MacBook Pro بقياس 14 إنش مع شريحة M5 Pro، ذاكرة 24GB وسعة 1TB، جديد ومسكّر بالكرتونة. وفي نسخة MDM (جهاز مُدار) بسعر أقل.', en: '14-inch MacBook Pro with M5 Pro, 24GB memory and 1TB storage, brand new and sealed, plus a lower-priced MDM (managed device) unit.' },
      specs: [{ ar: 'شاشة Liquid Retina XDR بقياس 14 إنش', en: '14-inch Liquid Retina XDR display' }], source: P.oct1,
      variants: [
        v('24-1tb-mdm', '24GB · 1TB', 'new-sealed', 1499, { notes: ['mdm'], posted: '2026-10-01' }),
        v('24-1tb', '24GB · 1TB', 'new-sealed', 1999, { posted: '2026-10-01' }),
      ],
    },
    {
      id: 'macbook-air-15-m5', category: 'computers', brand: 'Apple', name: { ar: 'MacBook Air 15" M5', en: 'MacBook Air 15" M5' },
      image: 'assets/devices/macbook-air.webp', featured: true,
      tagline: { ar: 'مكفول سنة كاملة من Apple', en: 'Full 1-year Apple warranty' },
      about: { ar: 'MacBook Air M5 بقياس 15 إنش، رام 16GB وسعة 512GB، مكفول سنة كاملة من Apple.', en: '15-inch MacBook Air M5 with 16GB RAM and 512GB storage, with a full 1-year Apple warranty.' },
      specs: [], source: P.oct6,
      variants: [v('16-512', '16GB · 512GB', '', 888, { warranty: 'apple1', posted: '2026-10-06' })],
    },
    {
      id: 'ipad-a16', category: 'computers', brand: 'Apple', name: { ar: 'iPad A16', en: 'iPad A16' },
      image: 'assets/devices/ipad.webp',
      tagline: { ar: 'خيارات Wi‑Fi من المنشور', en: 'Wi‑Fi options from the post' },
      about: { ar: 'عروض منشورة لـ iPad A16 جديد مسكّر بالكرتونة بنسخة Wi‑Fi بسعتي 128GB و256GB. لم نربط خيار 128GB بسعر 379 دينار بنوع اتصال لأن ربط صور المنشور غير واضح؛ أكّد أي خيار خلوي مع تريو.', en: 'Published offers for sealed-new iPad A16 Wi‑Fi in 128GB and 256GB. The 128GB/JD 379 image was not assigned a connectivity type because the post’s image mapping is unclear; confirm any cellular option with Trio.' },
      specs: [], source: P.aug20,
      variants: [
        v('wifi-128', 'Wi‑Fi · 128GB', 'new-sealed', 329, { posted: '2026-08-20' }),
        v('wifi-256', 'Wi‑Fi · 256GB', 'new-sealed', 379, { posted: '2026-08-20' }),
      ],
    },
    {
      id: 'ipad-pro-m5', category: 'computers', brand: 'Apple', name: { ar: 'iPad Pro M5', en: 'iPad Pro M5' },
      image: 'assets/devices/ipad-pro-m5.png',
      tagline: { ar: 'قوة الـ M5 · 11 و13 إنش', en: 'M5 power · 11 and 13 inch' },
      about: { ar: 'عروض منشورة لـ iPad Pro مع شريحة M5 بقياسي 11 و13 إنش، جديد No Active مع الكرتونة. خيار 11 إنش بسعة 512GB غير معروض هنا لتعارض السعر بين صور المنشور؛ أكّده مباشرة مع تريو.', en: 'Published offers for iPad Pro with M5 in 11-inch and 13-inch, new and never activated, with box. The 11-inch/512GB option is omitted because its price conflicts across the post’s images; confirm it directly with Trio.' },
      specs: [], source: P.aug20,
      variants: [
        v('11-256', '11" · 256GB', 'new', 799, { notes: ['noActive'], posted: '2026-08-20' }),
        v('13-256', '13" · 256GB', 'new', 899, { notes: ['noActive'], posted: '2026-08-20' }),
        v('13-512', '13" · 512GB', 'new', 1039, { notes: ['noActive'], posted: '2026-08-20' }),
      ],
    },
    {
      id: 'airtag', category: 'accessories', brand: 'Apple', name: { ar: 'AirTag', en: 'AirTag' },
      image: 'assets/devices/airtag.webp',
      tagline: { ar: 'خلّي AirTag يدور عن أغراضك بدالك', en: 'Let AirTag find your things' },
      about: { ar: 'Apple AirTag جديد مسكّر بالكرتونة. صغير بالحجم، بس بيساعدك تضل عارف وين أغراضك المهمة.', en: 'Apple AirTag, sealed new in box. Small, but it helps you keep track of what matters.' },
      specs: [], source: P.sep30,
      variants: [v('one', '', 'new-sealed', 28, { posted: '2026-09-30' })],
    },
  ],
};

export default seed;
