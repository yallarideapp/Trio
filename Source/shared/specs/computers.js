// Hardware facts checked against Apple's technical specifications on 2026-10-18.
// Sources support editorial maintenance; they are not storefront links.
// Storage and memory remain properties of the selected catalogue variant.
const text = (ar, en) => ({ ar, en });
const row = (ar, en, valueAr, valueEn = valueAr) => ({ label: text(ar, en), value: text(valueAr, valueEn) });

const proSpecs = (chip, size, resolution) => [
  row('الشاشة', 'Display', `Liquid Retina XDR بقياس ${size} إنش، ${resolution}`, `${size}-inch Liquid Retina XDR, ${resolution}`),
  row('المعالج', 'Chip', chip),
  row('معدل التحديث', 'Refresh rate', 'ProMotion متكيّف حتى 120 هرتز', 'Adaptive ProMotion, up to 120Hz'),
  row('المنافذ', 'Ports', '3 × Thunderbolt 5 عبر USB-C، وHDMI، وقارئ SDXC، ومنفذ سماعات 3.5 مم', '3 × USB-C / Thunderbolt 5, HDMI, SDXC reader, 3.5mm audio'),
  row('الاتصال اللاسلكي', 'Wireless', 'Wi-Fi 7 وBluetooth 6', 'Wi-Fi 7 and Bluetooth 6'),
  row('الكاميرا', 'Camera', 'Center Stage بدقة 12MP، وتصوير فيديو 1080p', '12MP Center Stage; 1080p video'),
  row('البصمة والشحن', 'Security & charging', 'Touch ID وشحن MagSafe 3', 'Touch ID; MagSafe 3 charging'),
];

