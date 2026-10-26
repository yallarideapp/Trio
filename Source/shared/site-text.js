// Editable public copy. Catalog names, specifications and contact details remain
// in their existing content fields. Values are plain text, never HTML.
import { conditions, conditionShort, notes, warranties, governorates } from './labels.js';

export const SITE_TEXT_LIMIT = 5000;
export const MAX_SITE_TEXT_TOTAL = 500000;

export const storeCopy = {
  ar: {
    title: 'TRIO Mobile | تريو موبايل', home: 'الرئيسية', shop: 'الأجهزة', offers: 'العروض', saved: 'المفضلة', bag: 'السلة',
    maintenance: 'الصيانة', tradein: 'التبديل', contact: 'زورونا', switchLang: 'Switch to English', menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة',
    heroLine1: 'إحنا اللعبة', heroLine2: 'الجديدة.', heroShop: 'تسوّق الأجهزة', browse: 'تصفّح الأجهزة', heroChoose: 'اختار نوع الجهاز',
    from: 'من', view: 'شوف الجهاز', choose: 'اختار السعة', add: 'أضف للسلة', added: 'انضاف للسلة', soldOut: 'غير متوفر', unavailable: 'غير متوفر حالياً',
    save: 'حفظ الجهاز', unsave: 'إلغاء الحفظ', savedNow: 'انحفظ بالمفضلة.', viewSaved: 'شوف المفضلة', unsavedNow: 'انشال من المفضلة.',
    lookingFor: 'عن ماذا تبحث', categories: 'تسوّق حسب القسم', allDevices: 'شاهد كل الأجهزة', offersAll: 'كل العروض',
    count: (n) => n === 2 ? 'جهازين' : `${n} ${n === 1 ? 'جهاز' : n <= 10 ? 'أجهزة' : 'جهاز'}`,
    trust: [['اعثر على جهازك', 'ابحث حسب الماركة ونوع الجهاز'], ['قارن الخيارات', 'السعة والحالة في مكان واحد'], ['احفظ مفضلتك', 'ارجع للأجهزة اللي عجبتك'], ['بيع · شراء · تبديل', 'وصيانة احترافية بالمحل']],
    servicesTitle: 'بيع، شراء، تبديل وصيانة', servicesText: 'جهازك القديم ممكن يكون بداية جهازك الجديد. احكيلنا عنه، أو جيبه للصيانة.', repairCta: 'احكي معنا عن الصيانة', tradeCta: 'اسأل عن التبديل',
    aboutTitle: 'مش بس محل موبايلات.', aboutText: 'بيع وشراء وتبديل الأجهزة، وصيانة احترافية.', followTitle: 'تابع الجديد من تريو', follow: 'افتح إنستغرام',
    collection: 'تشكيلة تريو', shopIntro: 'تصفّح الأجهزة وقارن المواصفات والسعات والحالات.', offersTitle: 'عروض تريو', offersIntro: 'اكتشف العروض واختر الجهاز اللي بناسبك.',
    search: 'ابحث عن جهاز', searchPlaceholder: 'اسم الجهاز أو الماركة…', brand: 'الماركة', allBrands: 'كل الماركات', sort: 'الترتيب', featured: 'الترتيب المقترح',
    priceLow: 'السعر: من الأقل', priceHigh: 'السعر: من الأعلى', nameSort: 'حسب الاسم', condAll: 'كل الحالات', condNew: 'جديد', condUsed: 'مستعمل بحالة الجديد',
    filters: 'فلترة وترتيب', clear: 'امسح البحث والفلاتر', noResults: 'ما لقينا أجهزة بهالبحث.', noResultsText: 'جرّب كلمة ثانية أو امسح الفلاتر.',
    savedIntro: 'الأجهزة اللي عجبتك، كلها بمكان واحد.', noSaved: 'لسه ما حفظت أجهزة.', noSavedText: 'اضغط القلب على أي جهاز ليرجع يظهر هون.',
    stockLabel: 'الكمية المتوفرة', quantityLimit: 'وصلت للحد المسموح لهذا الخيار.', batteryHealth: 'صحة البطارية', batteryCycles: 'عدد دورات شحن البطارية',
    details: 'المواصفات التقنية', configuration: 'التهيئة', condition: 'الحالة', warranty: 'الكفالة', options: 'الخيارات', related: 'من نفس القسم', backCategory: 'كل أجهزة القسم',
    askWhatsapp: 'اسأل على واتساب', call: 'اتصل بتريو', ask: 'اسألنا على إنستغرام', source: 'شوف المنشور على إنستغرام', imageCard: 'صورة الجهاز قريباً',
    notFound: 'الجهاز مش موجود بهالقائمة.', notFoundText: 'ارجع للأجهزة لتشوف تشكيلة تريو.',
    bagTitle: 'السلة', bagEmpty: 'السلة فاضية.', bagEmptyText: 'اختار جهاز وأضفه للسلة.', remove: 'شيل', qty: 'العدد', subtotal: 'المجموع', delivery: 'التوصيل', deliveryValue: 'نأكده معك بالاتصال',
    total: 'المجموع', bagFull: 'السلة فيها أكبر عدد أجهزة لطلب واحد.', checkout: 'أكمل الطلب', checkoutLive: 'أكمل الطلب', keepShopping: 'كمّل تسوّق', bagFixed: 'تحدّثت السلة حسب الكميات المتوفرة.',
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
    heroLine1: 'A whole', heroLine2: 'new game.', heroShop: 'Shop devices', browse: 'Browse devices', heroChoose: 'Choose a device type',
    from: 'from', view: 'View device', choose: 'Choose option', add: 'Add to bag', added: 'Added to bag', soldOut: 'Out of stock', unavailable: 'Not available right now',
    save: 'Save device', unsave: 'Remove from saved', savedNow: 'Saved.', viewSaved: 'View saved', unsavedNow: 'Removed from saved.',
    lookingFor: 'What are you looking for?', categories: 'Shop by category', allDevices: 'View all devices', offersAll: 'All offers',
    count: (n) => `${n} ${n === 1 ? 'device' : 'devices'}`,
    trust: [['Find your device', 'Search by brand and category'], ['Compare options', 'Storage and condition together'], ['Save your favorites', 'Keep the devices you like'], ['Buy · Sell · Trade in', 'And professional repair in store']],
    servicesTitle: 'Buy, sell, trade in and repair', servicesText: 'Your old device can be the start of your new one. Tell us about it, or bring it in for repair.', repairCta: 'Ask about a repair', tradeCta: 'Ask about trade-in',
    aboutTitle: 'More than a mobile store.', aboutText: 'Buy, sell and trade in devices, with professional repair.', followTitle: 'Catch the latest from Trio', follow: 'Open Instagram',
    collection: 'THE TRIO COLLECTION', shopIntro: 'Explore devices and compare specifications, storage and condition.', offersTitle: 'Trio offers', offersIntro: 'Explore offers and find your next device.',
    search: 'Search devices', searchPlaceholder: 'Device name or brand…', brand: 'Brand', allBrands: 'All brands', sort: 'Sort', featured: 'Featured',
    priceLow: 'Price: low to high', priceHigh: 'Price: high to low', nameSort: 'Name A–Z', condAll: 'Any condition', condNew: 'New', condUsed: 'Used like new',
    filters: 'Filters', clear: 'Clear search and filters', noResults: 'No devices match this search.', noResultsText: 'Try another word or clear the filters.',
    savedIntro: 'The devices you like, all in one place.', noSaved: 'Nothing saved yet.', noSavedText: 'Tap the heart on a device to save it here.',
    stockLabel: 'Available quantity', quantityLimit: 'You have reached the quantity limit for this option.', batteryHealth: 'Battery health', batteryCycles: 'Battery cycle count',
    details: 'Technical specifications', configuration: 'Configuration', condition: 'Condition', warranty: 'Warranty', options: 'Options', related: 'More in this category', backCategory: 'Back to category',
    askWhatsapp: 'Ask on WhatsApp', call: 'Call Trio', ask: 'Ask us on Instagram', source: 'See the post on Instagram', imageCard: 'Photo coming soon',
    notFound: 'This device is not in the collection.', notFoundText: 'Browse devices to explore Trio’s collection.',
    bagTitle: 'Your bag', bagEmpty: 'Your bag is empty.', bagEmptyText: 'Pick a device and add it to your bag.', remove: 'Remove', qty: 'Qty', subtotal: 'Subtotal', delivery: 'Delivery', deliveryValue: 'Confirmed by phone',
    total: 'Total', bagFull: 'Your bag holds the most devices one order can take.', checkout: 'Checkout', checkoutLive: 'Checkout', keepShopping: 'Keep shopping', bagFixed: 'Your bag was updated to match current stock.',
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

Object.assign(storeCopy.ar.errors, { 'storage-full': 'مساحة المتصفح غير كافية لحفظ الطلب.', 'storage-unavailable': 'تخزين المتصفح غير متاح. فعّله وحاول مجدداً.', 'storage-invalid': 'تعذّر قراءة بيانات العرض المحفوظة في هذا المتصفح.', 'orders-full': 'وصل سجل العرض إلى الحد الأقصى من الطلبات.', 'token-conflict': 'تغيّر الحساب أو تفاصيل الطلب. راجع البيانات وحاول مجدداً.', 'signed-out': 'تغيّرت جلسة الحساب. راجع بياناتك وحاول مجدداً.', generic: 'تعذّر حفظ الطلب. حاول مجدداً.' });
Object.assign(storeCopy.en.errors, { 'storage-full': 'Your browser does not have enough space to save the order.', 'storage-unavailable': 'Browser storage is unavailable. Enable it and try again.', 'storage-invalid': 'Could not read the saved demo data in this browser.', 'orders-full': 'The demo order history is full.', 'token-conflict': 'Your account or order details changed. Review checkout and try again.', 'signed-out': 'Your account session changed. Review checkout and try again.', generic: 'Could not save your order. Please try again.' });
storeCopy.ar.errors['stock-limit'] = 'الكمية المطلوبة أكبر من المخزون المتوفر. راجع السلة.';
storeCopy.en.errors['stock-limit'] = 'The quantity exceeds current stock. Review your bag.';
// Offer prices: the old price is crossed out and the saving is shown on the device page.
storeCopy.ar.offerSave = 'بتوفّر'; storeCopy.en.offerSave = 'You save';

export const accountCopy = {
  ar: { title: 'حسابي', signin: 'تسجيل الدخول', create: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور', repeat: 'تأكيد كلمة المرور', name: 'الاسم', mobile: 'رقم الموبايل', save: 'احفظ التعديلات', signout: 'تسجيل الخروج', profile: 'معلومات الحساب', orders: 'طلباتي', empty: 'لا توجد طلبات مرتبطة بحسابك بعد.', loading: 'جارٍ تحميل حسابك…', unavailable: 'تسجيل الحسابات غير مفعّل بعد', unavailableText: 'يتم ربط خدمة حسابات العملاء. سيُفعّل إنشاء الحساب وتسجيل الدخول بعد اتصالها بالموقع.', passwordHint: '16 حرفاً على الأقل.', change: 'تغيير كلمة المرور', current: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', saved: 'تم حفظ التعديلات.', created: 'تم إنشاء حسابك.', mismatch: 'كلمتا المرور غير متطابقتين.', generic: 'تعذّر إكمال العملية. حاول مرة أخرى.', network: 'تعذّر الاتصال بخدمة الحسابات.', more: 'عرض طلبات أقدم', browse: 'تصفّح الأجهزة', new: 'جديد', confirmed: 'مؤكد', out: 'قيد التوصيل', delivered: 'تم التسليم', cancelled: 'ملغي', 'bad-credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'bad-email': 'اكتب بريداً إلكترونياً صحيحاً.', 'bad-name': 'اكتب اسماً من حرفين على الأقل.', 'bad-mobile': 'اكتب رقم موبايل أردنياً صحيحاً، أو اتركه فارغاً.', 'weak-password': 'استخدم كلمة مرور من 16 حرفاً على الأقل.', 'email-in-use': 'هذا البريد مسجّل بالفعل. سجّل الدخول بحسابك.', locked: 'محاولات كثيرة. انتظر قليلاً وحاول مجدداً.', 'signed-out': 'انتهت الجلسة. سجّل الدخول مجدداً.' },
  en: { title: 'My account', signin: 'Sign in', create: 'Create account', email: 'Email address', password: 'Password', repeat: 'Confirm password', name: 'Name', mobile: 'Mobile number', save: 'Save changes', signout: 'Sign out', profile: 'Account details', orders: 'My orders', empty: 'No orders are linked to your account yet.', loading: 'Loading your account…', unavailable: 'Customer accounts are not active yet', unavailableText: 'Trio’s customer account service is being connected. Registration and sign-in will be enabled once it is connected to the website.', passwordHint: 'At least 16 characters.', change: 'Change password', current: 'Current password', newPassword: 'New password', saved: 'Changes saved.', created: 'Your account has been created.', mismatch: 'Passwords do not match.', generic: 'Could not complete this request. Please try again.', network: 'Could not connect to the account service.', more: 'Show older orders', browse: 'Browse devices', new: 'New', confirmed: 'Confirmed', out: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled', 'bad-credentials': 'The email address or password is incorrect.', 'bad-email': 'Enter a valid email address.', 'bad-name': 'Enter a name with at least two characters.', 'bad-mobile': 'Enter a valid Jordanian mobile number, or leave it empty.', 'weak-password': 'Use a password with at least 16 characters.', 'email-in-use': 'This email is already registered. Sign in to your account.', locked: 'Too many attempts. Please wait and try again.', 'signed-out': 'Your session ended. Please sign in again.' },
};
Object.assign(accountCopy.ar, { retry: 'حاول مجدداً', ordersError: 'تعذّر تحميل طلباتك. حاول مجدداً.', signedIn: 'تم تسجيل الدخول.', demoTitle: 'حساب تجريبي للعرض', demoText: 'استخدم بيانات تجريبية. الحساب محفوظ على هذا المتصفح فقط حتى ربط خدمة الحسابات.', sample: 'جرّب حساب العرض', 'storage-full': 'مساحة المتصفح غير كافية لحفظ التغييرات.', 'storage-unavailable': 'التخزين في المتصفح غير متاح. فعّله وحاول مجدداً.' });
Object.assign(accountCopy.en, { retry: 'Try again', ordersError: 'Could not load your orders. Please try again.', signedIn: 'You are signed in.', demoTitle: 'Owner demonstration account', demoText: 'Use sample details. Your account stays on this browser until the shared service is connected.', sample: 'Try a sample account', 'storage-full': 'Your browser does not have enough space to save these changes.', 'storage-unavailable': 'Browser storage is unavailable. Enable it and try again.' });
Object.assign(accountCopy.ar, { 'accounts-full': 'وصل العرض إلى الحد الأقصى من الحسابات.', 'storage-invalid': 'تعذّر قراءة بيانات العرض المحفوظة في هذا المتصفح.' });
Object.assign(accountCopy.en, { 'accounts-full': 'The demo has reached its account limit.', 'storage-invalid': 'Could not read the saved demo data in this browser.' });

const extraPairs = {
  "all": {
    "ar": "الكل",
    "en": "All"
  },
  "breadcrumb": {
    "ar": "مسار التصفح",
    "en": "Breadcrumb"
  },
  "closeSearch": {
    "ar": "إغلاق البحث",
    "en": "Close search"
  },
  "storePhotoAlt": {
    "ar": "داخل محل تريو موبايل",
    "en": "Inside Trio Mobile"
  },
  "storyEyebrow": {
    "ar": "THIS IS TRIO.",
    "en": "THIS IS TRIO."
  },
  "adminPanel": {
    "ar": "لوحة التحكم",
    "en": "Admin panel"
  },
  "demoAdmin": {
    "ar": "نسخة عرض · لوحة التحكم",
    "en": "Demo · Admin panel"
  },
  "footerTrademark": {
    "ar": "متجر مستقل وغير تابع لـ Apple أو Samsung أو Huawei. الأسماء والعلامات التجارية لأصحابها.",
    "en": "Independent store, not affiliated with Apple, Samsung or Huawei. Names and trademarks belong to their owners."
  },
  "viewCategory": {
    "ar": "كل {category}",
    "en": "View {category}"
  },
  "countOne": {
    "ar": "{count} جهاز",
    "en": "{count} device"
  },
  "countTwo": {
    "ar": "جهازين",
    "en": "{count} devices"
  },
  "countFew": {
    "ar": "{count} أجهزة",
    "en": "{count} devices"
  },
  "countMany": {
    "ar": "{count} جهاز",
    "en": "{count} devices"
  },
  "brandName": {
    "ar": "TRIO",
    "en": "TRIO"
  },
  "brandSubtitle": {
    "ar": "MOBILE",
    "en": "MOBILE"
  },
  "brandFull": {
    "ar": "TRIO Mobile",
    "en": "TRIO Mobile"
  },
  "servicesEyebrow": {
    "ar": "TRIO MOBILE",
    "en": "TRIO MOBILE"
  },
  "copyright": {
    "ar": "© 2026 TRIO Mobile.",
    "en": "© 2026 TRIO Mobile."
  },
  "socialHandle": {
    "ar": "@trio_mobile.jo",
    "en": "@trio_mobile.jo"
  },
  "instagramLabel": {
    "ar": "Instagram",
    "en": "Instagram"
  },
  "facebookLabel": {
    "ar": "Facebook",
    "en": "Facebook"
  },
  "languageButton": {
    "ar": "English",
    "en": "عربي"
  },
  "metaDescription": {
    "ar": "TRIO Mobile — بيع، شراء، تبديل وصيانة احترافية. تصفّح الهواتف واللابتوب والتابلت والساعات، وقارن المواصفات والسعات. خلدا، عمّان.",
    "en": "Buy, sell, trade in and professional repair. Explore phones, laptops, tablets and watches. Compare device specifications and configurations. Khalda, Amman."
  },
  "socialTitle": {
    "ar": "TRIO Mobile — تريو موبايل",
    "en": "TRIO Mobile — تريو موبايل"
  }
};
const shellPairs = [
  {
    "kind": "text",
    "ar": "انتقل إلى المحتوى",
    "en": "Skip to content"
  },
  {
    "kind": "label",
    "ar": "التنقل الرئيسي",
    "en": "Main navigation"
  },
  {
    "kind": "text",
    "ar": "الرئيسية",
    "en": "Home"
  },
  {
    "kind": "text",
    "ar": "الأجهزة",
    "en": "Devices"
  },
  {
    "kind": "text",
    "ar": "العروض",
    "en": "Offers"
  },
  {
    "kind": "text",
    "ar": "الصيانة",
    "en": "Repair"
  },
  {
    "kind": "text",
    "ar": "التبديل",
    "en": "Trade in"
  },
  {
    "kind": "text",
    "ar": "زورونا",
    "en": "Visit us"
  },
  {
    "kind": "text",
    "ar": "ابحث عن جهاز",
    "en": "Search devices"
  },
  {
    "kind": "placeholder",
    "ar": "ابحث عن جهاز…",
    "en": "Search devices…"
  },
  {
    "kind": "label",
    "ar": "المفضلة",
    "en": "Saved devices"
  },
  {
    "kind": "label",
    "ar": "السلة",
    "en": "Bag"
  },
  {
    "kind": "label",
    "ar": "قائمة الهاتف",
    "en": "Mobile navigation"
  },
  {
    "kind": "text",
    "ar": "كل الأجهزة",
    "en": "All devices"
  },
  {
    "kind": "text",
    "ar": "المفضلة",
    "en": "Saved"
  },
  {
    "kind": "text",
    "ar": "معاينة محلية — تعديلات هذا المتصفح فقط، وليست منشورة للزوار.",
    "en": "Local preview — changes are saved in this browser only and are not published for visitors."
  },
  {
    "kind": "text",
    "ar": "عدّل المعاينة",
    "en": "Edit preview"
  },
  {
    "kind": "text",
    "ar": "الموقع المنشور",
    "en": "Published site"
  },
  {
    "kind": "label",
    "ar": "لوحة التحكم",
    "en": "Admin panel"
  },
  {
    "kind": "text",
    "ar": "لوحة التحكم",
    "en": "Admin panel"
  },
  {
    "kind": "text",
    "ar": "بيع · شراء · تبديل · صيانة احترافية",
    "en": "Buy · Sell · Trade in · Professional repair"
  },
  {
    "kind": "label",
    "ar": "روابط المتجر",
    "en": "Store links"
  },
  {
    "kind": "text",
    "ar": "المفضلة",
    "en": "Saved devices"
  },
  {
    "kind": "text",
    "ar": "واتساب",
    "en": "WhatsApp"
  },
  {
    "kind": "text",
    "ar": "الخريطة",
    "en": "Directions"
  },
  {
    "kind": "text",
    "ar": "خلدا · عمّان",
    "en": "Khalda · Amman"
  },
  {
    "kind": "text",
    "ar": "متجر مستقل وغير تابع لـ Apple أو Samsung أو Huawei. الأسماء والعلامات التجارية لأصحابها.",
    "en": "Independent store, not affiliated with Apple, Samsung or Huawei. Names and trademarks belong to their owners."
  },
  {
    "kind": "label",
    "ar": "التنقل السريع",
    "en": "Quick navigation"
  },
  {
    "kind": "text",
    "ar": "السلة",
    "en": "Bag"
  }
];

const localizePairs = (source, language) => Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value[language]]));
export const extraCopy = { ar: localizePairs(extraPairs, 'ar'), en: localizePairs(extraPairs, 'en') };
export const labelsCopy = Object.fromEntries(['ar', 'en'].map((language) => [language, {
  conditions: localizePairs(conditions, language), conditionShort: localizePairs(conditionShort, language),
  notes: localizePairs(notes, language), warranties: localizePairs(warranties, language),
  governorates: Object.fromEntries(governorates.map(([id, ar, en]) => [id, language === 'ar' ? ar : en])),
}]));
const copies = { store: storeCopy, account: accountCopy, labels: labelsCopy, extra: extraCopy, shell: { ar: {}, en: {} } };
const entries = [];
function collect(scope, ar, en, path = []) {
  if (typeof ar === 'string' && typeof en === 'string') {
    entries.push({ id: [scope, ...path].join('.'), section: scope, defaults: { ar, en } });
  } else if (ar && en && typeof ar === 'object' && typeof en === 'object') {
    for (const key of Object.keys(ar)) if (Object.hasOwn(en, key)) collect(scope, ar[key], en[key], [...path, key]);
  }
}
for (const scope of ['store', 'account', 'labels', 'extra']) collect(scope, copies[scope].ar, copies[scope].en);
const pairKey = (ar, en) => JSON.stringify([ar, en]);
const shellLookup = new Map();
const knownPairs = new Map();
for (const entry of entries) if (['store', 'account', 'extra'].includes(entry.section) && !knownPairs.has(pairKey(entry.defaults.ar, entry.defaults.en))) knownPairs.set(pairKey(entry.defaults.ar, entry.defaults.en), entry.id);
function shellHash(value) { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
for (const pair of shellPairs) {
  const key = pairKey(pair.ar, pair.en);
  let id = knownPairs.get(key);
  if (!id) {
    const name = pair.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'text';
    id = 'shell.' + name + '-' + shellHash(key);
    const field = id.slice(6);
    copies.shell.ar[field] = pair.ar; copies.shell.en[field] = pair.en;
    entries.push({ id, section: 'shell', defaults: { ar: pair.ar, en: pair.en } });
    knownPairs.set(key, id);
  }
  shellLookup.set(pair.kind + ':' + key, id);
}
export const siteTextEntries = entries;
const registry = new Map(entries.map((entry) => [entry.id, entry]));
export const shellTextId = (ar, en, kind = 'text') => shellLookup.get(kind + ':' + pairKey(ar, en)) || knownPairs.get(pairKey(ar, en)) || '';

// Accept ordinary records from another browser realm as well as JSON records.
// Known IDs and own translation keys below prevent prototype keys being stored.
const plainObject = (value) => value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
export function validSiteText(value) {
  if (value === undefined || value === null) return true;
  if (!plainObject(value)) return false;
  const ids = Object.keys(value);
  if (ids.length > registry.size) return false;
  let total = 0;
  for (const id of ids) {
    if (!registry.has(id) || !plainObject(value[id])) return false;
    const pair = value[id];
    for (const language of Object.keys(pair)) {
      if (!['ar', 'en'].includes(language) || typeof pair[language] !== 'string' || pair[language].length > SITE_TEXT_LIMIT) return false;
      total += pair[language].length;
      if (total > MAX_SITE_TEXT_TOTAL) return false;
    }
  }
  return true;
}
export const validHeroMode = (value) => value === undefined || value === null || value === 'default' || value === 'selected';
// Keep only supplied translations; empty inputs restore the built-in text.
export function normalizeSiteText(value) {
  if (!validSiteText(value)) return {};
  return Object.fromEntries(Object.entries(value || {}).map(([id, pair]) => [id, Object.fromEntries(Object.entries(pair).filter(([, text]) => text.trim()))]).filter(([, pair]) => Object.keys(pair).length));
}
export function siteText(settings, id, language, fallback) {
  const lang = language === 'en' ? 'en' : 'ar';
  const pair = registry.has(id) && settings?.siteText && Object.hasOwn(settings.siteText, id) ? settings.siteText[id] : undefined;
  const override = pair && Object.hasOwn(pair, lang) ? pair[lang] : undefined;
  if (typeof override === 'string' && override.length <= SITE_TEXT_LIMIT && override.trim()) return override;
  return fallback !== undefined ? fallback : registry.get(id)?.defaults[lang] ?? '';
}
export function resolvedCopy(settings, scope, language) {
  const lang = language === 'en' ? 'en' : 'ar';
  const source = copies[scope]?.[lang];
  const resolve = (value, path) => {
    if (typeof value === 'string') return siteText(settings, [scope, ...path].join('.'), lang, value);
    if (Array.isArray(value)) return value.map((item, index) => resolve(item, [...path, String(index)]));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, [...path, key])]));
    return value; // Functions such as the original count formatter stay callable.
  };
  return source ? resolve(source, []) : {};
}
