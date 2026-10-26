import { api, local, MODE, ApiError, withDefaults } from '../../src/store.js';
import { forwardArrow } from '../../../shared/navigation.js';
import { validPrice, toFils, formatJD, fromPrice, normaliseMobile, validStockQuantity, MAX_STOCK_QUANTITY, validOfferPrice, inOffers } from '../../../shared/pricing.js';
import { conditions, conditionGroup, conditionOptions, notes as noteLabels, warranties, orderStatuses, governorates } from '../../../shared/labels.js';
import { pagesAdmin } from './pages-store.js';
import deviceSpecifications from '../../../shared/device-specs.js';
import { applyHomePlacement } from '../../../shared/home-placement.js';
import { validBatteryHealth, validBatteryCycles } from '../../../shared/battery.js';
import { MAX_CATEGORIES, CATEGORY_NAME_LIMIT, validCategoryId, validCategoryName, validCategoryImage } from '../../../shared/categories.js';
import { siteTextEntries, siteText, SITE_TEXT_LIMIT, validSiteText, validHeroMode } from '../../../shared/site-text.js';
import { PREVIEW_KEY } from '../../src/pages-preview.js';
import { categoryArtworkSource } from '../../../shared/home-artwork.js';
import { availabilitySummary, setDeviceSoldOut } from '../../../shared/availability.js';

const IS_PAGES = MODE === 'pages';
const USE_TECHNICAL = MODE !== 'demo';
const adminApi = IS_PAGES ? pagesAdmin : api.admin;
const orderApi = IS_PAGES ? api.demoOrders : adminApi;
const draftKey = IS_PAGES ? 'trio-pages-editor-draft-v1' : 'trio-admin-draft';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (v) => JSON.parse(JSON.stringify(v));