export default {
  'macbook-pro-16-m5-max': {
    summary: text('شاشة XDR واسعة وشريحة M5 Max لتحرير الفيديو والتصميم والعمل مع المشاريع الكبيرة، مع منافذ متعددة لشاشاتك وملحقاتك.', 'A large XDR display and M5 Max for video editing, design and demanding projects, with versatile connections for displays and accessories.'),
    specs: proSpecs('Apple M5 Max', '16.2', '3456 × 2234'),
    sources: ['https://www.apple.com/macbook-pro/specs/'],
  },
  'macbook-pro-16-m5-pro': {
    summary: text('مساحة شاشة واسعة مع شريحة M5 Pro للعمل على التصميم والبرمجة وتحرير المحتوى. يجمع شاشة XDR مع اتصال Thunderbolt 5 وشحن MagSafe.', 'A spacious XDR screen and M5 Pro for design, coding and content creation, with Thunderbolt 5 connectivity and MagSafe charging.'),
    specs: proSpecs('Apple M5 Pro', '16.2', '3456 × 2234'),
    sources: ['https://www.apple.com/macbook-pro/specs/'],
  },
  'macbook-pro-14-m5-pro': {
    summary: text('قوة M5 Pro في مقاس يسهل حمله، مع شاشة XDR سلسة ومنافذ عملية للبرمجة والتصميم وإنتاج المحتوى أثناء التنقل.', 'M5 Pro in a portable size, with a fluid XDR display and useful connections for coding, design and content creation on the move.'),
    specs: proSpecs('Apple M5 Pro', '14.2', '3024 × 1964'),
    sources: ['https://support.apple.com/en-us/126318'],
  },
  'macbook-air-15-m5': {
    summary: text('شاشة 15.3 إنش للعمل والدراسة مع شريحة M5 وكاميرا Center Stage. صوت من ست سماعات واتصال USB-C لملحقاتك وشاشاتك.', 'A 15.3-inch screen for work and study, powered by M5 with a Center Stage camera, six-speaker sound and USB-C connections for your accessories and displays.'),
    specs: [
      row('الشاشة', 'Display', 'Liquid Retina بقياس 15.3 إنش، 2880 × 1864، وسطوع 500 شمعة', '15.3-inch Liquid Retina, 2880 × 1864, 500 nits'),
      row('المعالج', 'Chip', 'Apple M5'),
      row('المنافذ', 'Ports', 'منفذا Thunderbolt 4 عبر USB-C، وشحن MagSafe 3، ومنفذ سماعات 3.5 مم', '2 × USB-C / Thunderbolt 4, MagSafe 3, 3.5mm audio'),
      row('الاتصال اللاسلكي', 'Wireless', 'Wi-Fi 7 وBluetooth 6', 'Wi-Fi 7 and Bluetooth 6'),
      row('الكاميرا', 'Camera', 'Center Stage بدقة 12MP مع Desk View، وفيديو 1080p', '12MP Center Stage with Desk View; 1080p video'),
      row('الصوت', 'Audio', 'ست سماعات مع دعم الصوت المكاني', 'Six speakers; Spatial Audio support'),
      row('البصمة', 'Security', 'Touch ID'),
    ],
    sources: ['https://www.apple.com/macbook-air/specs/'],
  },
  'ipad-a16': {
    summary: text('iPad بشريحة A16 وشاشة Liquid Retina للقراءة والدراسة والترفيه، مع كاميرا أمامية أفقية تتبع حركتك أثناء مكالمات الفيديو.', 'An A16-powered iPad with a Liquid Retina screen for reading, study and entertainment, plus a landscape camera that keeps you centred during video calls.'),
    specs: [
      row('الشاشة', 'Display', 'Liquid Retina بقياس 10.86 إنش، 2360 × 1640، وسطوع 500 شمعة', '10.86-inch Liquid Retina, 2360 × 1640, 500 nits'),
      row('المعالج', 'Chip', 'Apple A16، معالج مركزي 5 أنوية ورسومات 4 أنوية', 'Apple A16; 5 CPU cores, 4 GPU cores'),
      row('الكاميرات', 'Cameras', 'خلفية واسعة 12MP؛ أمامية أفقية Center Stage بدقة 12MP', '12MP wide rear; landscape 12MP Center Stage front'),
      row('الاتصال اللاسلكي', 'Wireless', 'Wi-Fi 6 وBluetooth 5.3', 'Wi-Fi 6 and Bluetooth 5.3'),
      row('المنفذ', 'Port', 'USB-C للشحن والبيانات، مع خرج DisplayPort', 'USB-C charging and data; DisplayPort video output'),
      row('البصمة', 'Security', 'Touch ID'),
      row('توافق القلم', 'Pencil compatibility', 'Apple Pencil عبر USB-C أو Apple Pencil الجيل الأول مع محوّل USB-C', 'Apple Pencil USB-C; first-generation Pencil with USB-C adapter'),
    ],
    sources: ['https://support.apple.com/en-us/122240'],
  },
  'ipad-pro-m5': {
    summary: text('شريحة M5 وشاشة OLED بتقنية ProMotion للرسم وتحرير المحتوى وتعدد المهام. تصميم بشاشة 11 أو 13 إنش، مع Face ID ودعم Apple Pencil Pro.', 'M5 and an OLED ProMotion screen for drawing, content editing and multitasking. Choose an 11-inch or 13-inch display, with Face ID and Apple Pencil Pro compatibility.'),
    specs: [
      row('الشاشة', 'Display', 'Ultra Retina XDR بتقنية Tandem OLED، مقاس 11 أو 13 إنش، وProMotion من 10 إلى 120 هرتز', '11-inch or 13-inch Ultra Retina XDR, tandem OLED, adaptive 10–120Hz'),
      row('المعالج', 'Chip', 'Apple M5'),
      row('الكاميرات', 'Cameras', 'خلفية واسعة 12MP؛ أمامية TrueDepth أفقية 12MP مع Center Stage', '12MP wide rear; landscape 12MP TrueDepth front with Center Stage'),
      row('الاتصال اللاسلكي', 'Wireless', 'Wi-Fi 7 وBluetooth 6', 'Wi-Fi 7 and Bluetooth 6'),
      row('المنفذ', 'Port', 'USB-C مع Thunderbolt 3 وUSB 4 حتى 40Gb/s', 'USB-C; Thunderbolt 3 / USB 4, up to 40Gb/s'),
      row('الأمان والمستشعرات', 'Security & sensors', 'Face ID وماسح LiDAR', 'Face ID and LiDAR scanner'),
      row('توافق القلم', 'Pencil compatibility', 'Apple Pencil Pro وApple Pencil عبر USB-C، مع دعم التحويم', 'Apple Pencil Pro and USB-C Pencil; Pencil hover support'),
    ],
    sources: ['https://www.apple.com/ipad-pro/specs/'],
  },
};
