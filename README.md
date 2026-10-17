# Trio Mobile

A responsive, Arabic/English storefront for [@trio_mobile.jo](https://www.instagram.com/trio_mobile.jo/), with a visual direction inspired by the [Flick Mobile project](https://github.com/yallarideapp/flickmobile).

The complete, dependency-free website is in [`website/`](website/). It includes product browsing, search and category filters, a saved-products list, and product details. AI-generated device illustrations come from the Flick reference repository; they were not downloaded from Instagram. The catalog is illustrative: prices, availability, and store contact details have not been verified. The site does not include a backend or checkout.

## Preview locally

From the repository root, run:

```sh
python3 -m http.server 4173 --bind 0.0.0.0 --directory website
```

Open <http://localhost:4173>. No package installation or build step is required.

See [`website/README.md`](website/README.md) for editing, asset attribution, and publishing instructions.

## Publish with GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) publishes the `website/` directory on pushes to `main`, or when run manually. In the repository's **Settings → Pages**, select **GitHub Actions** as the source before deploying. Uploading the code to GitHub and publishing a live website are separate steps; the deployed address appears in the workflow's `github-pages` environment after a successful deployment.
