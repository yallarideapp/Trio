# Verification — 17 October 2026

Passed on the completed static website in the browser:

- Arabic/RTL and English/LTR at 320, 390, 768 and 1280 CSS pixels. Document scroll width matched viewport width in every case. Two catalog columns on phones, three at 768px and four on desktop.
- All rendered images loaded. No browser console errors or warnings during the final checks.
- Arabic search for سامسونج returned Galaxy S25 FE; English search for macbook returned MacBook Pro and Air. Search combined with category selection; unmatched queries showed the empty state and reset recovered the full catalog.
- Computer category returned MacBook Pro, iPad A16 and MacBook Air. Source links matched each product’s actual post.
- Favorites could be added, filtered, persisted across reload and removed. Removing the last favorite displayed the empty-favorites message.
- Product dialogs displayed the full original image, price/availability context, Instagram inquiry, original-post link and phone link. Escape and close button worked. Mobile dialog had no horizontal overflow.
- Name sorting returned alphabetically ordered product names; restoring Featured returned the editorial order.
- Mobile menu opened and closed after navigation. Language changes persisted across reload. Localized image descriptions and control labels changed with the language.
- Phone, Instagram, Facebook and map destinations matched the public profile/post information. Calls and messages were not placed.

Automated checks:

```sh
node website/tests/check.mjs
node --check website/app.js
node --check website/catalog.js
```

The dependency-free check verifies ten bilingual product records, thirteen original image checksums, image/post mapping, valid contact destinations, local resource existence, unique IDs, internal anchor targets, translations, external-link isolation and removal of sample media references. The website has no build step.

The catalog records public posts, not live stock. Current prices, availability, warranties and transaction terms must be confirmed directly with Trio. Browser checks cover the current Chromium-based environment; physical iOS/Android devices were not used.
