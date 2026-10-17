# Storefront correction verification — 17 October 2026

The corrected site follows the Flick browsing pattern: routed home/catalog/category/product pages and separate device images. Browser checks below ran on the completed source, including the final cache-busted script/CSS references.

Passed:

- All ten devices render from `assets/devices/*.png`; product pages and category cards show clean device images with `object-fit: contain`, without Instagram poster text or boxes. Full promotional posters are secondary source links only.
- Arabic/RTL and English/LTR catalog layouts at 320, 390, 768 and 1280px. Document scroll width equals viewport width. Two catalog columns on phones, three at 768px, four on desktop.
- Home page checked at all four widths, including switching the hero from iPhone to Apple Watch/MacBook. No horizontal overflow.
- Arabic search for سامسونج returned Galaxy S25 FE. English search for macbook returned the two MacBooks. Brand filter Huawei returned Huawei Watch GT 6. Computer category returned MacBook Pro, iPad A16 and MacBook Air.
- Product images and titles open native `#/p/<id>` pages; breadcrumb links and browser Back return to category/catalog. Product pages show standalone images and original-post source links. Mobile detail has no horizontal overflow and keeps bottom navigation visible.
- Favorites can be added, survive reload, appear on the separate favorites page, and be removed. Removing the final favorite shows a recovery link and an empty state.
- Mobile menu opens with the translated Close label, closes after navigation, and reaches repair/contact pages. Contact phone links match `tel:+962796999292`.
- No broken images, image fallbacks, console errors or warnings in the browser checks. All image paths are local and work relative to a project directory.
- Read-only image inspection verified that all ten device PNGs have genuine RGBA alpha, with alpha min=0 and max=254 or 255. Original JPEGs remain unchanged.

Automated validation:

```sh
node website/tests/check.mjs
node --check website/app.js
node --check website/catalog.js
```

The dependency-free check covers 24 route cases, bilingual data and rendered links, actual search/filter/favorite functions, corrupt saved data, local resource references, source mapping, thirteen original JPEG checksums and ten RGBA device PNG headers/checksums. See the script for exact assertions.

Device files are AI-assisted background-extraction edits, with exact prompts and checksums in `sources.json`. They are not a new inventory or a guarantee of product condition/color. Prices, stock, warranties, store hours and service terms must still be confirmed directly with Trio. Physical iOS/Android devices were not used; responsive checks ran in the available Chromium browser.
