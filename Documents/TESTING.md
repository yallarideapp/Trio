# Replacement storefront verification — 18 October 2026

## Quick homepage selections in the device list — 26 October 2026

- Each admin Devices row now has a labeled Show on home page switch, replacing the passive Featured badge. It works without opening the device editor, preserves earlier selections, assigns latest-selection priority through the existing placement helper, and unhides newly selected devices. Changes remain in the draft until Save preview/Publish. Stable product IDs keep filtered/reordered lists accurate; the row does not rerender, preserving search, keyboard focus and scroll position.
- Live/Pages builds and the complete regression suite pass. Added editor integration coverage for translated switches, independent selections, hidden-device promotion, filtered/reordered identity, pending-draft persistence, unchanged saved preview and unchanged prices/options. Chromium on an isolated localhost origin verified direct/keyboard selection, Save preview and reload, the latest selected iPhone in the home preview, and unticking without opening the editor. English 320px, Arabic 390px and English 1280px layouts fit without horizontal overflow; labels have at least 44px touch height. No captured console warnings/errors. Owner public drafts/orders were not modified; physical devices and production Worker publication were not tested.

## Order confirmation layout — 23 October 2026

- Replaced the receipt's reused compact bag grid with full-width receipt rows: device name, storage and quantity share the flexible column, with each saved line total beside it. The order reference and overall total have dedicated styles, Arabic names use bidi isolation with inherited alignment, and action buttons wrap safely. Guest checkout has one Keep shopping action; signed-in Pages customers retain My orders. Receipt identity/channel checks, saved prices and truthful demo messaging are unchanged.
- Live/Pages builds and the complete existing regression suite pass. Chromium QA on a separate localhost origin reproduced the pictured order (3 × JD829 plus JD789 = JD3276), verified reload persistence and the single working shopping link, and checked Arabic/English receipt layouts at 320px, 390px and desktop widths without horizontal document overflow. No captured console warnings/errors. The owner's public browser draft/orders were not modified; physical devices and a production Worker checkout were not tested.

## Home category images and names — 21 October 2026

- Removed device counts and starting prices from the six home category tiles, leaving their images, translated names and category links. Removed unused metadata styles.
- Live/Pages builds and the full existing regression suite pass. Chromium at 390px confirms Arabic/English tiles contain only category names, retain three columns and have no horizontal overflow.

## Optional used-device battery readings — 21 October 2026

- Added per-option Battery health (%) and Battery cycles controls in the device editor. They appear for Used like new (including legacy used aliases), are optional, and hide/disable/clear when the option changes to New. Health accepts whole percentages from 0 to 100; cycles accepts nonnegative safe whole counts. No measurements were added to the shipped catalog.
- The selected used option displays only supplied, valid readings on its device page. Missing values remain absent, explicit 0 remains visible, and New options never display stale battery details. Pages preview, JSON import/export and the future Worker publishing path preserve null/zero/numeric values and reject invalid measurements before writes.
- Regression tests cover validation boundaries, malformed/nonfinite values, unknown legacy fields, save/import/export, backend atomic rejection, bilingual editor controls and selected-option storefront rows. Live/Pages builds and all existing suites pass.
- Chromium QA on a separate localhost origin: entered two independent readings, changed one option New→Used and confirmed its fields cleared while the other retained its values, rejected 101% health, saved valid values and verified them after reload. Switching between 256GB and 512GB used options changed battery readings correctly, including 0 cycles. Arabic/English labels and the 390px editor/device layouts fit without horizontal overflow; no captured storefront console warnings/errors. The public owner draft and seed catalog were not given test measurements. Physical devices and a production Worker deployment were not tested.

## Mobile header search icon — 21 October 2026

- Replaced the persistent phone search field with a labeled 44px search-icon button in the compact top header. Tapping reveals and immediately focuses the existing search input below the header. The button exposes expanded state and translated labels. Submit (including the same query), Escape, navigation, language changes and opening the menu close the field; Escape and repeated submissions restore focus to the toggle. Desktop retains its search input.
- Narrow product headers retain bag and account access: use the Trio logo badge where needed and a named account icon at the smallest widths. The six home categories and three-column layout are unchanged.
- Chromium QA: Arabic 390px home, Arabic 320px/390px product headers and English 320px home/390px product headers fit without horizontal overflow. Icon reveal focuses the input; Arabic Samsung and English Huawei searches return the expected products. Repeating a query closes search and restores focus. Escape and mutually exclusive menu/search states work. Desktop at 1280px retains a visible input and hidden mobile toggle. No captured console warnings/errors.
- Live/Pages builds and all existing regression suites pass. Physical mobile devices were not tested.

