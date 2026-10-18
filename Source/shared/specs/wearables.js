// Hardware descriptions checked against manufacturer specifications, 2026-10-18.
// Sources are retained for editorial verification; they are not storefront links.
const text = (ar, en) => ({ ar, en });
const spec = (arLabel, enLabel, arValue, enValue) => ({
  label: text(arLabel, enLabel), value: text(arValue, enValue),
});

export default {
  'apple-watch-s11': {
    summary: text(
      'ساعة بشاشة Retina دائمة التشغيل وشريحة S10، تجمع تتبّع النشاط والنوم مع شحن سريع وتصميم نحيف.',
      'A slim everyday watch pairing an always-on Retina screen and S10 processor with activity tracking, sleep tracking and fast charging.',
    ),
    specs: [
      spec('مقاس الهيكل', 'Case sizes', '42 أو 46 مم، بسماكة 9.7 مم', '42 or 46 mm; 9.7 mm thick'),
      spec('الشاشة', 'Screen', 'OLED بتقنية LTPO3 ودعم التشغيل الدائم؛ سطوع أقصى 2000 شمعة', 'LTPO3 OLED, always on; brightness peaks at 2,000 nits'),
      spec('المعالج', 'Processor', 'شريحة S10 بمعالج ثنائي النواة 64 بت', 'S10 with a dual-core, 64-bit CPU'),
      spec('التخزين', 'Storage', '64GB', '64GB'),
      spec('عمر البطارية', 'Battery rating', 'حتى 24 ساعة للاستخدام العادي أو 38 ساعة في نمط الطاقة المنخفضة', 'Rated for up to 24 hours normally, or 38 hours with low power enabled'),
      spec('الشحن السريع', 'Fast charging', 'من 0 إلى 80% خلال نحو 30 دقيقة', 'Approximately 30 minutes from empty to 80%'),
      spec('مقاومة الماء والغبار', 'Water and dust rating', 'مقاومة ماء بتصنيف 50 متراً، وغبار IP6X', '50 m water-resistance rating; IP6X dust protection'),
    ],
    sources: ['https://support.apple.com/en-us/125093'],
  },
  'apple-watch-ultra-3': {
    summary: text(
      'هيكل تيتانيوم بقياس 49 مم، وشاشة ساطعة مع زجاج ياقوتي وGPS ثنائي التردد لتتبّع التمارين والرحلات.',
      'A 49 mm titanium watch built around a bright sapphire-covered screen and dual-frequency GPS for workouts and outdoor routes.',
    ),
    specs: [
      spec('الهيكل', 'Case', 'تيتانيوم من الدرجة 5 بقياس 49 مم', '49 mm, made from grade-5 titanium'),
      spec('الشاشة', 'Screen', 'OLED بتقنية LTPO3 دائمة التشغيل، 422 × 514 بكسل، حتى 3000 شمعة', 'Always-on LTPO3 OLED; 422 × 514 pixels; peak brightness of 3,000 nits'),
      spec('المعالج', 'Processor', 'شريحة S10 بمعالج ثنائي النواة 64 بت', 'S10 with a dual-core, 64-bit CPU'),
      spec('تحديد الموقع', 'Navigation', 'GPS ثنائي التردد L1 وL5', 'GPS using both L1 and L5 frequencies'),
      spec('عمر البطارية', 'Battery rating', 'حتى 42 ساعة للاستخدام العادي أو 72 ساعة في نمط الطاقة المنخفضة', 'Rated for up to 42 hours normally, or 72 hours with low power enabled'),
      spec('الشحن السريع', 'Fast charging', 'من 0 إلى 80% خلال نحو 45 دقيقة', 'Approximately 45 minutes from empty to 80%'),
      spec('مقاومة الماء والغبار', 'Water and dust rating', 'مقاومة ماء بتصنيف 100 متر، وغبار IP6X', '100 m water-resistance rating; IP6X dust protection'),
    ],
    sources: ['https://support.apple.com/en-us/125095'],
  },
  'apple-watch-se-3': {
    summary: text(
      'ساعة بهيكل ألومنيوم وشاشة Retina دائمة التشغيل، مع شريحة S10 ومستشعر حرارة وتتبّع للنشاط والنوم.',
      'An aluminium watch with an always-on Retina screen, S10 processing and temperature sensing alongside activity and sleep tracking.',
    ),
    specs: [
      spec('مقاس الهيكل', 'Case sizes', 'ألومنيوم بقياس 40 أو 44 مم', 'Aluminium in 40 or 44 mm sizes'),
      spec('الشاشة', 'Screen', 'OLED بتقنية LTPO ودعم التشغيل الدائم؛ سطوع أقصى 1000 شمعة', 'LTPO OLED, always on; brightness peaks at 1,000 nits'),
      spec('المعالج', 'Processor', 'شريحة S10 بمعالج ثنائي النواة 64 بت', 'S10 with a dual-core, 64-bit CPU'),
      spec('التخزين', 'Storage', '64GB', '64GB'),
      spec('عمر البطارية', 'Battery rating', 'حتى 18 ساعة للاستخدام العادي أو 32 ساعة في نمط الطاقة المنخفضة', 'Rated for up to 18 hours normally, or 32 hours with low power enabled'),
      spec('الشحن السريع', 'Fast charging', 'من 0 إلى 80% خلال نحو 45 دقيقة', 'Approximately 45 minutes from empty to 80%'),
      spec('مقاومة الماء', 'Water rating', 'مقاومة ماء بتصنيف 50 متراً', '50 m water-resistance rating'),
    ],
    sources: ['https://support.apple.com/en-us/125094'],
  },
  'huawei-watch-gt6': {
    summary: text(
      'ساعة بشاشة AMOLED وهيكل فولاذي، مع GPS ثنائي التردد ومستشعرات للنبض والحرارة، وتوافق مع هواتف Android وiPhone.',
      'An AMOLED watch with a steel case, dual-band GPS, pulse and temperature sensors, and support for Android phones and iPhone.',
    ),
    specs: [
      spec('الشاشة', 'Screen', 'AMOLED ملونة بدقة 466 × 466 بكسل', 'Colour AMOLED at 466 × 466 pixels'),
      spec('مادة الهيكل', 'Case material', 'فولاذ مقاوم للصدأ', 'Stainless steel construction'),
      spec('تحديد الموقع', 'Navigation', 'GPS ثنائي التردد L1 وL5 مع أنظمة ملاحة متعددة', 'L1/L5 dual-band GPS with multiple satellite systems'),
      spec('الاتصال', 'Wireless links', 'Bluetooth 6.0 وNFC', 'Bluetooth version 6.0 plus NFC'),
      spec('المستشعرات', 'Sensors', 'مستشعر بصري للنبض، ومستشعر حرارة، ومقياس ضغط جوي', 'Optical pulse sensing, temperature sensing and a barometer'),
      spec('تصنيف الحماية', 'Protection ratings', 'مقاومة ماء 5 ATM وتصنيف IP69', '5 ATM water resistance and an IP69 rating'),
      spec('توافق الهواتف', 'Phone compatibility', 'Android 9.0 أو أحدث، وiOS 13.0 أو أحدث', 'Requires Android 9.0+ or iOS 13.0+'),
    ],
    sources: ['https://consumer.huawei.com/uk/wearables/watch-gt6/specs/'],
  },
  'airpods-max-2': {
    summary: text(
      'سماعات محيطية للأذن بشريحة H2 في كل جهة، مع إلغاء ضجيج نشط وصوت متكيّف ومنفذ USB-C للشحن والصوت السلكي.',
      'Over-ear headphones powered by an H2 chip on each side, combining adaptive listening and noise cancellation with USB-C charging and wired audio.',
    ),
    specs: [
      spec('معالجة الصوت', 'Audio processors', 'شريحة Apple H2 في كل سماعة', 'One Apple H2 processor per ear cup'),
      spec('أنماط الاستماع', 'Listening modes', 'إلغاء ضجيج نشط، ونمط شفافية، وصوت متكيّف', 'Noise cancellation, transparency and adaptive listening'),
      spec('الاتصال اللاسلكي', 'Wireless connection', 'Bluetooth 5.3', 'Bluetooth version 5.3'),
      spec('المنفذ والصوت السلكي', 'Port and wired audio', 'USB-C للشحن وصوت Lossless بزمن استجابة منخفض جداً', 'USB-C charging and lossless playback with very low latency'),
      spec('عمر البطارية', 'Battery rating', 'حتى 20 ساعة استماع مع تشغيل إلغاء الضجيج', 'Rated for up to 20 hours of playback with noise cancellation on'),
      spec('الميكروفونات', 'Microphone array', '9 ميكروفونات إجمالاً', 'Nine microphones in total'),
      spec('التحكم', 'Physical controls', 'Digital Crown وزر لتبديل نمط الاستماع', 'Digital Crown plus a listening-mode button'),
    ],
    sources: ['https://www.apple.com/airpods-max/specs/'],
  },
  airtag: {
    // The catalogue does not identify a generation. These specifications apply
    // to both generations; chip, weight and OS-version claims are omitted.
    summary: text(
      'قطعة صغيرة لتتبّع المفاتيح والحقائب عبر تطبيق تحديد الموقع، مع تنبيه صوتي وبطارية قابلة للاستبدال.',
      'A compact tracker for keys and bags, with location through Find My, an audible locator and a replaceable battery.',
    ),
    specs: [
      spec('العثور على الأغراض', 'Locating items', 'اتصال Bluetooth وشبكة Apple لتحديد الموقع', 'Bluetooth discovery and the Apple Find My network'),
      spec('نمط الفقدان', 'Lost-item mode', 'NFC لعرض معلومات الاتصال التي يحددها المالك', 'NFC access to contact details chosen by the owner'),
      spec('البطارية', 'Battery', 'بطارية CR2032 يمكن للمستخدم استبدالها', 'CR2032 cell, replaceable by the user'),
      spec('التنبيه الصوتي', 'Audible locator', 'مكبر صوت مدمج للمساعدة في العثور عليه', 'An integrated speaker helps locate nearby items'),
      spec('مقاومة الماء والغبار', 'Water and dust rating', 'IP67: عمق متر واحد لمدة تصل إلى 30 دقيقة في الاختبارات', 'IP67, laboratory tested at 1 m for up to 30 minutes'),
      spec('الأبعاد', 'Dimensions', 'قطر 31.9 مم، وسماكة 8 مم', '31.9 mm across and 8 mm thick'),
    ],
    sources: ['https://support.apple.com/en-us/111847', 'https://www.apple.com/airtag/'],
  },
};
