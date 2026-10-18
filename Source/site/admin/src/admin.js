import { api, local, MODE, ApiError, withDefaults } from '../../src/store.js';
import { validPrice, toFils, formatJD, fromPrice } from '../../../shared/pricing.js';
import { conditions, notes as noteLabels, warranties, orderStatuses, governorates } from '../../../shared/labels.js';

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
  'Options and prices': 'الخيارات والأسعار', 'Storage / size': 'السعة / المقاس', 'Condition': 'الحالة', 'Warranty': 'الكفالة', 'Price (JD)': 'السعر (د.أ)', 'Sold out': 'نفد', 'Add option': 'أضف خيار', 'Remove': 'شيل',
  'Specs': 'مواصفات', 'Add line': 'أضف سطر', 'Arabic': 'عربي', 'English': 'إنجليزي', 'Instagram post link (optional)': 'رابط المنشور على إنستغرام (اختياري)', 'Done': 'تم', 'not stated': 'غير محددة', 'none': 'بدون',
  'Shop phone': 'رقم المحل', 'WhatsApp number (with 962)': 'رقم الواتساب (مع 962)', 'Instagram link': 'رابط إنستغرام', 'Facebook link': 'رابط فيسبوك', 'Map link': 'رابط الخريطة', 'Address (Arabic)': 'العنوان (عربي)', 'Address (English)': 'العنوان (إنجليزي)',
  'Take orders on the site': 'استقبال الطلبات من الموقع', 'Delivery note (Arabic)': 'ملاحظة التوصيل (عربي)', 'Delivery note (English)': 'ملاحظة التوصيل (إنجليزي)', 'Prices note (Arabic)': 'ملاحظة الأسعار (عربي)', 'Prices note (English)': 'ملاحظة الأسعار (إنجليزي)', 'Offers title (Arabic)': 'عنوان العروض (عربي)', 'Offers title (English)': 'عنوان العروض (إنجليزي)',
  'Change password': 'تغيير كلمة السر', 'Current password': 'كلمة السر الحالية', 'Password changed.': 'تغيّرت كلمة السر.', 'Contact': 'التواصل', 'Ordering': 'الطلبات', 'Texts': 'نصوص',
  'Demo: changes stay in this browser. No password needed.': 'نسخة عرض: التعديلات بتضل على هالمتصفح. ما في كلمة سر.', 'Could not reach the server.': 'ما قدرنا نوصل للسيرفر.', 'Something went wrong.': 'صار خطأ.',
  'Session ended. Sign in again; your draft is kept.': 'انتهت الجلسة. ادخل مرة ثانية، والتعديلات محفوظة.', 'from': 'من', 'options': 'خيارات', 'Search devices': 'ابحث عن جهاز', 'new order': 'طلب جديد', 'new orders': 'طلبات جديدة',
  'Device id': 'رمز الجهاز', 'Notes': 'ملاحظات', 'Draft saved on this device.': 'المسودة محفوظة على هالجهاز.', 'Prices shown on the site come from this list.': 'الأسعار على الموقع من هالقائمة.',
};
let lang = local.read('trio-admin-lang') === 'en' ? 'en' : 'ar';
const t = (s, vars = {}) => (lang === 'ar' ? AR[s] || s : s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const L = (o) => (o && typeof o === 'object' ? o[lang] || o.ar || o.en || '' : String(o || ''));
const money = (jd) => formatJD(toFils(jd), lang);

const state = { view: 'orders', signedIn: false, setup: true, published: null, version: 0, draft: null, dirty: false, orders: [], orderFilter: '', orderOpen: null, editing: null, category: 'all', query: '', message: '' };

function saveDraft() {
  state.dirty = JSON.stringify(state.draft) !== JSON.stringify(state.published);
  if (state.dirty) local.write('trio-admin-draft', { baseVersion: state.version, content: state.draft }); else local.remove('trio-admin-draft');
  updateBar();
}
function flash(text, kind = 'ok') {
  const box = $('#flash'); if (!box) return;
  box.textContent = text; box.className = `flash is-${kind}`; box.hidden = false;
  clearTimeout(flash.timer); flash.timer = setTimeout(() => { box.hidden = true; }, 4200);
}
function errorText(error) {
  const code = error instanceof ApiError ? error.code : '';
  return ({ 'bad-password': t('Wrong password.'), 'bad-code': t('Wrong setup code.'), 'locked': t('Too many tries. Wait 15 minutes and try again.'), network: t('Could not reach the server.'), 'weak-password': t('At least 16 characters.') })[code] || `${t('Something went wrong.')}${code ? ` (${code})` : ''}`;
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
  return `<header class="bar"><div class="bar-in"><a class="brand" href="../index.html" ${MODE === 'demo' ? '' : 'target="_blank" rel="noopener"'}><img src="../assets/instagram/logo.jpg" alt="" width="34" height="34"><span dir="ltr">TRIO</span><small>${esc(t('Admin'))}</small></a>
  <nav class="tabs">${[['orders', 'Orders'], ['devices', 'Devices'], ['settings', 'Settings']].map(([id, label]) => `<button type="button" data-view="${id}" aria-current="${state.view === id}">${esc(t(label))}${id === 'orders' && n ? `<span class="badge">${n}</span>` : ''}</button>`).join('')}</nav>
  <div class="bar-actions"><span id="draft-state" class="draft-state"></span><button type="button" id="publish" class="btn primary">${esc(t('Publish'))}</button><button type="button" id="lang" class="btn ghost" lang="${lang === 'ar' ? 'en' : 'ar'}">${lang === 'ar' ? 'EN' : 'ع'}</button>${MODE === 'demo' ? '' : `<button type="button" id="logout" class="btn ghost">${esc(t('Sign out'))}</button>`}</div></div>
  ${MODE === 'demo' ? `<p class="demo-line">${esc(t('Demo: changes stay in this browser. No password needed.'))}</p>` : ''}</header>`;
}
function updateBar() {
  const s = $('#draft-state'); const p = $('#publish');
  if (s) { s.textContent = state.dirty ? t('Unpublished changes') : t('All changes are live.'); s.classList.toggle('is-dirty', state.dirty); }
  if (p) p.disabled = !state.dirty;
  let d = $('#discard'); if (state.dirty && !d && s) { s.insertAdjacentHTML('afterend', `<button type="button" id="discard" class="btn ghost small">${esc(t('Discard changes'))}</button>`); } else if (!state.dirty && d) d.remove();
}
function render() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = `${t('Admin')} | TRIO Mobile`;
  const root = $('#admin');
  if (!state.signedIn) { root.innerHTML = signInView(); return; }
  root.innerHTML = `${topBar()}<main class="wrap">${state.view === 'orders' ? ordersView() : state.view === 'devices' ? (state.editing ? editView() : devicesView()) : settingsView()}</main><p id="flash" class="flash" role="status" hidden></p>`;
  updateBar();
}
function signInView() {
  const setup = !state.setup;
  return `<main class="sign"><form id="sign-form" class="card sign-card"><img src="../assets/instagram/logo.jpg" alt="" width="56" height="56"><h1>${esc(t('Admin'))} · TRIO</h1>${setup ? `<p class="muted">${esc(t('First sign-in: enter the setup code you were given, then choose the admin password.'))}</p><label class="f"><span>${esc(t('Setup code'))}</span><input name="code" autocomplete="off" required></label><label class="f"><span>${esc(t('New password'))}</span><input name="password" type="password" autocomplete="new-password" minlength="16" required><small>${esc(t('At least 16 characters.'))}</small></label><label class="f"><span>${esc(t('Repeat password'))}</span><input name="repeat" type="password" autocomplete="new-password" required></label>` : `<label class="f"><span>${esc(t('Password'))}</span><input name="password" type="password" autocomplete="current-password" required></label>`}<p id="sign-error" class="error" role="alert" hidden></p><button class="btn primary wide" type="submit">${esc(t(setup ? 'Create password' : 'Sign in'))}</button><button type="button" id="lang" class="btn ghost small" lang="${lang === 'ar' ? 'en' : 'ar'}">${lang === 'ar' ? 'English' : 'عربي'}</button></form></main>`;
}

