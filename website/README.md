# Trio website

This folder contains the static Trio Mobile storefront for [@trio_mobile.jo](https://www.instagram.com/trio_mobile.jo/). Its layout and illustrative device imagery follow the [Flick Mobile reference project](https://github.com/yallarideapp/flickmobile).

## Run locally

From the repository root:

```sh
python3 -m http.server 4173 --bind 0.0.0.0 --directory website
```

Open <http://localhost:4173>. Stop the server with `Ctrl+C`. The site uses plain HTML, CSS, and JavaScript; no dependency install or build step is needed.

## Edit the site

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, navigation, and storefront content. |
| `styles.css` | Responsive styling and Arabic/English layout. |
| `app.js` | Language switching, search, filters, saved products, and product dialogs. |
| `catalog.js` | Product names, categories, images, and other catalog content. |
| `assets/` | Locally served images and other visual assets. |

To update products, edit the existing entries in `catalog.js` or add entries with the same fields. Add new photos to `assets/` and use their relative paths in the catalog. Maintain both Arabic and English product content where provided, and check that every referenced image exists.

The catalog is illustrative. Confirm product names, specifications, prices, availability, and business contact details with Trio before treating this as an operational store. The Instagram profile is the supplied contact destination. There is no backend, payment processing, or checkout; saved products are a browser feature.

## Image provenance

The AI-generated device illustrations were copied from the user-supplied [yallarideapp/flickmobile](https://github.com/yallarideapp/flickmobile) reference repository to match its image style. They were not downloaded from Instagram. See [asset provenance](assets/README.md) for the exact source commit and font licenses. Keep this source information when replacing or redistributing the images, and use photos the business is permitted to publish.

## Check changes

Preview the site at desktop and mobile widths. Check both languages, category filters, search, saved products, product dialogs, image loading, and the Instagram links. Because this is a static site, local preview does not require credentials or external services.

## Publish on GitHub Pages

The repository workflow at `.github/workflows/pages.yml` uploads this directory directly and deploys it to GitHub Pages. It runs on pushes to `main` and supports a manual run from **Actions**.

1. Push the website folder and workflow to the repository.
2. Open **Settings → Pages**, and set **Source** to **GitHub Actions**.
3. Run the Pages workflow or push a new commit to `main`.
4. Open the deployment URL shown in the completed workflow's `github-pages` environment.

No custom domain is configured. A GitHub upload alone does not establish that the site is live; confirm a successful Pages deployment before sharing its address.
