import { api, local, MODE, ApiError, withDefaults } from '../../src/store.js';
import { forwardArrow } from '../../../shared/navigation.js';
import { validPrice, toFils, formatJD, fromPrice, normaliseMobile, validStockQuantity, MAX_STOCK_QUANTITY, validOfferPrice, inOffers } from '../../../shared/pricing.js';
import { conditions, conditionGroup, conditionOptions, notes as noteLabels, warranties, orderStatuses, governorates } from '../../../shared/labels.js';
import { pagesAdmin } from './pages-store.js';
import deviceSpecifications from '../../../shared/device-specs.js';
import { applyHomePlacement } from '../../../shared/home-placement.js';
import { validBatteryHealth, validBatteryCycles } from '../../../shared/battery.js';
import { MAX_CATEGORIES, CATEGORY_NAME_LIMIT, validCategoryId, validCategoryName, validCategoryImage } from '../../../shared/categories.js';

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
  'Social link for the Repair and Visit us pages': 'الرابط الاجتماعي لصفحتي الصيانة وزيارتنا', 'Offers heading': 'عنوان العروض',
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
  'Uses a device picture until you upload a category photo.': 'تُستخدم صورة جهاز افتراضية حتى ترفع صورة للقسم.', 'No category photo yet.': 'لم تُضف صورة للقسم بعد.',
  'devices in this category': 'جهاز في هذا القسم', 'Move its devices to another category before deleting it.': 'انقل أجهزة هذا القسم إلى قسم آخر قبل حذفه.', 'Keep at least one category.': 'يجب إبقاء قسم واحد على الأقل.',
  'Delete this empty category?': 'هل تريد حذف هذا القسم الفارغ؟', 'Category added. Add its photo or assign devices to it.': 'أُضيف القسم. ارفع صورته أو انقل أجهزة إليه.',
  'Category names are required in both languages.': 'اسم القسم مطلوب بالعربي والإنجليزي.', 'Check category names, ids and photos. Keep between 1 and {max} categories.': 'تحقق من أسماء الأقسام ورموزها وصورها. يجب أن يكون عدد الأقسام بين 1 و{max}.',
};
let lang = local.read('trio-admin-lang') === 'en' ? 'en' : 'ar';
const t = (s, vars = {}) => (lang === 'ar' ? AR[s] || s : ({ new: 'New', confirmed: 'Confirmed', out: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' }[s] || s)).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const L = (o) => (o && typeof o === 'object' ? o[lang] || o.ar || o.en || '' : String(o || ''));
const money = (jd) => formatJD(toFils(jd), lang);

const initialView = IS_PAGES ? ({ '#orders': 'orders', '#categories': 'categories', '#settings': 'settings' }[globalThis.location?.hash] || 'devices') : 'orders';
const state = { view: initialView, signedIn: IS_PAGES, setup: true, published: null, version: 0, draft: null, dirty: false, orders: [], legacyOrders: [], orderFilter: '', orderOpen: null, orderQuery: '', orderBefore: null, editing: null, category: 'all', query: '', addingCategory: null, message: '' };

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
function devicesView() {
  const c = state.draft;
  const q = state.query.trim().toLowerCase();
  const list = c.products.filter((p) => (state.category === 'all' || p.category === state.category) && (!q || `${p.name.ar} ${p.name.en} ${p.brand}`.toLowerCase().includes(q)));
  return `<div class="head"><h1>${esc(t('Devices'))}</h1><button type="button" class="btn primary" data-add-device>${esc(t('Add device'))}</button></div><p class="muted">${esc(t(IS_PAGES ? 'Preview prices come from this list.' : 'Prices shown on the site come from this list.'))}</p>
  <div class="chips">${[['all', t('All')], ...c.categories.map((x) => [x.id, L(x.name)])].map(([id, label]) => `<button type="button" class="chip" data-cat="${esc(id)}" aria-pressed="${state.category === id}">${esc(label)} <span>${c.products.filter((p) => id === 'all' || p.category === id).length}</span></button>`).join('')}</div>
  <label class="f search"><span class="sr">${esc(t('Search devices'))}</span><input id="device-search" type="search" placeholder="${esc(t('Search devices'))}" value="${esc(state.query)}"></label>
  <p class="muted home-list-help">${esc(t('Choose home devices directly from this list. The latest selection leads its category.'))} ${esc(t(IS_PAGES ? 'Save preview to see your home selections.' : 'Publish to show your home selections.'))}</p>
  <ul class="rows">${list.map((p) => { const low = fromPrice(p); const i = c.products.indexOf(p); return `<li class="row device-row"><span class="thumb">${thumb(p)}</span><span class="d-main"><strong dir="auto">${esc(L(p.name))}</strong><small>${esc(p.brand)} · ${p.variants.length} ${esc(t('options'))}${low !== null ? ` · ${esc(t('from'))} ${esc(formatJD(low, lang))}` : ''}</small><span class="flags">${p.hidden ? `<em class="flag off">${esc(t('Hidden'))}</em>` : ''}${inOffers(p) ? `<em class="flag">${esc(t('Offer'))}</em>` : ''}</span></span><span class="d-actions"><label class="home-toggle"><input type="checkbox" role="switch" data-home-device="${esc(p.id)}"${p.featured ? ' checked' : ''}><span>${esc(t('Show on home page'))}<span class="sr">: ${esc(L(p.name))}</span></span></label><button type="button" class="btn small" data-edit="${i}">${esc(t('Edit'))}</button><button type="button" class="btn ghost small icon" data-move="${i}" data-dir="-1" aria-label="${esc(t('Move up'))}"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" class="btn ghost small icon" data-move="${i}" data-dir="1" aria-label="${esc(t('Move down'))}"${i === c.products.length - 1 ? ' disabled' : ''}>↓</button></span></li>`; }).join('')}</ul>`;
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
  const optionsSection = `<section class="card device-options"><h2>${esc(t('Options and prices'))}</h2><p class="muted condition-help">${esc(t('Choose New or Used like new for each option.'))}</p><div class="variants">${p.variants.map((v, i) => `<div class="variant"><fieldset class="condition-choice"><legend>${esc(t('Condition'))} · ${esc(t('Option'))} ${i + 1}</legend><div class="condition-options">${Object.entries(conditionOptions).map(([key, label]) => `<label class="condition-option"><input type="radio" name="v.${i}.condition" value="${key}"${conditionGroup(v.condition) === key ? ' checked' : ''}><span>${esc(L(label))}</span></label>`).join('')}</div></fieldset><label class="f"><span>${esc(t('Storage / size'))}</span><input name="v.${i}.storage" value="${esc(v.storage)}" dir="ltr"></label><label class="f"><span>${esc(t('Warranty'))}</span>${sel(`v.${i}.warranty`, v.warranty || '', warOpts)}</label><label class="f price"><span>${esc(t('Price (JD)'))}</span><input name="v.${i}.price" type="number" inputmode="decimal" min="0.001" step="0.001" value="${esc(v.price ?? '')}" dir="ltr"${validPrice(v.price) ? '' : ' aria-invalid="true"'}></label><label class="f price offer-price"><span>${esc(t('Offer price (JD, optional)'))}</span><input name="v.${i}.offerPrice" type="number" inputmode="decimal" min="0.001" step="0.001" value="${esc(v.offerPrice ?? '')}" dir="ltr"${validOfferPrice(v) ? '' : ' aria-invalid="true"'}><small>${esc(t('Leave blank for no offer. It must be lower than the price; the old price shows crossed out.'))}</small></label>
  ${batteryFields(v, i)}<div class="stock-fields"><fieldset class="stock-status"><legend>${esc(t('Availability'))}</legend><label class="stock-toggle"><input type="checkbox" name="v.${i}.soldOut"${v.soldOut ? ' checked' : ''}><span>${esc(t('Out of stock'))}</span></label></fieldset><label class="f stock-quantity"><span>${esc(t('Stock quantity (optional)'))}</span><input name="v.${i}.stockQuantity" type="number" inputmode="numeric" min="0" max="${MAX_STOCK_QUANTITY}" step="1" placeholder="${esc(t('Not tracked'))}" value="${esc(v.stockQuantity ?? '')}" dir="ltr"${validStockQuantity(v.stockQuantity) ? '' : ' aria-invalid="true"'}><small>${esc(t('Leave blank for no stock limit. Enter 0 for out of stock.'))} ${esc(t('Update this quantity when your stock changes.'))}</small></label></div>
  <div class="checks small">${Object.keys(noteLabels).map((n) => `<label><input type="checkbox" name="v.${i}.note.${n}"${(v.notes || []).includes(n) ? ' checked' : ''}> ${esc(L(noteLabels[n]))}</label>`).join('')}</div><button type="button" class="btn ghost small" data-remove-variant="${i}"${p.variants.length < 2 ? ' disabled' : ''}>${esc(t('Remove'))}</button></div>`).join('')}</div><button type="button" class="btn small" data-add-variant>${esc(t('Add option'))}</button></section>`;
  return `<div class="head"><button type="button" class="btn ghost small" data-close-edit>← ${esc(t('Done'))}</button><h1 dir="auto">${esc(L(p.name) || t('Add device'))}</h1><div class="btns"><button type="button" class="btn ghost small" data-duplicate>${esc(t('Duplicate'))}</button><button type="button" class="btn danger small" data-delete>${esc(t('Delete'))}</button></div></div>
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
  applyHomePlacement(p, state.draft.products, { category: get('category').value, featured: get('featured').checked, hidden: get('hidden').checked });
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
  const chosen = photoSrc(category);
  if (chosen) return { src: chosen, custom: true };
  const products = state.draft.products.filter((product) => product.category === category.id && !product.hidden);
  products.sort((a, b) => Number(b.featured === true) - Number(a.featured === true) || (b.homePriority || 0) - (a.homePriority || 0));
  const representative = products.find((product) => photoSrc(product));
  const defaultImage = !representative?.homePriority && ({ watches: 'assets/devices/huawei-watch-gt6.webp', audio: 'assets/categories/airpods-pro.png' })[category.id];
  return { src: defaultImage ? `../${defaultImage}` : representative ? photoSrc(representative) : '', custom: false };
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
    <div class="category-fields">${field('Name (Arabic)', 'name.ar', category.name.ar, { dir: 'rtl', attrs: `required maxlength="${CATEGORY_NAME_LIMIT}"` })}${field('Name (English)', 'name.en', category.name.en, { dir: 'ltr', attrs: `required maxlength="${CATEGORY_NAME_LIMIT}"` })}<p class="muted small">${esc(t('Category id'))}: <code dir="ltr">${esc(category.id)}</code></p><p class="muted small">${esc(t('The category id stays the same when you rename it.'))}</p><p class="muted small category-photo-help">${esc(t('The picture appears in the home category tile. A transparent image looks best.'))}${!photo.custom ? ` ${esc(t('Uses a device picture until you upload a category photo.'))}` : ''}</p><p class="muted small">${deviceCount} ${esc(t('devices in this category'))}${deleteReason ? ` · ${esc(deleteReason)}` : ''}</p></div></div></form></li>`;
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
function settingsView() {
  const s = state.draft.settings;
  const pair = (label, key, sub) => field(`${label} (Arabic)`, `${key}.ar`, s[key]?.ar || '', { type: sub }) + field(`${label} (English)`, `${key}.en`, s[key]?.en || '', { type: sub, dir: 'ltr' });
  return `<div class="head"><h1>${esc(t('Settings'))}</h1></div><form id="settings-form" class="edit"><div class="grid2"><section class="card"><h2>${esc(t('Contact'))}</h2>${field('Shop phone', 'phone', s.phone, { type: 'tel', dir: 'ltr' })}${field('WhatsApp number (with 962)', 'whatsapp', s.whatsapp, { type: 'tel', dir: 'ltr' })}${field(IS_PAGES ? 'Social link for the Repair and Visit us pages' : 'Instagram link', 'instagram', s.instagram, { type: 'url', dir: 'ltr' })}${field('Facebook link', 'facebook', s.facebook, { type: 'url', dir: 'ltr' })}${field('Map link', 'maps', s.maps, { type: 'url', dir: 'ltr' })}${field('Address (Arabic)', 'address.ar', s.address.ar)}${field('Address (English)', 'address.en', s.address.en, { dir: 'ltr' })}</section>
  <section class="card">${IS_PAGES ? '' : `<h2>${esc(t('Ordering'))}</h2><div class="checks"><label><input type="checkbox" name="ordersOn"${s.ordersOn !== false ? ' checked' : ''}> ${esc(t('Take orders on the site'))}</label></div>${pair('Delivery note', 'deliveryNote', 'textarea')}`}<h2>${esc(t('Texts'))}</h2>${pair('Offers title', 'offersTitle')}${IS_PAGES ? '' : pair('Prices note', 'pricesNote', 'textarea')}</section></div></form>
  ${MODE === 'demo' || IS_PAGES ? '' : `<form id="password-form" class="card narrow"><h2>${esc(t('Change password'))}</h2><label class="f"><span>${esc(t('Current password'))}</span><input name="current" type="password" autocomplete="current-password" required></label><label class="f"><span>${esc(t('New password'))}</span><input name="password" type="password" autocomplete="new-password" minlength="16" required><small>${esc(t('At least 16 characters.'))}</small></label><button class="btn" type="submit">${esc(t('Change password'))}</button></form>`}`;
}
function readSettings(form) {
  const s = state.draft.settings; const g = (n) => form.elements[n];
  for (const k of ['phone', 'whatsapp', 'instagram', 'facebook', 'maps']) s[k] = g(k).value.trim();
  s.whatsapp = s.whatsapp.replace(/\D/g, '');
  for (const k of IS_PAGES ? ['address', 'offersTitle'] : ['address', 'deliveryNote', 'offersTitle', 'pricesNote']) s[k] = { ar: g(`${k}.ar`).value.trim(), en: g(`${k}.en`).value.trim() };
  s.ordersOn = IS_PAGES ? false : g('ordersOn').checked;
  saveDraft();
}

// ---------- publish ----------
function validate(c) {
  const problems = []; const cats = new Set(c.categories.map((x) => x.id));
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
  if (e.target.id === 'device-search') { state.query = e.target.value; const pos = e.target.selectionStart; render(); const box = $('#device-search'); box.focus(); box.setSelectionRange(pos, pos); }
  if (e.target.id === 'order-search') { state.orderQuery = e.target.value; const pos = e.target.selectionStart; render(); const box = $('#order-search'); box.focus(); if (pos !== null) box.setSelectionRange(pos, pos); }
  const form = e.target.closest && e.target.closest('form');
  if (form && form.id === 'device-form' && e.target.type !== 'file') readDeviceForm(form);
  if (form && form.id === 'settings-form') readSettings(form);
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
if (IS_PAGES) {
  window.addEventListener('storage', (event) => { if (event.key === 'trio-browser-shop-v1' || event.key === null) pollOrders(); });
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
