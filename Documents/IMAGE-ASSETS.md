# Device image sources

The current catalog contains a complete photo for every device. Clean original Trio cutouts are retained. Thirteen missing, damaged or mismatched product photos were replaced with unmodified official Apple or Samsung product images on 18 October 2026. No device bodies were generated or reconstructed.

See [IMAGE-REPAIRS.json](IMAGE-REPAIRS.json) for each replacement’s original page URL, direct image URL, dimensions and SHA-256 checksum. These are maintenance records; source links are not rendered on product pages.

## Replaced photos

- iPhone 13, 15, 15 Pro Max, 16, 16 Pro, 16 Pro Max and 17 Pro: exact-model Apple comparison photographs, complete front/back views on white.
- iPhone 17e: complete Apple Store product photograph, replacing the empty image entry.
- Galaxy S26+: complete Samsung product photograph with transparent background.
- Apple Watch Ultra 3 and SE 3: complete official photographs replacing coarse cutouts.
- iPad Pro M5: correct single-camera M5 model, replacing the older, faded/cropped artwork.
- MacBook Pro 14-inch M5 Pro: proper 14-inch device photograph, replacing the shared 16-inch image. The two 16-inch configurations continue to share a photo of the same physical model.

The nine obsolete damaged WebP files were removed from the editable and generated site folders. New filenames also prevent stale copies from browser caches.

## Retained original Trio images

The clean iPhone 17 Pro Max, iPhone 17, Galaxy S25 FE, Apple Watch Series 11, Huawei Watch GT 6, AirPods Max, MacBook Pro 16-inch, MacBook Air, iPad A16 and AirTag cutouts remain. Their originals and publication provenance are retained under `Media-originals/` and `SOURCES.md`.

All device stages use contain sizing and white backgrounds; transparent images retain their original alpha. Product photography is model imagery rather than a claim about a particular unit or color being in stock.

## Verification

`Source/tests/images.mjs` rejects missing catalog paths, non-image downloads, incomplete PNG/JPEG/WebP containers and invalid dimensions. The storefront rendering check rejects name-only device cards. Visual inspection remains necessary for artwork damage such as cut-off edges or background remnants.

## Hero motion layers — 20 October 2026

Short home hero animations (`Source/site/src/hero-motion.js`) use layers cut from the shipped hero photos below. They show only during the 1–2 second animation; the original photo is shown again when it ends. The empty AirPods case is the one reconstructed area: it is visible only while the earbuds rise out of their wells, and shows no device that is not in the original photo. The earlier `airpods-pro-case-front.webp` layer was removed; the wells' front edges are now a clip outline in the code.

| File (`assets/hero/`) | From | What was done | Size | SHA-256 |
|---|---|---|---|---|
| `iphone-17-pro-max-screen-off.webp` | `assets/devices/iphone-17-pro-max.webp` | The front phone’s screen replaced with black glass. | 911×1041 | `0f282f217fc32ae3a5fd314da3f55ce7dbd9b0d45502baac189de88589295d4f` |
| `macbook-pro-base.webp` | `assets/devices/macbook-pro.webp` | The base below the hinge line; the lid made transparent. | 1200×822 | `bfa2d3ec0b1d007a2e9ba27df49be3ab64bb81bb72dfa7de9273dc800e14e95e` |
| `macbook-pro-lid.webp` | `assets/devices/macbook-pro.webp` | The lid above the hinge line, cropped. | 856×601 | `8f0114b5ee7dbb297603b443a8237b337a089756cf53741ade1f03e81939588b` |
| `macbook-pro-lid-off.webp` | `assets/devices/macbook-pro.webp` | The lid with the screen replaced by black glass. | 856×601 | `03e11613bae6cb7bee8c5152126dbf6da5a88318d357cc1371caa746d456157c` |
| `huawei-watch-gt6-screen-off.webp` | `assets/devices/huawei-watch-gt6.webp` | The round display replaced with black glass. | 964×1200 | `97e46778de0372c1f6dbe63f2c486a0641099160a0cc2f906a834ff3762b2613` |
| `airpods-pro-case-empty.webp` | `assets/categories/airpods-pro.png` | Both earbuds removed. The right well behind the right earbud was filled in by image inpainting; the left well is the mirror image of the right one (the case is symmetric); the back rim and the case outline above both earbuds were redrawn from the clear rim between them. Replaced the first version on 20 October 2026 (`20831eb6…`), which showed smudges. | 1000×1000 | `f0d7c35f58bbd96a07da5b3b2f8b26b1d8609fd60bd12390b662f32aaf31e4f9` |
| `airpods-pro-bud-left.webp` | `assets/categories/airpods-pro.png` | The left earbud, cut out with its whole stem; edge pixels over the case take the earbud's own colour. | 285×384 | `d4b467f30fea518fa7eea3117f83862b6e72685f312fbbefae11fac43425c658` |
| `airpods-pro-bud-right.webp` | `assets/categories/airpods-pro.png` | The right earbud, cut out with its whole stem and tip; edge pixels over the case take the earbud's own colour. | 286×438 | `cd630f66f3f1ef6e44ed9fab4ff9bd933e74b0563904ece472f8f7158fa4c6a2` |
