# Asset provenance

`instagram/` contains thirteen unchanged originals from Trio Mobile's public Instagram profile/posts, collected 17 October 2026: its actual profile logo, product graphics and reel/store imagery. `../sources.json` maps originals to their source URLs and SHA-256 checksums.

`devices/` contains ten transparent PNGs made with the built-in image_gen background-extraction editor from those originals. The prompts request preserving the pictured devices while removing all poster text, pricing, packaging and surroundings. The tool outputs were copied without further pixel editing. Every source relationship, full prompt, method, byte count and checksum is in `../sources.json` under `deviceImages`. These are AI-assisted edits of supplied Trio imagery, not manufacturer-certified product photographs. Original post links remain available for comparison.

The device assets serve hero, category, catalog and detail views with `object-fit: contain`. The storefront does not display full advertising posters as product images. No Flick illustration is used.

The existing IBM Plex Sans Arabic and Lalezar fonts and their licenses remain in `fonts/`.
