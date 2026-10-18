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

The supplied Worker source is preserved for a future separately configured backend deployment. Its D1/KV bindings are placeholders; no Cloudflare deployment has been performed. `npm run build` produces the live Worker assets; `npm run demo:build` produces a clearly labeled local-only demo. See `Cloudflare-guide.md` for the supplied setup guide.

Prices, condition and warranty descriptions are attributed to dated public Instagram posts, not a claim of current stock or terms. Confirm current details directly with Trio. Unconfirmed WhatsApp and inferred catalog options are excluded from this release.
