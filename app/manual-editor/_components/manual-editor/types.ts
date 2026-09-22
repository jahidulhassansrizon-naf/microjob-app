export type PhotoMode = "passport" | "dual" | "visa" | "rsizes" | "freesize";

export type AiTool = "face" | "object" | "transparent" | "upscale" | "cutout";

export type ObjectTab = "face" | "skin" | "hair" | "shadow";

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
