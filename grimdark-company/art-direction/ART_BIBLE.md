# GRIM COMPANY — ART BIBLE v1.0
**Step 1 of 8: style lock, asset standards, quality gate.**  
**Status:** art direction and tooling approved for evaluation; production paintings and all game integrations remain pending Steps 2–8. Existing playable release and saves are unchanged.

## 1. Direction
**Dark fantasy / Gothic mercenary chronicle.** The mood is severe, dangerous and human; dark does not mean indiscriminately underexposed. Inspired by the player's references: bold ink-rich figures beside firelight, and monumental black Gothic architecture beneath an ominous red moon. Images must read immediately as one recognizable location or individual at a phone-sized crop.

- **Environment treatment:** painterly monumental architecture, believable materials, huge silhouettes, atmospheric depth, intentional focal lighting, worn civilization, weather and regional differentiation.
- **Character treatment:** hand-illustrated / dark graphic-novel realism, confident outline hierarchy, believable proportions, worn equipment and nuanced expressions. **Not** cartoon flat-fill faces, generic AI glamour portraits or interchangeable helmets.
- **Mood:** dangerous but legible; blue/gray shadow versus warm firelight; occasional saturated blood red as an accent, never uniform red over every frame.
- **Art must contain no lettering, fake UI, meters, numerals, or logos.** All live information, labels and controls remain HTML over clean backgrounds.
- **Visual storytelling:** party wealth/rarity/region should be conveyed through apparel, heraldry and environment, not random glowing particles.
- **Consistency:** one believable world. Variation comes from culture, landscape, season, weather, clothing and perspective—not mismatched painting techniques.

## 2. Fixed palette
| Token | Hex | Intent |
|---|---|---|
| obsidian | `#0B0D0D` | main dark background |
| charcoal | `#1A1A1F` | panels and shadows |
| iron | `#353840` | steel / cool geometry |
| stone | `#66646A` | neutral stone |
| bone | `#D9C9A3` | readable parchment text |
| old gold | `#C89B3C` | rewards and engraved accents |
| blood | `#8B1E24` | stakes / danger |
| ember | `#D64A2B` | firelight and sparse emphasis |
| forest | `#334D3A` | woodland shadow |
| midnight | `#1E2A3C` | blue distance / cool contrast |

Use near-black and bone for most UI text. Gold is uncommon, meaningful emphasis. Avoid text directly on a busy image: dark gradient backing must preserve readability. Keep text and progress indicators as sharp DOM / SVG UI.

## 3. Composition rules
**Hero scenes:** source framing ~3:2 landscape; subject remains identifiable in narrow center crop, with a safe central zone and a quiet bottom strip reserved for an HTML title/controls. The existing top-of-screen scene often occupies 210–430 CSS px tall, so evaluate at 320, 390 and 430 CSS px phone widths as well as desktop.

**Portraits:** shoulder-up, centered recognizable face, distinct eye/helmet/brow silhouette, realistic shoulders/equipment; face occupies roughly 35–55% of frame height. Leave space for square and round crops. Avoid deep-black invisible faces, cropped chins, identical hero lighting or shifting racial traits. Portrait identity is stable: derived from character ID and saved/recoverable.

**Depth:** one foreground, one major focal subject, one background layer; environmental silhouettes remain legible after scale reduction. Tiny filigree is a bonus, not the only visible detail.

**Image handling:** `object-fit:cover` for pre-approved hero framing; `object-fit:contain` for uncut review. Explicit `object-position` for each scene. No global blur, CSS scaling-up beyond available pixels, canvas downsampling, low-quality sprite sheet, CSS `pixelated`, repeated JPEG/WebP transcodes, or embedding raster as base64 SVG.

## 4. Technical image specifications
| Asset | Source *master* minimum | Served export | Target file size |
|---|---|---|---|
| Environment | 3072 × 2048 px, lossless PNG or other genuine original | 2048 × 1365 WebP `q=90`; 1536 × 1024 WebP mobile | <= 1.1 MB desktop, <= 750 KB mobile, unless manually approved |
| Portrait | 1536 × 1536 px, lossless | 1024 × 1024 WebP `q=91`; 512 × 512 WebP cards | <= 350 KB large, <= 140 KB card, unless manually approved |
| Transparent accessory | native high-resolution transparent PNG | lossless WebP/PNG | per asset |
| Icons, borders, meters | SVG vector | SVG | native resolution |

