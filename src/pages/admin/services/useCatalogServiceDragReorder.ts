import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  enabled: boolean;
  onReorder: (activeId: string, overId: string) => void;
};

function findCatalogServiceIdAtPoint(clientX: number, clientY: number, skipId: string | null): string | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const node of stack) {
    const row = node.closest<HTMLElement>('[data-catalog-service-id]');
    const id = row?.dataset.catalogServiceId;
    if (!id || id === skipId) continue;
    return id;
  }
  return null;
}

export function useCatalogServiceDragReorder({ enabled, onReorder }: Options) {
  const draggingIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);
  const captureRef = useRef<{ pointerId: number; element: HTMLElement } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const releaseCapture = useCallback(() => {
    const capture = captureRef.current;
    if (!capture) return;
    try {
      capture.element.releasePointerCapture(capture.pointerId);
    } catch {
      // ignore if capture already released
    }
    captureRef.current = null;
  }, []);

  const finishDrag = useCallback(() => {
    const active = draggingIdRef.current;
    const over = overIdRef.current;
    if (active && over && active !== over) {
      onReorder(active, over);
    }
    releaseCapture();
    draggingIdRef.current = null;
    overIdRef.current = null;
    setDraggingId(null);
    setOverId(null);
  }, [onReorder, releaseCapture]);

  useEffect(() => {
    if (!draggingId) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      const active = draggingIdRef.current;
      if (!active) return;

      const nextOver = findCatalogServiceIdAtPoint(event.clientX, event.clientY, active);
      if (!nextOver) return;

      if (overIdRef.current === nextOver) return;
      overIdRef.current = nextOver;
      setOverId(nextOver);
    };

    const onPointerUp = () => finishDrag();

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [draggingId, finishDrag]);

  const onHandlePointerDown = useCallback(
    (serviceId: string, event: React.PointerEvent<HTMLButtonElement>) => {
      if (!enabled) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      captureRef.current = { pointerId: event.pointerId, element: event.currentTarget };
      draggingIdRef.current = serviceId;
      overIdRef.current = serviceId;
      setDraggingId(serviceId);
      setOverId(serviceId);
    },
    [enabled],
  );

  return {
    draggingId,
    overId,
    isDragging: draggingId !== null,
    onHandlePointerDown,
  };
}
