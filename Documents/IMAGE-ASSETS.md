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