// ---------- orders ----------
const fmtDate = (iso) => { try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Amman' }).format(new Date(iso)); } catch { return iso; } };
const fils = (n) => formatJD(n, lang);
function ordersView() {
  if (state.orderOpen) return orderDetail(state.orders.find((o) => o.number === state.orderOpen));
  const counts = Object.fromEntries(orderStatuses.map((s) => [s, state.orders.filter((o) => o.status === s).length]));
  const list = state.orderFilter ? state.orders.filter((o) => o.status === state.orderFilter) : state.orders;
  return `<div class="head"><h1>${esc(t('Orders'))}</h1></div><div class="chips">${[['', t('All'), state.orders.length], ...orderStatuses.map((s) => [s, t(s), counts[s]])].map(([id, label, n]) => `<button type="button" class="chip" data-order-filter="${id}" aria-pressed="${state.orderFilter === id}">${esc(label)} <span>${n}</span></button>`).join('')}</div>
  ${list.length ? `<ul class="rows">${list.map((o) => `<li><button type="button" class="row order-row" data-open-order="${esc(o.number)}"><span class="o-num" dir="ltr">${esc(o.number)}</span><span class="o-main"><strong>${esc(o.customer.name)}</strong><small dir="ltr">${esc(o.customer.mobile)}</small></span><span class="o-meta"><small>${esc(fmtDate(o.createdAt))}</small><strong>${esc(fils(o.totalFils))}</strong></span><span class="status s-${esc(o.status)}">${esc(t(o.status))}</span></button></li>`).join('')}</ul>` : `<p class="empty">${esc(t('No orders here yet.'))}</p>`}`;
}
function orderDetail(o) {
  if (!o) { state.orderOpen = null; return ordersView(); }
  const wa = `https://wa.me/962${o.customer.mobile.replace(/^0/, '')}`;
  const gov = governorates.find(([id]) => id === o.customer.governorate);
  return `<div class="head"><button type="button" class="btn ghost small" data-close-order>← ${esc(t('Back'))}</button><h1 dir="ltr">${esc(o.number)}</h1><span class="status s-${esc(o.status)}">${esc(t(o.status))}</span></div>
  <div class="grid2"><section class="card"><h2>${esc(o.customer.name)}</h2><p dir="ltr" class="big">${esc(o.customer.mobile)}</p><div class="btns"><a class="btn primary" href="tel:${esc(o.customer.mobile)}">${esc(t('Call'))}</a><a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener">${esc(t('WhatsApp'))}</a></div>
  <p><strong>${esc(o.fulfilment === 'pickup' ? t('Pickup in store') : t('Delivery'))}</strong>${o.fulfilment === 'pickup' ? '' : ` — ${esc(gov ? (lang === 'ar' ? gov[1] : gov[2]) : o.customer.governorate)}`}</p>${o.customer.address ? `<p>${esc(o.customer.address)}</p>` : ''}${o.customer.notes ? `<p class="muted"><strong>${esc(t('Customer notes'))}:</strong> ${esc(o.customer.notes)}</p>` : ''}<p class="muted">${esc(fmtDate(o.createdAt))}</p></section>
  <section class="card"><ul class="lines">${o.lines.map((l) => `<li><span dir="auto">${esc(lang === 'ar' ? l.nameAr || l.name : l.name)}${l.storage ? ` · ${esc(l.storage)}` : ''}${l.condition ? ` · ${esc(L(conditions[l.condition]))}` : ''}</span><span>× ${l.qty}</span><strong>${esc(fils(l.unitFils * l.qty))}</strong></li>`).join('')}</ul><p class="total"><span>${esc(t('Total'))}</span><strong>${esc(fils(o.totalFils))}</strong></p>
  <form id="order-form" data-number="${esc(o.number)}"><label class="f"><span>${esc(t('Status'))}</span><select name="status">${orderStatuses.map((s) => `<option value="${s}"${o.status === s ? ' selected' : ''}>${esc(t(s))}</option>`).join('')}</select></label><label class="f"><span>${esc(t('Private note'))}</span><textarea name="note" rows="3" maxlength="500">${esc(o.note || '')}</textarea></label><button class="btn primary" type="submit">${esc(t('Save'))}</button></form></section></div>`;
}
async function loadOrders() {
  const data = await guard(() => api.admin.orders());
  if (data) state.orders = data.orders || [];
}

// ---------- devices ----------
function devicesView() {
  const c = state.draft;
  const q = state.query.trim().toLowerCase();
  const list = c.products.filter((p) => (state.category === 'all' || p.category === state.category) && (!q || `${p.name.ar} ${p.name.en} ${p.brand}`.toLowerCase().includes(q)));
  return `<div class="head"><h1>${esc(t('Devices'))}</h1><button type="button" class="btn primary" data-add-device>${esc(t('Add device'))}</button></div><p class="muted">${esc(t('Prices shown on the site come from this list.'))}</p>
  <div class="chips">${[['all', t('All')], ...c.categories.map((x) => [x.id, L(x.name)])].map(([id, label]) => `<button type="button" class="chip" data-cat="${esc(id)}" aria-pressed="${state.category === id}">${esc(label)} <span>${c.products.filter((p) => id === 'all' || p.category === id).length}</span></button>`).join('')}</div>
  <label class="f search"><span class="sr">${esc(t('Search devices'))}</span><input id="device-search" type="search" placeholder="${esc(t('Search devices'))}" value="${esc(state.query)}"></label>
  <ul class="rows">${list.map((p) => { const low = fromPrice(p); const i = c.products.indexOf(p); return `<li class="row device-row"><span class="thumb">${thumb(p)}</span><span class="d-main"><strong dir="auto">${esc(L(p.name))}</strong><small>${esc(p.brand)} · ${p.variants.length} ${esc(t('options'))}${low !== null ? ` · ${esc(t('from'))} ${esc(formatJD(low, lang))}` : ''}</small><span class="flags">${p.hidden ? `<em class="flag off">${esc(t('Hidden'))}</em>` : ''}${p.offer ? `<em class="flag">${esc(t('Offer'))}</em>` : ''}${p.featured ? `<em class="flag">${esc(t('Featured'))}</em>` : ''}</span></span><span class="d-actions"><button type="button" class="btn small" data-edit="${i}">${esc(t('Edit'))}</button><button type="button" class="btn ghost small icon" data-move="${i}" data-dir="-1" aria-label="${esc(t('Move up'))}"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" class="btn ghost small icon" data-move="${i}" data-dir="1" aria-label="${esc(t('Move down'))}"${i === c.products.length - 1 ? ' disabled' : ''}>↓</button></span></li>`; }).join('')}</ul>`;
}
function photoSrc(p) { if (p.photo) { const u = api.photoUrl(p.photo); if (u) return u; } return p.image ? `../${p.image}` : ''; }
function thumb(p) { const s = photoSrc(p); return s ? `<img src="${esc(s)}" alt="" loading="lazy">` : `<span class="noimg">${esc(p.brand.slice(0, 1))}</span>`; }
function field(label, name, value, { type = 'text', dir = '', attrs = '' } = {}) {
  return `<label class="f"><span>${esc(t(label))}</span>${type === 'textarea' ? `<textarea name="${name}" rows="3"${dir ? ` dir="${dir}"` : ''} ${attrs}>${esc(value)}</textarea>` : `<input name="${name}" type="${type}" value="${esc(value)}"${dir ? ` dir="${dir}"` : ''} ${attrs}>`}</label>`;
}
function editView() {
  const p = state.draft.products[state.editing.index];
  if (!p) { state.editing = null; return devicesView(); }
  const sel = (name, value, options) => `<select name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const condOpts = Object.keys(conditions).map((k) => [k, k ? L(conditions[k]) : t('not stated')]);
  const warOpts = Object.keys(warranties).map((k) => [k, k ? L(warranties[k]) : t('none')]);
  return `<div class="head"><button type="button" class="btn ghost small" data-close-edit>← ${esc(t('Done'))}</button><h1 dir="auto">${esc(L(p.name) || t('Add device'))}</h1><div class="btns"><button type="button" class="btn ghost small" data-duplicate>${esc(t('Duplicate'))}</button><button type="button" class="btn danger small" data-delete>${esc(t('Delete'))}</button></div></div>
  <form id="device-form" class="edit" autocomplete="off"><div class="grid2"><section class="card"><div class="grid2 tight">${field('Name (Arabic)', 'name.ar', p.name.ar, { dir: 'auto' })}${field('Name (English)', 'name.en', p.name.en, { dir: 'ltr' })}${field('Brand', 'brand', p.brand, { dir: 'ltr' })}<label class="f"><span>${esc(t('Category'))}</span>${sel('category', p.category, state.draft.categories.map((c) => [c.id, L(c.name)]))}</label></div>
  ${field('Short line (Arabic)', 'tagline.ar', p.tagline?.ar || '')}${field('Short line (English)', 'tagline.en', p.tagline?.en || '', { dir: 'ltr' })}${field('About (Arabic)', 'about.ar', p.about?.ar || '', { type: 'textarea' })}${field('About (English)', 'about.en', p.about?.en || '', { type: 'textarea', dir: 'ltr' })}
  <div class="checks"><label><input type="checkbox" name="offer"${p.offer ? ' checked' : ''}> ${esc(t('Show in offers'))}</label><label><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}> ${esc(t('Show on home page'))}</label><label><input type="checkbox" name="hidden"${p.hidden ? ' checked' : ''}> ${esc(t('Hide from the site'))}</label></div>
  ${field('Instagram post link (optional)', 'source', p.source || '', { type: 'url', dir: 'ltr' })}<p class="muted small">${esc(t('Device id'))}: <code dir="ltr">${esc(p.id)}</code></p></section>
  <section class="card"><h2>${esc(t('Photo'))}</h2><div class="photo">${thumb(p)}</div><p class="muted small">${esc(t('A photo with a plain or transparent background looks best.'))}</p><div class="btns"><label class="btn"><input type="file" id="photo-input" accept="image/*" hidden>${esc(t('Upload photo'))}</label>${p.photo ? `<button type="button" class="btn ghost" data-clear-photo>${esc(t('Use the shipped photo'))}</button>` : ''}</div>
  <h2>${esc(t('Specs'))}</h2><div class="specs">${(p.specs || []).map((s, i) => `<div class="spec"><input name="spec.${i}.ar" value="${esc(s.ar)}" placeholder="${esc(t('Arabic'))}"><input name="spec.${i}.en" value="${esc(s.en)}" placeholder="${esc(t('English'))}" dir="ltr"><button type="button" class="btn ghost small" data-remove-spec="${i}" aria-label="${esc(t('Remove'))}">×</button></div>`).join('')}</div><button type="button" class="btn ghost small" data-add-spec>${esc(t('Add line'))}</button></section></div>
  <section class="card"><h2>${esc(t('Options and prices'))}</h2><div class="variants">${p.variants.map((v, i) => `<div class="variant"><label class="f"><span>${esc(t('Storage / size'))}</span><input name="v.${i}.storage" value="${esc(v.storage)}" dir="ltr"></label><label class="f"><span>${esc(t('Condition'))}</span>${sel(`v.${i}.condition`, v.condition || '', condOpts)}</label><label class="f"><span>${esc(t('Warranty'))}</span>${sel(`v.${i}.warranty`, v.warranty || '', warOpts)}</label><label class="f price"><span>${esc(t('Price (JD)'))}</span><input name="v.${i}.price" type="number" inputmode="decimal" min="0.001" step="0.001" value="${esc(v.price ?? '')}" dir="ltr"${validPrice(v.price) ? '' : ' aria-invalid="true"'}></label>
  <div class="checks small">${Object.keys(noteLabels).map((n) => `<label><input type="checkbox" name="v.${i}.note.${n}"${(v.notes || []).includes(n) ? ' checked' : ''}> ${esc(L(noteLabels[n]))}</label>`).join('')}<label><input type="checkbox" name="v.${i}.soldOut"${v.soldOut ? ' checked' : ''}> ${esc(t('Sold out'))}</label></div><button type="button" class="btn ghost small" data-remove-variant="${i}"${p.variants.length < 2 ? ' disabled' : ''}>${esc(t('Remove'))}</button></div>`).join('')}</div><button type="button" class="btn small" data-add-variant>${esc(t('Add option'))}</button></section></form>`;
}
function slugify(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'device'; }
function uniqueId(base) { const ids = new Set(state.draft.products.map((p) => p.id)); let id = base; let n = 2; while (ids.has(id)) id = `${base}-${n++}`; return id; }
function readDeviceForm(form) {
  const p = state.draft.products[state.editing.index];
  const get = (n) => form.elements[n];
  p.name = { ar: get('name.ar').value.trim(), en: get('name.en').value.trim() };
  p.brand = get('brand').value.trim(); p.category = get('category').value;
  p.tagline = { ar: get('tagline.ar').value.trim(), en: get('tagline.en').value.trim() };
  p.about = { ar: get('about.ar').value.trim(), en: get('about.en').value.trim() };
  p.offer = get('offer').checked; p.featured = get('featured').checked; p.hidden = get('hidden').checked;
  p.source = get('source').value.trim();
  if (p._new && p.name.en) { const others = new Set(state.draft.products.filter((x) => x !== p).map((x) => x.id)); let id = slugify(p.name.en); let n = 2; const base = id; while (others.has(id)) id = `${base}-${n++}`; p.id = id; }
  p.specs = (p.specs || []).map((s, i) => ({ ar: get(`spec.${i}.ar`).value.trim(), en: get(`spec.${i}.en`).value.trim() }));
  p.variants = p.variants.map((v, i) => {
    const price = get(`v.${i}.price`).value.trim();
    return { ...v, storage: get(`v.${i}.storage`).value.trim(), condition: get(`v.${i}.condition`).value, warranty: get(`v.${i}.warranty`).value, price: price === '' ? null : Math.round(Number(price) * 1000) / 1000, soldOut: get(`v.${i}.soldOut`).checked, notes: Object.keys(noteLabels).filter((n) => get(`v.${i}.note.${n}`).checked) };
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

// ---------- settings ----------
function settingsView() {
  const s = state.draft.settings;
  const pair = (label, key, sub) => field(`${label} (Arabic)`, `${key}.ar`, s[key]?.ar || '', { type: sub }) + field(`${label} (English)`, `${key}.en`, s[key]?.en || '', { type: sub, dir: 'ltr' });
  return `<div class="head"><h1>${esc(t('Settings'))}</h1></div><form id="settings-form" class="edit"><div class="grid2"><section class="card"><h2>${esc(t('Contact'))}</h2>${field('Shop phone', 'phone', s.phone, { type: 'tel', dir: 'ltr' })}${field('WhatsApp number (with 962)', 'whatsapp', s.whatsapp, { type: 'tel', dir: 'ltr' })}${field('Instagram link', 'instagram', s.instagram, { type: 'url', dir: 'ltr' })}${field('Facebook link', 'facebook', s.facebook, { type: 'url', dir: 'ltr' })}${field('Map link', 'maps', s.maps, { type: 'url', dir: 'ltr' })}${field('Address (Arabic)', 'address.ar', s.address.ar)}${field('Address (English)', 'address.en', s.address.en, { dir: 'ltr' })}</section>
  <section class="card"><h2>${esc(t('Ordering'))}</h2><div class="checks"><label><input type="checkbox" name="ordersOn"${s.ordersOn !== false ? ' checked' : ''}> ${esc(t('Take orders on the site'))}</label></div>${pair('Delivery note', 'deliveryNote', 'textarea')}<h2>${esc(t('Texts'))}</h2>${pair('Offers title', 'offersTitle')}${pair('Prices note', 'pricesNote', 'textarea')}</section></div></form>
  ${MODE === 'demo' ? '' : `<form id="password-form" class="card narrow"><h2>${esc(t('Change password'))}</h2><label class="f"><span>${esc(t('Current password'))}</span><input name="current" type="password" autocomplete="current-password" required></label><label class="f"><span>${esc(t('New password'))}</span><input name="password" type="password" autocomplete="new-password" minlength="16" required><small>${esc(t('At least 16 characters.'))}</small></label><button class="btn" type="submit">${esc(t('Change password'))}</button></form>`}`;
}
function readSettings(form) {
  const s = state.draft.settings; const g = (n) => form.elements[n];
  for (const k of ['phone', 'whatsapp', 'instagram', 'facebook', 'maps']) s[k] = g(k).value.trim();
  s.whatsapp = s.whatsapp.replace(/\D/g, '');
  for (const k of ['address', 'deliveryNote', 'offersTitle', 'pricesNote']) s[k] = { ar: g(`${k}.ar`).value.trim(), en: g(`${k}.en`).value.trim() };
  s.ordersOn = g('ordersOn').checked;
  saveDraft();
}

// ---------- publish ----------
function validate(c) {
  const problems = []; const cats = new Set(c.categories.map((x) => x.id));
  for (const p of c.products) {
    const name = L(p.name) || p.id;
    if (!p.name.ar || !p.name.en) problems.push(`${name}: ${t('needs an Arabic and English name')}`);
    if (!cats.has(p.category)) problems.push(`${name}: ${t('has an unknown category')}`);
    if (!p.variants.length) problems.push(`${name}: ${t('needs at least one option')}`);
    if (p.variants.some((v) => !validPrice(v.price))) problems.push(`${name}: ${t('has an option without a valid price')}`);
    if (new Set(p.variants.map((v) => v.key)).size !== p.variants.length) problems.push(`${name}: ${t('has two options with the same code')}`);
  }
  return problems;
}
async function publish() {
  const active = document.activeElement; if (active && active.form) active.form.dispatchEvent(new Event('change', { bubbles: true }));
  const problems = validate(state.draft);
  if (problems.length) { flash(`${t('Fix before publishing:')} ${problems.slice(0, 4).join(' · ')}`, 'error'); return; }
  const button = $('#publish'); button.disabled = true; button.textContent = t('Publishing…');
  try {
    for (const p of state.draft.products) delete p._new;
    const res = await api.admin.publish(state.draft, state.version);
    state.version = res.version; state.draft.version = res.version; state.published = clone(state.draft); saveDraft(); flash(t('Published.'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) { flash(t('Someone published a newer version. Load it, then make your change again.'), 'error'); $('#flash').insertAdjacentHTML('beforeend', ` <button type="button" class="btn small" data-reload-published>${esc(t('Load the published version'))}</button>`); }
    else if (error instanceof ApiError && error.status === 401) { state.signedIn = false; render(); flash(t('Session ended. Sign in again; your draft is kept.'), 'warn'); }
    else flash(errorText(error), 'error');
  } finally { if (button.isConnected) { button.textContent = t('Publish'); updateBar(); } }
}
async function loadContent({ keepDraft = true } = {}) {
  const data = await guard(() => api.admin.content());
  if (!data) return false;
  state.published = withDefaults(data.content); state.version = data.version || 0;
  const saved = keepDraft ? local.read('trio-admin-draft') : null;
  state.draft = saved && saved.content && saved.baseVersion === state.version ? withDefaults(saved.content) : clone(state.published);
  if (saved && saved.baseVersion !== state.version) local.remove('trio-admin-draft');
  state.dirty = JSON.stringify(state.draft) !== JSON.stringify(state.published);
  return true;
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const el = e.target instanceof Element ? e.target : null; if (!el) return;
  const hit = (s) => el.closest(s);
  if (hit('#lang')) { lang = lang === 'ar' ? 'en' : 'ar'; local.write('trio-admin-lang', lang); render(); return; }
  if (hit('[data-view]')) { state.view = hit('[data-view]').dataset.view; state.editing = null; state.orderOpen = null; if (state.view === 'orders') await loadOrders(); render(); return; }
  if (hit('#publish')) { publish(); return; }
  if (hit('#discard')) { if (confirmed(t('Discard all unpublished changes?'))) { state.draft = clone(state.published); state.editing = null; saveDraft(); render(); } return; }
  if (hit('[data-reload-published]')) { await loadContent({ keepDraft: false }); state.editing = null; render(); return; }
  if (hit('#logout')) { await guard(() => api.admin.logout()); state.signedIn = false; render(); return; }
  if (hit('[data-order-filter]')) { state.orderFilter = hit('[data-order-filter]').dataset.orderFilter; render(); return; }
  if (hit('[data-open-order]')) { state.orderOpen = hit('[data-open-order]').dataset.openOrder; render(); window.scrollTo(0, 0); return; }
  if (hit('[data-close-order]')) { state.orderOpen = null; render(); return; }
  if (hit('[data-cat]')) { state.category = hit('[data-cat]').dataset.cat; render(); return; }
  if (hit('[data-edit]')) { state.editing = { index: Number(hit('[data-edit]').dataset.edit) }; render(); window.scrollTo(0, 0); return; }
  if (hit('[data-close-edit]')) { state.editing = null; render(); return; }
  if (hit('[data-move]')) { const b = hit('[data-move]'); const i = Number(b.dataset.move); const j = i + Number(b.dataset.dir); const list = state.draft.products; if (j >= 0 && j < list.length) { [list[i], list[j]] = [list[j], list[i]]; saveDraft(); render(); } return; }
  if (hit('[data-add-device]')) {
    const cat = state.category !== 'all' ? state.category : state.draft.categories[0].id;
    const p = { _new: true, id: uniqueId('device'), category: cat, brand: 'Apple', name: { ar: '', en: '' }, image: '', photo: '', hidden: true, offer: false, featured: false, tagline: { ar: '', en: '' }, about: { ar: '', en: '' }, specs: [], source: '', variants: [{ key: 'a', storage: '', condition: 'new-sealed', notes: [], warranty: '', price: null, soldOut: false }] };
    state.draft.products.unshift(p); state.editing = { index: 0 }; saveDraft(); render(); return;
  }
  const form = $('#device-form');
  if (form && state.editing) {
    const p = state.draft.products[state.editing.index];
    if (hit('[data-duplicate]')) { readDeviceForm(form); const copy = clone(p); copy.id = uniqueId(`${p.id}-copy`); copy.hidden = true; state.draft.products.splice(state.editing.index + 1, 0, copy); state.editing = { index: state.editing.index + 1 }; saveDraft(); render(); return; }
    if (hit('[data-delete]')) { if (confirmed(t('Delete this device?'))) { state.draft.products.splice(state.editing.index, 1); state.editing = null; saveDraft(); render(); } return; }
    if (hit('[data-add-variant]')) { readDeviceForm(form); const keys = new Set(p.variants.map((v) => v.key)); let k = 1; while (keys.has(`o${k}`)) k++; p.variants.push({ key: `o${k}`, storage: '', condition: p.variants[0]?.condition || 'new-sealed', notes: [], warranty: '', price: null, soldOut: false }); saveDraft(); render(); return; }
    if (hit('[data-remove-variant]')) { readDeviceForm(form); p.variants.splice(Number(hit('[data-remove-variant]').dataset.removeVariant), 1); saveDraft(); render(); return; }
    if (hit('[data-add-spec]')) { readDeviceForm(form); (p.specs ||= []).push({ ar: '', en: '' }); saveDraft(); render(); return; }
    if (hit('[data-remove-spec]')) { readDeviceForm(form); p.specs.splice(Number(hit('[data-remove-spec]').dataset.removeSpec), 1); saveDraft(); render(); return; }
    if (hit('[data-clear-photo]')) { p.photo = ''; saveDraft(); render(); return; }
  }
});
function confirmed(text) { try { return window.confirm(text); } catch { return true; } }
document.addEventListener('change', async (e) => {
  const form = e.target.closest && e.target.closest('form');
  if (e.target.id === 'photo-input' && e.target.files[0]) {
    const file = e.target.files[0]; const p = state.draft.products[state.editing.index];
    flash(t('Uploading…'), 'warn');
    try { const blob = await resizeImage(file); const res = await api.admin.uploadPhoto(blob); p.photo = res.id; saveDraft(); render(); flash(t('Photo uploaded. Publish to show it.')); }
    catch (error) { if (error instanceof ApiError && error.status === 401) { state.signedIn = false; render(); return; } flash(t('Could not upload the photo.'), 'error'); }
    return;
  }
  if (form && form.id === 'device-form') readDeviceForm(form);
  if (form && form.id === 'settings-form') readSettings(form);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'device-search') { state.query = e.target.value; const pos = e.target.selectionStart; render(); const box = $('#device-search'); box.focus(); box.setSelectionRange(pos, pos); }
  const form = e.target.closest && e.target.closest('form');
  if (form && form.id === 'device-form' && e.target.type !== 'file') readDeviceForm(form);
  if (form && form.id === 'settings-form') readSettings(form);
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'sign-form') {
    const err = $('#sign-error'); err.hidden = true;
    const show = (m) => { err.textContent = m; err.hidden = false; };
    try {
      if (!state.setup) {
        if (f.password.value.length < 16) return show(t('At least 16 characters.'));
        if (f.password.value !== f.repeat.value) return show(t('Passwords do not match.'));
        await api.admin.setup(f.code.value.trim(), f.password.value);
        state.setup = true;
      } else await api.admin.login(f.password.value);
      state.signedIn = true; await loadContent(); await loadOrders(); render();
    } catch (error) { show(errorText(error)); }
    return;
  }
  if (f.id === 'order-form') {
    const number = f.dataset.number;
    const ok = await guard(() => api.admin.updateOrder(number, { status: f.status.value, note: f.note.value }));
    if (ok) { const o = state.orders.find((x) => x.number === number); if (o) { o.status = f.status.value; o.note = f.note.value; } flash(t('Saved.')); render(); }
    return;
  }
  if (f.id === 'password-form') {
    if (f.password.value.length < 16) { flash(t('At least 16 characters.'), 'error'); return; }
    const ok = await guard(() => api.admin.password(f.current.value, f.password.value));
    if (ok) { f.reset(); flash(t('Password changed.')); }
  }
});
setInterval(async () => { if (state.signedIn && document.visibilityState === 'visible') { const before = state.orders.filter((o) => o.status === 'new').length; await loadOrders(); const after = state.orders.filter((o) => o.status === 'new').length; if (after !== before && state.view === 'orders' && !state.orderOpen) render(); else { const b = $('[data-view=orders]'); if (b) b.innerHTML = `${esc(t('Orders'))}${after ? `<span class="badge">${after}</span>` : ''}`; } } }, 60000);

(async function start() {
  try {
    const s = await api.admin.status();
    state.setup = !!s.setup; state.signedIn = !!s.signedIn;
    if (state.signedIn) { await loadContent(); await loadOrders(); }
  } catch (error) { state.signedIn = false; console.warn(error); }
  render();
}());