## Compact search and all home categories — 21 October 2026

- Mobile header search is now 38px high and at most 220px wide beside Sign in, retaining 16px input text. The What are you looking for? grid shows Phones, Laptops, Tablets, Watches, Audio and Accessories in catalog order, with three tiles per row at every breakpoint. Cards use real category photos and keep counts and starting prices on separate lines. The existing four hero choices and offer selection remain unchanged.
- Bilingual storefront checks cover all six category links, real tablet/accessory photos and the selected tablet image, alongside existing hero, offers, conditions and checkout behavior. Live/Pages builds and the full regression suite pass.
- Chromium QA: English and Arabic labels fit at 320px, with three columns and no horizontal document overflow. Checked 390px phone, 768px tablet and 1280px desktop grids; all six photos load. Tablets opens the two iPads, Accessories opens AirTag, and the smaller header search returns both iPads for iPad. No captured console warnings/errors. Physical iOS/Android devices were not tested.

## Mobile search in the top header — 20 October 2026

- Moved the mobile search field into the sticky header beside Sign in / تسجيل الدخول, with the logo, language switch and menu on the row above. Removed the duplicate home-hero and mobile-menu search forms. Catalog search/filter tools remain available, and desktop keeps its existing header layout. Existing backgrounds and newer hero animations/buttons are preserved.
- Browser QA verified Arabic at 320px and 390px and English at 320px with no horizontal document overflow. Search and Sign in share the same row with 46px-high controls; the search input uses 16px text. Arabic سامسونج returns Galaxy S26+ and Galaxy S25 FE; English Huawei returns Huawei Watch GT6. The mobile menu opens/closes and contains no duplicate search input. Desktop header checked at 1280px. The rebuilt iPhone 17 Pro page at 320px keeps Sign in visible beside search without overflow.
- Live/Pages builds and the complete existing regression suite pass. Browser tests use Chromium; physical iOS/Android devices were not tested.

## Out of stock and optional stock quantity — 20 October 2026

- Added a prominent, bilingual Availability control with Out of stock plus an optional whole-number stock quantity for each option. Blank/null retains the standard order limit; 0 is unavailable, and a manual out-of-stock flag overrides positive quantity. Quantities are manually maintained and cap each order; orders do not decrement inventory. No stock amounts were added to the public seed catalog.
- Shared pricing and quantity helpers govern cards, hero, product options, bag controls and checkout validation. Repeated adds stop at the stock limit, bag increases disable at the limit, and a stock reduction clamps existing quantities or removes unavailable items. Out-of-stock offers remain visible, and condition filters retain unavailable devices. Supplied quantities appear in the device details.
- Pages and Worker preserve null/zero/positive quantities through publish/import/export. Negative, fractional, string, nonfinite and oversized values reject before writes. Integration checks cover exact totals, stock-limit/sold-out errors, unchanged legacy options and independent manual availability flags.
- Browser QA saved quantity2, reloaded and verified persistence, added twice and rejected a third addition, and checked the disabled bag increase. Manual out-of-stock with quantity2 removed purchase actions after the save completed. Quantity0 also disabled purchase; blank quantity with the flag off restored purchasing. A negative quantity was rejected. Arabic/English editor controls were inspected with no browser errors or warnings. Test data used a separate localhost origin and did not alter the owner's public browser draft.
- Live/Pages builds and the full catalog, image, editor, account, order, stock and Worker suites pass. Shared production deployment remains deferred as previously requested.

## Home layout and single-condition devices — 19 October 2026

