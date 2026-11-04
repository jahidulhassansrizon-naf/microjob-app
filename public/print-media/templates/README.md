# SohojKaj Print Media Starter Library

This starter pack contains 69 editable vector template concepts for the Print Media page.

## Contents
- 69 SVG designs (vector elements are separated and named with IDs and `data-layer-name`).
- 69 JSON manifests (canvas settings, element metadata and editability flags).
- 69 PNG previews.
- Category contact sheets and `catalog.csv`.
- `templates-index.json` master catalogue.

## Important integration note
These are first-pass vector template assets, not a finished editor integration. Your app's existing editor data model and print/export workflow must be inspected before mapping these JSON objects into it. SVG elements can be individually selected by their IDs in an SVG-aware editor, but the application must implement selection, text editing, image replacement, transform controls, undo/redo, save/load and export.

## Recommended editor mapping
- `shape`: editable vector geometry / fill / stroke.
- `text`: editable text element (preserve Unicode Bengali text and load a Bengali-capable font such as Noto Sans Bengali or Hind Siliguri in the app).
- `guide`: non-printing guide; hide before export.
- Placeholder rectangles and labels: replace with user-uploaded image or edited text as appropriate.

## Printing checklist before production
1. Confirm actual physical size for every product with the print provider.
2. Add bleed (commonly 3 mm where required) and a safe area.
3. Ensure images are high enough resolution at final print size.
4. Use embedded/available Bengali fonts and verify PDF font embedding.
5. Convert colors to the printer's required color profile (often CMYK) and proof the PDF.
6. Verify QR codes, barcodes and business/payment details using real supplied data; placeholders are intentionally blank.
7. Election-related designs must be checked against current Bangladesh Election Commission rules before publication or use.

## File naming
`NN-template-name.svg` is the editable vector source. Matching `.json` is the template metadata. Matching `.png` under `previews/` is a gallery preview.
