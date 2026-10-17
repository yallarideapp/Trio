/**
 * Editorial product families, not a live inventory or price list.
 * Confirm the exact model, specifications and availability with Trio Mobile.
 * The product photography is illustrative artwork from the Flick reference.
 */
export const instagramUrl = 'https://www.instagram.com/trio_mobile.jo/';

export const categories = {
  all: { ar: 'الكل', en: 'All' },
  phones: { ar: 'هواتف', en: 'Phones' },
  tablets: { ar: 'أجهزة لوحية', en: 'Tablets' },
  wearables: { ar: 'ساعات وسماعات', en: 'Watches & audio' },
  accessories: { ar: 'إكسسوارات', en: 'Accessories' },
};

export const products = [
  {
    id: 'iphone-pro', category: 'phones', brand: 'Apple',
    name: { ar: 'iPhone Pro', en: 'iPhone Pro' },
    caption: { ar: 'تفاصيل أكثر. إمكانيات أوسع.', en: 'More detail. More possibility.' },
    description: { ar: 'استكشف عائلة iPhone Pro وتواصل معنا لاختيار الموديل واللون والسعة المناسبة لك.', en: 'Explore the iPhone Pro family. Talk to us about the model, color and storage that suit you.' },
    image: 'assets/products/phones-apple.png', x: '0%', y: '0%',
    keywords: 'ايفون آيفون برو apple iphone pro هاتف موبايل',
  },
  {
    id: 'galaxy-ultra', category: 'phones', brand: 'Samsung',
    name: { ar: 'Galaxy Ultra', en: 'Galaxy Ultra' },
    caption: { ar: 'مساحة أكبر لأفكارك.', en: 'More room for your ideas.' },
    description: { ar: 'تعرّف على عائلة Galaxy Ultra واسأل فريق تريو عن الموديلات والمواصفات والخيارات الحالية.', en: 'Discover the Galaxy Ultra family. Ask the Trio team about current models, specifications and options.' },
    image: 'assets/products/phones-samsung.png', x: '100%', y: '0%',
    keywords: 'سامسونج جالكسي جالاكسي الترا galaxy ultra samsung هاتف موبايل',
  },
  {
    id: 'iphone', category: 'phones', brand: 'Apple',
    name: { ar: 'iPhone', en: 'iPhone' },
    caption: { ar: 'رفيقك في كل يوم.', en: 'Your everyday companion.' },
    description: { ar: 'اعثر على iPhone الذي يناسب يومك. راسلنا لمعرفة الموديلات والألوان والسعات والأسعار الحالية.', en: 'Find the iPhone that fits your day. Message us for current models, colors, storage options and prices.' },
    image: 'assets/products/phones-apple.png', x: '100%', y: '100%',
    keywords: 'ايفون آيفون apple iphone هاتف موبايل',
  },
  {
    id: 'galaxy', category: 'phones', brand: 'Samsung',
    name: { ar: 'Galaxy', en: 'Galaxy' },
    caption: { ar: 'عالمك، على طريقتك.', en: 'Your world. Your way.' },
    description: { ar: 'استكشف خيارات Samsung Galaxy وتحدّث معنا عن احتياجاتك لنساعدك في مقارنة الموديلات.', en: 'Explore Samsung Galaxy options. Tell us what you need so we can help you compare models.' },
    image: 'assets/products/phones-samsung.png', x: '100%', y: '100%',
    keywords: 'سامسونج جالكسي جالاكسي samsung galaxy هاتف موبايل',
  },
  {
    id: 'ipad', category: 'tablets', brand: 'Apple',
    name: { ar: 'iPad', en: 'iPad' },
    caption: { ar: 'للشغل، للدراسة، ولأفكارك.', en: 'For work, study and your next idea.' },
    description: { ar: 'تصفّح عائلة iPad واسألنا عن الموديلات والسعات والملحقات المتوافقة مع اختيارك.', en: 'Explore the iPad family and ask about models, storage and accessories compatible with your choice.' },
    image: 'assets/products/tablets-watch.png', x: '0%', y: '0%',
    keywords: 'ايباد آيباد تابلت جهاز لوحي apple ipad tablet',
  },
  {
    id: 'watch', category: 'wearables', brand: 'Apple',
    name: { ar: 'Apple Watch', en: 'Apple Watch' },
    caption: { ar: 'تفصيلة تكمل يومك.', en: 'A little detail for your day.' },
    description: { ar: 'تعرّف على خيارات Apple Watch وتواصل معنا لتأكيد الموديل والمقاس والتوافق مع هاتفك.', en: 'Discover Apple Watch options. Contact us to confirm the model, size and compatibility with your phone.' },
    image: 'assets/products/watches-earbuds.png', x: '0%', y: '0%',
    keywords: 'ساعة ساعات ابل آبل ساعة ذكية apple watch wearable',
  },
  {
    id: 'airpods', category: 'wearables', brand: 'Apple',
    name: { ar: 'AirPods', en: 'AirPods' },
    caption: { ar: 'لحظاتك، بصوتك المفضّل.', en: 'Your moments. Your soundtrack.' },
    description: { ar: 'استكشف عائلة AirPods واسأل فريق تريو عن الاختلافات بين الموديلات والتوافق والأسعار الحالية.', en: 'Explore the AirPods family. Ask the Trio team about model differences, compatibility and current prices.' },
    image: 'assets/products/watches-earbuds.png', x: '0%', y: '100%',
    keywords: 'ايربودز ايربود سماعات آبل ابل apple airpods earbuds audio',
  },
  {
    id: 'accessories', category: 'accessories', brand: 'Everyday essentials',
    brandAr: 'أساسيات يومك',
    name: { ar: 'إكسسوارات', en: 'Accessories' },
    caption: { ar: 'كل ما يكمل جهازك.', en: 'The finishing touch for your device.' },
    description: { ar: 'اسألنا عن الشواحن والكابلات والحماية المناسبة لجهازك. نؤكد معك نوع المنفذ والتوافق قبل الاختيار.', en: 'Ask about chargers, cables and protection for your device. We will help confirm the connector and compatibility before you choose.' },
    image: 'assets/products/accessories.png', x: '0%', y: '0%',
    keywords: 'اكسسوارات إكسسوارات شاحن كابل حماية charger cable case accessories',
  },
];
