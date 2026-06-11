import type { CSSProperties, RefObject } from 'react';
import { useCallback, useLayoutEffect, useState } from 'react';
import { POPOVER_SHEET_Z_INDEX } from '../../../shared/ui/popoverSheetPosition';

const GAP = 6;
const MAX_HEIGHT = 420;

export function useCatalogSearchDropdownPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el || !open) return;

    const rect = el.getBoundingClientRect();
    const vh = window.visualViewport?.height ?? window.innerHeight;

    setStyle({
      position: 'fixed',
      top: rect.bottom + GAP,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(MAX_HEIGHT, Math.max(160, vh * 0.6)),
      zIndex: POPOVER_SHEET_Z_INDEX,
    });
  }, [anchorRef, open]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return undefined;
    }

    measure();
    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    window.visualViewport?.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('scroll', onWin);

    const ro = new ResizeObserver(measure);
    const el = anchorRef.current;
    if (el) ro.observe(el);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
      window.visualViewport?.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('scroll', onWin);
    };
  }, [open, measure, anchorRef]);

  return open ? style : null;
}
