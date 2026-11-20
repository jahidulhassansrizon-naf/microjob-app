// Auto Crop corner detection: 100% client-side (OpenCV.js), no server.
//
// Several strategies are tried and the best 4-corner shape wins:
//  1. "paper" mask  - the darkest colour channel (min of R, G, B) is high on
//     white paper and low on red cloth / wood / dark tables.
//  2. "bright" mask - plain grey brightness (Otsu), good for dark tables.
//  3. "edges"       - Canny edges, closed and filled (good for low contrast).
// Result: corners as 0..1 fractions of the image, so they can be applied to an
// image of any size (e.g. the 2x Magic Clean image).

export type NormPoint = { x: number; y: number };

type Candidate = { quad: NormPoint[]; score: number };

const MAX_DETECT_SIDE = 900;
const MIN_AREA_SHARE = 0.12;
const MAX_AREA_SHARE = 0.985;

function polygonArea(points: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function detectDocumentCornersCv(
  cv: any,
  source: HTMLCanvasElement,
): NormPoint[] | null {
  if (!cv || !cv.Mat || !source.width || !source.height) return null;

  const scale = Math.min(
    1,
    MAX_DETECT_SIDE / Math.max(source.width, source.height),
  );
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(source.width * scale));
  small.height = Math.max(1, Math.round(source.height * scale));
  const ctx = small.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, small.width, small.height);

  const width = small.width;
  const height = small.height;
  const imageArea = width * height;
  const minArea = imageArea * MIN_AREA_SHARE;

  const garbage: any[] = [];
  const keep = <T>(mat: T): T => {
    garbage.push(mat);
    return mat;
  };

  const normalize = (quad: { x: number; y: number }[]): NormPoint[] =>
    quad.map((pt) => ({
      x: Math.min(1, Math.max(0, pt.x / width)),
      y: Math.min(1, Math.max(0, pt.y / height)),
    }));

  const candidates: Candidate[] = [];

  // Turns the biggest outlines of a binary mask into candidate quads.
  const collectFromMask = (mask: any, weight: number) => {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    try {
      cv.findContours(
        mask,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE,
      );

      const ranked: { index: number; area: number }[] = [];
      for (let i = 0; i < contours.size(); i++) {
        const c = contours.get(i);
        ranked.push({ index: i, area: cv.contourArea(c) });
        c.delete();
      }
      ranked.sort((a, b) => b.area - a.area);

      for (const { index, area } of ranked.slice(0, 3)) {
        if (area < minArea) continue;

        const contour = contours.get(index);
        const hull = new cv.Mat();
        const approx = new cv.Mat();
        try {
          cv.convexHull(contour, hull, false, true);
          const perimeter = cv.arcLength(hull, true);

          let approxQuad: { x: number; y: number }[] | null = null;
          for (const epsilon of [0.012, 0.02, 0.03, 0.045, 0.06]) {
            cv.approxPolyDP(hull, approx, epsilon * perimeter, true);
            if (approx.rows === 4) {
              const d = approx.data32S;
              approxQuad = [
                { x: d[0], y: d[1] },
                { x: d[2], y: d[3] },
                { x: d[4], y: d[5] },
                { x: d[6], y: d[7] },
              ];
              break;
            }
            if (approx.rows < 4) break;
          }

          // No clean 4-corner outline: use the tilted bounding box instead.
          const exact = approxQuad !== null;
          const quad: { x: number; y: number }[] =
            approxQuad ??
            cv.RotatedRect.points(cv.minAreaRect(contour)).map(
              (pt: NormPoint) => ({ x: pt.x, y: pt.y }),
            );

          const quadArea = polygonArea(quad);
          if (quadArea < minArea || quadArea > imageArea * MAX_AREA_SHARE)
            continue;

          const fill = Math.min(1, area / quadArea);
          const score =
            (quadArea / imageArea) *
            (0.6 + 0.4 * fill) *
            (exact ? 1 : 0.9) *
            weight;
          candidates.push({ quad: normalize(quad), score });
        } finally {
          approx.delete();
          hull.delete();
          contour.delete();
        }
      }
    } finally {
      contours.delete();
      hierarchy.delete();
    }
  };

  // Closes small holes (text, folds) and removes specks from a mask.
  const cleanMask = (mask: any) => {
    const side = Math.max(3, Math.round(Math.max(width, height) * 0.012) | 1);
    const kernel = keep(
      cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(side, side)),
    );
    cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
    cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
  };

  try {
    const rgba = keep(cv.imread(small));
    const rgb = keep(new cv.Mat());
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);

    const gray = keep(new cv.Mat());
    cv.cvtColor(rgb, gray, cv.COLOR_RGB2GRAY);
    const grayBlur = keep(new cv.Mat());
    cv.GaussianBlur(gray, grayBlur, new cv.Size(7, 7), 0);

    // 1) Paper mask from the darkest colour channel.
    const channels = keep(new cv.MatVector());
    cv.split(rgb, channels);
    const r = keep(channels.get(0));
    const g = keep(channels.get(1));
    const b = keep(channels.get(2));
    const minRG = keep(new cv.Mat());
    cv.min(r, g, minRG);
    const minChannel = keep(new cv.Mat());
    cv.min(minRG, b, minChannel);
    const minBlur = keep(new cv.Mat());
    cv.GaussianBlur(minChannel, minBlur, new cv.Size(7, 7), 0);
    const paperMask = keep(new cv.Mat());
    cv.threshold(minBlur, paperMask, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    cleanMask(paperMask);
    collectFromMask(paperMask, 1.0);

    // 2) Bright mask from plain brightness.
    const brightMask = keep(new cv.Mat());
    cv.threshold(
      grayBlur,
      brightMask,
      0,
      255,
      cv.THRESH_BINARY | cv.THRESH_OTSU,
    );
    cleanMask(brightMask);
    collectFromMask(brightMask, 0.97);

    // 3) Edge based outline.
    const median = (() => {
      const data = grayBlur.data as Uint8Array;
      const histogram = new Uint32Array(256);
      for (let i = 0; i < data.length; i++) histogram[data[i]]++;
      let seen = 0;
      for (let v = 0; v < 256; v++) {
        seen += histogram[v];
        if (seen >= data.length / 2) return v;
      }
      return 128;
    })();
    const low = Math.max(0, Math.round(0.66 * median));
    const high = Math.min(255, Math.round(1.33 * median) + 30);
    const edges = keep(new cv.Mat());
    cv.Canny(grayBlur, edges, low, high);
    const edgeKernel = keep(
      cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5)),
    );
    cv.dilate(edges, edges, edgeKernel);
    cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, edgeKernel);
    collectFromMask(edges, 0.92);

    if (candidates.length === 0) return null;
    candidates.sort((a, b2) => b2.score - a.score);
    return candidates[0].quad;
  } catch (error) {
    console.error("Document corner detection failed:", error);
    return null;
  } finally {
    for (const mat of garbage) {
      try {
        mat.delete();
      } catch {
        // already released
      }
    }
  }
}