- Removed Picks from Trio from home. The four category tiles sit under What are you looking for? / شو عم تدوّر عليه؟, immediately followed by Offers / العروض. Removed the obsolete phone layout ordering rules. The admin's home-selection help now describes the category showcase.
- Each card has one condition badge matching its cheapest available option. Its price and Add/Choose action use only that condition's options. New/Used filters scope variants before pricing and sorting; unknown conditions do not count as New. Card, hero and bag links preserve the condition in the device route. Direct device URLs also scope the option picker to one condition, including saved selections. No catalog prices, option keys, product IDs or order records changed.
- Bilingual regression checks cover the home section order, removal of Picks, one badge, stale opposite-condition selections, exact filter prices, matching detail/bag links and unchanged catalog data. The original 24 models still appear once each in the catalog and favorites continue to use their original IDs.
- Browser QA verified English home headings and one badge on every offer. New iPhone 17 displayed JD655 in its card, device view and added bag line. Arabic Used like new displayed JD555. No checked document overflow or browser warnings/errors. Test shopping used a separate localhost origin.
- Live/Pages builds and the full catalog, image, preview, account, checkout, order and Worker regression suites pass. Earlier verification sections below describe historical releases superseded by this layout.

## Visible condition controls and home heading — 19 October 2026

- Moved Options and prices above the device details, photos and specifications. Each option has exactly two visible native radio choices, New and Used like new, with an independent group. Legacy condition keys map to the matching choice; unspecified conditions stay unselected until chosen. New options use canonical condition keys.
- Browser QA changed the first iPhone 17 Pro Max option to New and the second to Used like new, saved the preview, reloaded and reopened the editor. Both selections persisted independently, while other options retained their selections. Arabic and English controls render correctly and the checked desktop page has no document overflow or console warnings/errors. Test edits used a separate localhost origin, preserving the owner's public-site browser drafts.
- The home product heading is What are you looking for? / شو عم تدوّر عليه؟, including previews with an older Offers title setting. The category section is Shop by category / تسوّق حسب القسم. The separate Offers page retains its editable heading. Bilingual automated checks and browser inspection confirm both headings.
- Live and Pages builds, the full existing regression suite, and updated editor/storefront checks pass.

## Home selections, arrows and condition labels — 19 October 2026

- Every visible, selected device in the four supported home categories now appears in Picks, including selected offers. Removed the eight-item cap and offer exclusion. A persisted selection priority makes the latest selection lead its category and initial hero. Selecting a hidden device unhides it without clearing earlier selections; explicitly hiding it later still works.
- Regression checks cover more than eight selected items, earlier selections, hidden devices, category changes, repeated selection, backwards clocks, export/import and backend validation. Duplicated products start hidden and unselected. Shared condition labels collapse legacy keys into New and Used like new without changing catalog prices or variant identities; card chips are deduplicated and the editor offers only those two labels plus an unspecified choice.
- Replaced diagonal navigation glyphs with consistent SVG arrows that follow language direction. Storefront and admin dropdowns use inset chevrons with reserved text space and mirrored RTL positioning. Existing site backgrounds remain unchanged.
- Browser QA selected iPhone 17 Pro while earlier devices remained selected, saved the draft and verified it leads the home hero and Picks alongside all earlier selections. Arabic/English catalog filters and arrows were checked at 1280px and a 424px narrow viewport with no horizontal document overflow. The narrow admin form also fit at 424px. The requested 320/390px override did not apply to the catalog tab in this environment, so those widths were not reverified in this release.
- Live and Pages builds and the complete catalog, image, storefront, preview, account, order and Worker checks pass. Browser testing uses Chromium, not physical iOS or Android devices.

## Adoption review — 19 October 2026

