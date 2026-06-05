import { useCallback, useRef, useState } from 'react';

type Props = {
  label: string;
  disabled?: boolean;
  onConfirm: () => void;
};

export function SlideToConfirmButton({ label, disabled, onConfirm }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const reset = useCallback(() => setOffset(0), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setDragging(true);
    startX.current = e.clientX - offset;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !trackRef.current) return;
    const max = trackRef.current.clientWidth - 48;
    const next = Math.max(0, Math.min(max, e.clientX - startX.current));
    setOffset(next);
  };

  const onPointerUp = () => {
    if (!dragging || !trackRef.current) return;
    setDragging(false);
    const max = trackRef.current.clientWidth - 48;
    if (offset >= max * 0.85) {
      onConfirm();
      reset();
      return;
    }
    reset();
  };

  return (
    <div
      ref={trackRef}
      className={`relative h-12 overflow-hidden rounded-full bg-[#F5F5F5] ring-1 ring-[#EEEEEE] ${disabled ? 'opacity-50' : ''}`}
    >
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-[#6B7280]">
        {label}
      </p>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className="absolute left-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-white shadow-sm transition-transform touch-none"
        aria-label={label}
      >
        →
      </button>
    </div>
  );
}
