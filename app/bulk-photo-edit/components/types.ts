import type React from "react";

export type PhotoProcessingStatus =
  | "pending"
  | "processing"
  | "success"
  | "error";

export type PhotoItem = {
  id: string;
  file: File;
  preview: string;
  status: PhotoProcessingStatus;
  resultUrl: string | null;
  error: string | null;
};

export type ToolItem = {
  name: string;
  description: string;
  icon: React.ReactNode;
};

export type ToolPreset = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tools: ToolItem[];
};

export type SelectedTools = Record<string, string[]>;

export type ApplyMode = "all" | "each";

// Tool selection kept separately for every photo (keyed by photo id) in "each" mode.
export type PhotoToolsMap = Record<string, SelectedTools>;
