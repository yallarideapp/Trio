// Model hardware specifications checked against manufacturer pages on 2026-10-18.
// Sources are provenance for editors; they are not storefront links.
const text = (ar, en = ar) => ({ ar, en });
const row = (ar, en, valueAr, valueEn = valueAr) => ({ label: text(ar, en), value: text(valueAr, valueEn) });
const display = (ar, en) => row('الشاشة', 'Display', ar, en);
const chip = value => row('المعالج', 'Processor', value);
const rear = (ar, en) => row('الكاميرات الخلفية', 'Rear cameras', ar, en);
const front = (ar, en) => row('الكاميرا الأمامية', 'Front camera', ar, en);
const video = (ar, en) => row('تصوير الفيديو', 'Video', ar, en);
const charging = (ar, en) => row('الشحن والاتصال', 'Charging & connector', ar, en);

export default {
  'iphone-17-pro-max': {
    summary: text('شاشة واسعة مع ProMotion، ومعالج A19 Pro وكاميرات Fusion احترافية للتصوير والألعاب والعمل.', 'An expansive ProMotion screen, A19 Pro performance and a versatile Fusion camera system for photography, gaming and work.'),
    specs: [
      display('OLED ‏6.9 إنش · Super Retina XDR · ProMotion حتى 120Hz', '6.9-inch OLED · Super Retina XDR · ProMotion up to 120Hz'),
      chip('Apple A19 Pro'),
      rear('رئيسية 48MP + واسعة جداً 48MP + تقريب 48MP مع تقريب بصري 4x', '48MP main + 48MP ultrawide + 48MP telephoto with 4x optical zoom'),
      front('18MP مع Center Stage وتركيز تلقائي', '18MP Center Stage with autofocus'),
      video('Dolby Vision بدقة 4K حتى 120 إطار/ثانية بالكاميرا الرئيسية', '4K Dolby Vision at up to 120fps on the main camera'),
      charging('USB-C بسرعة USB 3 حتى 10Gb/s · شحن MagSafe لاسلكي', 'USB-C with USB 3 up to 10Gb/s · MagSafe wireless charging'),
    ],
    sources: ['https://support.apple.com/en-us/125091'],
  },
  'iphone-17-pro': {
    summary: text('أداء A19 Pro وكاميرات احترافية في حجم مريح، مع شاشة ProMotion وتصوير فيديو Dolby Vision.', 'A19 Pro power and pro cameras in a comfortable size, with ProMotion fluidity and Dolby Vision video.'),
    specs: [
      display('OLED ‏6.3 إنش · Super Retina XDR · ProMotion حتى 120Hz', '6.3-inch OLED · Super Retina XDR · ProMotion up to 120Hz'),
      chip('Apple A19 Pro'),
      rear('رئيسية 48MP + واسعة جداً 48MP + تقريب 48MP مع تقريب بصري 4x', '48MP main + 48MP ultrawide + 48MP telephoto with 4x optical zoom'),
      front('18MP مع Center Stage وتركيز تلقائي', '18MP Center Stage with autofocus'),
      video('Dolby Vision بدقة 4K حتى 120 إطار/ثانية بالكاميرا الرئيسية', '4K Dolby Vision at up to 120fps on the main camera'),
      charging('USB-C بسرعة USB 3 حتى 10Gb/s · شحن MagSafe لاسلكي', 'USB-C with USB 3 up to 10Gb/s · MagSafe wireless charging'),
    ],
    sources: ['https://support.apple.com/en-us/125090'],
  },
  'iphone-17': {
    summary: text('شاشة ProMotion سلسة ومعالج A19، مع كاميرتين بدقة 48MP وكاميرا أمامية تتكيف مع صورك ومكالماتك.', 'A smooth ProMotion display and A19 chip, paired with dual 48MP cameras and an adaptable Center Stage front camera.'),
    specs: [
      display('OLED ‏6.3 إنش · Super Retina XDR · ProMotion حتى 120Hz', '6.3-inch OLED · Super Retina XDR · ProMotion up to 120Hz'),
      chip('Apple A19'),
      rear('رئيسية Fusion بدقة 48MP + واسعة جداً 48MP · تصوير ماكرو', '48MP Fusion main + 48MP ultrawide · macro photography'),
      front('18MP مع Center Stage وتركيز تلقائي', '18MP Center Stage with autofocus'),
      video('Dolby Vision بدقة 4K حتى 60 إطار/ثانية', '4K Dolby Vision at up to 60fps'),
      charging('USB-C · شحن MagSafe وQi2 لاسلكي', 'USB-C · MagSafe and Qi2 wireless charging'),
    ],
    sources: ['https://www.apple.com/iphone-17/specs/'],
  },
  'iphone-17e': {
    summary: text('أداء A19 في تصميم مريح بشاشة OLED، مع كاميرا Fusion بدقة 48MP ودعم شحن MagSafe.', 'A19 performance in a comfortable OLED design, with a 48MP Fusion camera and MagSafe charging support.'),
    specs: [
      display('OLED ‏6.1 إنش · Super Retina XDR · دقة 2532 × 1170', '6.1-inch OLED · Super Retina XDR · 2532 × 1170 resolution'),
      chip('Apple A19'),
      rear('كاميرا Fusion بدقة 48MP مع تثبيت بصري', '48MP Fusion camera with optical stabilisation'),
      front('TrueDepth بدقة 12MP مع تركيز تلقائي', '12MP TrueDepth with autofocus'),
      video('Dolby Vision بدقة 4K حتى 60 إطار/ثانية', '4K Dolby Vision at up to 60fps'),
      charging('USB-C · شحن MagSafe وQi2 لاسلكي', 'USB-C · MagSafe and Qi2 wireless charging'),
    ],
    sources: ['https://www.apple.com/iphone-17e/specs/'],
  },
  'iphone-16-pro': {
    summary: text('معالج A18 Pro وشاشة ProMotion، مع كاميرات متعددة وتقريب بصري 5x وتحكم مخصص بالكاميرا.', 'A18 Pro performance and ProMotion fluidity, with versatile cameras, 5x optical zoom and dedicated Camera Control.'),
    specs: [
      display('OLED ‏6.3 إنش · Super Retina XDR · ProMotion حتى 120Hz', '6.3-inch OLED · Super Retina XDR · ProMotion up to 120Hz'),
      chip('Apple A18 Pro'),
      rear('رئيسية Fusion بدقة 48MP + واسعة جداً 48MP + تقريب 12MP بصري 5x', '48MP Fusion main + 48MP ultrawide + 12MP telephoto with 5x optical zoom'),
      front('TrueDepth بدقة 12MP مع تركيز تلقائي', '12MP TrueDepth with autofocus'),
      video('Dolby Vision بدقة 4K حتى 120 إطار/ثانية بالكاميرا الرئيسية', '4K Dolby Vision at up to 120fps on the main camera'),
      charging('USB-C بسرعة USB 3 حتى 10Gb/s · شحن MagSafe لاسلكي', 'USB-C with USB 3 up to 10Gb/s · MagSafe wireless charging'),
    ],
    sources: ['https://support.apple.com/en-au/121031'],
  },
  'iphone-16-pro-max': {
    summary: text('شاشة 6.9 إنش لتجربة مشاهدة واسعة، وأداء A18 Pro مع كاميرات احترافية وتقريب بصري 5x.', 'A spacious 6.9-inch screen, A18 Pro performance and a pro camera system with 5x optical zoom.'),
    specs: [
      display('OLED ‏6.9 إنش · Super Retina XDR · ProMotion حتى 120Hz', '6.9-inch OLED · Super Retina XDR · ProMotion up to 120Hz'),
      chip('Apple A18 Pro'),
      rear('رئيسية Fusion بدقة 48MP + واسعة جداً 48MP + تقريب 12MP بصري 5x', '48MP Fusion main + 48MP ultrawide + 12MP telephoto with 5x optical zoom'),
      front('TrueDepth بدقة 12MP مع تركيز تلقائي', '12MP TrueDepth with autofocus'),
      video('Dolby Vision بدقة 4K حتى 120 إطار/ثانية بالكاميرا الرئيسية', '4K Dolby Vision at up to 120fps on the main camera'),
      charging('USB-C بسرعة USB 3 حتى 10Gb/s · شحن MagSafe لاسلكي', 'USB-C with USB 3 up to 10Gb/s · MagSafe wireless charging'),
    ],
    sources: ['https://support.apple.com/en-us/121032'],
  },
  'iphone-16': {
    summary: text('أداء A18 للاستخدام اليومي والألعاب، مع كاميرا Fusion وتصوير ماكرو وزر تحكم سريع بالكاميرا.', 'A18 power for everyday apps and games, with Fusion photography, macro capture and quick Camera Control access.'),
    specs: [
      display('OLED ‏6.1 إنش · Super Retina XDR · Dynamic Island', '6.1-inch OLED · Super Retina XDR · Dynamic Island'),
      chip('Apple A18'),
      rear('رئيسية Fusion بدقة 48MP + واسعة جداً 12MP · تصوير ماكرو', '48MP Fusion main + 12MP ultrawide · macro photography'),
      front('TrueDepth بدقة 12MP مع تركيز تلقائي', '12MP TrueDepth with autofocus'),
      video('Dolby Vision بدقة 4K حتى 60 إطار/ثانية', '4K Dolby Vision at up to 60fps'),
      charging('USB-C · شحن MagSafe وQi2 لاسلكي', 'USB-C · MagSafe and Qi2 wireless charging'),
    ],
    sources: ['https://www.apple.com/iphone-16/specs/'],
  },
  'iphone-15-pro-max': {
    summary: text('تصميم من التيتانيوم وشاشة ProMotion كبيرة، مع معالج A17 Pro وتقريب بصري 5x للتصوير من بعيد.', 'A titanium design and large ProMotion display, with A17 Pro performance and 5x optical zoom for distant subjects.'),
    specs: [
      display('OLED ‏6.7 إنش · Super Retina XDR · ProMotion حتى 120Hz', '6.7-inch OLED · Super Retina XDR · ProMotion up to 120Hz'),
      chip('Apple A17 Pro'),
      rear('رئيسية 48MP + واسعة جداً 12MP + تقريب 12MP بصري 5x', '48MP main + 12MP ultrawide + 12MP telephoto with 5x optical zoom'),
      front('TrueDepth بدقة 12MP مع تركيز تلقائي', '12MP TrueDepth with autofocus'),
      video('Dolby Vision بدقة 4K حتى 60 إطار/ثانية', '4K Dolby Vision at up to 60fps'),
      charging('USB-C بسرعة USB 3 حتى 10Gb/s · شحن MagSafe لاسلكي', 'USB-C with USB 3 up to 10Gb/s · MagSafe wireless charging'),
    ],
    sources: ['https://support.apple.com/en-us/111828'],
  },
  'iphone-15': {
    summary: text('شاشة OLED مع Dynamic Island وكاميرا رئيسية بدقة 48MP، في تصميم خفيف مع منفذ USB-C.', 'An OLED screen with Dynamic Island and a 48MP main camera, in a lightweight design with USB-C convenience.'),
    specs: [
      display('OLED ‏6.1 إنش · Super Retina XDR · Dynamic Island', '6.1-inch OLED · Super Retina XDR · Dynamic Island'),
      chip('Apple A16 Bionic'),
      rear('رئيسية 48MP + واسعة جداً 12MP مع تثبيت بصري للرئيسية', '48MP main + 12MP ultrawide, with optical stabilisation on the main camera'),
      front('TrueDepth بدقة 12MP مع تركيز تلقائي', '12MP TrueDepth with autofocus'),
      video('Dolby Vision بدقة 4K حتى 60 إطار/ثانية', '4K Dolby Vision at up to 60fps'),
      charging('USB-C · شحن MagSafe وQi2 لاسلكي', 'USB-C · MagSafe and Qi2 wireless charging'),
    ],
    sources: ['https://support.apple.com/en-us/111831'],
  },
  'iphone-13': {
    summary: text('تجربة iPhone بشاشة OLED ومعالج A15 Bionic، مع كاميرتين للتصوير اليومي ودعم MagSafe.', 'An OLED iPhone experience powered by A15 Bionic, with dual cameras for everyday photography and MagSafe support.'),
    specs: [
      display('OLED ‏6.1 إنش · Super Retina XDR · دقة 2532 × 1170', '6.1-inch OLED · Super Retina XDR · 2532 × 1170 resolution'),
      chip('Apple A15 Bionic'),
      rear('رئيسية 12MP + واسعة جداً 12MP مع تثبيت بصري للرئيسية', '12MP main + 12MP ultrawide, with optical stabilisation on the main camera'),
      front('كاميرا TrueDepth بدقة 12MP مع Face ID', '12MP TrueDepth camera with Face ID'),
      video('Dolby Vision بدقة 4K حتى 60 إطار/ثانية', '4K Dolby Vision at up to 60fps'),
      charging('منفذ Lightning · شحن MagSafe لاسلكي', 'Lightning connector · MagSafe wireless charging'),
    ],
    sources: ['https://support.apple.com/en-us/111872'],
  },
  'galaxy-s26-plus': {
    summary: text('شاشة QHD+ واسعة وسلسة مع معالج Exynos 2600، وكاميرات متعددة وبطارية كبيرة لتطبيقاتك ومحتواك.', 'A large, fluid QHD+ screen and Exynos 2600 chip, with versatile cameras and a substantial battery for apps and entertainment.'),
    specs: [
      display('Dynamic AMOLED 2X ‏6.7 إنش · QHD+ · تحديث حتى 120Hz', '6.7-inch Dynamic AMOLED 2X · QHD+ · up to 120Hz'),
      chip('Samsung Exynos 2600'),
      row('الذاكرة', 'Memory', 'RAM ‏12GB', '12GB RAM'),
      rear('رئيسية 50MP + واسعة جداً 12MP + تقريب 10MP بصري 3x', '50MP main + 12MP ultrawide + 10MP telephoto with 3x optical zoom'),
      front('12MP بفتحة عدسة f/2.2', '12MP with f/2.2 aperture'),
      row('البطارية', 'Battery', 'سعة نموذجية 4,900mAh', '4,900mAh typical capacity'),
      charging('USB-C · شحن سلكي حتى 45W', 'USB-C · wired charging up to 45W'),
    ],
    sources: ['https://www.samsung.com/levant/smartphones/galaxy-s26/', 'https://www.samsung.com/ie/support/mobile-devices/what-are-the-differences-between-the-galaxy-s26-ultra-s26-plus-and-s26/', 'https://news.samsung.com/uk/samsung-unveils-galaxy-s26-series-the-most-intuitive-galaxy-ai-phone-yet'],
  },
  'galaxy-s25-fe': {
    summary: text('شاشة AMOLED كبيرة مع تحديث 120Hz، ومعالج Exynos 2400 وكاميرا رئيسية 50MP وشحن سريع.', 'A large 120Hz AMOLED display, Exynos 2400 performance, a 50MP main camera and fast charging.'),
    specs: [
      display('Dynamic AMOLED 2X ‏6.7 إنش · FHD+ · تحديث حتى 120Hz', '6.7-inch Dynamic AMOLED 2X · FHD+ · up to 120Hz'),
      chip('Samsung Exynos 2400'),
      row('الذاكرة', 'Memory', 'RAM ‏8GB', '8GB RAM'),
      rear('رئيسية 50MP + واسعة جداً 12MP + تقريب 8MP بصري 3x', '50MP main + 12MP ultrawide + 8MP telephoto with 3x optical zoom'),
      front('12MP بفتحة عدسة f/2.2', '12MP with f/2.2 aperture'),
      row('البطارية', 'Battery', 'سعة نموذجية 4,900mAh', '4,900mAh typical capacity'),
      charging('USB-C · سلكي حتى 45W · لاسلكي حتى 15W', 'USB-C · wired up to 45W · wireless up to 15W'),
    ],
    sources: ['https://www.samsung.com/levant/smartphones/galaxy-s/galaxy-s25-fe-navy-256gb-sm-s731bdbvmea/'],
  },
};
