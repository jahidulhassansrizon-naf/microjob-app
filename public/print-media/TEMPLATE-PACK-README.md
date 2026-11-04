# SebaLagbe.com - Premium Print Media Templates V1

Ten original, flat, front-facing 2D print templates for everyday Bangladeshi businesses and institutions. Every template is a genuine vector SVG with real `<text>`/`<tspan>` text, grouped layers, unique IDs and editor metadata. No raster images, no text-as-paths, no embedded fonts, no SebaLagbe branding inside the artwork (all logo/identity areas are replaceable placeholders).

## Contents

```
sebalagbe-print-media-v1/
  templates/   10 SVG files
  manifests/   10 JSON manifests (one per SVG, same base name)
  previews/    10 PNG previews + contact-sheet.png
  template-catalog.json
  README.md
```

| File | Title | Print size | Category | Editable objects |
|---|---|---|---|---|
| 01-shop-signboard.svg | Premium Shop Signboard | 10 ft x 3 ft (3048 x 914.4 mm) | Shop & Business | 53 |
| 02-cash-memo.svg | Professional Cash Memo | A5 portrait (148 x 210 mm) | Shop & Business | 68 |
| 03-money-receipt.svg | Premium Money Receipt | A5 portrait (148 x 210 mm) | Business Forms | 52 |
| 04-professional-invoice.svg | Professional Invoice / Bill | A4 portrait (210 x 297 mm) | Business Forms | 92 |
| 05-delivery-challan.svg | Delivery Challan | A4 portrait (210 x 297 mm) | Business Forms | 89 |
| 06-mobile-repair-job-card.svg | Mobile Servicing Job Card | A5 portrait (148 x 210 mm) | Mobile Servicing & Electronics | 87 |
| 07-mobile-payment-stand.svg | Mobile Banking & Bangla QR Payment Stand | A5 portrait (148 x 210 mm) | Mobile Banking | 29 |
| 08-tolet-banner.svg | House Rent / TO-LET Banner | 3 ft x 2 ft (914.4 x 609.6 mm) | Banner & Signboard | 39 |
| 09-restaurant-menu.svg | Premium Restaurant Menu | A4 portrait (210 x 297 mm) | Restaurant & Food | 79 |
| 10-school-admission-form.svg | School Admission Form | A4 portrait (210 x 297 mm) | Education & Institution | 72 |

## Units and dimensions

* 1 SVG user unit = 1 mm. `width`/`height` are in `mm` and `viewBox="0 0 W H"` equals the **trim size**, so nothing is stretched. Aspect ratios: signboard 10:3, A5 148:210, A4 210:297, TO-LET banner 3:2.
* Signboard viewBox is 3048 x 914.4 (10 ft x 3 ft). TO-LET banner is 914.4 x 609.6 (3 ft x 2 ft).

## SVG structure

* Top-level `<g>` elements are layers with meaningful IDs and `data-layer-name`: `background_layer`, `border_layer`, `header_layer`, `logo_placeholder`, `title_text`, `subtitle_text`, `contact_information`, `decorative_shapes`, `footer_layer`, plus design-specific ones (e.g. `billing_table`, `qr_area`, `official_approval`).
* Every user-editable object carries: `id` (unique), `data-editable="true"`, `data-object-type` (`text` | `shape` | `image`) and `data-layer-name`.
* Text: `<text>` with `<tspan>`; change size with `font-size`, colour with `fill`, family with `font-family`. Font stack: `'Noto Sans Bengali','Hind Siliguri','Noto Sans',sans-serif`.
* Shapes: `<rect>`, `<circle>`, `<line>`, `<path>`, `<polygon>`; fill, stroke, stroke-width and position are independent per object. Table rules, column dividers, zebra rows and field lines are each their own object.
* Icons are editable groups (`data-object-type="shape"`, `shapeKind` = `icon` in the manifest); colour is set by `stroke` on the inner group.
* Non-editable decorations (placeholder hint icon/text) have `data-editable="false"`.

