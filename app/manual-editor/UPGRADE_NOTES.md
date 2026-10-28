# Manual Editor upgrade notes

## What this pass added (new)

- **Retouch & Remove editor** (`RetouchEditorModal.tsx`, button "Retouch" next to Cutout Editor). One modal, six distinct tools:
  - **Remove** – paint over a spot, dust, scratch or small object; the area is rebuilt from its surroundings. *This is a classic diffusion fill, not generative AI inpainting.*
  - **Clone / Heal** – pick a clean source, paint over the problem; texture is copied and tone is matched to the surroundings.
  - **Red-eye** – only strongly red pixels inside the brush are neutralised.
  - **Skin smooth** – edge-preserving smoothing limited to skin-coloured pixels, strength slider (default 50 %).
  - **Blur** and **Pixelate** – hide private details inside the painted area.
  - Brush size, zoom (100–600 %), undo/redo (Ctrl+Z / Ctrl+Shift+Z), undo-everything, Cancel, "Save to photo".
  - Works at the photo's full pixel resolution, only on the painted region (plus margin), and keeps history as small patches (max 20), not full-image snapshots.
- **Pixel engine** (`photoTools.ts`): pure TypeScript, no dependencies, unit-tested in Node (see below).
- **Cutout Editor**: added zoom (100–600 %), an *Edge softness* control (alpha-only, preview = output), and a preview-backdrop picker (transparent / white / light blue / grey / custom). The backdrop is preview only; the real background colour is still chosen in the Background panel.
- **Safari/iOS export fix**: `CanvasRenderingContext2D.filter` is ignored by Safari < 18, so Brightness / Contrast / Saturation / Hue / Sepia / B&W were silently missing from downloads, saved photos and print there. `drawAsset` now falls back to a pixel implementation of the same CSS filter chain (only the photo is filtered, not the background colour).
- **Download feedback**: after Download the panel shows format, pixel size, file size and whether the file is transparent or flattened on white.
- `EditorProvider.applyRetouchedFile` (new): swaps the active photo for the retouched one while keeping background-removed state, transforms and the "original" used by Before/After.

## Already present from the earlier pass (verified by reading the code)

- Cutout Editor is wired to real background removal, with alpha-aware Erase and Restore (Restore copies from the original upload), undo/redo/reset.
- Hue, Sepia, Black & White flow through preview, export, print and save (they share `filterString`).
- PNG / JPEG / WebP export with quality; JPEG flattens transparency on white.
- No Text & Shapes / sticker / watermark code exists in this source. None was added.

## Not done in this pass (be aware)

- **No live-preview Develop sliders** (Exposure, Temperature, Tint, Highlights/Shadows, Vibrance, Vignette). They need a canvas-based preview in `PhotoWorkspace`, which currently previews with CSS filters; adding them without that would make preview differ from export.
- No generative/AI inpainting, deblur or denoise models; no perspective correction; no free-crop / straighten / aspect-ratio presets beyond what `CropEditor` already has; no custom export dimensions; no soft background blur or drop shadow; no "Auto Enhance" button.
- Object Adjust, AI Face Enhance, AI Upscale, Print Studio, Saved Photos and QR upload were read but not changed and could not be run here.

## Verification actually performed

- `photoTools.ts`: compiled with `tsc --strict`, 21 unit checks + 11 CSS-filter-fidelity checks pass in Node (see test list in the chat summary).
- Cutout edge smoothing: numerically checked (area change ≤ 3.4 % at max softness, interior stays opaque, RGB untouched).
- Every changed `.ts/.tsx` file parses with no syntax errors. Full type-check and build could NOT be run: this ZIP has no `package.json`, `tsconfig.json`, `@/lib/*`, `fabric`, `@imgly/background-removal`, or React types.
- Nothing was run in a real browser. Canvas rendering, pointer painting, and the modals' look and feel are untested.

## New npm packages

None. Everything added uses existing dependencies (`react`, `lucide-react`).

---

# Pass 3 (this pass): Enhance & Restore

