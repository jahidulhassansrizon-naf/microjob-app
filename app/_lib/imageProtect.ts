import type { SyntheticEvent } from "react";

/**
 * Spread on a plain <img> to switch off the right-click menu and dragging on that picture,
 * so people cannot use "Open image in new tab" / "Save image as" / "Copy image address" on it.
 */
export const blockImageMenu = {
  draggable: false,
  onContextMenu: (event: SyntheticEvent) => event.preventDefault(),
  onDragStart: (event: SyntheticEvent) => event.preventDefault(),
} as const;
