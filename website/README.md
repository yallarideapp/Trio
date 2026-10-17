# Trio Mobile storefront

This continues the existing static website with a storefront modeled on [Flickmobile](https://github.com/yallarideapp/flickmobile): home, category browsing, a focused catalog, native product detail pages, and fixed mobile navigation. Trio keeps its verified green-and-black branding, actual logo, products and public contact details.

## Device images

The hero, category cards, product cards and product detail pages show standalone devices on transparent backgrounds. Ten PNG assets in `assets/devices/` were made with the built-in image_gen background-extraction editor from Trio's own Instagram artwork and reel covers. Poster text, prices, boxes and backgrounds were removed. These are edited source-based product depictions, not untouched photographs. The original thirteen JPEGs remain in `assets/instagram/` for provenance; the store photo is used in the home story section. No promotional poster is used as catalog or detail imagery.

[sources.json](sources.json) records each original source URL/checksum and each device edit's source file, exact prompt, checksum and method. No Flick product illustration was copied. Fonts remain self-hosted with their existing licenses.

## Browsing

- Home `#/` with device-type hero switches and category links.
- Catalog `#/shop` and categories `#/shop/phones`, `#/shop/computers`, `#/shop/wearables`, `#/shop/accessories`.
- Product pages `#/p/<product-id>` with device-only images, verified descriptions/specs, Call/Instagram inquiry and original-post link.
- Favorites `#/saved`, repair `#/maintenance`, trade-in `#/trade-in` and contact `#/contact`.
- Arabic/RTL and English/LTR; search, brand/category filters, name sort and persistent favorites.
- Back/forward support and shareable filter URLs. Old `#catalog` and `#contact` links still work.

Trio's public Instagram profile was checked on 17 October 2026. Public phone: 0796999292; location: Khalda, Umm Al Summaq, near Al Sukkar Circle. Map and Facebook links are the ones listed by the profile. No current prices, stock, opening hours, delivery terms or warranties are inferred. The site directs purchases and service questions to the actual store.

## Run and validate

No build step or package installation:

```sh
python3 -m http.server 4173 --directory website
node website/tests/check.mjs
node --check website/app.js
node --check website/catalog.js
```

All references are relative to this folder, including when hosted under `/Trio/` on GitHub Pages. The existing Pages workflow deploys the complete `website/` folder. See [TESTING.md](TESTING.md) for browser verification.
