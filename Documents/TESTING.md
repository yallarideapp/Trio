# Replacement storefront verification — 18 October 2026

The editable Source folder from the supplied Trio-complete-with-demo delivery replaces the previous storefront. The generated GitHub Pages folder is website/.

Passed on the final source:

- Source/tests/check.mjs --pages: 24 bilingual products, valid option keys/conditions/warranties/images, 2,000 randomized bag totals in integer fils, quantity limits, phone normalization, legacy language preference migration, and the Pages adapter. The Pages bundle has no /api endpoints or local demo order storage and does not ship the admin application.
- JavaScript syntax and git whitespace checks. esbuild 0.25.10 builds the Pages bundle. Live/demo adapter smoke checks remain functional with mocked network/storage; no backend deployment was performed.
- Home and catalog at 320, 390, 768 and 1280px in Arabic/RTL and English/LTR: document width equals viewport width; 2, 3 and 4 catalog columns as appropriate. No broken loaded images. Mobile controls, menu, bottom navigation and device images remain usable.
- Text contrast checked from computed foreground/background colors on home, catalog, product detail, contact, repair, trade-in, inquiry, and legacy done routes in both languages. No checked text fell below its 4.5:1 normal / 3:1 large-text threshold. Lowest observed normal-text ratio was 7.44:1. Solid fallback backgrounds are supplied for gradient device placeholders.
- Arabic Samsung search returns Galaxy S26+ and S25 FE. English MacBook search returns four MacBooks. Huawei filter returns Watch GT 6; ascending price sort starts with AirTag.
- Favorites persist after reload, show only saved devices and can be removed. Old product IDs and raw language preferences are mapped to the replacement catalog where applicable.
- Option selection updates price, date and original post link: iPhone 17 Pro Max 1TB displays JD969 / 2026-10-08 / October 8 post; 256GB new displays JD839 / October 14 part-two post. Ambiguous options from the supplied source notes are excluded.
- All four home hero categories switch to the appropriate standalone image.
- Bag add/remove and quantity controls work; two AirTags total JD56. Confirmation opens direct Instagram/phone contact, with no personal-data form or false received-order screen. Old done URLs show contact information.
- Menu opens, navigates and closes. Phone links match tel:+962796999292. Instagram, Facebook and map retain the verified public URLs; unconfirmed WhatsApp is omitted.
- Admin URL shows a bilingual availability explanation and a working repository-relative return link. No passwordless demo admin is published.

Tests use the available Chromium browser, not physical iOS/Android devices. Historical post prices do not confirm current availability or terms; those remain subject to direct confirmation with Trio.

## Device specifications and contact cleanup — 18 October 2026

This release replaces the source/date/disclaimer sections described above with retail descriptions and technical specification tables.

- All 24 devices have Arabic/English manufacturer-backed hardware profiles with at least six specification rows. Official source URLs are recorded in Source/shared/specs; they are not product-page links.
- Automated rendering checks cover 48 bilingual product views, every catalog variant’s selected price/configuration, absence of device inquiry/source/disclaimer sections, and route-specific Instagram rules. Existing pricing, data, Pages adapter and preference tests still pass.
- Browser checks confirm no Instagram URLs or visible text on Home, Devices, Offers, Saved, Trade in, checkout inquiry and old done routes. Repair and Visit us retain their Instagram links.
- Device pages have no visible phone/ask links, source links, old disclaimer paragraphs or posted-price dates. They retain price, condition/warranty where supplied, favorites, option selection and Add to bag.
- iPhone 17 Pro tested at 320, 390, 768 and 1280px in Arabic, without horizontal overflow. English 320px views checked for iPhone, Samsung, MacBook, iPad, Apple Watch, AirPods Max and AirTag. All specification tables fit.
- Choosing iPhone 17 Pro Max 512GB new updates both price to JD939 and the specification configuration row to 512GB. Favorites and Samsung search still work. No browser console warnings/errors. The revised English product page also passes the computed-color contrast checks.
- Responsive testing uses Chromium; no physical-device testing was performed.