## Added
- **Enhance & Restore modal** (`PhotoEnhanceModal.tsx`), opened from four new buttons in the AI Tools panel: **Auto Enhance**, **Denoise & Deblur**, **Relight**, **Old Photo**. Each has a live preview, "Compare with original", Reset, Cancel/Stop, Apply, progress and clear errors. Apply always re-processes the *untouched source pixels at full resolution* (never the preview) and commits through the existing `applyRetouchedFile`, so transforms, background colour, adjustments, export, print and save keep working.
- **Pixel engine** (`photoEnhance.ts`, no dependencies):
  - *Auto Enhance*: histogram levels, exposure (only brightens dark photos; leaves white-background/high-key photos alone), gray-world white balance with safeguards for strongly coloured scenes, contrast, vibrance (gentler on skin tones), noise estimate (Immerkaer), sharpness estimate, light denoise/sharpen only when measured as needed. Reports in plain words what it changed.
  - *Denoise*: edge-preserving bilateral filter, Weak/Medium/Strong, alpha-aware.
  - *Deblur*: two-scale unsharp mask with a halo limiter. **This is detail recovery by sharpening, not an AI deblur model.** It cannot undo heavy blur (measured: only ~20 % steeper on a 13 px-wide soft edge, ~65 % on mild softness).
  - *Relight*: lifts only locally dark regions (decided from a heavily blurred luma map), protects highlights, optional extra fill light on a detected face. **Tone correction, not 3-D relighting.**
  - *Old Photo*: thin dust/scratch repair (up to ~5 px wide), per-channel fade restoration, denoise, detail recovery. Faces can be protected from dust repair. **Does not fill tears or missing areas and does not add colour.**
- `detectHeadBoxes()` (end of `aiEnhancement.ts`): reuses the existing person detector + the same head-ROI heuristic Face Enhance uses. **It is a person detector, not a landmark/face-mesh detector**, so head boxes are estimates.
- `AiTool` gained `"enhance"`; the exhaustive `Record<AiTool, string>` in `EditorProvider.tsx` was updated to match.

## Removed from the build (reversible)
- `OverlayToolsPanel.tsx` (Text & Shapes) was renamed to `OverlayToolsPanel.tsx.removed`. It was not imported anywhere, referenced `PhotoOverlayType` and provider fields (`overlays`, `addOverlay`, ...) that do not exist, so it could not compile, and the brief excludes Text & Shapes. Rename it back to restore it.

## Verification actually performed
- `photoEnhance.ts`: compiled with `tsc --strict`; **33 unit checks pass in Node** (noise estimation accuracy, denoise noise-reduction and edge preservation at all 3 levels, auto-enhance on dark / balanced / colour-cast images, strength 0 / 0.5, deblur gain and halo bound, relight shadow lift / highlight protection / face fill / strength 0, dust + scratch removal, no false positives on clean images and real edges, protected regions, fade restoration, alpha preservation, grayscale detection, cancellation, progress).
- The tests found and I fixed three real bugs: relight darkened highlights even at zero lift; cancellation was ignored on images smaller than one work chunk; auto-enhance could not properly lift very dark photos.
- `PhotoEnhanceModal.tsx` type-checks under `--strict` against typed stubs for React / lucide-react (the real `@types/react` is not available here). All changed files parse with no syntax errors.
- **NOT done:** full project type-check, lint, `next build`, and any real-browser run. This ZIP has no `package.json`, `tsconfig.json`, `@/lib/*`, `DashboardNavbar` or `node_modules`. Canvas rendering, the modal layout and mobile behaviour are untested in a browser.

## New npm packages
None. Uses `react` and `lucide-react` only.

## Still not implemented (and why)
- AI Object Remover (true inpainting), AI Photo Colorizer: need a neural model; see the decision list in the chat summary. Nothing fake was added.
- Background Blur, Smart Background Replace extras, Smart Compressor, AI Passport Fit, extra Develop sliders (Exposure/Temperature/Tint/Highlights/Shadows/Vibrance/Vignette), free crop / straighten / perspective, AI-tools category regrouping, Bangla strings for the new modal.

---

# Pass 4: Speed (Remove BG, Upscale, Object Adjust) + tool guide

