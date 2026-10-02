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