const AR = {
  'Device stock': 'مخزون الجهاز', 'In stock': 'متوفر', 'Some options are out of stock': 'بعض الخيارات غير متوفرة', 'Manage stock': 'عدّل المخزون',
  '{available} of {total} options available': '{available} من {total} خيارات متوفرة', 'Mark all options out of stock': 'اجعل كل الخيارات غير متوفرة', 'Clear manual out-of-stock flags': 'ألغِ التعطيل اليدوي للخيارات',
  'The out-of-stock checkbox below applies only to that option.': 'خيار «غير متوفر» بالأسفل يخص ذلك الخيار فقط.', 'A quantity of 0 stays out of stock. Update the quantity to make that option available.': 'الكمية 0 تبقى غير متوفرة. عدّل الكمية لإتاحة ذلك الخيار.',
  'Stock updated. Save your changes to apply it.': 'تم تعديل المخزون. احفظ التعديلات لتطبيقها.',
  'Admin': 'لوحة التحكم', 'Sign in': 'تسجيل الدخول', 'Password': 'كلمة السر', 'New password': 'كلمة سر جديدة', 'Repeat password': 'أعد كلمة السر', 'Setup code': 'رمز الإعداد',
  'First sign-in: enter the setup code you were given, then choose the admin password.': 'أول دخول: اكتب رمز الإعداد اللي معك، وبعدين اختار كلمة سر للوحة.',
  'Create password': 'أنشئ كلمة السر', 'At least 16 characters.': '16 حرف على الأقل.', 'Passwords do not match.': 'كلمتا السر مش متطابقتين.',
  'Wrong password.': 'كلمة السر غلط.', 'Wrong setup code.': 'رمز الإعداد غلط.', 'Too many tries. Wait 15 minutes and try again.': 'محاولات كثيرة. استنى 15 دقيقة وجرّب.',
  'Orders': 'الطلبات', 'Devices': 'الأجهزة', 'Settings': 'الإعدادات', 'Publish': 'انشر', 'Publishing…': 'عم ننشر…', 'Published.': 'انتشر على الموقع.', 'View site': 'شوف الموقع', 'Sign out': 'خروج',
  'Unpublished changes': 'تعديلات مش منشورة', 'All changes are live.': 'كل التعديلات منشورة.', 'Discard changes': 'تجاهل التعديلات', 'Discard all unpublished changes?': 'تتجاهل كل التعديلات اللي مش منشورة؟',
  'Someone published a newer version. Load it, then make your change again.': 'في نسخة أحدث انتشرت. حمّلها وبعدين أعد تعديلك.', 'Load the published version': 'حمّل النسخة المنشورة',
  'Fix before publishing:': 'صلّح قبل النشر:', 'needs an Arabic and English name': 'بدها اسم عربي وإنجليزي', 'needs at least one option': 'بدها خيار واحد على الأقل', 'has an option without a valid price': 'فيها خيار بدون سعر صحيح', 'has two options with the same code': 'فيها خيارين بنفس الرمز', 'has an unknown category': 'قسمها مش موجود',
  'All': 'الكل', 'new': 'جديد', 'confirmed': 'تأكد', 'out': 'طلع للتوصيل', 'delivered': 'انسلّم', 'cancelled': 'ملغي', 'No orders here yet.': 'ما في طلبات هون لسه.',
  'Status': 'الحالة', 'Private note': 'ملاحظة خاصة', 'Save': 'احفظ', 'Saved.': 'انحفظ.', 'Call': 'اتصال', 'WhatsApp': 'واتساب', 'Delivery': 'توصيل', 'Pickup in store': 'استلام من المحل', 'Customer notes': 'ملاحظات الزبون', 'Total': 'المجموع', 'Back': 'رجوع',
  'Add device': 'أضف جهاز', 'Hidden': 'مخفي', 'Offer': 'عرض', 'Featured': 'مميز', 'Edit': 'عدّل', 'Duplicate': 'نسخة', 'Delete': 'احذف', 'Delete this device?': 'تحذف هالجهاز؟', 'Move up': 'لفوق', 'Move down': 'لتحت',
  'Name (Arabic)': 'الاسم (عربي)', 'Name (English)': 'الاسم (إنجليزي)', 'Brand': 'الماركة', 'Category': 'القسم', 'Short line (Arabic)': 'سطر قصير (عربي)', 'Short line (English)': 'سطر قصير (إنجليزي)', 'About (Arabic)': 'عن الجهاز (عربي)', 'About (English)': 'عن الجهاز (إنجليزي)',
  'Photo': 'الصورة', 'Upload photo': 'ارفع صورة', 'Use the shipped photo': 'رجّع الصورة الأصلية', 'Uploading…': 'عم نرفع…', 'Photo uploaded. Publish to show it.': 'انرفعت الصورة. انشر لتظهر.', 'Could not upload the photo.': 'ما قدرنا نرفع الصورة.',
  'A photo with a plain or transparent background looks best.': 'الصورة بخلفية سادة أو شفافة بتطلع أحلى.', 'Show in offers': 'يظهر بالعروض', 'Show on home page': 'يظهر بالرئيسية', 'Hide from the site': 'إخفاء عن الموقع',
  'Choose New or Used like new for each option.': 'اختر جديد أو مستعمل بحالة الجديد لكل خيار.', 'Option': 'الخيار',
  'Battery condition': 'حالة البطارية', 'Battery health (%) (optional)': 'صحة البطارية (%) (اختياري)', 'Battery cycles (optional)': 'عدد دورات شحن البطارية (اختياري)',
  'Leave blank if unknown. Enter the readings from this device.': 'اتركها فارغة إذا لم تكن معروفة. أدخل القراءات من هذا الجهاز.', 'Not provided': 'غير مدخلة', 'has invalid battery details': 'فيه بيانات بطارية غير صحيحة',
  'Out of stock': 'غير متوفر', 'Stock quantity (optional)': 'الكمية المتوفرة (اختياري)', 'Availability': 'التوفر', 'Not tracked': 'غير محددة',
  'Leave blank for no stock limit. Enter 0 for out of stock.': 'اتركها فارغة بدون حد للمخزون. أدخل 0 إذا نفدت الكمية.', 'Update this quantity when your stock changes.': 'حدّث هذه الكمية عندما يتغير مخزونك.', 'has an invalid stock quantity': 'فيه كمية مخزون غير صحيحة', 'has an offer price that is not below its price': 'فيه سعر عرض مش أقل من السعر', 'Offer price (JD, optional)': 'سعر العرض (دينار، اختياري)', 'Leave blank for no offer. It must be lower than the price; the old price shows crossed out.': 'اتركه فاضي إذا ما في عرض. لازم يكون أقل من السعر، والسعر القديم بيطلع مشطوب.', 'A device with an offer price shows in offers automatically. Tick this to show it there without one.': 'الجهاز اللي إله سعر عرض بيطلع بالعروض لحاله. علّم هون عشان يطلع بالعروض بدون سعر عرض.',
  'Options and prices': 'الخيارات والأسعار', 'Storage / size': 'السعة / المقاس', 'Condition': 'الحالة', 'Warranty': 'الكفالة', 'Price (JD)': 'السعر (د.أ)', 'Sold out': 'نفد', 'Add option': 'أضف خيار', 'Remove': 'شيل',
  'Specs': 'مواصفات', 'Add line': 'أضف سطر', 'Arabic': 'عربي', 'English': 'إنجليزي', 'Instagram post link (optional)': 'رابط المنشور على إنستغرام (اختياري)', 'Done': 'تم', 'not stated': 'غير محددة', 'none': 'بدون',
  'Shop phone': 'رقم المحل', 'WhatsApp number (with 962)': 'رقم الواتساب (مع 962)', 'Instagram link': 'رابط إنستغرام', 'Facebook link': 'رابط فيسبوك', 'Map link': 'رابط الخريطة', 'Address (Arabic)': 'العنوان (عربي)', 'Address (English)': 'العنوان (إنجليزي)',
  'Take orders on the site': 'استقبال الطلبات من الموقع', 'Delivery note (Arabic)': 'ملاحظة التوصيل (عربي)', 'Delivery note (English)': 'ملاحظة التوصيل (إنجليزي)', 'Prices note (Arabic)': 'ملاحظة الأسعار (عربي)', 'Prices note (English)': 'ملاحظة الأسعار (إنجليزي)', 'Offers title (Arabic)': 'عنوان العروض (عربي)', 'Offers title (English)': 'عنوان العروض (إنجليزي)',
  'Change password': 'تغيير كلمة السر', 'Current password': 'كلمة السر الحالية', 'Password changed.': 'تغيّرت كلمة السر.', 'Contact': 'التواصل', 'Ordering': 'الطلبات', 'Texts': 'نصوص',
  'Demo: changes stay in this browser. No password needed.': 'نسخة عرض: التعديلات بتضل على هالمتصفح. ما في كلمة سر.', 'Could not reach the server.': 'ما قدرنا نوصل للسيرفر.', 'Something went wrong.': 'صار خطأ.',
  'Session ended. Sign in again; your draft is kept.': 'انتهت الجلسة. ادخل مرة ثانية، والتعديلات محفوظة.', 'from': 'من', 'options': 'خيارات', 'Search devices': 'ابحث عن جهاز', 'new order': 'طلب جديد', 'new orders': 'طلبات جديدة',
  'Device id': 'رمز الجهاز', 'Notes': 'ملاحظات', 'Draft saved on this device.': 'المسودة محفوظة على هالجهاز.', 'Prices shown on the site come from this list.': 'الأسعار على الموقع من هالقائمة.',
  'Catalog editor': 'محرر الكتالوج', 'Save preview': 'احفظ المعاينة', 'Saving…': 'جارٍ الحفظ…', 'Saved to this browser.': 'تم الحفظ في هذا المتصفح.',
  'Changes not saved to preview': 'تعديلات لم تُحفظ في المعاينة', 'Preview saved in this browser': 'المعاينة محفوظة في هذا المتصفح',
  'View preview': 'افتح المعاينة', 'Open public store': 'افتح الموقع العام', 'Export JSON': 'تصدير JSON', 'Import JSON': 'استيراد JSON', 'Reset preview': 'إعادة ضبط المعاينة',
  'Browser-only preview': 'معاينة في هذا المتصفح فقط',
  'Edit devices, prices, photos and contact details here. Saving changes updates your preview on this browser only; visitors and other devices still see the public website.': 'عدّل الأجهزة والأسعار والصور ومعلومات التواصل هنا. الحفظ يحدّث المعاينة في هذا المتصفح فقط؛ الزوار والأجهزة الأخرى يشاهدون الموقع العام.',
  'Export includes your uploaded photos. Import it to continue on another browser. Exporting does not publish changes to the public website.': 'ملف التصدير يتضمن الصور التي رفعتها. استورده لمتابعة العمل في متصفح آخر. التصدير لا ينشر التعديلات على الموقع العام.',
  'Preview tools': 'أدوات المعاينة', 'Catalog exported. The public website is unchanged.': 'تم تصدير الكتالوج. الموقع العام لم يتغير.',
  'Catalog imported. Save preview to view it.': 'تم استيراد الكتالوج. احفظ المعاينة لعرضه.', 'Could not import this file. Use a Trio catalog JSON export.': 'تعذر استيراد الملف. استخدم ملف JSON مُصدّراً من محرر تريو.',
  'This file is too large.': 'حجم الملف كبير جداً.', 'Reset this browser preview to the public catalog? Your exported files are kept.': 'هل تريد إعادة معاينة هذا المتصفح إلى الكتالوج العام؟ ملفات التصدير تبقى محفوظة.',
  'Preview reset to the public catalog.': 'أُعيدت المعاينة إلى الكتالوج العام.', 'Discard changes since the last saved preview?': 'هل تريد تجاهل التعديلات منذ آخر حفظ للمعاينة؟',
  'Fix before saving:': 'صحّح قبل الحفظ:', 'A newer preview was saved in another tab. Reload it before saving again.': 'حُفظت معاينة أحدث في تبويب آخر. أعد تحميلها قبل الحفظ.', 'Load saved preview': 'تحميل المعاينة المحفوظة',
  'Photo uploaded. Save preview to show it.': 'رُفعت الصورة. احفظ المعاينة لعرضها.', 'Preview prices come from this list.': 'أسعار المعاينة تأتي من هذه القائمة.',
  'Summary (Arabic)': 'الملخص (عربي)', 'Summary (English)': 'الملخص (إنجليزي)', 'Label (Arabic)': 'اسم المواصفة (عربي)', 'Label (English)': 'اسم المواصفة (إنجليزي)', 'Value (Arabic)': 'القيمة (عربي)', 'Value (English)': 'القيمة (إنجليزي)',
  'Storage is full. Export your draft to keep a copy.': 'مساحة التخزين ممتلئة. صدّر المسودة للاحتفاظ بنسخة.', 'Preview storage is full. Export a copy or remove unused photos.': 'مساحة تخزين المعاينة ممتلئة. صدّر نسخة أو احذف الصور غير المستخدمة.',
  'Social link for the Repair and Visit us pages': 'الرابط الاجتماعي لصفحتي الصيانة وزيارتنا',
  'Check device names, prices and options, or import a valid Trio catalog export.': 'تحقق من أسماء الأجهزة والأسعار والخيارات، أو استورد ملف كتالوج تريو صحيحاً.', 'The photo could not be saved. Choose another image.': 'تعذر حفظ الصورة. اختر صورة أخرى.',
  'Local order book': 'سجل الطلبات المحلي', 'Manual orders saved in this browser only. They are not sent to Trio or shared with other devices. Online checkout is off.': 'طلبات تسجلها يدوياً وتُحفظ في هذا المتصفح فقط. لا تُرسل إلى تريو ولا تظهر على الأجهزة الأخرى. الطلب الإلكتروني مغلق.',
  'Add local order': 'أضف طلباً محلياً', 'New local order': 'طلب محلي جديد', 'Save local order': 'احفظ الطلب محلياً', 'Local order saved.': 'تم حفظ الطلب محلياً.', 'Export orders': 'تصدير الطلبات', 'Orders exported from this browser.': 'تم تصدير طلبات هذا المتصفح.',
  'Search orders': 'ابحث في الطلبات', 'No local orders yet.': 'لا توجد طلبات محلية بعد.', 'Record your first order using the button above.': 'سجّل أول طلب باستخدام الزر أعلاه.', 'No matching orders.': 'لا توجد طلبات مطابقة.',
  'Customer name': 'اسم العميل', 'Mobile (optional)': 'رقم الموبايل (اختياري)', 'Customer name is required.': 'اكتب اسم العميل.', 'Enter a valid Jordanian mobile number, or leave it empty.': 'اكتب رقم موبايل أردنياً صحيحاً، أو اتركه فارغاً.',
  'Fulfilment': 'طريقة الاستلام', 'Order items': 'أجهزة الطلب', 'Device and option': 'الجهاز والخيار', 'Quantity': 'الكمية', 'Add item': 'أضف جهازاً', 'Cancel': 'إلغاء', 'Choose a device': 'اختر جهازاً',
  'Prices use the last saved preview catalog. Save device changes before creating an order.': 'الأسعار من آخر كتالوج محفوظ للمعاينة. احفظ تعديلات الأجهزة قبل تسجيل الطلب.',
  'Choose available devices and quantities from 1 to {max}.': 'اختر أجهزة متاحة وكميات من 1 إلى {max}.', 'Each option can appear only once. Increase its quantity instead.': 'يمكن إضافة كل خيار مرة واحدة. غيّر كميته لطلب أكثر من جهاز.',
  'Add at least one available device.': 'أضف جهازاً متاحاً واحداً على الأقل.', 'Maximum {max} items per order.': 'الحد الأقصى {max} خيارات للطلب.', 'No available devices in the saved catalog.': 'لا توجد أجهزة متاحة في الكتالوج المحفوظ.',
  'Local record': 'سجل محلي', 'Customer': 'العميل', 'Local note': 'ملاحظة محلية', 'Refresh orders': 'تحديث الطلبات', 'Could not save this order. Check its customer and device details.': 'تعذر حفظ الطلب. تحقق من بيانات العميل والأجهزة.',
  'The order prices changed. Reload the saved catalog and review the total.': 'تغيّرت أسعار الطلب. أعد تحميل الكتالوج المحفوظ وراجع المجموع.', 'Reload saved catalog': 'إعادة تحميل الكتالوج المحفوظ', 'Order limit reached. Export your orders to keep a copy.': 'وصل سجل الطلبات إلى الحد الأقصى. صدّر الطلبات للاحتفاظ بنسخة.',
  'Shared order service not connected': 'خدمة الطلبات المشتركة غير متصلة',
  'Customer orders will appear here after the shared order service is connected.': 'ستظهر طلبات العملاء هنا بعد ربط خدمة الطلبات المشتركة.',
  'This website currently accepts no online orders. Customer checkout and automatic order delivery to this panel require the shared service.': 'هذا الموقع لا يستقبل طلبات إلكترونية حالياً. إتمام طلب العميل ووصوله تلقائياً إلى هذه اللوحة يتطلب ربط الخدمة المشتركة.',
  'Previous browser records': 'سجلات المتصفح السابقة', 'These earlier records exist only in this browser. They are separate from customer checkout orders.': 'هذه السجلات السابقة موجودة في هذا المتصفح فقط، وهي منفصلة عن طلبات العملاء الإلكترونية.',
  'Export previous records': 'تصدير السجلات السابقة', 'Customer orders': 'طلبات العملاء', 'Customer checkout orders arrive here automatically. This list refreshes every 15 seconds while the panel is visible.': 'تصل طلبات العملاء من الموقع إلى هنا تلقائياً. تتحدث القائمة كل 15 ثانية أثناء عرض اللوحة.',
  'Load older orders': 'تحميل الطلبات الأقدم',
  'Owner demo · this browser only': 'عرض لصاحب المحل · في هذا المتصفح فقط',
  'Demo checkout orders appear here automatically. They are not sent to the store or shared with other browsers.': 'تظهر طلبات تجربة الشراء هنا تلقائياً. لا تُرسل إلى المحل ولا تظهر في متصفحات أخرى.',
  'Demo orders': 'طلبات العرض التجريبي', 'Save demo order': 'احفظ الطلب التجريبي', 'Demo order saved.': 'تم حفظ الطلب التجريبي.', 'Demo note': 'ملاحظة تجريبية',
  'No demo orders yet.': 'لا توجد طلبات تجريبية بعد.', 'Place an order through the storefront to demonstrate checkout.': 'أكمل طلباً من واجهة الموقع لتجربة الشراء.', 'Open demo store': 'افتح متجر العرض',
  'Export demo orders': 'تصدير الطلبات التجريبية', 'Demo orders exported from this browser.': 'تم تصدير طلبات العرض من هذا المتصفح.',
  'The latest selected device leads its category in the home showcase for Phones, Laptops, Watches and Audio. Selecting a device also makes it visible.': 'آخر جهاز تختاره يتصدر قسمه في واجهة الرئيسية للهواتف واللابتوبات والساعات والسماعات. تحديد الجهاز يجعله ظاهراً أيضاً.',
  'Save preview to see your home selections.': 'احفظ المعاينة لتظهر اختياراتك في الرئيسية.', 'Publish to show your home selections.': 'انشر لتظهر اختياراتك في الرئيسية.',
  'Choose home devices directly from this list. The latest selection leads its category.': 'اختر أجهزة الرئيسية مباشرة من هذه القائمة. آخر جهاز تختاره يتصدر قسمه.',
  'Categories': 'الأقسام', 'Add category': 'أضف قسماً', 'New category': 'قسم جديد', 'Category id': 'رمز القسم', 'Category photo': 'صورة القسم', 'Change photo': 'غيّر الصورة', 'Reset photo': 'استعادة الصورة الافتراضية',
  'Edit the home category names, pictures and order here. Device categories use the same names.': 'عدّل أسماء الأقسام وصورها وترتيبها في الرئيسية من هنا. تستخدم الأجهزة أسماء الأقسام نفسها.',
  'Save preview to see your category changes.': 'احفظ المعاينة لتظهر تعديلات الأقسام.', 'Publish to show your category changes.': 'انشر لتظهر تعديلات الأقسام.',
  'You can add up to {max} categories.': 'يمكنك إضافة حتى {max} قسماً.', 'Choose names in Arabic and English, up to {max} characters each.': 'اكتب اسماً بالعربي والإنجليزي، حتى {max} حرف لكل اسم.',
  'The category id stays the same when you rename it.': 'يبقى رمز القسم ثابتاً عند تغيير اسمه.', 'The picture appears in the home category tile. A transparent image looks best.': 'تظهر الصورة في بطاقة القسم بالرئيسية. الصورة بخلفية شفافة هي الأنسب.',
  'Uses the default category picture until you upload a photo.': 'تُستخدم صورة القسم الافتراضية حتى ترفع صورته الخاصة.', 'No category photo yet.': 'لم تُضف صورة للقسم بعد.',
  'devices in this category': 'جهاز في هذا القسم', 'Move its devices to another category before deleting it.': 'انقل أجهزة هذا القسم إلى قسم آخر قبل حذفه.', 'Keep at least one category.': 'يجب إبقاء قسم واحد على الأقل.',
  'Delete this empty category?': 'هل تريد حذف هذا القسم الفارغ؟', 'Category added. Add its photo or assign devices to it.': 'أُضيف القسم. ارفع صورته أو انقل أجهزة إليه.',
  'Category names are required in both languages.': 'اسم القسم مطلوب بالعربي والإنجليزي.', 'Check category names, ids and photos. Keep between 1 and {max} categories.': 'تحقق من أسماء الأقسام ورموزها وصورها. يجب أن يكون عدد الأقسام بين 1 و{max}.',
  'Website texts': 'نصوص الموقع', 'Search website texts': 'ابحث في نصوص الموقع', 'Edit the public website in Arabic and English. Device names, descriptions and category names are edited in their own tabs.': 'عدّل نصوص واجهة الموقع بالعربي والإنجليزي. أسماء الأجهزة ومواصفاتها وأسماء الأقسام تُعدّل من تبويباتها.',
  'Choose a page, then change its Arabic or English text. Save your changes when you finish.': 'اختر الصفحة، ثم عدّل النص العربي أو الإنجليزي. احفظ التعديلات عند الانتهاء.', 'Page or area': 'الصفحة أو الجزء', 'Home page': 'الصفحة الرئيسية', 'Header and footer': 'أعلى وأسفل الموقع', 'Devices and search': 'الأجهزة والبحث', 'Repair, trade-in and visit us': 'الصيانة والتبديل وزيارتنا', 'Bag and checkout': 'السلة وإتمام الطلب', 'Common texts': 'النصوص الأساسية', 'More texts and messages': 'نصوص ورسائل إضافية', 'Show fewer texts': 'إخفاء النصوص الإضافية', 'Search results from all pages': 'نتائج البحث من كل الصفحات', 'Clear search': 'مسح البحث', 'Showing {count} texts': 'عرض {count} نص', 'The search includes every page and additional messages.': 'البحث يشمل كل الصفحات والرسائل الإضافية.', 'Additional messages include error messages, accessibility labels and less-used texts.': 'تشمل النصوص الإضافية رسائل الخطأ وتسميات الوصول والنصوص الأقل استخداماً.', 'Restore this text': 'استعادة هذا النص',
  'Hero title — first line': 'عنوان الرئيسية — السطر الأول', 'Hero title — second line': 'عنوان الرئيسية — السطر الثاني', 'Shop devices button': 'زر تسوّق الأجهزة', 'Categories heading': 'عنوان الأقسام', 'View all devices button': 'زر شاهد كل الأجهزة', 'Offers heading': 'عنوان العروض', 'All offers button': 'زر كل العروض', 'Services heading': 'عنوان الخدمات', 'Services introduction': 'مقدمة الخدمات', 'About heading': 'عنوان التعريف بالمتجر', 'About introduction': 'نص التعريف بالمتجر', 'Home link': 'رابط الرئيسية', 'Devices link': 'رابط الأجهزة', 'Offers link': 'رابط العروض', 'Repair link': 'رابط الصيانة', 'Trade-in link': 'رابط التبديل', 'Visit us link': 'رابط زيارتنا', 'Sign in button': 'زر تسجيل الدخول', 'Brand name': 'اسم المتجر', 'Brand subtitle': 'السطر أسفل اسم المتجر', 'Footer copyright': 'حقوق النشر أسفل الموقع', 'Store description in footer': 'وصف المتجر أسفل الموقع', 'Devices page introduction': 'مقدمة صفحة الأجهزة', 'Offers page introduction': 'مقدمة صفحة العروض', 'Search placeholder': 'النص داخل مربع البحث', 'Add to bag button': 'زر أضف إلى السلة', 'Choose option button': 'زر اختر الخيار', 'Out of stock label': 'تسمية غير متوفر', 'New condition label': 'تسمية الحالة الجديدة', 'Used condition label': 'تسمية الحالة المستعملة', 'Battery health label': 'تسمية صحة البطارية', 'Battery cycles label': 'تسمية دورات البطارية', 'No results heading': 'عنوان عدم وجود نتائج', 'Repair heading': 'عنوان الصيانة', 'Repair introduction': 'مقدمة الصيانة', 'Trade-in heading': 'عنوان التبديل', 'Trade-in introduction': 'مقدمة التبديل', 'Trade-in note': 'ملاحظة التبديل', 'Visit us heading': 'عنوان زيارتنا', 'Visit us introduction': 'مقدمة زيارتنا', 'Map button': 'زر الخريطة', 'Call button': 'زر الاتصال', 'Bag heading': 'عنوان السلة', 'Empty bag heading': 'عنوان السلة الفارغة', 'Empty bag message': 'رسالة السلة الفارغة', 'Checkout button': 'زر إتمام الطلب', 'Checkout heading': 'عنوان إتمام الطلب', 'Checkout introduction': 'مقدمة إتمام الطلب', 'Place order button': 'زر تأكيد الطلب', 'Keep shopping button': 'زر متابعة التسوق', 'Order confirmation heading': 'عنوان تأكيد الطلب', 'Order confirmation message': 'رسالة تأكيد الطلب', 'Account heading': 'عنوان الحساب', 'Create account button': 'زر إنشاء الحساب', 'Email label': 'تسمية البريد الإلكتروني', 'Password label': 'تسمية كلمة المرور', 'Name label': 'تسمية الاسم', 'Mobile label': 'تسمية رقم الموبايل', 'Save account button': 'زر حفظ الحساب', 'Sign out button': 'زر تسجيل الخروج', 'Account details heading': 'عنوان معلومات الحساب', 'My orders heading': 'عنوان طلباتي', 'No orders message': 'رسالة عدم وجود طلبات', 'Text': 'النص',
  'Navigation and footer': 'التنقل وتذييل الموقع', 'Storefront': 'واجهة المتجر', 'Customer accounts': 'حسابات العملاء', 'Device and order labels': 'تسميات الأجهزة والطلبات', 'Page content': 'محتوى الصفحات',
  'Restore default text': 'استعادة النص الافتراضي', 'Restore all default texts': 'استعادة كل النصوص الافتراضية', 'Restore all website texts? Contact details, devices, prices and photos are kept.': 'هل تريد استعادة نصوص الموقع الافتراضية؟ تبقى معلومات التواصل والأجهزة والأسعار والصور محفوظة.',
  'Text restored. Save your changes to apply it.': 'استُعيد النص الافتراضي. احفظ التعديلات لتطبيقه.', 'Default website texts restored. Save your changes to apply them.': 'استُعيدت نصوص الموقع الافتراضية. احفظ التعديلات لتطبيقها.', 'Edited': 'معدّل', 'Default': 'افتراضي', 'texts': 'نص', 'No matching texts.': 'لا توجد نصوص مطابقة.', 'Keep the placeholders unchanged: {tokens}': 'أبقِ الرموز كما هي: {tokens}',
  'Home presentation': 'عرض الصفحة الرئيسية', 'Restore default animations and pictures': 'استعادة الحركة والصور الافتراضية', 'Use selected devices': 'عرض الأجهزة المحددة', 'Default animations and pictures are active.': 'الحركة والصور الافتراضية مفعّلة.', 'Your selected devices are active.': 'الأجهزة التي حددتها مفعّلة.', 'Restore the original animated showcase without deleting devices, uploaded pictures or home selections. Selecting a device again switches back to your selected devices.': 'استعد العرض المتحرك الأصلي بدون حذف الأجهزة أو الصور المرفوعة أو اختيارات الرئيسية. اختيار جهاز مرة أخرى يفعّل عرض الأجهزة المحددة.', 'Home presentation updated. Save your changes to apply it.': 'حُدّث عرض الرئيسية. احفظ التعديلات لتطبيقه.', 'Check website text lengths and home presentation.': 'تحقق من طول نصوص الموقع واختيار عرض الرئيسية.',
  'Battery details': 'بيانات البطارية', 'Choose Used like new to enter battery health and cycles.': 'اختر مستعمل بحالة الجديد لإدخال صحة البطارية وعدد دورات الشحن.', 'Used options include optional battery health and cycle readings below.': 'تتضمن خيارات الأجهزة المستعملة حقولاً اختيارية لصحة البطارية وعدد دورات الشحن أدناه.',
};
let lang = local.read('trio-admin-lang') === 'en' ? 'en' : 'ar';
const t = (s, vars = {}) => (lang === 'ar' ? AR[s] || s : ({ new: 'New', confirmed: 'Confirmed', out: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' }[s] || s)).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const L = (o) => (o && typeof o === 'object' ? o[lang] || o.ar || o.en || '' : String(o || ''));
const money = (jd) => formatJD(toFils(jd), lang);

const initialView = IS_PAGES ? ({ '#orders': 'orders', '#categories': 'categories', '#settings': 'settings' }[globalThis.location?.hash] || 'devices') : 'orders';
const state = { view: initialView, signedIn: IS_PAGES, setup: true, published: null, version: 0, draft: null, dirty: false, orders: [], legacyOrders: [], orderFilter: '', orderOpen: null, orderQuery: '', orderBefore: null, editing: null, category: 'all', query: '', addingCategory: null, message: '', textQuery: '', textArea: 'home', textAdvanced: false };

function saveDraft() {
  state.dirty = JSON.stringify(state.draft) !== JSON.stringify(state.published);
  if (state.dirty) {
    if (!local.write(draftKey, { baseVersion: state.version, content: state.draft })) flash(t('Storage is full. Export your draft to keep a copy.'), 'error');
  } else local.remove(draftKey);
  updateBar();
}
function flash(text, kind = 'ok') {
  const box = $('#flash'); if (!box) return;
  box.textContent = text; box.className = `flash is-${kind}`; box.hidden = false;
  clearTimeout(flash.timer); flash.timer = setTimeout(() => { box.hidden = true; }, 4200);
}
function errorText(error) {
  const code = error instanceof ApiError ? error.code : '';
  return ({ 'bad-password': t('Wrong password.'), 'bad-code': t('Wrong setup code.'), 'locked': t('Too many tries. Wait 15 minutes and try again.'), network: t('Could not reach the server.'), 'weak-password': t('At least 16 characters.'), 'storage-full': t('Preview storage is full. Export a copy or remove unused photos.'), 'invalid-draft': t('Check device names, prices and options, or import a valid Trio catalog export.'), 'invalid-photo': t('The photo could not be saved. Choose another image.'), 'too-large': t('This file is too large.'), 'bad-order': t('Could not save this order. Check its customer and device details.'), 'bad-mobile': t('Enter a valid Jordanian mobile number, or leave it empty.'), 'price-changed': t('The order prices changed. Reload the saved catalog and review the total.'), 'orders-full': t('Order limit reached. Export your orders to keep a copy.') })[code] || `${t('Something went wrong.')}${code ? ` (${code})` : ''}`;
}
async function guard(fn) {
  try { return await fn(); } catch (error) {
    if (error instanceof ApiError && error.status === 401) { state.signedIn = false; render(); flash(t('Session ended. Sign in again; your draft is kept.'), 'warn'); return undefined; }
    flash(errorText(error), 'error'); return undefined;
  }
}

// ---------- shell ----------
function topBar() {
  const n = state.orders.filter((o) => o.status === 'new').length;
  const tabs = IS_PAGES ? [['devices', 'Devices'], ['categories', 'Categories'], ['orders', 'Orders'], ['settings', 'Settings']] : [['orders', 'Orders'], ['devices', 'Devices'], ['categories', 'Categories'], ['settings', 'Settings']];
  return `<header class="bar"><div class="bar-in"><a class="brand" href="../index.html#/" ${MODE === 'demo' ? '' : 'target="_blank" rel="noopener"'}><img src="../assets/instagram/logo.jpg" alt="" width="34" height="34"><span dir="ltr">TRIO</span><small>${esc(t(IS_PAGES ? 'Catalog editor' : 'Admin'))}</small></a>
  <nav class="tabs">${tabs.map(([id, label]) => `<button type="button" data-view="${id}" aria-current="${state.view === id}">${esc(t(label))}${id === 'orders' && n ? `<span class="badge">${n}</span>` : ''}</button>`).join('')}</nav>
  <div class="bar-actions"><span id="draft-state" class="draft-state" role="status"></span><button type="button" id="publish" class="btn primary">${esc(t(IS_PAGES ? 'Save preview' : 'Publish'))}</button>${IS_PAGES ? `<a class="btn ghost" href="../index.html?preview=draft#/" target="_blank" rel="noopener">${esc(t('View preview'))}${forwardArrow}</a>` : ''}<button type="button" id="lang" class="btn ghost" lang="${lang === 'ar' ? 'en' : 'ar'}">${lang === 'ar' ? 'EN' : 'ع'}</button>${MODE === 'demo' || IS_PAGES ? '' : `<button type="button" id="logout" class="btn ghost">${esc(t('Sign out'))}</button>`}</div></div>
  ${MODE === 'demo' ? `<p class="demo-line">${esc(t('Demo: changes stay in this browser. No password needed.'))}</p>` : ''}</header>`;
}
function previewTools() {
  return `<aside class="preview-notice" aria-label="${esc(t('Browser-only preview'))}"><div><strong>${esc(t('Browser-only preview'))}</strong><p>${esc(t('Edit devices, prices, photos and contact details here. Saving changes updates your preview on this browser only; visitors and other devices still see the public website.'))}</p></div><a class="btn ghost small" href="../index.html#/" target="_blank" rel="noopener">${esc(t('Open public store'))}${forwardArrow}</a></aside>
  <section class="preview-tools" aria-label="${esc(t('Preview tools'))}"><div class="btns"><button type="button" id="export-draft" class="btn">${esc(t('Export JSON'))} ↓</button><label class="btn" for="import-draft">${esc(t('Import JSON'))} ↑<input type="file" id="import-draft" accept="application/json,.json" class="file-input"></label><button type="button" id="reset-preview" class="btn danger">${esc(t('Reset preview'))}</button></div><p class="muted small">${esc(t('Export includes your uploaded photos. Import it to continue on another browser. Exporting does not publish changes to the public website.'))}</p></section>`;
}
function updateBar() {
  const s = $('#draft-state'); const p = $('#publish');
  if (s) { s.textContent = state.dirty ? t(IS_PAGES ? 'Changes not saved to preview' : 'Unpublished changes') : t(IS_PAGES ? 'Preview saved in this browser' : 'All changes are live.'); s.classList.toggle('is-dirty', state.dirty); }
  if (p) p.disabled = !state.dirty;
  let d = $('#discard'); if (state.dirty && !d && s) { s.insertAdjacentHTML('afterend', `<button type="button" id="discard" class="btn ghost small">${esc(t('Discard changes'))}</button>`); } else if (!state.dirty && d) d.remove();
}
function render() {
  if (state.draft && state.category !== 'all' && !state.draft.categories.some((category) => category.id === state.category)) state.category = 'all';
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = `${t(IS_PAGES ? 'Catalog editor' : 'Admin')} | TRIO Mobile`;
  document.body.classList.toggle('pages-editor', IS_PAGES);
  const root = $('#admin');
  if (!state.signedIn) { root.innerHTML = signInView(); return; }
  root.innerHTML = `${topBar()}<main class="wrap">${IS_PAGES && state.view !== 'orders' ? previewTools() : ''}${state.view === 'orders' ? ordersView() : state.view === 'devices' ? (state.editing ? editView() : devicesView()) : state.view === 'categories' ? categoriesView() : settingsView()}</main><p id="flash" class="flash" role="status" hidden></p>`;
  updateBar();
  if (state.view === 'settings') filterWebsiteTexts();
}
function signInView() {
  const setup = !state.setup;
  return `<main class="sign"><form id="sign-form" class="card sign-card"><img src="../assets/instagram/logo.jpg" alt="" width="56" height="56"><h1>${esc(t('Admin'))} · TRIO</h1>${setup ? `<p class="muted">${esc(t('First sign-in: enter the setup code you were given, then choose the admin password.'))}</p><label class="f"><span>${esc(t('Setup code'))}</span><input name="code" autocomplete="off" required></label><label class="f"><span>${esc(t('New password'))}</span><input name="password" type="password" autocomplete="new-password" minlength="16" required><small>${esc(t('At least 16 characters.'))}</small></label><label class="f"><span>${esc(t('Repeat password'))}</span><input name="repeat" type="password" autocomplete="new-password" required></label>` : `<label class="f"><span>${esc(t('Password'))}</span><input name="password" type="password" autocomplete="current-password" required></label>`}<p id="sign-error" class="error" role="alert" hidden></p><button class="btn primary wide" type="submit">${esc(t(setup ? 'Create password' : 'Sign in'))}</button><button type="button" id="lang" class="btn ghost small" lang="${lang === 'ar' ? 'en' : 'ar'}">${lang === 'ar' ? 'English' : 'عربي'}</button></form></main>`;
}

// ---------- orders ----------
const fmtDate = (iso) => { try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Amman' }).format(new Date(iso)); } catch { return iso; } };
const fils = (n) => formatJD(n, lang);
function localOrdersNotice() {
  return `<aside class="preview-notice order-notice"><div><strong>${esc(t('Owner demo · this browser only'))}</strong><p>${esc(t('Demo checkout orders appear here automatically. They are not sent to the store or shared with other browsers.'))}</p></div></aside>`;
}
function legacyOrdersExport() {
  return IS_PAGES && state.legacyOrders.length ? `<details class="card"><summary>${esc(t('Previous browser records'))} (${state.legacyOrders.length})</summary><p class="muted">${esc(t('These earlier records exist only in this browser. They are separate from customer checkout orders.'))}</p><div class="btns"><button type="button" class="btn ghost" data-export-legacy-orders>${esc(t('Export previous records'))}</button></div></details>` : '';
}
function ordersView() {
  const notice = IS_PAGES ? localOrdersNotice() : MODE === 'live' ? `<aside class="preview-notice order-notice"><div><strong>${esc(t('Customer orders'))}</strong><p>${esc(t('Customer checkout orders arrive here automatically. This list refreshes every 15 seconds while the panel is visible.'))}</p></div></aside>` : '';
  if (state.orderOpen) {
    const order = state.orders.find((o) => o.number === state.orderOpen);
    if (order) return `${notice}${orderDetail(order)}`;
    state.orderOpen = null;
  }
  const counts = Object.fromEntries(orderStatuses.map((s) => [s, state.orders.filter((o) => o.status === s).length]));
  const query = state.orderQuery.trim().toLowerCase();
  const list = state.orders.filter((o) => (!state.orderFilter || o.status === state.orderFilter) && (!query || `${o.number} ${o.customer.name} ${o.customer.mobile || ''} ${o.lines.map((line) => `${line.name} ${line.nameAr || ''}`).join(' ')}`.toLowerCase().includes(query)));
  return `${notice}<div class="head"><h1>${esc(t(IS_PAGES ? 'Demo orders' : 'Orders'))}</h1><div class="btns order-actions">${IS_PAGES ? `<button type="button" class="btn ghost" data-export-orders${state.orders.length ? '' : ' disabled'}>${esc(t('Export demo orders'))}</button>` : ''}<button type="button" class="btn ghost" data-refresh-orders aria-label="${esc(t('Refresh orders'))}">↻</button></div></div>
  <label class="f search"><span class="sr">${esc(t('Search orders'))}</span><input id="order-search" type="search" placeholder="${esc(t('Search orders'))}" value="${esc(state.orderQuery)}"></label><div class="chips">${[['', t('All'), state.orders.length], ...orderStatuses.map((s) => [s, t(s), counts[s]])].map(([id, label, n]) => `<button type="button" class="chip" data-order-filter="${id}" aria-pressed="${state.orderFilter === id}">${esc(label)}${MODE === 'live' ? '' : ` <span>${n}</span>`}</button>`).join('')}</div>
  ${list.length ? `<ul class="rows order-rows">${list.map((o) => `<li><button type="button" class="row order-row" data-open-order="${esc(o.number)}"><span class="o-num" dir="ltr">${esc(o.number)}</span><span class="o-main"><strong>${esc(o.customer.name)}</strong>${o.customer.mobile ? `<small dir="ltr">${esc(o.customer.mobile)}</small>` : ''}</span><span class="o-meta"><small>${esc(fmtDate(o.createdAt))}</small><strong>${esc(fils(o.totalFils))}</strong></span><span class="status s-${esc(o.status)}">${esc(t(o.status))}</span></button></li>`).join('')}</ul>` : `<div class="empty"><p>${esc(t(state.orders.length ? 'No matching orders.' : IS_PAGES ? 'No demo orders yet.' : 'No orders here yet.'))}</p>${IS_PAGES && !state.orders.length ? `<p class="muted">${esc(t('Place an order through the storefront to demonstrate checkout.'))}</p><div class="btns"><a class="btn primary" href="../index.html#/shop" target="_blank" rel="noopener">${esc(t('Open demo store'))}${forwardArrow}</a></div>` : ''}</div>`}${state.orderBefore ? `<div class="btns"><button type="button" class="btn" data-load-older-orders>${esc(t('Load older orders'))}</button></div>` : ''}${legacyOrdersExport()}`;
}
function orderDetail(o) {
  if (!o) { state.orderOpen = null; return ordersView(); }
  const mobile = String(o.customer.mobile || '');
  const normalised = normaliseMobile(mobile);
  const wa = normalised ? `https://wa.me/962${normalised.replace(/^0/, '')}` : '';
  const gov = governorates.find(([id]) => id === o.customer.governorate);
  return `<div class="head"><button type="button" class="btn ghost small" data-close-order>← ${esc(t('Back'))}</button><h1 dir="ltr">${esc(o.number)}</h1><span class="status s-${esc(o.status)}">${esc(t(o.status))}</span></div>
  <div class="grid2"><section class="card"><h2>${esc(o.customer.name)}</h2>${mobile ? `<p dir="ltr" class="big">${esc(mobile)}</p><div class="btns"><a class="btn primary" href="tel:${esc(mobile)}">${esc(t('Call'))}</a>${wa ? `<a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener">${esc(t('WhatsApp'))}</a>` : ''}</div>` : ''}
  <p><strong>${esc(o.fulfilment === 'pickup' ? t('Pickup in store') : t('Delivery'))}</strong>${o.fulfilment === 'pickup' || !o.customer.governorate ? '' : ` — ${esc(gov ? (lang === 'ar' ? gov[1] : gov[2]) : o.customer.governorate)}`}</p>${o.customer.address ? `<p>${esc(o.customer.address)}</p>` : ''}${o.customer.notes ? `<p class="muted"><strong>${esc(t('Customer notes'))}:</strong> ${esc(o.customer.notes)}</p>` : ''}<p class="muted">${esc(fmtDate(o.createdAt))}</p></section>
  <section class="card"><ul class="lines">${o.lines.map((l) => `<li><span dir="auto">${esc(lang === 'ar' ? l.nameAr || l.name : l.name)}${l.storage ? ` · ${esc(l.storage)}` : ''}${l.condition ? ` · ${esc(L(conditions[l.condition]))}` : ''}</span><span>× ${l.qty}</span><strong>${esc(fils(l.unitFils * l.qty))}</strong></li>`).join('')}</ul><p class="total"><span>${esc(t('Total'))}</span><strong>${esc(fils(o.totalFils))}</strong></p>
  <form id="order-form" data-number="${esc(o.number)}"><label class="f"><span>${esc(t('Status'))}</span><select name="status">${orderStatuses.map((s) => `<option value="${s}"${o.status === s ? ' selected' : ''}>${esc(t(s))}</option>`).join('')}</select></label><label class="f"><span>${esc(t(IS_PAGES ? 'Demo note' : 'Private note'))}</span><textarea name="note" rows="3" maxlength="500">${esc(o.note || '')}</textarea></label><button class="btn primary" type="submit">${esc(t(IS_PAGES ? 'Save demo order' : 'Save'))}</button></form></section></div>`;
}
async function loadOrders({ append = false } = {}) {
  const filter = MODE !== 'demo' ? state.orderFilter : '';
  const before = append ? state.orderBefore : '';
  const data = await guard(() => orderApi.orders(filter, before));
  if (!data || (MODE !== 'demo' && filter !== state.orderFilter)) return false;
  const incoming = data.orders || [];
  state.orders = append ? [...new Map([...state.orders, ...incoming].map((order) => [order.number, order])).values()] : incoming;
  state.orderBefore = Number.isSafeInteger(data.nextBefore) && data.nextBefore > 0 ? data.nextBefore : null;
  if (IS_PAGES) state.legacyOrders = (await pagesAdmin.orders()).orders || [];
  return true;
}
async function exportOrders({ legacy = false } = {}) {
  try {
    const data = await (legacy ? pagesAdmin : orderApi).exportOrders();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `trio-${legacy ? 'previous-records' : 'demo-orders'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash(t(legacy ? 'Orders exported from this browser.' : 'Demo orders exported from this browser.'));
  } catch (error) { flash(errorText(error), 'error'); }
}

// ---------- devices ----------
function stockFlag(product) {
  const stock = availabilitySummary(product);
  const text = stock.state === 'out' ? t('Out of stock') : stock.state === 'partial' ? t('Some options are out of stock') : t('In stock');
  return `<em class="flag stock-flag is-${stock.state}">${esc(text)}</em>`;
}
function deviceStockControls(product) {
  const stock = availabilitySummary(product);
  const manualOut = product.variants.some((variant) => variant.soldOut === true);
  const allManualOut = product.variants.every((variant) => variant.soldOut === true);
  return `<div class="device-stock-controls"><div><h3>${esc(t('Device stock'))}</h3><p>${stockFlag(product)} <span>${esc(t('{available} of {total} options available', stock))}</span></p></div><div class="btns"><button type="button" class="btn ghost small" data-set-device-stock="${esc(product.id)}" data-sold-out="true"${allManualOut ? ' disabled' : ''}>${esc(t('Mark all options out of stock'))}</button><button type="button" class="btn ghost small" data-set-device-stock="${esc(product.id)}" data-sold-out="false"${manualOut ? '' : ' disabled'}>${esc(t('Clear manual out-of-stock flags'))}</button></div><p class="muted small">${esc(t('The out-of-stock checkbox below applies only to that option.'))} ${esc(t('A quantity of 0 stays out of stock. Update the quantity to make that option available.'))}</p></div>`;
}
function devicesView() {
  const c = state.draft;
  const q = state.query.trim().toLowerCase();
  const list = c.products.filter((p) => (state.category === 'all' || p.category === state.category) && (!q || `${p.name.ar} ${p.name.en} ${p.brand}`.toLowerCase().includes(q)));
  return `<div class="head"><h1>${esc(t('Devices'))}</h1><button type="button" class="btn primary" data-add-device>${esc(t('Add device'))}</button></div><p class="muted">${esc(t(IS_PAGES ? 'Preview prices come from this list.' : 'Prices shown on the site come from this list.'))}</p>
  <div class="chips">${[['all', t('All')], ...c.categories.map((x) => [x.id, L(x.name)])].map(([id, label]) => `<button type="button" class="chip" data-cat="${esc(id)}" aria-pressed="${state.category === id}">${esc(label)} <span>${c.products.filter((p) => id === 'all' || p.category === id).length}</span></button>`).join('')}</div>
  <label class="f search"><span class="sr">${esc(t('Search devices'))}</span><input id="device-search" type="search" placeholder="${esc(t('Search devices'))}" value="${esc(state.query)}"></label>
  <p class="muted home-list-help">${esc(t('Choose home devices directly from this list. The latest selection leads its category.'))} ${esc(t(IS_PAGES ? 'Save preview to see your home selections.' : 'Publish to show your home selections.'))}</p>
  <ul class="rows">${list.map((p) => { const low = fromPrice(p); const i = c.products.indexOf(p); return `<li class="row device-row"><span class="thumb">${thumb(p)}</span><span class="d-main"><strong dir="auto">${esc(L(p.name))}</strong><small>${esc(p.brand)} · ${p.variants.length} ${esc(t('options'))}${low !== null ? ` · ${esc(t('from'))} ${esc(formatJD(low, lang))}` : ''}</small><span class="flags">${stockFlag(p)}<button type="button" class="btn ghost small stock-shortcut" data-stock-edit="${i}">${esc(t('Manage stock'))}</button>${p.hidden ? `<em class="flag off">${esc(t('Hidden'))}</em>` : ''}${inOffers(p) ? `<em class="flag">${esc(t('Offer'))}</em>` : ''}</span></span><span class="d-actions"><label class="home-toggle"><input type="checkbox" role="switch" data-home-device="${esc(p.id)}"${p.featured ? ' checked' : ''}><span>${esc(t('Show on home page'))}<span class="sr">: ${esc(L(p.name))}</span></span></label><button type="button" class="btn small" data-edit="${i}">${esc(t('Edit'))}</button>${p.variants.some((v) => conditionGroup(v.condition) === 'like-new') ? `<button type="button" class="btn ghost small battery-shortcut" data-battery-edit="${i}">${esc(t('Battery details'))}</button>` : ''}<button type="button" class="btn ghost small icon" data-move="${i}" data-dir="-1" aria-label="${esc(t('Move up'))}"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" class="btn ghost small icon" data-move="${i}" data-dir="1" aria-label="${esc(t('Move down'))}"${i === c.products.length - 1 ? ' disabled' : ''}>↓</button></span></li>`; }).join('')}</ul>`;
}
function photoSrc(p) { if (p.photo) { const u = IS_PAGES ? adminApi.photoUrl(p.photo) : api.photoUrl(p.photo); if (u) return u; } return p.image ? `../${p.image}` : ''; }
function thumb(p) { const s = photoSrc(p); return s ? `<img src="${esc(s)}" alt="" loading="lazy">` : `<span class="noimg">${esc(p.brand.slice(0, 1))}</span>`; }
function field(label, name, value, { type = 'text', dir = '', attrs = '' } = {}) {
  return `<label class="f"><span>${esc(t(label))}</span>${type === 'textarea' ? `<textarea name="${name}" rows="3"${dir ? ` dir="${dir}"` : ''} ${attrs}>${esc(value)}</textarea>` : `<input name="${name}" type="${type}" value="${esc(value)}"${dir ? ` dir="${dir}"` : ''} ${attrs}>`}</label>`;
}
function technicalFields(p) {
  return (p.technical?.specs || []).map((s, i) => `<div class="technical-spec"><div class="grid2 tight">${field('Label (Arabic)', `technical.${i}.label.ar`, s.label?.ar || '', { dir: 'rtl', attrs: 'maxlength="120"' })}${field('Label (English)', `technical.${i}.label.en`, s.label?.en || '', { dir: 'ltr', attrs: 'maxlength="120"' })}${field('Value (Arabic)', `technical.${i}.value.ar`, s.value?.ar || '', { dir: 'rtl', attrs: 'maxlength="400"' })}${field('Value (English)', `technical.${i}.value.en`, s.value?.en || '', { dir: 'ltr', attrs: 'maxlength="400"' })}</div><button type="button" class="btn ghost small" data-remove-spec="${i}">${esc(t('Remove'))}</button></div>`).join('');
}
function editView() {
  const p = state.draft.products[state.editing.index];
  if (!p) { state.editing = null; return devicesView(); }
  const sel = (name, value, options) => `<select name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const warOpts = Object.keys(warranties).map((k) => [k, k ? L(warranties[k]) : t('none')]);
  const batteryFields = (v, i) => `<fieldset class="battery-fields" data-battery-fields="${i}"${conditionGroup(v.condition) === 'like-new' ? '' : ' hidden disabled'}><legend>${esc(t('Battery condition'))}</legend><label class="f"><span>${esc(t('Battery health (%) (optional)'))}</span><input name="v.${i}.batteryHealth" type="number" inputmode="numeric" min="0" max="100" step="1" placeholder="${esc(t('Not provided'))}" value="${esc(v.batteryHealth ?? '')}" dir="ltr"${validBatteryHealth(v.batteryHealth) ? '' : ' aria-invalid="true"'}></label><label class="f"><span>${esc(t('Battery cycles (optional)'))}</span><input name="v.${i}.batteryCycles" type="number" inputmode="numeric" min="0" max="${Number.MAX_SAFE_INTEGER}" step="1" placeholder="${esc(t('Not provided'))}" value="${esc(v.batteryCycles ?? '')}" dir="ltr"${validBatteryCycles(v.batteryCycles) ? '' : ' aria-invalid="true"'}></label><p class="muted small">${esc(t('Leave blank if unknown. Enter the readings from this device.'))}</p></fieldset>`;
  const optionsSection = `<section class="card device-options"><h2>${esc(t('Options and prices'))}</h2>${deviceStockControls(p)}<p class="muted condition-help">${esc(t('Choose New or Used like new for each option.'))} ${esc(t('Choose Used like new to enter battery health and cycles.'))}</p><div class="variants">${p.variants.map((v, i) => `<div class="variant"><fieldset class="condition-choice"><legend>${esc(t('Condition'))} · ${esc(t('Option'))} ${i + 1}</legend><div class="condition-options">${Object.entries(conditionOptions).map(([key, label]) => `<label class="condition-option"><input type="radio" name="v.${i}.condition" value="${key}"${conditionGroup(v.condition) === key ? ' checked' : ''}><span>${esc(L(label))}</span></label>`).join('')}</div></fieldset><label class="f"><span>${esc(t('Storage / size'))}</span><input name="v.${i}.storage" value="${esc(v.storage)}" dir="ltr"></label><label class="f"><span>${esc(t('Warranty'))}</span>${sel(`v.${i}.warranty`, v.warranty || '', warOpts)}</label><label class="f price"><span>${esc(t('Price (JD)'))}</span><input name="v.${i}.price" type="number" inputmode="decimal" min="0.001" step="0.001" value="${esc(v.price ?? '')}" dir="ltr"${validPrice(v.price) ? '' : ' aria-invalid="true"'}></label><label class="f price offer-price"><span>${esc(t('Offer price (JD, optional)'))}</span><input name="v.${i}.offerPrice" type="number" inputmode="decimal" min="0.001" step="0.001" value="${esc(v.offerPrice ?? '')}" dir="ltr"${validOfferPrice(v) ? '' : ' aria-invalid="true"'}><small>${esc(t('Leave blank for no offer. It must be lower than the price; the old price shows crossed out.'))}</small></label>
  ${batteryFields(v, i)}<div class="stock-fields"><fieldset class="stock-status"><legend>${esc(t('Availability'))}</legend><label class="stock-toggle"><input type="checkbox" name="v.${i}.soldOut"${v.soldOut ? ' checked' : ''}><span>${esc(t('Out of stock'))}</span></label></fieldset><label class="f stock-quantity"><span>${esc(t('Stock quantity (optional)'))}</span><input name="v.${i}.stockQuantity" type="number" inputmode="numeric" min="0" max="${MAX_STOCK_QUANTITY}" step="1" placeholder="${esc(t('Not tracked'))}" value="${esc(v.stockQuantity ?? '')}" dir="ltr"${validStockQuantity(v.stockQuantity) ? '' : ' aria-invalid="true"'}><small>${esc(t('Leave blank for no stock limit. Enter 0 for out of stock.'))} ${esc(t('Update this quantity when your stock changes.'))}</small></label></div>
  <div class="checks small">${Object.keys(noteLabels).map((n) => `<label><input type="checkbox" name="v.${i}.note.${n}"${(v.notes || []).includes(n) ? ' checked' : ''}> ${esc(L(noteLabels[n]))}</label>`).join('')}</div><button type="button" class="btn ghost small" data-remove-variant="${i}"${p.variants.length < 2 ? ' disabled' : ''}>${esc(t('Remove'))}</button></div>`).join('')}</div><button type="button" class="btn small" data-add-variant>${esc(t('Add option'))}</button></section>`;
  return `<div class="head"><button type="button" class="btn ghost small" data-close-edit>← ${esc(t('Done'))}</button><h1 dir="auto">${esc(L(p.name) || t('Add device'))}</h1><div class="btns"><button type="button" class="btn ghost small" data-duplicate>${esc(t('Duplicate'))}</button><button type="button" class="btn danger small" data-delete>${esc(t('Delete'))}</button></div></div>
  ${p.variants.some((v) => conditionGroup(v.condition) === 'like-new') ? `<aside class="battery-edit-hint"><p>${esc(t('Used options include optional battery health and cycle readings below.'))}</p><button type="button" class="btn ghost small" data-focus-battery>${esc(t('Battery details'))}</button></aside>` : ''}
  <form id="device-form" class="edit" autocomplete="off">${optionsSection}<div class="grid2"><section class="card"><div class="grid2 tight">${field('Name (Arabic)', 'name.ar', p.name.ar, { dir: 'auto' })}${field('Name (English)', 'name.en', p.name.en, { dir: 'ltr' })}${field('Brand', 'brand', p.brand, { dir: 'ltr' })}<label class="f"><span>${esc(t('Category'))}</span>${sel('category', p.category, state.draft.categories.map((c) => [c.id, L(c.name)]))}</label></div>
  ${USE_TECHNICAL ? `${field('Summary (Arabic)', 'technical.summary.ar', p.technical?.summary?.ar || '', { type: 'textarea', dir: 'rtl', attrs: 'maxlength="1200"' })}${field('Summary (English)', 'technical.summary.en', p.technical?.summary?.en || '', { type: 'textarea', dir: 'ltr', attrs: 'maxlength="1200"' })}` : `${field('Short line (Arabic)', 'tagline.ar', p.tagline?.ar || '')}${field('Short line (English)', 'tagline.en', p.tagline?.en || '', { dir: 'ltr' })}${field('About (Arabic)', 'about.ar', p.about?.ar || '', { type: 'textarea' })}${field('About (English)', 'about.en', p.about?.en || '', { type: 'textarea', dir: 'ltr' })}`}
  <div class="checks"><label><input type="checkbox" name="offer"${p.offer ? ' checked' : ''}> ${esc(t('Show in offers'))}</label><label><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}> ${esc(t('Show on home page'))}</label><label><input type="checkbox" name="hidden"${p.hidden ? ' checked' : ''}> ${esc(t('Hide from the site'))}</label></div>
  <p class="muted small">${esc(t('A device with an offer price shows in offers automatically. Tick this to show it there without one.'))}</p>
  <p class="muted small">${esc(t('The latest selected device leads its category in the home showcase for Phones, Laptops, Watches and Audio. Selecting a device also makes it visible.'))} ${esc(t(IS_PAGES ? 'Save preview to see your home selections.' : 'Publish to show your home selections.'))}</p>
  ${USE_TECHNICAL ? '' : field('Instagram post link (optional)', 'source', p.source || '', { type: 'url', dir: 'ltr' })}<p class="muted small">${esc(t('Device id'))}: <code dir="ltr">${esc(p.id)}</code></p></section>
  <section class="card"><h2>${esc(t('Photo'))}</h2><div class="photo">${thumb(p)}</div><p class="muted small">${esc(t('A photo with a plain or transparent background looks best.'))}</p><div class="btns"><label class="btn"><input type="file" id="photo-input" accept="image/*" hidden>${esc(t('Upload photo'))}</label>${p.photo ? `<button type="button" class="btn ghost" data-clear-photo>${esc(t('Use the shipped photo'))}</button>` : ''}</div>
  <h2>${esc(t('Specs'))}</h2><div class="specs">${USE_TECHNICAL ? technicalFields(p) : (p.specs || []).map((s, i) => `<div class="spec"><input name="spec.${i}.ar" value="${esc(s.ar)}" placeholder="${esc(t('Arabic'))}"><input name="spec.${i}.en" value="${esc(s.en)}" placeholder="${esc(t('English'))}" dir="ltr"><button type="button" class="btn ghost small" data-remove-spec="${i}" aria-label="${esc(t('Remove'))}">×</button></div>`).join('')}</div><button type="button" class="btn ghost small" data-add-spec>${esc(t('Add line'))}</button></section></div>
</form>`;
}
function slugify(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'device'; }
function uniqueId(base) { const ids = new Set(state.draft.products.map((p) => p.id)); let id = base; let n = 2; while (ids.has(id)) id = `${base}-${n++}`; return id; }
function readDeviceForm(form) {
  const p = state.draft.products[state.editing.index];
  const get = (n) => form.elements[n];
  p.name = { ar: get('name.ar').value.trim(), en: get('name.en').value.trim() };
  p.brand = get('brand').value.trim();
  const newlySelected = get('featured').checked && (!p.featured || p.category !== get('category').value);
  applyHomePlacement(p, state.draft.products, { category: get('category').value, featured: get('featured').checked, hidden: get('hidden').checked });
  if (newlySelected) state.draft.settings.heroMode = 'selected';
  get('hidden').checked = p.hidden;
  if (USE_TECHNICAL) {
    p.technical ||= { summary: { ar: '', en: '' }, specs: [] };
    p.technical.summary = { ar: get('technical.summary.ar').value.trim(), en: get('technical.summary.en').value.trim() };
    p.technical.specs = (p.technical.specs || []).map((s, i) => ({
      label: { ar: get(`technical.${i}.label.ar`).value.trim(), en: get(`technical.${i}.label.en`).value.trim() },
      value: { ar: get(`technical.${i}.value.ar`).value.trim(), en: get(`technical.${i}.value.en`).value.trim() },
    }));
  } else {
    p.tagline = { ar: get('tagline.ar').value.trim(), en: get('tagline.en').value.trim() };
    p.about = { ar: get('about.ar').value.trim(), en: get('about.en').value.trim() };
    p.source = get('source').value.trim();
    p.specs = (p.specs || []).map((s, i) => ({ ar: get(`spec.${i}.ar`).value.trim(), en: get(`spec.${i}.en`).value.trim() }));
  }
  p.offer = get('offer').checked;
  if (p._new && p.name.en) { const others = new Set(state.draft.products.filter((x) => x !== p).map((x) => x.id)); let id = slugify(p.name.en); let n = 2; const base = id; while (others.has(id)) id = `${base}-${n++}`; p.id = id; }
  p.variants = p.variants.map((v, i) => {
    const price = get(`v.${i}.price`).value.trim();
    const offer = get(`v.${i}.offerPrice`).value.trim();
    const quantity = get(`v.${i}.stockQuantity`).value.trim();
    const parsedQuantity = quantity === '' ? null : Number(quantity);
    const stockQuantity = validStockQuantity(parsedQuantity) ? parsedQuantity : quantity;
    get(`v.${i}.stockQuantity`).setAttribute('aria-invalid', String(!validStockQuantity(stockQuantity)));
    const condition = get(`v.${i}.condition`).value;
    const used = conditionGroup(condition) === 'like-new';
    const fields = form.querySelector(`[data-battery-fields="${i}"]`);
    if (fields) { fields.hidden = !used; fields.disabled = !used; }
    const reading = (key, valid) => {
      const input = get(`v.${i}.${key}`);
      if (!used) input.value = '';
      const raw = input.value.trim();
      const parsed = raw === '' ? null : Number(raw);
      const value = valid(parsed) ? parsed : raw;
      input.setAttribute('aria-invalid', String(!valid(value)));
      return value;
    };
    const batteryHealth = reading('batteryHealth', validBatteryHealth);
    const batteryCycles = reading('batteryCycles', validBatteryCycles);
    const next = { ...v, storage: get(`v.${i}.storage`).value.trim(), condition, warranty: get(`v.${i}.warranty`).value, price: price === '' ? null : Math.round(Number(price) * 1000) / 1000, offerPrice: offer === '' ? null : Math.round(Number(offer) * 1000) / 1000, soldOut: get(`v.${i}.soldOut`).checked, stockQuantity, batteryHealth, batteryCycles, notes: Object.keys(noteLabels).filter((n) => get(`v.${i}.note.${n}`).checked) };
    get(`v.${i}.offerPrice`).setAttribute('aria-invalid', String(!validOfferPrice(next)));
    return next;
  });
  saveDraft();
}
async function resizeImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    const s = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(img.naturalWidth * s); canvas.height = Math.round(img.naturalHeight * s);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.86, 0.76, 0.64]) {
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', q));
      if (blob && blob.type === 'image/webp' && blob.size <= 900 * 1024) return blob;
    }
    throw new Error('too-large');
  } finally { URL.revokeObjectURL(url); }
}

// ---------- categories ----------
function categoryPhoto(category) {
  return categoryArtworkSource(category, { photoUrl: (photo) => IS_PAGES ? adminApi.photoUrl(photo) : api.photoUrl(photo), assetUrl: (image) => `../${image}` });
}
function categoriesView() {
  const list = state.draft.categories;
  const adding = state.addingCategory;
  return `<div class="head"><h1>${esc(t('Categories'))}</h1><button type="button" class="btn primary" data-add-category${list.length >= MAX_CATEGORIES || adding ? ' disabled' : ''}>${esc(t('Add category'))}</button></div>
  <p class="muted category-intro">${esc(t('Edit the home category names, pictures and order here. Device categories use the same names.'))} ${esc(t(IS_PAGES ? 'Save preview to see your category changes.' : 'Publish to show your category changes.'))}</p>
  <p class="muted small category-limit">${esc(t('You can add up to {max} categories.', { max: MAX_CATEGORIES }))}</p>
  ${adding ? `<form id="add-category-form" class="card add-category" autocomplete="off"><div class="head"><h2>${esc(t('New category'))}</h2><button type="button" class="btn ghost small" data-cancel-category>${esc(t('Cancel'))}</button></div><div class="grid2 tight">${field('Name (Arabic)', 'name.ar', adding.ar, { dir: 'rtl', attrs: `required maxlength="${CATEGORY_NAME_LIMIT}"` })}${field('Name (English)', 'name.en', adding.en, { dir: 'ltr', attrs: `required maxlength="${CATEGORY_NAME_LIMIT}"` })}</div><p class="muted small">${esc(t('Choose names in Arabic and English, up to {max} characters each.', { max: CATEGORY_NAME_LIMIT }))}</p><div class="btns"><button type="submit" class="btn primary">${esc(t('Add category'))}</button></div></form>` : ''}
  <ol class="category-editor-list">${list.map((category, index) => {
    const photo = categoryPhoto(category);
    const deviceCount = state.draft.products.filter((product) => product.category === category.id).length;
    const deleteReason = deviceCount ? t('Move its devices to another category before deleting it.') : list.length <= 1 ? t('Keep at least one category.') : '';
    return `<li class="card category-editor-card" data-category-card="${esc(category.id)}"><form data-category-form="${esc(category.id)}" autocomplete="off"><div class="category-card-head"><h2 dir="auto">${esc(L(category.name))}</h2><div class="category-card-actions"><button type="button" class="btn ghost small icon" data-category-move="${esc(category.id)}" data-dir="-1" aria-label="${esc(t('Move up'))}: ${esc(L(category.name))}"${index === 0 ? ' disabled' : ''}>↑</button><button type="button" class="btn ghost small icon" data-category-move="${esc(category.id)}" data-dir="1" aria-label="${esc(t('Move down'))}: ${esc(L(category.name))}"${index === list.length - 1 ? ' disabled' : ''}>↓</button><button type="button" class="btn danger small" data-category-delete="${esc(category.id)}" aria-label="${esc(t('Delete'))}: ${esc(L(category.name))}"${deleteReason ? ` disabled title="${esc(deleteReason)}"` : ''}>${esc(t('Delete'))}</button></div></div>
    <div class="category-card-content"><div class="category-image-editor"><div class="category-photo">${photo.src ? `<img src="${esc(photo.src)}" alt="${esc(L(category.name))}" loading="lazy">` : `<span class="category-photo-placeholder" aria-label="${esc(t('No category photo yet.'))}">${esc((L(category.name) || '?').slice(0, 1))}</span>`}</div><div class="btns category-photo-actions"><label class="btn small" for="category-photo-${esc(category.id)}">${esc(t(photo.custom ? 'Change photo' : 'Upload photo'))}<input type="file" id="category-photo-${esc(category.id)}" data-category-photo="${esc(category.id)}" accept="image/*" class="file-input" aria-label="${esc(t('Category photo'))}: ${esc(L(category.name))}"></label>${photo.custom ? `<button type="button" class="btn ghost small" data-category-reset-photo="${esc(category.id)}">${esc(t('Reset photo'))}</button>` : ''}</div></div>
    <div class="category-fields">${field('Name (Arabic)', 'name.ar', category.name.ar, { dir: 'rtl', attrs: `required maxlength="${CATEGORY_NAME_LIMIT}"` })}${field('Name (English)', 'name.en', category.name.en, { dir: 'ltr', attrs: `required maxlength="${CATEGORY_NAME_LIMIT}"` })}<p class="muted small">${esc(t('Category id'))}: <code dir="ltr">${esc(category.id)}</code></p><p class="muted small">${esc(t('The category id stays the same when you rename it.'))}</p><p class="muted small category-photo-help">${esc(t('The picture appears in the home category tile. A transparent image looks best.'))}${!photo.custom ? ` ${esc(t('Uses the default category picture until you upload a photo.'))}` : ''}</p><p class="muted small">${deviceCount} ${esc(t('devices in this category'))}${deleteReason ? ` · ${esc(deleteReason)}` : ''}</p></div></div></form></li>`;
  }).join('')}</ol>`;
}
function readCategoryForm(form) {
  const category = state.draft.categories.find((item) => item.id === form.dataset.categoryForm);
  if (!category) return;
  category.name = { ar: form.elements['name.ar'].value.trim(), en: form.elements['name.en'].value.trim() };
  for (const code of ['ar', 'en']) form.elements[`name.${code}`].setAttribute('aria-invalid', String(!category.name[code] || category.name[code].length > CATEGORY_NAME_LIMIT));
  const heading = form.querySelector('h2');
  if (heading) heading.textContent = L(category.name) || category.id;
  saveDraft();
}
function nextCategoryId(name) {
  const ids = new Set(state.draft.categories.map((category) => category.id));
  const base = slugify(name).slice(0, 30).replace(/-$/, '') || 'category';
  let id = base; let n = 2;
  while (ids.has(id) || !validCategoryId(id)) { const suffix = `-${n++}`; id = `${base.slice(0, 30 - suffix.length).replace(/-$/, '')}${suffix}`; }
  return id;
}

// ---------- settings ----------
const textSections = {
  home: { name: 'Home page', fields: [
    ['store.heroLine1', 'Hero title — first line'], ['store.heroLine2', 'Hero title — second line'], ['store.heroShop', 'Shop devices button'], ['store.lookingFor', 'Categories heading'], ['store.allDevices', 'View all devices button'], ['store.offersTitle', 'Offers heading'], ['store.offersAll', 'All offers button'], ['store.servicesTitle', 'Services heading'], ['store.servicesText', 'Services introduction'], ['store.aboutTitle', 'About heading'], ['store.aboutText', 'About introduction'],
  ] },
  navigation: { name: 'Header and footer', fields: [
    ['store.home', 'Home link'], ['store.shop', 'Devices link'], ['store.offers', 'Offers link'], ['store.maintenance', 'Repair link'], ['store.tradein', 'Trade-in link'], ['store.contact', 'Visit us link'], ['extra.brandName', 'Brand name'], ['extra.brandSubtitle', 'Brand subtitle'], ['extra.copyright', 'Footer copyright'], ['extra.footerTrademark', 'Store description in footer'],
  ] },
  devices: { name: 'Devices and search', fields: [
    ['store.shopIntro', 'Devices page introduction'], ['store.offersIntro', 'Offers page introduction'], ['store.searchPlaceholder', 'Search placeholder'], ['store.add', 'Add to bag button'], ['store.choose', 'Choose option button'], ['store.soldOut', 'Out of stock label'], ['store.condNew', 'New condition label'], ['store.condUsed', 'Used condition label'], ['store.batteryHealth', 'Battery health label'], ['store.batteryCycles', 'Battery cycles label'], ['store.noResults', 'No results heading'],
  ] },
  services: { name: 'Repair, trade-in and visit us', fields: [
    ['store.serviceTitle', 'Repair heading'], ['store.serviceText', 'Repair introduction'], ['store.tradeTitle', 'Trade-in heading'], ['store.tradeText', 'Trade-in introduction'], ['store.tradeNote', 'Trade-in note'], ['store.contactTitle', 'Visit us heading'], ['store.contactIntro', 'Visit us introduction'], ['store.map', 'Map button'], ['store.phone', 'Call button'],
  ] },
  checkout: { name: 'Bag and checkout', fields: [
    ['store.bagTitle', 'Bag heading'], ['store.bagEmpty', 'Empty bag heading'], ['store.bagEmptyText', 'Empty bag message'], ['store.checkout', 'Checkout button'], ['store.checkoutTitle', 'Checkout heading'], ['store.checkoutIntro', 'Checkout introduction'], ['store.placeOrder', 'Place order button'], ['store.keepShopping', 'Keep shopping button'], ['store.doneTitle', 'Order confirmation heading'], ['store.doneNext', 'Order confirmation message'],
  ] },
  account: { name: 'Customer accounts', fields: [
    ['account.title', 'Account heading'], ['account.signin', 'Sign in button'], ['account.create', 'Create account button'], ['account.email', 'Email label'], ['account.password', 'Password label'], ['account.name', 'Name label'], ['account.mobile', 'Mobile label'], ['account.save', 'Save account button'], ['account.signout', 'Sign out button'], ['account.profile', 'Account details heading'], ['account.orders', 'My orders heading'], ['account.empty', 'No orders message'],
  ] },
};
const textFieldLabels = new Map(Object.values(textSections).flatMap((section) => section.fields));
function textEntryArea(entry) {
  const common = Object.entries(textSections).find(([, section]) => section.fields.some(([id]) => id === entry.id));
  if (common) return common[0];
  if (entry.section === 'account') return 'account';
  if (entry.section === 'shell') return 'navigation';
  if (entry.section === 'labels') return entry.id.startsWith('labels.governorates.') ? 'checkout' : 'devices';
  if (entry.section === 'extra') return /^extra\.(?:viewCategory|count|all)/.test(entry.id) ? 'devices' : /^extra\.(?:story|services)/.test(entry.id) ? 'home' : 'navigation';
  if (/^store\.(?:hero|trust\.|services|about|follow|browse|categories)/.test(entry.id)) return 'home';
  if (/^store\.(?:title|saved$|bag$|switchLang|menu)/.test(entry.id)) return 'navigation';
  if (/^store\.(?:service|trade|contact|repairCta|tradeCta|askWhatsapp|call$|ask$|source$|phone$|storeLocation|map$|social$|whatsapp$|postedOn|wa|photoNote)/.test(entry.id)) return 'services';
  if (/^store\.(?:bag|remove$|qty$|subtotal$|delivery|total$|checkout|keepShopping|name$|mobile|fulfilment|pickup|governorate$|address|notes$|placeOrder|sending$|payCash|privacy$|ordersOff|sendWhatsapp|done|receipt|demo|myOrders|signInCheckout|errors\.)/.test(entry.id)) return 'checkout';
  return 'devices';
}
function textEntryTitle(entry) {
  if (textFieldLabels.has(entry.id)) return t(textFieldLabels.get(entry.id));
  // Less-used messages still have readable, short titles rather than registry IDs
  // or an entire paragraph repeated above the editable text.
  const preview = (entry.defaults[lang] || entry.defaults.en || t('Text')).trim();
  return preview.length <= 56 ? preview : `${preview.slice(0, 53).trimEnd()}…`;
}
function textValue(entry, language) {
  const fallback = entry.id === 'store.offersTitle' ? state.draft.settings.offersTitle?.[language] || entry.defaults[language] : entry.defaults[language];
  return siteText(state.draft.settings, entry.id, language, fallback);
}
function textEntryEdited(entry) {
  return !!state.draft.settings.siteText?.[entry.id] || (entry.id === 'store.offersTitle' && ['ar', 'en'].some((language) => state.draft.settings.offersTitle?.[language] && state.draft.settings.offersTitle[language] !== entry.defaults[language]));
}
function selectedTextEntries() {
  const query = state.textQuery.trim().toLocaleLowerCase();
  if (query) return siteTextEntries.filter((entry) => [textEntryTitle(entry), t(textSections[textEntryArea(entry)].name), ...Object.values(entry.defaults), textValue(entry, 'ar'), textValue(entry, 'en')].join(' ').toLocaleLowerCase().includes(query));
  const area = textSections[state.textArea] || textSections.home;
  const common = area.fields.map(([id]) => siteTextEntries.find((entry) => entry.id === id)).filter(Boolean);
  return state.textAdvanced ? [...common, ...siteTextEntries.filter((entry) => textEntryArea(entry) === state.textArea && !common.includes(entry))] : common;
}
function textEntriesView(entries) {
  return entries.map((entry) => {
    const edited = textEntryEdited(entry);
    const tokens = [...new Set(Object.values(entry.defaults).join(' ').match(/\{[\w]+\}/g) || [])];
    const longText = Math.max(...Object.values(entry.defaults).map((value) => value.length)) > 90;
    return `<article class="text-entry" data-text-entry="${esc(entry.id)}"><div class="text-entry-head"><div><small class="muted">${esc(t(textSections[textEntryArea(entry)].name))}</small><h4 dir="auto">${esc(textEntryTitle(entry))}</h4></div><span class="text-custom-state${edited ? ' is-edited' : ''}">${esc(t(edited ? 'Edited' : 'Default'))}</span><button type="button" class="btn ghost small" data-reset-text="${esc(entry.id)}">${esc(t('Restore this text'))}</button></div><div class="grid2 tight">${['ar', 'en'].map((language) => field(language === 'ar' ? 'Arabic' : 'English', `siteText.${entry.id}.${language}`, textValue(entry, language), { type: longText ? 'textarea' : 'text', dir: language === 'ar' ? 'rtl' : 'ltr', attrs: `maxlength="${SITE_TEXT_LIMIT}" data-site-text="${esc(entry.id)}" data-text-language="${language}"` })).join('')}</div>${tokens.length ? `<p class="muted small" dir="auto">${esc(t('Keep the placeholders unchanged: {tokens}', { tokens: tokens.join(' · ') }))}</p>` : ''}</article>`;
  }).join('');
}
function websiteTextsView() {
  return `<section class="card website-texts" aria-labelledby="website-text-title"><div class="head"><h2 id="website-text-title">${esc(t('Website texts'))}</h2><button type="button" class="btn ghost small" data-reset-all-text>${esc(t('Restore all default texts'))}</button></div><p class="muted">${esc(t('Choose a page, then change its Arabic or English text. Save your changes when you finish.'))}</p><div class="text-editor-tools"><label class="f"><span>${esc(t('Page or area'))}</span><select id="site-text-area">${Object.entries(textSections).map(([id, section]) => `<option value="${id}"${id === state.textArea ? ' selected' : ''}>${esc(t(section.name))}</option>`).join('')}</select></label><label class="f text-search"><span>${esc(t('Search website texts'))}</span><input type="search" id="site-text-search" value="${esc(state.textQuery)}" placeholder="${esc(t('Search website texts'))}"><small>${esc(t('The search includes every page and additional messages.'))}</small></label></div><div class="text-list-head"><h3 data-text-area-title></h3><p class="muted small" data-text-results role="status"></p><button type="button" class="btn ghost small" data-text-clear${state.textQuery ? '' : ' hidden'}>${esc(t('Clear search'))}</button></div><p class="empty" data-text-empty hidden>${esc(t('No matching texts.'))}</p><div class="text-sections">${textEntriesView(selectedTextEntries())}</div><div class="text-more"><button type="button" class="btn ghost" data-text-advanced aria-expanded="${state.textAdvanced}">${esc(t(state.textAdvanced ? 'Show fewer texts' : 'More texts and messages'))}</button><p class="muted small">${esc(t('Additional messages include error messages, accessibility labels and less-used texts.'))}</p></div></section>`;
}
function filterWebsiteTexts() {
  const entries = selectedTextEntries();
  const list = $('.website-texts .text-sections');
  if (list) list.innerHTML = textEntriesView(entries);
  const heading = $('[data-text-area-title]');
  if (heading) heading.textContent = t(state.textQuery.trim() ? 'Search results from all pages' : textSections[state.textArea]?.name || 'Home page');
  const result = $('[data-text-results]');
  if (result) result.textContent = t('Showing {count} texts', { count: entries.length });
  const empty = $('[data-text-empty]');
  if (empty) empty.hidden = entries.length > 0;
  const more = $('.text-more');
  if (more) more.hidden = !!state.textQuery.trim();
  const clear = $('[data-text-clear]');
  if (clear) clear.hidden = !state.textQuery;
  const advanced = $('[data-text-advanced]');
  if (advanced) { advanced.textContent = t(state.textAdvanced ? 'Show fewer texts' : 'More texts and messages'); advanced.setAttribute('aria-expanded', String(state.textAdvanced)); }
}
function settingsView() {
  const s = state.draft.settings;
  const pair = (label, key, sub) => field(`${label} (Arabic)`, `${key}.ar`, s[key]?.ar || '', { type: sub }) + field(`${label} (English)`, `${key}.en`, s[key]?.en || '', { type: sub, dir: 'ltr' });
  const defaultHero = s.heroMode === 'default';
  return `<div class="head"><h1>${esc(t('Settings'))}</h1></div><form id="settings-form" class="edit"><section class="card home-presentation"><h2>${esc(t('Home presentation'))}</h2><p class="muted">${esc(t('Restore the original animated showcase without deleting devices, uploaded pictures or home selections. Selecting a device again switches back to your selected devices.'))}</p><div class="btns"><button type="button" class="btn${defaultHero ? ' primary' : ' ghost'}" data-hero-mode="default" aria-pressed="${defaultHero}">${esc(t('Restore default animations and pictures'))}</button><button type="button" class="btn${!defaultHero ? ' primary' : ' ghost'}" data-hero-mode="selected" aria-pressed="${!defaultHero}">${esc(t('Use selected devices'))}</button></div><p class="muted small" role="status">${esc(t(defaultHero ? 'Default animations and pictures are active.' : 'Your selected devices are active.'))}</p></section><div class="grid2"><section class="card"><h2>${esc(t('Contact'))}</h2>${field('Shop phone', 'phone', s.phone, { type: 'tel', dir: 'ltr' })}${field('WhatsApp number (with 962)', 'whatsapp', s.whatsapp, { type: 'tel', dir: 'ltr' })}${field(IS_PAGES ? 'Social link for the Repair and Visit us pages' : 'Instagram link', 'instagram', s.instagram, { type: 'url', dir: 'ltr' })}${field('Facebook link', 'facebook', s.facebook, { type: 'url', dir: 'ltr' })}${field('Map link', 'maps', s.maps, { type: 'url', dir: 'ltr' })}${field('Address (Arabic)', 'address.ar', s.address.ar)}${field('Address (English)', 'address.en', s.address.en, { dir: 'ltr' })}</section>
  ${IS_PAGES ? '' : `<section class="card"><h2>${esc(t('Ordering'))}</h2><div class="checks"><label><input type="checkbox" name="ordersOn"${s.ordersOn !== false ? ' checked' : ''}> ${esc(t('Take orders on the site'))}</label></div>${pair('Delivery note', 'deliveryNote', 'textarea')}${pair('Prices note', 'pricesNote', 'textarea')}</section>`}</div>${websiteTextsView()}</form>
  ${MODE === 'demo' || IS_PAGES ? '' : `<form id="password-form" class="card narrow"><h2>${esc(t('Change password'))}</h2><label class="f"><span>${esc(t('Current password'))}</span><input name="current" type="password" autocomplete="current-password" required></label><label class="f"><span>${esc(t('New password'))}</span><input name="password" type="password" autocomplete="new-password" minlength="16" required><small>${esc(t('At least 16 characters.'))}</small></label><button class="btn" type="submit">${esc(t('Change password'))}</button></form>`}`;
}
function readWebsiteTexts(form) {
  const s = state.draft.settings;
  // Only the selected page is mounted. Keep saved overrides from every other
  // page, and replace or remove only translations represented in this form.
  const overrides = clone(s.siteText || {});
  for (const entry of siteTextEntries) {
    const pair = { ...overrides[entry.id] };
    for (const language of ['ar', 'en']) {
      const input = form.elements[`siteText.${entry.id}.${language}`];
      if (!input) continue;
      const value = input.value.trim();
      const fallback = entry.id === 'store.offersTitle' ? s.offersTitle?.[language] || entry.defaults[language] : entry.defaults[language];
      if (value && value !== fallback) pair[language] = value;
      else delete pair[language];
    }
    if (Object.keys(pair).length) overrides[entry.id] = pair;
    else delete overrides[entry.id];
  }
  if (Object.keys(overrides).length) s.siteText = overrides;
  else delete s.siteText;
}
function readSettings(form) {
  const s = state.draft.settings; const g = (n) => form.elements[n];
  for (const k of ['phone', 'whatsapp', 'instagram', 'facebook', 'maps']) s[k] = g(k).value.trim();
  s.whatsapp = s.whatsapp.replace(/\D/g, '');
  for (const k of IS_PAGES ? ['address'] : ['address', 'deliveryNote', 'pricesNote']) s[k] = { ar: g(`${k}.ar`).value.trim(), en: g(`${k}.en`).value.trim() };
  s.ordersOn = IS_PAGES ? false : g('ordersOn').checked;
  readWebsiteTexts(form);
  saveDraft();
}
function focusBatteryFields() {
  const input = $('.battery-fields:not([hidden]) input');
  input?.closest('fieldset')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  input?.focus({ preventScroll: true });
}

// ---------- publish ----------
function validate(c) {
  const problems = []; const cats = new Set(c.categories.map((x) => x.id));
  if (!validSiteText(c.settings?.siteText) || !validHeroMode(c.settings?.heroMode)) problems.push(t('Check website text lengths and home presentation.'));
  if (!c.categories.length || c.categories.length > MAX_CATEGORIES || cats.size !== c.categories.length || c.categories.some((category) => !validCategoryId(category.id) || !validCategoryName(category.name) || !validCategoryImage(category.image))) problems.push(t('Check category names, ids and photos. Keep between 1 and {max} categories.', { max: MAX_CATEGORIES }));
  for (const p of c.products) {
    const name = L(p.name) || p.id;
    if (!p.name.ar || !p.name.en) problems.push(`${name}: ${t('needs an Arabic and English name')}`);
    if (!cats.has(p.category)) problems.push(`${name}: ${t('has an unknown category')}`);
    if (!p.variants.length) problems.push(`${name}: ${t('needs at least one option')}`);
    if (p.variants.some((v) => !validStockQuantity(v.stockQuantity))) problems.push(`${name}: ${t('has an invalid stock quantity')}`);
    if (p.variants.some((v) => !validBatteryHealth(v.batteryHealth) || !validBatteryCycles(v.batteryCycles))) problems.push(`${name}: ${t('has invalid battery details')}`);
    if (p.variants.some((v) => !validPrice(v.price))) problems.push(`${name}: ${t('has an option without a valid price')}`);
    else if (p.variants.some((v) => !validOfferPrice(v))) problems.push(`${name}: ${t('has an offer price that is not below its price')}`);
    if (new Set(p.variants.map((v) => v.key)).size !== p.variants.length) problems.push(`${name}: ${t('has two options with the same code')}`);
  }
  return problems;
}
async function publish() {
  readCurrentForm();
  const problems = validate(state.draft);
  if (problems.length) { flash(`${t(IS_PAGES ? 'Fix before saving:' : 'Fix before publishing:')} ${problems.slice(0, 4).join(' · ')}`, 'error'); return; }
  const button = $('#publish'); button.disabled = true; button.textContent = t(IS_PAGES ? 'Saving…' : 'Publishing…');
  try {
    for (const p of state.draft.products) delete p._new;
    if (IS_PAGES) state.draft.settings.ordersOn = false;
    const res = await adminApi.publish(state.draft, state.version);
    state.version = res.version; state.draft.version = res.version; state.published = clone(state.draft); saveDraft(); flash(t(IS_PAGES ? 'Saved to this browser.' : 'Published.'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) { flash(t(IS_PAGES ? 'A newer preview was saved in another tab. Reload it before saving again.' : 'Someone published a newer version. Load it, then make your change again.'), 'error'); $('#flash').insertAdjacentHTML('beforeend', ` <button type="button" class="btn small" data-reload-published>${esc(t(IS_PAGES ? 'Load saved preview' : 'Load the published version'))}</button>`); }
    else if (error instanceof ApiError && error.status === 401) { state.signedIn = false; render(); flash(t('Session ended. Sign in again; your draft is kept.'), 'warn'); }
    else flash(errorText(error), 'error');
  } finally { if (button.isConnected) { button.textContent = t(IS_PAGES ? 'Save preview' : 'Publish'); updateBar(); } }
}
function editableContent(content) {
  const result = withDefaults(content);
  if (USE_TECHNICAL) for (const product of result.products) product.technical ||= clone(deviceSpecifications[product.id] || { summary: { ar: '', en: '' }, specs: [] });
  return result;
}
async function loadContent({ keepDraft = true } = {}) {
  const data = await guard(() => adminApi.content());
  if (!data) return false;
  state.published = editableContent(data.content); state.version = data.version || 0;
  const saved = keepDraft ? local.read(draftKey) : null;
  state.draft = saved && saved.content && saved.baseVersion === state.version ? editableContent(saved.content) : clone(state.published);
  if (saved && saved.baseVersion !== state.version) local.remove(draftKey);
  state.dirty = JSON.stringify(state.draft) !== JSON.stringify(state.published);
  return true;
}
function readCurrentForm() {
  const device = $('#device-form');
  const settings = $('#settings-form');
  if (device && state.editing) readDeviceForm(device);
  if (settings) readSettings(settings);
  for (const form of $$('[data-category-form]')) readCategoryForm(form);
}
async function exportDraft() {
  readCurrentForm();
  try {
    const data = await adminApi.exportDraft(state.draft);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `trio-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash(t('Catalog exported. The public website is unchanged.'));
  } catch (error) { flash(errorText(error), 'error'); }
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const el = e.target instanceof Element ? e.target : null; if (!el) return;
  const hit = (s) => el.closest(s);
  if (hit('#lang')) { readCurrentForm(); lang = lang === 'ar' ? 'en' : 'ar'; local.write('trio-admin-lang', lang); render(); return; }
  if (hit('[data-view]')) { const view = hit('[data-view]').dataset.view; if (!['devices', 'categories', 'orders', 'settings'].includes(view)) return; readCurrentForm(); state.view = view; state.editing = null; state.orderOpen = null; if (IS_PAGES) history.replaceState(null, '', `#${view}`); if (state.view === 'orders') await loadOrders(); render(); return; }
  if (hit('#publish')) { publish(); return; }
  if (hit('[data-stock-edit]')) {
    state.editing = { index: Number(hit('[data-stock-edit]').dataset.stockEdit) }; render();
    $('.device-stock-controls')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return;
  }
  if (hit('[data-set-device-stock]')) {
    if (!state.signedIn) return;
    readCurrentForm();
    const button = hit('[data-set-device-stock]');
    const product = state.draft.products.find((item) => item.id === button.dataset.setDeviceStock);
    if (product) { setDeviceSoldOut(product, button.dataset.soldOut === 'true'); saveDraft(); render(); flash(t('Stock updated. Save your changes to apply it.')); }
    return;
  }
  if (hit('[data-text-advanced]')) {
    readCurrentForm(); state.textAdvanced = !state.textAdvanced; filterWebsiteTexts(); return;
  }
  if (hit('[data-text-clear]')) {
    readCurrentForm(); state.textQuery = ''; const search = $('#site-text-search'); if (search) search.value = ''; filterWebsiteTexts(); return;
  }
  if (hit('[data-hero-mode]')) {
    readCurrentForm();
    const mode = hit('[data-hero-mode]').dataset.heroMode;
    if (!['default', 'selected'].includes(mode)) return;
    state.draft.settings.heroMode = mode; saveDraft(); render(); flash(t('Home presentation updated. Save your changes to apply it.')); return;
  }
  if (hit('[data-reset-text]') || hit('[data-reset-all-text]')) {
    const all = !!hit('[data-reset-all-text]');
    if (all && !confirmed(t('Restore all website texts? Contact details, devices, prices and photos are kept.'))) return;
    readCurrentForm();
    const ids = all ? siteTextEntries.map((entry) => entry.id) : [hit('[data-reset-text]').dataset.resetText];
    for (const entry of siteTextEntries.filter((entry) => ids.includes(entry.id))) {
      if (state.draft.settings.siteText) delete state.draft.settings.siteText[entry.id];
      if (entry.id === 'store.offersTitle') delete state.draft.settings.offersTitle;
      for (const language of ['ar', 'en']) {
        const input = $(`[data-site-text="${entry.id}"][data-text-language="${language}"]`);
        if (input) input.value = entry.defaults[language];
      }
      const label = $(`[data-text-entry="${entry.id}"] .text-custom-state`);
      if (label) { label.textContent = t('Default'); label.classList.remove('is-edited'); }
    }
    if (state.draft.settings.siteText && !Object.keys(state.draft.settings.siteText).length) delete state.draft.settings.siteText;
    saveDraft(); filterWebsiteTexts(); flash(t(all ? 'Default website texts restored. Save your changes to apply them.' : 'Text restored. Save your changes to apply it.')); return;
  }
  if (IS_PAGES && hit('#export-draft')) { await exportDraft(); return; }
  if (IS_PAGES && hit('#reset-preview')) {
    if (!confirmed(t('Reset this browser preview to the public catalog? Your exported files are kept.'))) return;
    try { await adminApi.reset(); local.remove(draftKey); await loadContent({ keepDraft: false }); state.editing = null; state.addingCategory = null; state.view = 'devices'; render(); flash(t('Preview reset to the public catalog.')); }
    catch (error) { flash(errorText(error), 'error'); }
    return;
  }
  if (hit('#discard')) { if (confirmed(t(IS_PAGES ? 'Discard changes since the last saved preview?' : 'Discard all unpublished changes?'))) { state.draft = clone(state.published); state.editing = null; state.addingCategory = null; saveDraft(); render(); } return; }
  if (hit('[data-reload-published]')) { await loadContent({ keepDraft: false }); state.editing = null; state.addingCategory = null; render(); return; }
  if (hit('#logout') && !IS_PAGES) { await guard(() => adminApi.logout()); state.signedIn = false; render(); return; }
  if (hit('[data-order-filter]')) { state.orderFilter = hit('[data-order-filter]').dataset.orderFilter; if (MODE !== 'demo') await loadOrders(); render(); return; }
  if (hit('[data-load-older-orders]')) { const button = hit('[data-load-older-orders]'); button.disabled = true; await loadOrders({ append: true }); render(); return; }
  if (IS_PAGES && hit('[data-export-orders]')) { await exportOrders(); return; }
  if (IS_PAGES && hit('[data-export-legacy-orders]')) { await exportOrders({ legacy: true }); return; }
  if (hit('[data-refresh-orders]')) { await loadOrders(); render(); return; }
  if (hit('[data-open-order]')) { state.orderOpen = hit('[data-open-order]').dataset.openOrder; render(); window.scrollTo(0, 0); return; }
  if (hit('[data-close-order]')) { state.orderOpen = null; await loadOrders(); render(); return; }
  if (hit('[data-add-category]')) {
    if (!state.signedIn || state.draft.categories.length >= MAX_CATEGORIES) return;
    readCurrentForm(); state.addingCategory = { ar: '', en: '' }; render(); $('#add-category-form input')?.focus(); return;
  }
  if (hit('[data-cancel-category]')) { state.addingCategory = null; render(); return; }
  if (hit('[data-category-move]')) {
    readCurrentForm();
    const button = hit('[data-category-move]'); const list = state.draft.categories;
    const index = list.findIndex((category) => category.id === button.dataset.categoryMove); const next = index + Number(button.dataset.dir);
    if (index >= 0 && next >= 0 && next < list.length) { [list[index], list[next]] = [list[next], list[index]]; saveDraft(); render(); }
    return;
  }
  if (hit('[data-category-delete]')) {
    const id = hit('[data-category-delete]').dataset.categoryDelete;
    if (state.draft.products.some((product) => product.category === id)) { flash(t('Move its devices to another category before deleting it.'), 'warn'); return; }
    if (state.draft.categories.length <= 1) { flash(t('Keep at least one category.'), 'warn'); return; }
    if (confirmed(t('Delete this empty category?'))) {
      readCurrentForm(); state.draft.categories = state.draft.categories.filter((category) => category.id !== id);
      if (state.category === id) state.category = 'all';
      saveDraft(); render();
    }
    return;
  }
  if (hit('[data-category-reset-photo]')) {
    const category = state.draft.categories.find((item) => item.id === hit('[data-category-reset-photo]').dataset.categoryResetPhoto);
    if (category) { readCurrentForm(); category.photo = ''; category.image = ''; saveDraft(); render(); }
    return;
  }
  if (hit('[data-cat]')) { state.category = hit('[data-cat]').dataset.cat; render(); return; }
  if (hit('[data-battery-edit]')) { state.editing = { index: Number(hit('[data-battery-edit]').dataset.batteryEdit) }; render(); focusBatteryFields(); return; }
  if (hit('[data-focus-battery]')) { focusBatteryFields(); return; }
  if (hit('[data-edit]')) { state.editing = { index: Number(hit('[data-edit]').dataset.edit) }; render(); window.scrollTo(0, 0); return; }
  if (hit('[data-close-edit]')) { state.editing = null; render(); return; }
  if (hit('[data-move]')) { const b = hit('[data-move]'); const i = Number(b.dataset.move); const j = i + Number(b.dataset.dir); const list = state.draft.products; if (j >= 0 && j < list.length) { [list[i], list[j]] = [list[j], list[i]]; saveDraft(); render(); } return; }
  if (hit('[data-add-device]')) {
    const cat = state.category !== 'all' ? state.category : state.draft.categories[0].id;
    const p = { _new: true, id: uniqueId('device'), category: cat, brand: 'Apple', name: { ar: '', en: '' }, image: '', photo: '', hidden: true, offer: false, featured: false, tagline: { ar: '', en: '' }, about: { ar: '', en: '' }, specs: [], source: '', ...(USE_TECHNICAL ? { technical: { summary: { ar: '', en: '' }, specs: [] } } : {}), variants: [{ key: 'a', storage: '', condition: 'new', notes: [], warranty: '', price: null, soldOut: false }] };
    state.draft.products.unshift(p); state.editing = { index: 0 }; saveDraft(); render(); return;
  }
  const form = $('#device-form');
  if (form && state.editing) {
    const p = state.draft.products[state.editing.index];
    if (hit('[data-duplicate]')) { readDeviceForm(form); const copy = clone(p); copy.id = uniqueId(`${p.id}-copy`); copy.hidden = true; copy.featured = false; copy.homePriority = 0; state.draft.products.splice(state.editing.index + 1, 0, copy); state.editing = { index: state.editing.index + 1 }; saveDraft(); render(); return; }
    if (hit('[data-delete]')) { if (confirmed(t('Delete this device?'))) { state.draft.products.splice(state.editing.index, 1); state.editing = null; saveDraft(); render(); } return; }
    if (hit('[data-add-variant]')) { readDeviceForm(form); const keys = new Set(p.variants.map((v) => v.key)); let k = 1; while (keys.has(`o${k}`)) k++; p.variants.push({ key: `o${k}`, storage: '', condition: conditionGroup(p.variants[0]?.condition) || 'new', notes: [], warranty: '', price: null, soldOut: false }); saveDraft(); render(); return; }
    if (hit('[data-remove-variant]')) { readDeviceForm(form); p.variants.splice(Number(hit('[data-remove-variant]').dataset.removeVariant), 1); saveDraft(); render(); return; }
    if (hit('[data-add-spec]')) { readDeviceForm(form); if (USE_TECHNICAL) p.technical.specs.push({ label: { ar: '', en: '' }, value: { ar: '', en: '' } }); else (p.specs ||= []).push({ ar: '', en: '' }); saveDraft(); render(); return; }
    if (hit('[data-remove-spec]')) { readDeviceForm(form); (USE_TECHNICAL ? p.technical.specs : p.specs).splice(Number(hit('[data-remove-spec]').dataset.removeSpec), 1); saveDraft(); render(); return; }
    if (hit('[data-clear-photo]')) { p.photo = ''; saveDraft(); render(); return; }
  }
});
function confirmed(text) { try { return window.confirm(text); } catch { return true; } }
document.addEventListener('change', async (e) => {
  if (e.target.id === 'site-text-area') {
    readCurrentForm(); if (!textSections[e.target.value]) return;
    state.textArea = e.target.value; state.textAdvanced = false; state.textQuery = '';
    const search = $('#site-text-search'); if (search) search.value = '';
    filterWebsiteTexts(); return;
  }
  const form = e.target.closest && e.target.closest('form');
  if (e.target.dataset?.categoryPhoto !== undefined && e.target.files?.[0]) {
    const category = state.draft?.categories.find((item) => item.id === e.target.dataset.categoryPhoto);
    if (!state.signedIn || !category) return;
    const input = e.target; const file = input.files[0];
    readCurrentForm(); input.disabled = true; flash(t('Uploading…'), 'warn');
    try {
      const blob = await resizeImage(file); const res = await adminApi.uploadPhoto(blob);
      if (state.draft.categories.includes(category)) { category.photo = res.id; saveDraft(); render(); flash(t(IS_PAGES ? 'Photo uploaded. Save preview to show it.' : 'Photo uploaded. Publish to show it.')); }
    } catch (error) { if (error instanceof ApiError && error.status === 401) { state.signedIn = false; render(); return; } flash(t('Could not upload the photo.'), 'error'); }
    finally { if (input.isConnected) { input.disabled = false; input.value = ''; } }
    return;
  }
  if (e.target.dataset?.homeDevice !== undefined) {
    const product = state.draft?.products.find((item) => item.id === e.target.dataset.homeDevice);
    if (!state.signedIn || state.view !== 'devices' || state.editing || !product) return;
    applyHomePlacement(product, state.draft.products, { featured: e.target.checked, category: product.category, hidden: product.hidden });
    if (e.target.checked) state.draft.settings.heroMode = 'selected';
    saveDraft();
    if (!product.hidden) e.target.closest('.device-row')?.querySelector('.flag.off')?.remove();
    return;
  }
  if (IS_PAGES && e.target.id === 'import-draft' && e.target.files?.[0]) {
    const file = e.target.files[0];
    try {
      if (file.size > 20 * 1024 * 1024) { flash(t('This file is too large.'), 'error'); return; }
      const data = JSON.parse(await file.text());
      const content = await adminApi.importDraft(data);
      state.draft = withDefaults(content); state.draft.settings.ordersOn = false; state.editing = null; state.addingCategory = null; state.view = 'devices'; state.category = 'all'; state.query = '';
      saveDraft(); render(); flash(t('Catalog imported. Save preview to view it.'));
    } catch (error) { flash(error instanceof ApiError ? errorText(error) : t('Could not import this file. Use a Trio catalog JSON export.'), 'error'); }
    finally { e.target.value = ''; }
    return;
  }
  if (e.target.id === 'photo-input' && e.target.files[0]) {
    const file = e.target.files[0]; const p = state.draft.products[state.editing.index];
    flash(t('Uploading…'), 'warn');
    try { const blob = await resizeImage(file); const res = await adminApi.uploadPhoto(blob); p.photo = res.id; saveDraft(); render(); flash(t(IS_PAGES ? 'Photo uploaded. Save preview to show it.' : 'Photo uploaded. Publish to show it.')); }
    catch (error) { if (error instanceof ApiError && error.status === 401) { state.signedIn = false; render(); return; } flash(t('Could not upload the photo.'), 'error'); }
    return;
  }
  if (form && form.id === 'device-form') readDeviceForm(form);
  if (form && form.id === 'settings-form') readSettings(form);
  if (form?.dataset?.categoryForm !== undefined) readCategoryForm(form);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'site-text-search') { readCurrentForm(); state.textQuery = e.target.value; filterWebsiteTexts(); return; }
  if (e.target.id === 'device-search') { state.query = e.target.value; const pos = e.target.selectionStart; render(); const box = $('#device-search'); box.focus(); box.setSelectionRange(pos, pos); }
  if (e.target.id === 'order-search') { state.orderQuery = e.target.value; const pos = e.target.selectionStart; render(); const box = $('#order-search'); box.focus(); if (pos !== null) box.setSelectionRange(pos, pos); }
  const form = e.target.closest && e.target.closest('form');
  if (form && form.id === 'device-form' && e.target.type !== 'file') readDeviceForm(form);
  if (form && form.id === 'settings-form') {
    readSettings(form);
    if (e.target.dataset?.siteText) {
      const entry = siteTextEntries.find((item) => item.id === e.target.dataset.siteText);
      const edited = entry && textEntryEdited(entry);
      const label = e.target.closest('[data-text-entry]')?.querySelector('.text-custom-state');
      if (label) { label.textContent = t(edited ? 'Edited' : 'Default'); label.classList.toggle('is-edited', edited); }
    }
  }
  if (form?.dataset?.categoryForm !== undefined && e.target.type !== 'file') readCategoryForm(form);
  if (form?.id === 'add-category-form' && state.addingCategory) state.addingCategory = { ar: form.elements['name.ar'].value, en: form.elements['name.en'].value };
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'add-category-form') {
    if (!state.signedIn || state.draft.categories.length >= MAX_CATEGORIES) { flash(t('You can add up to {max} categories.', { max: MAX_CATEGORIES }), 'warn'); return; }
    const name = { ar: f.elements['name.ar'].value.trim(), en: f.elements['name.en'].value.trim() };
    if (!validCategoryName(name)) { flash(t('Category names are required in both languages.'), 'error'); return; }
    const id = nextCategoryId(name.en); state.draft.categories.push({ id, name }); state.addingCategory = null;
    saveDraft(); render(); $(`[data-category-card="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash(t('Category added. Add its photo or assign devices to it.')); return;
  }
  if (f.dataset?.categoryForm !== undefined) { readCategoryForm(f); return; }
  if (f.id === 'sign-form') {
    const err = $('#sign-error'); err.hidden = true;
    const show = (m) => { err.textContent = m; err.hidden = false; };
    try {
      if (!state.setup) {
        if (f.password.value.length < 16) return show(t('At least 16 characters.'));
        if (f.password.value !== f.repeat.value) return show(t('Passwords do not match.'));
        await adminApi.setup(f.code.value.trim(), f.password.value);
        state.setup = true;
      } else await adminApi.login(f.password.value);
      state.signedIn = true; await loadContent(); await loadOrders(); render();
    } catch (error) { show(errorText(error)); }
    return;
  }
  if (f.id === 'order-form') {
    const number = f.dataset.number;
    const ok = await guard(() => orderApi.updateOrder(number, { status: f.status.value, note: f.note.value }));
    if (ok) { const o = state.orders.find((x) => x.number === number); if (o) { o.status = f.status.value; o.note = f.note.value; } render(); flash(t(IS_PAGES ? 'Demo order saved.' : 'Saved.')); }
    return;
  }
  if (f.id === 'password-form') {
    if (f.password.value.length < 16) { flash(t('At least 16 characters.'), 'error'); return; }
    const ok = await guard(() => adminApi.password(f.current.value, f.password.value));
    if (ok) { f.reset(); flash(t('Password changed.')); }
  }
});
let pollingOrders = false;
async function pollOrders() {
  if (pollingOrders || !state.signedIn || document.visibilityState !== 'visible' || state.orderOpen) return;
  pollingOrders = true;
  const previous = JSON.stringify(state.orders);
  const search = $('#order-search');
  const focused = document.activeElement === search;
  const position = focused ? search.selectionStart : null;
  try {
    if (!await loadOrders()) return;
    const count = state.orders.filter((order) => order.status === 'new').length;
    if (state.view === 'orders' && previous !== JSON.stringify(state.orders)) {
      render();
      if (focused) { const field = $('#order-search'); field?.focus(); if (position !== null) field?.setSelectionRange(position, position); }
    } else {
      const button = $('[data-view=orders]');
      if (button) button.innerHTML = `${esc(t('Orders'))}${count ? `<span class="badge">${count}</span>` : ''}`;
    }
  } finally { pollingOrders = false; }
}
setInterval(pollOrders, MODE === 'demo' ? 60000 : 15000);
document.addEventListener('visibilitychange', pollOrders);
let savedPreviewRequest = 0;
async function syncSavedPreview() {
  if (!IS_PAGES || !state.signedIn || !state.draft || document.visibilityState === 'hidden') return;
  const request = ++savedPreviewRequest;
  try {
    const data = await adminApi.content();
    if (request !== savedPreviewRequest) return;
    const incoming = editableContent(data.content);
    const version = data.version || 0;
    if (version === state.version && JSON.stringify(incoming) === JSON.stringify(state.published)) return;
    // Input/change handlers already keep this tab's state current. Reading forms
    // here would call saveDraft(), which can erase another tab's cached draft.
    if (state.dirty || state.editing || state.addingCategory || state.orderOpen || $('[data-category-photo]:disabled')) {
      // Never replace a form that the owner is editing in this tab. Its original
      // version stays intact so saving also retains the normal conflict check.
      const title = lang === 'ar' ? 'تغيّرت المعاينة المحفوظة في تبويب آخر' : 'The saved preview changed in another tab';
      const message = lang === 'ar' ? 'احتفظنا بتعديلاتك هنا. صدّر نسخة منها قبل تحميل المعاينة المحفوظة.' : 'Your edits here are kept. Export a copy before loading the saved preview.';
      const notice = `<aside id="preview-sync-notice" class="preview-notice" role="status"><div><strong>${esc(title)}</strong><p>${esc(message)}</p></div><button type="button" class="btn ghost small" data-reload-published>${esc(t('Load saved preview'))}</button></aside>`;
      const previous = $('#preview-sync-notice');
      if (previous) previous.outerHTML = notice;
      else $('main.wrap')?.insertAdjacentHTML('afterbegin', notice);
      return;
    }
    state.published = clone(incoming); state.draft = clone(incoming); state.version = version; state.dirty = false;
    // Do not delete the shared editor-draft key: another open admin tab may own
    // unsaved edits. This clean tab only adopts the saved preview in memory.
    render();
  } catch { /* Keep the editor available; focus and storage events can retry. */ }
}
if (IS_PAGES) {
  window.addEventListener('storage', (event) => {
    if (event.key === 'trio-browser-shop-v1' || event.key === null) pollOrders();
    if (event.key === PREVIEW_KEY || event.key === null) syncSavedPreview();
  });
  window.addEventListener('focus', syncSavedPreview);
  document.addEventListener('visibilitychange', syncSavedPreview);
  window.addEventListener('trio-browser-shop-change', pollOrders);
}

(async function start() {
  try {
    if (!IS_PAGES) {
      const s = await adminApi.status();
      state.setup = !!s.setup; state.signedIn = !!s.signedIn;
    }
    if (state.signedIn) { await loadContent(); await loadOrders(); }
  } catch (error) { state.signedIn = false; console.warn(error); }
  render();
}());