- Shopper passwords now use 20,000 PBKDF2 rounds, the same as the admin. Measured locally: about 3.7ms per hash at 20,000 and 17.6ms at 100,000, so a password change (two hashes) at 100,000 would take about 35ms, over the free plan's 10ms CPU limit. The 16-character minimum stays. Existing rows keep their own round count.
- Arabic device pages at 320px overflowed by 33px: the header bag icon plus the Sign in link did not fit. Below 360px the header Sign in link now hides on device pages only; it stays in the menu.
- The home story text no longer names the area (the owner asked for no location line on the home page). The footer and Visit us keep the address.
- `tests/customer-account-ui.mjs` supplies a lock queue when the runtime has no Web Locks, so `npm test` also passes on Node 22. Node 20 lacks `node:sqlite`; the package script now asks for Node 22 or newer.
- Passed: every suite in `Source/tests` on Node 22 and 24 (live and Pages builds); the live Worker under Wrangler 4.140.0 with both migrations: admin setup, ordering switched on in Settings, price edit, photo upload, publish, shopper sign-up, checkout from a second browser, order in the shopper history and the admin, status change, sign-out; 59 API abuse checks (origin, content type, body size, price tampering, quantities, duplicate tokens, concurrent orders, rate limits, parallel logins, forged cookies, hostile content, photos); 38 shopper-account checks (cookie flags, admin/shopper cookie separation, spoofed owner fields, private history, profile and password changes, session revocation, login and sign-up limits); the portable demo from a folder; 15 routes × 10 widths × 2 languages without document overflow, page errors or broken images.
- Not tested: a real Cloudflare account and its CPU metrics, real email delivery, physical iPhone/Android devices.

## Working owner demonstration — 19 October 2026

- Pages now has functional browser-only registration, sign-in/out, sample-account entry, profile editing, password changes and private order history. Passwords are stored only as salted PBKDF2 hashes. A bilingual banner identifies the owner demonstration and explains that no payments are collected or orders sent to the store.
- Replaced the contact/inquiry bag action with Checkout, a complete contact/delivery/pickup form, exact totals and a saved DEMO-number receipt. Checkout orders automatically appear in the same browser's admin Orders panel, with search, status updates, notes and export. Earlier manually entered records remain a separate archive.
- Automated tests pass using real WebCrypto and local storage: unique accounts, credential validation/rotation, persisted sessions, sample access, account-scoped history, guest orders, catalog-derived prices, snapshots, retry deduplication, pagination and atomic quota failures. Web Locks serialize writes. Queued operations reject an intervening account/session switch, and corrupt data is preserved rather than silently reset. No backend requests occur in Pages.
- Browser testing completed sample sign-in → edit profile → add AirTag → Checkout → DEMO-1001 confirmation → My orders → automatic admin entry. The JD28 total matches the shipped catalog. Changing the admin status to Confirmed reached the account history, and an unfinished checkout kept its unsent notes during the cross-tab update.
- Arabic 320px and English 390px account/checkout layouts fit without horizontal document overflow. Browser tests use Chromium, not physical iOS/Android. Registration, returning password sign-in and password rotation are covered by the actual adapter/UI test harness; browser QA uses the built-in sample button without entering new credentials.
- Live and Pages builds and the complete account/order/catalog/image/preview suites pass. Shared production accounts/orders remain deferred for Trio's future GitHub and Cloudflare accounts. Demonstration data is not migrated into production.

## Future dedicated accounts — current deployment decision

- Owner deferred Cloudflare connection until dedicated Trio GitHub and Cloudflare accounts exist. No current account connection, resource creation or deployment was performed.
- Audited the application for owner-specific URLs and account IDs. APIs use the same origin and device assets/routes are relative. D1/KV remain placeholders. Removed the source's fixed social image URL; optional build variable SITE_URL generates it for the chosen deployment.
- Built with a future HTTPS domain and repository subpath: share metadata uses that domain/subpath. Built without SITE_URL: no old-account share URL is included. Invalid HTTP, credential-bearing, query and fragment URLs fail before replacing build output. Rebuilt the current Pages preview with its existing public URL, preserving its share image.
- Updated the handover guide for a new repository/account, both database migrations, browser draft handling, and enabling ordering through admin Publish after deployment. Full existing account/order/catalog checks pass.

## Customer accounts and automatic orders — current update