## Device image repairs — 18 October 2026

- All 24 catalog entries now have a device photo, including the previously empty iPhone 17e. Thirteen missing, damaged or mismatched images were replaced with unmodified official manufacturer photos. Nine obsolete damaged assets were removed.
- All 23 unique shipped images fully decode with Pillow and match byte-for-byte between Source/site and website. Replacement source URLs and SHA-256 hashes are recorded in IMAGE-REPAIRS.json.
- The Pages checks now reject empty paths, missing files, truncated PNG/JPEG/WebP containers, and images outside the expected dimensions. All 48 bilingual product renders are checked for the absence of name-only image placeholders.
- Browser catalog inspection loaded all 24 device images successfully, with nonzero natural dimensions and no placeholders. Phones, watches, laptops and tablets were visually checked for complete edges and clean backgrounds.
- Mobile checks covered the iPhone 17e product page and Arabic home at 390px, the Arabic catalog at 320px, and the English desktop catalog at 1280px. Checked pages have no horizontal document overflow.

## Mobile storefront refresh — 18 October 2026

- Mobile home now puts search and device categories first, uses a clean white photo stage, and shows offers earlier. Laptop/tablet and watch/AirPods compositions appear in both the home showcase and category cards; they link to their categories. The AirPods illustration does not add a product, price or availability claim.
- Catalog filters collapse into a labeled native disclosure on phones and stay visible on tablets/desktops. Active filter counts remain visible when collapsed. On the 320px Arabic catalog, the first device photo starts around 301px from the top, with no horizontal document overflow.
- English home search for Samsung returns both Samsung phones. Ascending price sorting puts S25 FE first. Arabic Huawei filtering returns one watch; the filter indicator updates. Favorites persist through page navigation and reload.
- Mobile device pages show a fixed selected-price/Add-to-bag bar. Selecting the retained MacBook 48GB/1TB option updates the bar to JD2549 and adds that exact option to the bag. Removal works. The bar replaces the bottom navigation on device pages; the bag remains accessible in the header.
- Checked Arabic/English phone layouts at 320px and 390px, the tablet catalog at 768px, and desktop catalog/home at 1280px. Catalog columns remain 2/3/4, all 24 catalog images load, and checked pages have no horizontal overflow. Samsung's photo fits the shorter mobile detail stage without clipping. Both new home photo combinations were visually checked.
- Safe-area padding is included in the fixed bar and toast offset. Browser testing uses Chromium; physical iPhone/Android and iPhone safe-area rendering were not available.

## Separate categories and product tiles — 18 October 2026

- Six independent bilingual categories: Phones (12), Laptops (4), Tablets (2), Watches (4), Audio (1), and Accessories (1). Home links, hero choices, category filters, breadcrumbs and related products use the new category assignments.
- Default All Devices displays six labeled sections, with all 24 products appearing exactly once. Search, brand/condition filters and explicit sorting retain a flat result list so global price ordering remains correct. Previous computers/wearables category URLs resolve to laptops/watches.
- Home and catalog products now have a complete bordered tile containing the image, description, price and action. Pale sage image stages blend with the brand palette; the site's dark background and desktop green hero are retained. Phones now use the same green hero styling and content order as desktop, adapted to a stacked layout.
- Regression checks cover bilingual section headings, exact category membership, no duplicate devices, iPad search, global ascending price order and legacy URLs. Existing pricing, image, Pages-adapter and 48 bilingual product checks pass.
- Browser checks at 320px and 390px confirm separate tablet results and usable tiles without horizontal overflow. Tablet 768px keeps three product columns; iPad search returns two tablets and global ascending price sorting starts with AirTag. Desktop 1280px home has six individual category tiles and the same background colors. All Devices contains the expected 12/4/2/4/1/1 grouped products.