## Replaceable images (logos, photos)

Each placeholder is a `<rect>`/`<circle>` with `data-object-type="image"` and `data-placeholder="true"`. To replace: place the user's image at the placeholder's `x/y/width/height` (clipped to its shape if desired) and remove the sibling `*_hint` group (`class="placeholder-hint"`, `data-placeholder-hint="true"`). The manifest lists every placeholder with `type: "image"` and `replaceable: true`. Photo/logo areas: shop/organisation/institution logo, house photo (08), food photos (09), student photo (10), seal (03), payment-service logos and QR (07).

## Payment stand (07) - important

* No bKash/Nagad/Rocket/Upay logos or names, no QR code, no account numbers are drawn.
* `qr_image_placeholder` is a completely empty white square. The merchant uploads their own valid QR there. `qr_hint_text` (outside the square) can be deleted afterwards.
* The four `service_logo_placeholder_*` boxes are neutral; merchants supply their own logos only if they are entitled to use them.

## Manifests

Each manifest has: `id, title, platform ("SebaLagbe.com"), category, description, file, preview, physicalWidth, physicalHeight, unit, aspectRatio, viewBox, layers, editableObjects, fonts, colorPalette, printSettings`. Each editable object has `id, type, name, layer, x, y, width, height, editable, visible, locked` (text objects also `fontSize`, `defaultText`). IDs match the SVG exactly. Coordinates are in viewBox units (mm) and were **measured from a rendered copy of the SVG** (`getBBox`), not guessed. Background rectangles intentionally extend beyond 0..W / 0..H into the bleed (negative x/y).

## Print production

1. **Bleed.** Backgrounds already extend past the trim by the amount in `printSettings.bleedMm` (3 mm for A4/A5; 10 mm for the TO-LET banner; 15 mm for the signboard) and the root has `overflow="visible"`. Confirm your printer's bleed requirement; if it is larger, extend the background/band rectangles further outward.
2. **Guides.** Layer `print_guides` (trim = magenta, safe = cyan dashed, bleed = orange dashed) is hidden with `display="none"`. Show it while editing; it is marked `data-print="false"` and must stay hidden for output.
3. **Safe area.** All text stays inside `printSettings.safeMarginMm` (8 mm A4/A5, 22 mm banner, 60 mm signboard); verified by measurement.
4. **Fonts.** Fonts are referenced, not embedded. Install/load Noto Sans Bengali (or Hind Siliguri) in the editor and in the export pipeline, or the browser will substitute a fallback with different widths. Before sending to a printer, export to PDF with fonts embedded (or outlined **in the exported copy only** - never in the template).
5. **Colour.** Artwork is authored in screen RGB. RGB-to-CMYK conversion changes colours (especially the electric blue, purple and gold); do a printer proof. Colour match to physical print is not guaranteed.
6. **Large formats.** Vector artwork scales losslessly; any customer-supplied raster photos should be about 100-150 dpi at final size for the signboard/banner and 300 dpi for A4/A5.

## Editing notes

* Bengali placeholder text is real Unicode. Placeholder phone numbers use `০১XXX-XXXXXX` and addresses use generic labels; replace them.
* Long text does not auto-wrap in SVG. Multi-line text uses `<tspan dy>`; the editor should offer line-break editing or resize the font.
* Text boxes are not fixed-width; very long business names may need a smaller `font-size`. The signboard shop name uses `text-anchor="middle"`, so it stays centred when edited.

## Known limitations

* Previews were rendered in headless Chromium without the Noto Sans Bengali font (the fallback Bengali glyphs of the system were used). Glyph shapes and widths will differ slightly with the real font, so check long strings.
* Illustrations are simple line-icon sets (generic bag, cart, phone, wrench, burger, etc.), not complex illustrations; food photos are placeholders by design.
* Templates were checked in Chromium only, not in Illustrator/Inkscape/Figma.
* No existing SebaLagbe.com code was touched or assumed.