- Added visible Arabic/English Sign in and Create account navigation, customer profile/mobile editing, password changes and private order history. Checked account forms in Chromium at 320px and 1024px; no horizontal overflow. Pages explicitly disables account submission while the shared service is disconnected.
- The actual Worker handlers pass against SQLite with every migration: registration, normalized unique email, salted password hashes, sign-in/logout, profile validation, password/session rotation, separate customer/admin access, two shoppers' private histories, and guest orders. Submitted checkout orders appear automatically in the authenticated admin list. Tests cover server totals, spoofed ownership, invalid requests, concurrent retries, unique order numbers, status changes, notes and database reopen durability.
- Wrangler 4.140.0 applied both migrations locally and served the real Worker. HTTP checks passed for registration, Arabic profile/mobile normalization, password change, logout/login and denied customer access to admin. A signed-in checkout saved an order in local D1, appeared in its customer's history with the correct total, and retrying created no duplicate.
- Account interface regression tests cover profile/logout races, account switching during history loads, expired sessions, network retries and pending sign-in guards. Checkout contact drafts and receipts are isolated by customer identity. Independent backend review found an admin pagination snapshot race; order headers and lines now load in one transactional batch.
- Live and Pages builds, the full check suite and whitespace checks pass. Public manual order entry is removed; Pages retains export of older local records only.
- No production Cloudflare account, D1/KV bindings, deployment, real email delivery, production password CPU measurements or physical iPhone/Android tests were performed. The public Pages preview cannot accept shared accounts/orders until the owner completes the Cloudflare connection.

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

## Four home categories and browser editor — 18 October 2026

- Reviewed the public `yallarideapp/onestyle` repository and published reference. Home now limits its category tiles, hero choices, offers and picks to Phones, Laptops, Watches and Audio. All Devices retains all six independent categories. The pale hero caption bar is removed on desktop and phones; existing background colors are retained.
- Restored `/admin/` as the browser-only editor requested by the owner, with a footer link. It opens directly on Devices, offers bilingual specification/option/photo/contact editing, Save preview, View preview, JSON export/import and Reset. It has no simulated login, online-order controls or remote publication claims. Shared Worker hosting remains unconfigured.
- Normal storefront visits ignore local catalog edits. Only `?preview=draft` displays them, with a visible bilingual notice. Preview bags and favorites have separate keys from ordinary browsing. The photo bank stores one copy of each upload, prunes abandoned photos, and remaps conflicting imported IDs before preview save.
- Automated checks pass: four-category home including promoted excluded products, six-category catalog, 48 bilingual product views, every selected configuration, image decoding, 2,000 randomized pricing cases, ordinary/draft isolation, editable descriptions/specifications, version conflicts, export/import with photos, invalid import atomicity, storage errors, cleanup, reset, phone normalization and bilingual editor controls. Pages builds ship the editor and contain no live API endpoints or demo-order adapter.
- Browser checks passed on desktop and 390px English / 320px Arabic home, plus the editor at 320px: four home choices and category tiles, transparent caption background, no horizontal overflow, Arabic/English switching and working audio selection.
- Exercised the editor with a temporary local iPhone description/price change, uploaded a catalog image, saved preview, downloaded its JSON backup, reset and imported it, then saved again. The restored WebP loaded in the explicit preview with its edited price; ordinary browsing retained the original public product and price. Test edits are local browser data and are not part of the committed catalog.
- Testing uses Chromium, not physical iOS/Android devices. No Cloudflare or shared backend deployment was performed.

## Corner admin access and local Orders — 18 October 2026

- Added a bilingual fixed corner shortcut to `admin/index.html` on storefront routes. It clears the mobile bottom navigation/purchase bar; toasts appear above it. Footer access remains available.
- Home watch artwork now uses the existing transparent Huawei Watch GT 6 photograph from Trio's assets. The opaque white-backed Apple Watch illustration is no longer used for the home category or showcase. Catalog device photos are unchanged.
- Added an initially empty browser-local manual order book to the editor: catalog option/quantity selection, exact integer-fils totals, optional mobile number, pickup/delivery record, status/note editing, search, filters, refresh and JSON export. It uses saved preview/seed prices and snapshots each line. `LOCAL-` numbers and notices distinguish local records; the public storefront cannot create or access them.
- Automated checks pass for order validation, quantities, hidden/unknown options, totals, token retries, unique numbers, status filters, snapshots, storage errors, 500-record limit, isolated browser storage, preview reset preserving orders, bilingual forms and disabled public checkout. Catalog/image/pricing/preview regression checks also pass.
- Browser verified the corner shortcut opens admin, the watch has no white rectangle on the green hero, and the shortcut clears navigation at 390px. Created a local test order for two AirTags (JD56), changed its status and note, and confirmed persistence after reload. The Arabic order list fits 320px without horizontal overflow. Browser test records exist only on localhost and are not committed or seeded for visitors.

