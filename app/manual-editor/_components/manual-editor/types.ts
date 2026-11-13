export type PhotoMode = "passport" | "dual" | "visa" | "rsizes" | "freesize" | "admission";

/** Which preset list a size menu / preset belongs to. */
export type SizeMenuKey = "visa" | "rsizes" | "admission";

export type AiTool = "face" | "object" | "transparent" | "upscale" | "cutout" | "retouch" | "enhance" | "pose";

export type ObjectTab = "face" | "skin" | "hair" | "shadow";

export type ObjectBrushMode = "brush" | "erase";

export type PhotoAsset = {
  file: File;
  url: string;
  width: number;
  height: number;
};

export type SizePreset = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  /**
   * Admission / job-portal presets: the exported image must be EXACTLY this many
   * pixels, within this KB range, in this format. When set, `widthMm`/`heightMm`
   * are only the print size (pixels at 300 DPI) used for preview and Print Studio.
   */
  widthPx?: number;
  heightPx?: number;
  minKB?: number;
  maxKB?: number;
  format?: "jpg" | "png" | "any";
  /** Short Bangla hint shown under the preset button. */
  note?: string;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropHandle = "move" | "nw" | "ne" | "sw" | "se";

export type EditorFilters = {
  brightness: number;
  contrast: number;
  saturation: number;
  sharp: number;
};

