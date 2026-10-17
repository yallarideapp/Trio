# Trio Mobile website

This rebuild continues the existing static HTML/CSS/JavaScript website. Layout inspiration comes from [Flickmobile](https://github.com/yallarideapp/flickmobile): a dark header, bright brand hero, large device image, category cards and responsive catalog. Trio’s real green-and-black identity replaces the sample yellow branding.

## Content

Instagram access was verified in the browser on 17 October 2026. The actual profile logo, bio, public phone, location, Facebook and map links were read from [@trio_mobile.jo](https://www.instagram.com/trio_mobile.jo/). Thirteen original JPEGs are stored locally, including product posts and store/reel photos. See [sources.json](sources.json) for each source, description and checksum. No Instagram credentials or temporary CDN links are included.

Ten product entries are based on named or pictured devices in those posts. Search, category filters, sort, saved favorites and product dialogs work in Arabic (RTL) and English (LTR). Language and favorites persist in localStorage, with graceful storage-error handling. Calls, Instagram, Facebook and directions use the verified public destinations.

This is a browse-and-contact website. Current prices, stock levels, store hours, delivery, payment terms and warranties are not invented. Original graphics can contain historical offers; the catalog and dialogs explain that customers must confirm current price, condition and availability with Trio. CSS crops emphasize devices; opening a product shows its full, unaltered source image and post link.

## Run

Serve this directory with any static HTTP server, for example:

```sh
python3 -m http.server 4173 --directory website
```

Open http://localhost:4173. There is no build step or package installation. All images, scripts, CSS and fonts are local and relative, so the same folder works under a GitHub Pages project path. The existing repository workflow deploys the complete website folder.

## Checks

```sh
node website/tests/check.mjs
node --check website/app.js
node --check website/catalog.js
```

See [TESTING.md](TESTING.md) for browser coverage and verification limits. Fonts and their existing licenses remain in assets/fonts/.
