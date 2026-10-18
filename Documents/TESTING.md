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
