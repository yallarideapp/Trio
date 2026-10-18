# TRIO Mobile

The current Arabic/English storefront is published at [yallarideapp.github.io/Trio](https://yallarideapp.github.io/Trio/). It replaces the previous website with the editable project from the supplied `Trio-complete-with-demo` delivery.

- `Source/` — editable storefront, shared catalog, build tools, tests, and the optional Cloudflare Worker/admin source.
- `website/` — complete generated GitHub Pages website. Existing Pages automation publishes this folder on a push to `main`.
- `Documents/` — supplied source notes and original media. See `Documents/SOURCES.md` for excluded ambiguous options and historical price details.

## Edit and publish

```sh
cd Source
npm ci
npm run build:pages
npm test -- --pages
```

Commit the editable source and generated `website/` together. The build replaces the previous generated folder, so obsolete scripts and images are removed. Do not edit `website/app.js` directly. For a local preview, serve `website/` with any static HTTP server.

GitHub Pages supports the catalog, offers, options, search, filters, favorites, bag, and direct phone/Instagram/map links. It does not accept online orders or run an admin API. Bag confirmation opens verified contact links; it never creates a local demo order or claims the store received one.

The [browser-only admin editor](https://yallarideapp.github.io/Trio/admin/) is also linked in the footer. It edits devices, options, technical specifications, photos and contact settings. **Save preview** stores changes in this browser; **View preview** opens `?preview=draft`. Normal storefront visits continue to load the committed catalog. Export/import JSON transfers a draft together with its uploaded photos. Reset removes only the editor's local draft and preview, leaving favorites and the bag intact. No password or remote publication is implied. To publish an exported draft for everyone, its content must be integrated into the source and the generated website rebuilt and pushed.

Home features Phones, Laptops, Watches and Audio. All Devices retains the six independent categories, including Tablets and Accessories.

The fixed corner **Admin panel** shortcut opens the editor from any storefront page, above the phone navigation. The editor now includes an **Orders** tab (`admin/#orders`) for manually recording local orders, with catalog-priced line items, status filters, customer/device search, notes and JSON export. Records start empty, use `LOCAL-` numbers, and stay in this browser. Ordinary checkout remains contact-only. Catalog preview resets preserve these order records; they are stored separately from the catalog, bag and favorites.

The supplied Worker source is preserved for a future separately configured backend deployment. Its D1/KV bindings are placeholders; no Cloudflare deployment has been performed. `npm run build` produces the live Worker assets; `npm run demo:build` produces a clearly labeled local-only demo. See `Cloudflare-guide.md` for the supplied setup guide.

Prices, condition and warranty descriptions are attributed to dated public Instagram posts, not a claim of current stock or terms. Confirm current details directly with Trio. Unconfirmed WhatsApp and inferred catalog options are excluded from this release.

## Device specifications and contact links

Bilingual hardware descriptions and specification tables live in `Source/shared/specs/`, combined by `Source/shared/device-specs.js`. Each profile records official manufacturer URLs for maintenance; these are not rendered as product-page source links. Selected configuration, condition, warranty and price remain catalog variant fields.

Public product pages contain specifications and bag actions. Instagram links are limited to Repair and Visit us. Source/post commentary, dated price notices and product inquiry buttons are omitted from the storefront. `Source/tests/storefront.mjs` verifies this for all 24 devices in both languages and checks every selected configuration.
