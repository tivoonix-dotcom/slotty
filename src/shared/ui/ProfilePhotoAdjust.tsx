import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react';
import { cropImageToAspect, type PhotoFrameFocus } from '../lib/cropImageToAspect';

const HERO_ASPECT = 16 / 10;

type Props = {
  src: string;
  aspect?: number;
  initialFocus?: PhotoFrameFocus;
  onApply: (croppedDataUrl: string) => void | Promise<void>;
  onCancel: () => void;
};

export function ProfilePhotoAdjust({
  src,
  aspect = HERO_ASPECT,
  initialFocus,
  onApply,
  onCancel,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<PhotoFrameFocus>(
    () => initialFocus ?? { x: 0.5, y: 0.5, zoom: 1 },
  );
  const [dragging, setDragging] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectPercent = useMemo(() => `${(1 / aspect) * 100}%`, [aspect]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!dragging || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setFocus((prev) => ({
        ...prev,
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
      }));
    },
    [dragging],
  );

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  }, []);

  const previewStyle = useMemo(() => {
    const z = focus.zoom;
    const px = (0.5 - focus.x) * 40 * z;
    const py = (0.5 - focus.y) * 40 * z;
    return {
      transform: `translate(${px}%, ${py}%) scale(${z})`,
    } as const;
  }, [focus]);

  const apply = async () => {
    setApplying(true);
    setError(null);
    try {
      const out = await cropImageToAspect(src, aspect, focus);
      await onApply(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обработать фото');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-snug text-neutral-500">
        Перетащите фото, чтобы выбрать кадр. Лицо и важные детали должны попадать в рамку — так их увидят
        клиенты.
      </p>

      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[22px] bg-neutral-900 shadow-[0_12px_36px_rgba(17,17,17,0.18)] touch-none"
        style={{ paddingBottom: aspectPercent }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="img"
        aria-label="Настройка кадра фото"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full min-h-full min-w-full max-w-none object-cover"
            style={previewStyle}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-inset ring-white/25"
          aria-hidden
        />
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Приближение</span>
        <input
          type="range"
          min={1}
          max={2.5}
          step={0.02}
          value={focus.zoom}
          onChange={(e) => setFocus((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
          className="mt-2 w-full accent-[#E29595]"
        />
      </label>

      {error ? <p className="text-[12px] font-medium text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={applying}
          className="min-h-11 flex-1 rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98] disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => void apply()}
          disabled={applying}
          className="min-h-11 flex-1 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.28)] transition active:scale-[0.98] disabled:opacity-50"
        >
          {applying ? 'Сохраняем…' : 'Применить кадр'}
        </button>
      </div>
      </div>
  );
}
