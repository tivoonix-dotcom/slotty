import type { CSSProperties } from 'react';

export const POPOVER_SHEET_Z_INDEX = 280;
export const POPOVER_SHEET_PAD = 10;

export type SheetClampBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function getAdminSheetRoot(anchor: HTMLElement): HTMLElement | null {
  if (anchor.closest('[data-admin-picker-sheet]')) return null;
  return anchor.closest('[data-admin-sheet]');
}

export function getSheetClampBounds(anchor: HTMLElement): SheetClampBounds | null {
  const sheet = getAdminSheetRoot(anchor);
  if (!sheet) return null;

  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const pad = POPOVER_SHEET_PAD;
  const r = sheet.getBoundingClientRect();

  return {
    left: Math.max(pad, r.left + pad),
    top: Math.max(pad, r.top + pad),
    right: Math.min(vw - pad, r.right - pad),
    bottom: Math.min(vh - pad, r.bottom - pad),
  };
}

function fitPanelLeft(anchorRect: DOMRect, panelWidth: number, bounds: SheetClampBounds): number {
  const maxLeft = bounds.right - panelWidth;
  let left = anchorRect.left;
  if (left + panelWidth > bounds.right) {
    left = anchorRect.right - panelWidth;
  }
  if (left < bounds.left) left = bounds.left;
  if (left > maxLeft) left = Math.max(bounds.left, maxLeft);
  return left;
}

/** Под полем, поверх шита; при нехватке места — над полем. */
export function anchorBelowPopoverStyle(
  anchorRect: DOMRect,
  bounds: SheetClampBounds,
  panelWidth: number,
  maxPanelHeight: number,
  gap = 8,
): CSSProperties {
  const spanW = bounds.right - bounds.left;
  const width = Math.min(Math.max(anchorRect.width, panelWidth), spanW);
  const left = fitPanelLeft(anchorRect, width, bounds);

  const spaceBelow = bounds.bottom - anchorRect.bottom - gap;
  const spaceAbove = anchorRect.top - bounds.top - gap;
  const openDown = spaceBelow >= 100 || spaceBelow >= spaceAbove;

  if (openDown) {
    const maxHeight = Math.min(maxPanelHeight, Math.max(100, spaceBelow));
    return {
      position: 'fixed',
      top: anchorRect.bottom + gap,
      left,
      width,
      maxHeight,
      zIndex: POPOVER_SHEET_Z_INDEX,
    };
  }

  const maxHeight = Math.min(maxPanelHeight, Math.max(100, spaceAbove));
  return {
    position: 'fixed',
    top: Math.max(bounds.top, anchorRect.top - gap - maxHeight),
    left,
    width,
    maxHeight,
    zIndex: POPOVER_SHEET_Z_INDEX,
  };
}