## Offer prices and hero motion — 20 October 2026

- **Offer price (optional) per option:** blank means no offer; when set it must be below the option's price. Admin, browser editor, Worker and storefront share `shared/pricing.js` (`validOfferPrice`, `variantFils`, `inOffers`). A device with an offer price joins the offers automatically; "Show in offers" still works without one. Cards and options cross out the regular price; the device page also shows the saving. The bag, checkout and the Worker charge the offer price; an offer equal to or above the price is refused when publishing and when ordering.
- **Hero motion:** iPhone screen lights up, MacBook lid opens on its hinge then the screen lights, the watch is raised then wakes, the AirPods rise out of the case. Only for the shipped hero photos; other or uploaded photos keep the plain fade. No motion with "reduce motion"; no layers remain afterwards.
- Automated: all checks pass, including new offer checks (home offers, offers page, card, device page, checkout, priced lines, refused values, Worker publish and order at the offer price) and hero checks (each home category's hero photo has its motion; every layer file exists and is WebP).
- Browser (Chromium, Pages build): frame captures of all four motions at 1280px and 390px; reduced motion leaves the photo still; an offer of JD 50 on iPhone 17 Pro Max shows JD 789 crossed out and JD 739 on home, the card, the option and the device page with "You save JD 50", in Arabic at 1280px and English at 390px, no horizontal overflow; the admin shows the offer field for every option.
- Fixed: the admin status message (`#flash`) showed as an empty pill while hidden.
- Not tested: physical iOS or Android devices, Safari.

## Hero buttons, brand line and AirPods motion — 20 October 2026

- **Hero buttons:** the dark button is now «تسوّق الأجهزة» / "Shop devices" and opens the devices page; the outline button is «عروض تريو» / "Trio offers" and opens the offers. The words used elsewhere ("Browse devices" on the not-found page and the hero picture's label) are unchanged.
- **Brand line under the default hero picture:** the brand of the pictured device instead of "TRIO COLLECTION": Huawei for watches (Huawei Watch GT 6), Apple for audio (AirPods Pro).
- **AirPods motion, rebuilt:** each earbud starts deep in its well, hidden behind the well's front edge, rises out with a small tilt, past where the photo shows it, then settles into place (left first, right 140 ms later; about 1.7 s). New layers: a clean empty case and full cut-outs of both earbuds (`Documents/IMAGE-ASSETS.md`); the front-of-case layer is gone.
- Automated: all checks pass after the change; all three builds (live, Pages, demo) succeed.
- Browser (Chromium, Pages build): exact frames of the AirPods motion (every animation paused and stepped) at 1280px and 390px from start to end; the last frame matches the photo; no layers remain afterwards; the other three motions still run with no errors; reduced motion leaves all four photos still. Buttons and brand line checked in Arabic at 1280px and English at 390px and 1280px, with the outline button opening the offers and no horizontal overflow.
- Not tested: physical iOS or Android devices, Safari.

## Owner demo banner removed — 20 October 2026

- The bar «عرض تجريبي للمالك · الحسابات والطلبات على هذا المتصفح فقط · لا يتم تحصيل دفعات» no longer shows on the GitHub Pages copy (removed from `index.html`, `app.js` and `styles.css`). The demo order's done page still says it was not sent to the store and no payment was collected.
- Automated: all checks pass; all three builds succeed.
- Browser (Chromium, Pages build): home, devices and account at 390px and 1280px show no banner, no errors and no horizontal overflow.

## Repair in the phone bar — 25 October 2026

- Phone bottom bar: Home, Devices, Offers, **Repair** (wrench icon, highlighted on the repair page), Bag. Saved left the bar.
- Saved stays reachable: in the phone menu (with its count), the heart on every device, and the header heart on desktop. Saving a device now shows «انحفظ بالمفضلة.» with a «شوف المفضلة» link.
- Automated: all checks pass; all three builds succeed.
- Browser (Chromium, Pages build): Arabic and English at 320, 390 and 1280px: bar labels, Repair opens the repair page and is highlighted, the menu's Saved shows the count and opens the list, the save message links to Saved; no errors and no horizontal overflow.

## Footer trademark notice — 26 October 2026

- Footer line: «متجر مستقل وغير تابع لـ Apple أو Samsung أو Huawei. الأسماء والعلامات التجارية لأصحابها.» / "Independent store, not affiliated with Apple, Samsung or Huawei. Names and trademarks belong to their owners."
- Automated: all checks pass; all three builds succeed. Browser (Pages build): Arabic and English at 320, 390 and 1280px, no errors, no horizontal overflow.

## Editable home categories and selected-device artwork — 26 October 2026

- Added a bilingual Categories tab with Arabic/English names, independent category photos, add, reorder, reset photo, and deletion of empty categories. IDs stay stable; categories containing devices cannot be deleted. Up to 12 categories are supported. The home tiles and shop routes follow the saved names and order, including empty new categories.
- Category uploads participate in the existing photo bank, export/import, conflict remapping and cleanup. Both the Pages editor and future Worker content validation accept the same category structure. Discarding or resetting a draft clears a category filter if that category no longer exists.
- The selected iPhone 16 Pro Max uses a transparent hero asset against the existing green background. The original catalog/device photo is unchanged. Asset provenance and the image edit's limits are recorded in HERO_IPHONE_16_PRO_MAX_CUTOUT.md. The phone admin shortcut is a compact accessible icon to reduce overlap with the category tiles.
- Automated: live and Pages builds succeed; the complete Pages checks pass, including added category validation, persistence, uploaded-photo portability, empty-category routes, custom artwork, ordering, and hero asset coverage. Existing pricing, checkout, accounts and Worker integration checks pass.
- Browser (isolated localhost Pages build): added a test category, uploaded its photo, renamed Phones in both languages, reordered the new category, saved and reloaded, then confirmed the home tiles and empty-category link. Selected iPhone 16 Pro Max through the Devices list and checked its cutout on the 390px Arabic home. Checked category editing at 320px English, 390px Arabic and 1280px English: no horizontal document overflow, all four admin tabs fit at 320px, no broken images, no captured console warnings/errors.
- Test content remains only on the local test origin. The owner's public-browser draft was not saved, reset or published. No shared backend deployment or physical iOS/Android testing was performed.

## Site text editor, battery shortcuts and default animations — 26 October 2026

- Settings now contains a searchable bilingual public-site text editor with 298 entries, grouped by storefront, account, device labels, navigation/footer and additional page copy. Sparse plain-text overrides preserve the other language and can be reset individually or together. Device names/specifications and category names remain in their existing editors. Text changes use the existing explicit browser preview and portable JSON backup.
- Public rendering applies edits to page headings, buttons, service steps, account forms, error messages, navigation, search placeholders, accessibility labels, footer and document metadata. All inserted copy is escaped or assigned as text/attributes. Metadata edits affect the rendered preview; the browser editor does not rewrite the hosted static HTML or publish content for other visitors.
- Existing used-option battery health (0–100) and cycle count now have direct Battery details shortcuts in the device list and edit heading. Cards show supplied readings for their priced used option; details continue to show the selected used option. Unknown values remain absent. New options clear and hide readings without changing another option.
- Restore default animations and pictures selects the four original compatible hero images/motions. Use selected devices restores the owner's selections, and selecting a home device activates that mode. Both choices preserve device photos, prices, category edits and accumulated home selections. Default category artwork links to its category and does not imply a device price.
- Automated: Pages, live and demo builds succeed. Full checks cover sparse text validation and persistence, import/export and atomic invalid-input rejection, bilingual template and shell rendering, escaped text, account text, per-item/all-text reset, reversible hero modes, default image/animation matching and used-option battery parsing/display, including blank versus zero and invalid boundaries. Existing stock/pricing/accounts/orders checks pass.
- Fresh visual browser verification was blocked before opening the localhost test page: the browser's automatic approval review could not run because the account usage limit was reached. No claim of fresh responsive screenshots or visual animation playback is made for this change. No owner public-browser draft was saved/reset, no shared backend was deployed, and no physical-device testing was performed.

## Stock visibility, simpler text editing and independent category pictures — 26 October 2026

- Device list rows now show In stock, partially unavailable, or Out of stock, with a direct stock shortcut. The option editor explains independent option availability and adds bulk manual disable/clear controls for every option in that device. Clearing manual flags preserves a quantity of zero. Unavailable storefront cards have an explicit badge and disabled purchase action.
- Already-open explicit previews reload saved content on storage/focus/visibility changes; public visits remain isolated. Clean admin tabs adopt the latest saved preview. Dirty or active forms keep their data and show a reload notice; background synchronization never deletes another tab's pending draft. Request sequencing prevents older responses winning races. Unfinished checkout/account forms are preserved with a catalog-update notice.
- Replaced the text editor's full 298-field initial view with a page/area chooser and short lists of common text fields (Arabic and English). Additional copy is available through More texts and messages, and search covers all defaults and edited values. Changing areas or search preserves unmounted translations and resets remain available.
- Category pictures now resolve only from their own category upload/image or six stable shipped defaults. Changing a device photo, home selection, visibility or catalog order cannot change category artwork. A new category without artwork uses an intentional placeholder.
- Searched public source and generated site for AI-builder attribution; no visible website credit to AI, ChatGPT, Codex or OpenAI exists. Maintenance provenance and signed image provenance are not website-design credits and were preserved.
- Automated: complete regression suite and live/demo/Pages builds pass, including new availability, actual admin bulk-stock actions, cross-tab preview/admin synchronization, public isolation, checkout/account form protection, sparse text edits across areas, and independent category image tests. Fresh visual browser QA remains unavailable after the automatic approval review's usage-limit failure; no physical-device checks are claimed.
- The owner explicitly chose to defer the shared backend after confirming that stock should eventually update for every visitor. GitHub Pages still serves committed content; browser-admin saves are local previews, not public publication or cross-device stock updates. No Cloudflare account connection, resources or backend deployment were performed.

## Important text controls and condition-specific stock cards — 26 October 2026

- Read the owner's existing admin form without changing it: iPhone 17's Used option was saved as unavailable (97% health, 333 cycles), while New remained available. The open editor also used an older cached bundle. The previous model card chose the cheapest available condition, which hid the unavailable Used listing by switching to New.
- Storefront discovery now represents each model/condition independently. Sold-out Used and available New remain separate cards with their own labels, prices, purchase actions and condition URLs. Counts, search, filters, sorting, saved items, home offers and related devices use the same condition listings. IDs, option keys, prices, inventory values and photos are unchanged. The shipped 24 models produce 27 listings, including 15 phone listings. Unknown condition stays unclassified. Device edit stock summaries now update immediately when an option changes, without replacing the form.
- Settings starts with seven important text entries before contact/appearance controls: the two home-title lines, categories/offers headings and device/repair/visit-us introductions. Arabic and English remain directly editable. Additional text controls retain the complete page/search editor behind one explicit button, with no duplicate mounted inputs. Changing modes preserves hidden text and language overrides.
- Automated: complete checks and live/demo/Pages builds pass. New coverage reproduces the owner's exact Used-unavailable/New-available case, including battery readings, unrelated-condition prices, stable card identities through restocking, offers/related cards and important/advanced text-mode preservation. No owner stock values or public-browser draft were changed by the investigation. Shared production publication remains deferred as requested.

## Admin overview — 29 October 2026

- New first admin tab «نظرة عامة / Overview», opened by default (like the Flick admin): cards for new orders, devices shown, devices on offer and out-of-stock devices (each opens its tab); the latest 5 orders with All orders (a row opens that order); and a «قبل ما يصير الموقع رسمي» checklist (ordering and hosting tick themselves on the live site).
- Automated: all checks pass; all three builds succeed. Browser (Pages build): a demo order shows in the cards and latest orders and opens from there; 1280px and 390px without horizontal overflow or errors.

## Device list cards — 29 October 2026

- Admin device list now uses Flick-style cards: photo, name, brand and starting price on top with badges (stock, «عليه عرض», «بالرئيسية»); below, a «ظاهر / مخفي» button and icon buttons for edit, duplicate (adds a hidden copy) and delete (asks first), plus move up/down. The «يظهر بالرئيسية» switch left the list; it stays in the device form.
- Automated: all checks pass (the editor test now checks the new list actions). Browser (Pages build): show/hide, duplicate, delete and edit work at 1280px and 390px; the form still has the home-page choice; no errors or horizontal overflow.
