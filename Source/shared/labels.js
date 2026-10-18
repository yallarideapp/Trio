// Fixed wording for device condition, notes and warranty, in the shop's own words
// from its posts. The admin chooses from these lists.

export const conditions = {
  'new-sealed': { ar: 'جديد مسكّر بالكرتونة', en: 'New, sealed in box' },
  new: { ar: 'جديد', en: 'New' },
  'like-new': { ar: 'مستعمل بس مش مستخدم', en: 'Used but unused' },
  'used-agency': { ar: 'مستخدم بحالة الوكالة', en: 'Used, agency condition' },
  used: { ar: 'مستعمل', en: 'Used' },
  '': { ar: '', en: '' },
};

export const conditionShort = {
  'new-sealed': { ar: 'جديد مسكّر', en: 'Sealed' },
  new: { ar: 'جديد', en: 'New' },
  'like-new': { ar: 'بحالة الجديد', en: 'Like new' },
  'used-agency': { ar: 'بحالة الوكالة', en: 'Agency cond.' },
  used: { ar: 'مستعمل', en: 'Used' },
  '': { ar: '', en: '' },
};

export const notes = {
  noActive: { ar: 'No Active (ما تفعّل)', en: 'Never activated (No Active)' },
  active: { ar: 'Active (مفعّل)', en: 'Activated' },
  mdm: { ar: 'MDM — جهاز مُدار (مسجّل بإدارة أجهزة)', en: 'MDM — managed device (enrolled in device management)' },
};

export const warranties = {
  '': { ar: '', en: '' },
  trio3: { ar: 'كفالة Trio Mobile لمدة 3 سنوات', en: 'Trio Mobile warranty, 3 years' },
  agent1: { ar: 'كفالة الوكيل لمدة سنة', en: 'Local agent warranty, 1 year' },
  apple1: { ar: 'كفالة Apple لمدة سنة', en: 'Apple warranty, 1 year' },
};

export const orderStatuses = ['new', 'confirmed', 'out', 'delivered', 'cancelled'];

export const governorates = [
  ['amman', 'عمّان', 'Amman'], ['zarqa', 'الزرقاء', 'Zarqa'], ['irbid', 'إربد', 'Irbid'], ['balqa', 'البلقاء', 'Balqa'],
  ['madaba', 'مادبا', 'Madaba'], ['mafraq', 'المفرق', 'Mafraq'], ['jerash', 'جرش', 'Jerash'], ['ajloun', 'عجلون', 'Ajloun'],
  ['karak', 'الكرك', 'Karak'], ['tafilah', 'الطفيلة', 'Tafilah'], ['maan', 'معان', 'Ma’an'], ['aqaba', 'العقبة', 'Aqaba'],
];
