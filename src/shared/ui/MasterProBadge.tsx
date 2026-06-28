import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

export const MASTER_PRO_BADGE_SRC = '/photos/pro-icon.png';

const TOOLTIP_Z = 280;
const TOOLTIP_GAP = 8;
const TOOLTIP_WIDTH = 260;
const MIN_SPACE = 96;

const DEFAULT_TITLE = 'PRO мастер';
const DEFAULT_DESCRIPTION =
  'Мастер оформил подписку Slotty Pro — расширенный профиль и приоритет в каталоге.';

type Props = {
  className?: string;
  title?: string;
  description?: string;
};

function tooltipFixedStyle(anchor: DOMRect): CSSProperties {
  const pad = 12;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const width = Math.min(TOOLTIP_WIDTH, vw - pad * 2);
  let left = anchor.left + anchor.width / 2 - width / 2;
  left = Math.max(pad, Math.min(left, vw - pad - width));

  const spaceBelow = vh - anchor.bottom - TOOLTIP_GAP;
  const spaceAbove = anchor.top - TOOLTIP_GAP;
  const openUp = spaceBelow < MIN_SPACE && spaceAbove >= spaceBelow;

  if (openUp) {
    return {
      position: 'fixed',
      left,
      width,
      bottom: vh - anchor.top + TOOLTIP_GAP,
      zIndex: TOOLTIP_Z,
      maxHeight: Math.max(88, spaceAbove - pad),
    };
  }

  return {
    position: 'fixed',
    left,
    width,
    top: anchor.bottom + TOOLTIP_GAP,
    zIndex: TOOLTIP_Z,
    maxHeight: Math.max(88, spaceBelow - pad),
  };
}

function ProTooltipPanel({
  tooltipId,
  title,
  description,
}: {
  tooltipId: string;
  title: string;
  description: string;
}) {
  return (
    <div
      id={tooltipId}
      role="tooltip"
      className="overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-3 text-left shadow-[0_8px_24px_rgba(17,24,39,0.12)]"
    >
      <p className="text-[13px] font-semibold text-[#111827]">{title}</p>
      <p className="mt-1 text-[12px] leading-snug text-[#6B7280]">{description}</p>
    </div>
  );
}

export function MasterProBadge({
  className = 'h-5 w-5 shrink-0',
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: Props) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  const visible = pinned || hover;

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setStyle(tooltipFixedStyle(el.getBoundingClientRect()));
  }, []);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    const onReflow = () => updatePosition();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    window.visualViewport?.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      window.visualViewport?.removeEventListener('resize', onReflow);
    };
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = anchorRef.current;
      if (!el?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [pinned]);

  const portal =
    visible && typeof document !== 'undefined'
      ? createPortal(
          <div style={style}>
            <ProTooltipPanel tooltipId={tooltipId} title={title} description={description} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={title}
        aria-expanded={visible}
        aria-describedby={visible ? tooltipId : undefined}
        onClick={() => {
          setPinned((v) => !v);
          updatePosition();
        }}
        onMouseEnter={() => {
          setHover(true);
          updatePosition();
        }}
        onMouseLeave={() => setHover(false)}
        onFocus={() => {
          setHover(true);
          updatePosition();
        }}
        onBlur={() => setHover(false)}
        className="inline-flex shrink-0 cursor-help items-center justify-center rounded-full border-0 bg-transparent p-0 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/35 active:scale-[0.97]"
      >
        <img
          src={MASTER_PRO_BADGE_SRC}
          alt=""
          className={`pointer-events-none object-contain ${className}`}
          loading="lazy"
          decoding="async"
        />
      </button>
      {portal}
    </>
  );
}
