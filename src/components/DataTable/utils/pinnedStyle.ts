import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

/**
 * Returns inline styles for a pinned column so TanStack Table's
 * left/right offset values are applied correctly.
 */
export function getPinnedStyle<TData>(
  column: Column<TData, unknown>,
): CSSProperties {
  const isPinnedLeft = column.getIsPinned() === "left";
  const isPinnedRight = column.getIsPinned() === "right";

  return {
    position: isPinnedLeft || isPinnedRight ? "sticky" : "relative",
    left: isPinnedLeft ? column.getStart("left") : undefined,
    right: isPinnedRight ? column.getAfter("right") : undefined,
    zIndex: isPinnedLeft || isPinnedRight ? 1 : undefined,
  };
}