## Why it was slow (found by reading the code)
- **Remove BG** gave the full-resolution photo to `@imgly/background-removal`. The model only ever sees 1024 px, but the library still decoded, resized, composited and PNG-encoded the whole photo. After Upscale or Object Adjust the photo is a 2000-3200 px PNG, so every Remove BG afterwards got slower. The model and runtime were also only loaded on the first click.
- **Upscale** ran 128 px tiles with 20 px overlap (1.72x wasted work), one tile at a time, and every tile came back as a full x4 float image (~5 MB) that the UI thread converted and downscaled. Input could be up to 1600 px. A 1200x1600 photo meant 130 sequential model calls.
- **Object Adjust** sent the full-resolution bitmap to the segmentation worker although the model works on 256 px.

## What changed
- `segmentation.ts` - `removeBackgroundFromImage`: model runs on a <= 1024 px copy; the returned cut-out is used as a soft alpha mask on the ORIGINAL pixels (output keeps the photo's resolution, cap 4096). Mask cached per file (Remove BG then Cutout Editor = one model run). GPU (WebGPU) device is requested when available, with automatic CPU retry. New `preloadBackgroundRemoval()`.
- `EditorProvider.tsx` - once a photo is on the canvas the BG model (after 1.2 s) and the upscaler (after 2.4 s) are preloaded in the background. Hovering Remove BG / Transparent / Cutout Editor also preloads. A CPU-only browser gets a clear notice before Upscale starts.
- `upscaleMath.ts` (new, pure, unit-tested) + `upscale.worker.ts` + `aiEnhancement.ts` - tile size 256/overlap 16 on GPU (192/12 on CPU); RGBA tiles in, already-averaged x2 RGBA tiles out (conversion and 2x2 averaging moved into the worker); two tiles in flight so the model never waits for the UI thread; tiles are copied straight into place with `putImageData` (no intermediate canvas); the per-tile `setTimeout` yield was removed.
- **Behaviour change (on purpose):** Upscale now accepts photos up to 1280 px (GPU) / 640 px (CPU) on the longest side. A larger photo shows "This photo is already large..." instead of being shrunk and re-enlarged, which cost minutes and could not make it sharper. To change the limits edit `planUpscale()` in `upscaleMath.ts` (and the numbers in `toolGuide.ts`; a test checks they match).
- `segmentation.ts` - Object Adjust segmentation input is shrunk to <= 1024 px before it is sent to the worker.
- `toolGuide.ts` (new) + `AiToolsPanel.tsx` - every one of the 10 tools has a "what it does / use it when / good to know" text in English and Bangla: a hover/focus card under the buttons, a native tooltip, and a "How to use each tool" list. `manualEditorI18n.tsx` got the matching Bangla button labels and notices.
- `BackgroundPanel.tsx` - Remove BG button preloads the model on hover/focus.
- The duplicate nested folder `manual-editor/manual-editor/` (byte-identical copy) was left out of the ZIP.

## Verification actually performed
- `tests/upscaleMath.test.ts`: 25 checks pass in Node (pixel conversion, 2x2 averaging, tile geometry covers every pixel exactly once, a synthetic image rebuilt tile by tile equals the whole-image result, plan numbers match the on-screen guide, guide text complete in both languages). `tests/photoEnhance.test.ts` still 33/33.
- Changed `aiEnhancement.ts`, `segmentation.ts`, `upscale.worker.ts`, `AiToolsPanel.tsx`, `BackgroundPanel.tsx` type-check under `tsc --strict` against typed stubs for `@imgly/background-removal`, `onnxruntime-web`, `@mediapipe/tasks-vision` and React. Every `.ts/.tsx` file parses. Full project type-check / `next build` could not be run (no `package.json`, `@/lib/*`, `fabric`, `node_modules` in the ZIP).
- **NOT done:** no real-browser run, so no measured timings. The speed-up is from removing work (arithmetic above), not from a stopwatch.

## Things to check in the real project
- `@imgly/background-removal` must export `preload` (all 1.x versions do). `proxyToWorker`, `device`, `model` are passed through a loosely-typed object, so an older version simply ignores what it does not know.
- Optional, bigger win for CPU-only browsers: serve the app with cross-origin isolation (COOP/COEP headers) so ONNX can use several threads. Not changed here because it can break third-party CDN assets.
- Optional: self-host the imgly model files (`publicPath`) to avoid CDN latency on the first run.

## New npm packages
None.
