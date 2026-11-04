import { clearMyFilesDataCache } from "@/app/my-files/myFilesData";

/** Fired after a generated image has been saved to the user's My Files. */
export const MY_FILES_SAVED_EVENT = "sebalagbe:my-files-saved";

export type MyFilesSavedDetail = {
  /** How many images were saved (bulk editor can save several). Default 1. */
  count?: number;
  /** "design" = a saved Print Media design (editable later), default = a generated image. */
  kind?: "image" | "design";
};

/**
 * Call this once a generated image is safely saved.
 * - drops the in-memory My Files cache, so the new image shows up the moment the user opens My Files
 * - shows the global "saved in My Files" popup (see MyFilesSavedPopup)
 */
export function notifyMyFilesSaved(count = 1, kind: "image" | "design" = "image"): void {
  if (typeof window === "undefined") return;
  try {
    clearMyFilesDataCache();
  } catch {
    // the cache is only an optimisation
  }
  window.dispatchEvent(
    new CustomEvent<MyFilesSavedDetail>(MY_FILES_SAVED_EVENT, {
      detail: { count: Math.max(1, Math.floor(count) || 1), kind },
    }),
  );
}