*Do not invent detail by upscaling.* Source images smaller than these minima must be rejected, not quietly stretched. Size budgets are **warnings** pending perceptual review: never crush visible detail merely to meet a byte target. Preserve color profile consistency (sRGB output) and test alpha. Browser sources may choose desktop and mobile exports without changing one saved character's portrait. The exact pixel dimensions of 2048/1365 exports are intentional and documented; a precise 3:2 export may instead be 2046 × 1364 to avoid a tiny aspect-ratio shift.

## 5. Asset catalog
Eight **existing** routed environment scenes must be replaced individually (see `manifest.json`): chapterhouse, market, musterYard, marchWatch, pilgrimHouse, jobsBoard, armory, worldMap. More scenes for travel, dungeon and combat are **additional** future assets; do not pretend the eight current routes cover all environments.

Portrait v1 target: **5 races (Human, Elf, Dwarf, Orc, Celestial) × 2 presentations × 6 curated bases = 60** candidate base faces. Keep the current five cultural identities, class archetypes, gear roles and distinct silhouettes. Phase 1 prioritizes fully curated portraits; any hair/helmet/armor overlay is permitted **only if mobile compositing keeps painted edges, anatomy and lighting coherent**. Otherwise use more quality presets instead of procedural seams. Save/stable IDs must not change.

## 6. Export pipeline
1. Artist creates original master in `art-sources/` or another versioned original storage. **Never** overwrite the master with a compressed export.
2. Register the asset ID, category, dimensions, focal point, license/author and approval in `manifest.json`. Untested assets have `pending` status.
3. Run `python scripts/grim_art_pipeline.py export --manifest grimdark-company/art-direction/manifest.json --id <asset-id> --source <master.png> --dest <exports-directory>`.
4. The exporter validates dimensions, colorspace, focal crop, outputs WebP renditions, runs round-trip dimension checks, and writes a JSON report with file SHA-256, size, source hash, and warnings.
5. Review **actual files** at 1×/2×/3× CSS pixel density and 320/390/430 px viewport widths, with `cover` and `contain` modes. Inspect text overlays and focal cropping.
6. Only after artist approval, commit exports to the asset repository, hook them into `GC381_SCENES` and the portrait resolver in **Step 2**, test full gameplay/saves, then replace legacy SVGs. Do not automatically replace fallbacks.
7. Keep old SVG scenes and portraits until replacement assets are installed, verified on a live iPhone, and individually approved.

## 7. Approval gates
- **Sharpness:** at normal game size, visible brushwork and contours are not smeared or pixellated; source pixels exceed target device requirements. The browser reports intrinsic dimensions matching the actual export.
- **Art:** looks like the user's two dark-fantasy references, with readable forms at ~390 CSS px wide. Not an infographic, not baked-in UI, not merely a large conversion of the old SVG.
- **Character test:** the same face looks consistent in roster card, party panel, character sheet and manager modal; no flicker or identity changes across loads.
- **Performance:** no persistent frame/scroll hitch when switching 8 scenes; transparent fallback while loading, browser caching, no repeated decode each simulation tick.
- **Compatibility:** save keys and gameplay logic unchanged; all 8 art routes still resolve; old SVG fallbacks still work; missing image does not crash UI.
- **Go/no-go:** Step 1 does not ship art into gameplay; Step 2 launches one actual new scene and portrait into a sandbox preview first. Do not commission all 60 portraits until those benchmarks pass human phone review.

## 8. What Step 1 actually delivers
- This fixed reference specification and `manifest.json` covering all 8 currently routed scenes.
- A deterministic local raster export/validation script and synthetic-image CI tests.
- Style board references for compositional review (not production-quality source masters).
- A previously verified original-resolution mobile browser proof: `/grimdark-company/art-quality-proof/`.

**Still pending:** standalone high-resolution *approved* Grim Company master environment and portrait paintings. The concept boards are mood/reference compositions, not production artwork. Do not mislabel small crops of them as sharp native-size assets. Producing and approving those dedicated masters is the final quality gate before Step 2 and before wide asset production.
