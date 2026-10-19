// Display two condition groups while retaining the keys used by older catalogs.
export const conditionOptions = {
  new: { ar: 'جديد', en: 'New' },
  'like-new': { ar: 'مستعمل بحالة الجديد', en: 'Used like new' },
};

export function conditionGroup(value) {
  if (value === 'new' || value === 'new-sealed') return 'new';
  if (value === 'like-new' || value === 'used-agency' || value === 'used') return 'like-new';
  return '';
}

export const conditions = {
  'new-sealed': conditionOptions.new,
  new: conditionOptions.new,
  'like-new': conditionOptions['like-new'],
  'used-agency': conditionOptions['like-new'],
  used: conditionOptions['like-new'],
  '': { ar: '', en: '' },
};

export const conditionShort = { ...conditions };

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
