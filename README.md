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

The current GitHub Pages website is an owner demonstration. It supports catalog browsing, search, filters, favorites, bag, normal checkout, and browser-only shopper accounts. Checkout generates a DEMO order confirmation and automatically adds the order to this browser’s Orders panel. It does not send orders to the store, synchronize across devices, collect payments or run an admin API. The storefront and receipt label that limitation in Arabic and English.

The [browser-only admin editor](https://yallarideapp.github.io/Trio/admin/) is also linked in the footer. It edits devices, options, technical specifications, photos and contact settings. **Save preview** stores changes in this browser; **View preview** opens `?preview=draft`. Normal storefront visits continue to load the committed catalog. Export/import JSON transfers a draft together with its uploaded photos. Reset removes only the editor's local draft and preview, leaving favorites and the bag intact. No password or remote publication is implied. To publish an exported draft for everyone, its content must be integrated into the source and the generated website rebuilt and pushed.

Home features Phones, Laptops, Watches and Audio. All Devices retains the six independent categories, including Tablets and Accessories.

The fixed corner **Admin panel** shortcut opens the editor from any storefront page. Its **Orders** tab automatically shows checkout orders from the same browser, with status updates, notes, search and export. Manual order creation is removed; any older manual records remain a separate archive.

**Sign in** is visible in the desktop and mobile headers. The customer page includes Create account, profile/mobile editing, password changes and private order history. These work now for the owner demo, including registration, sign-in/out and the one-click **Try a sample account** option. Demo accounts use salted password hashes and persist only in this browser. Use sample credentials and contact details; this is not shared production authentication. Clearing browser storage removes the demo data.

The live Worker automatically records submitted checkout orders in D1, links signed-in customers to their own orders, and shows new orders in the protected admin with status updates and notes. Guest checkout also works. Customer sessions and admin sessions are separate. This shared production mode becomes functional when the Worker and database are connected. The current owner demonstration uses a separate browser adapter; no production activation is claimed.

The supplied Worker source is preserved for a future separately configured backend deployment. Its D1/KV bindings are placeholders; no Cloudflare deployment has been performed. `npm run build` produces the live Worker assets; `npm run demo:build` produces a clearly labeled local-only demo. See `Cloudflare-guide.md` for the supplied setup guide.

## Future Trio accounts

Deployment is deferred until the owner creates dedicated GitHub and Cloudflare accounts for Trio. The current accounts are not connected. Transfer or copy this complete project into the future Trio repository, then connect only that repository to Trio’s Cloudflare account. The application uses relative asset links and same-origin `/api` routes; no current Cloudflare account ID or API host is embedded in the source.

Set the optional build variable `SITE_URL` to the future public website URL (including a repository subpath for GitHub Pages). This generates the social share image URL for that deployment; leaving it unset omits that optional metadata. For the current preview: `SITE_URL=https://yallarideapp.github.io/Trio/ npm run build:pages`.

The [Cloudflare guide](Cloudflare-guide.md) covers the future repository, new D1/KV bindings, both migrations, runtime secrets, first admin setup, and enabling ordering with Publish. Shared customer accounts and real store orders stay inactive until that deployment; browser-only demo accounts/orders already work on the Pages preview. Export any browser editor draft before changing domains; a draft is not automatically migrated into the shared live admin.

Prices, condition and warranty descriptions are attributed to dated public Instagram posts, not a claim of current stock or terms. Confirm current details directly with Trio. Unconfirmed WhatsApp and inferred catalog options are excluded from this release.

## Device specifications and contact links

Bilingual hardware descriptions and specification tables live in `Source/shared/specs/`, combined by `Source/shared/device-specs.js`. Each profile records official manufacturer URLs for maintenance; these are not rendered as product-page source links. Selected configuration, condition, warranty and price remain catalog variant fields.

Public product pages contain specifications and bag actions. Instagram links are limited to Repair and Visit us. Source/post commentary, dated price notices and product inquiry buttons are omitted from the storefront. `Source/tests/storefront.mjs` verifies this for all 24 devices in both languages and checks every selected configuration.
