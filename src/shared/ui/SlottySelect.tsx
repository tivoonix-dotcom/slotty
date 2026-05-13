import type { CSSProperties, RefObject } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export type SlottySelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SlottySelectOption[];
  /** Доп. классы на корневой `relative`-контейнер (часто `mt-1.5 w-full`). */
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

const GAP = 6;
const VIEW_PAD = 8;
const MAX_PANEL = 320;

function useFixedListboxPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el || !open) return;
    const r = el.getBoundingClientRect();
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    const width = r.width;
    let left = r.left;
    left = Math.max(VIEW_PAD, Math.min(left, vw - width - VIEW_PAD));

    const spaceBelow = vh - r.bottom - VIEW_PAD;
    const spaceAbove = r.top - VIEW_PAD;
    const openDown = spaceBelow >= 140 || spaceBelow >= spaceAbove;

    if (openDown) {
      const maxHeight = Math.min(MAX_PANEL, Math.max(120, spaceBelow - GAP));
      setStyle({
        position: 'fixed',
        top: r.bottom + GAP,
        left,
        width,
        maxHeight,
        zIndex: 100,
      });
    } else {
      const maxHeight = Math.min(MAX_PANEL, Math.max(120, spaceAbove - GAP));
      setStyle({
        position: 'fixed',
        bottom: vh - r.top + GAP,
        left,
        width,
        maxHeight,
        zIndex: 100,
      });
    }
  }, [anchorRef, open]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    measure();
    const ro = new ResizeObserver(measure);
    const el = anchorRef.current;
    if (el) ro.observe(el);

    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('scroll', onWin);
    window.addEventListener('scroll', onWin, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('scroll', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, measure, anchorRef]);

  return open ? style : null;
}

export function SlottySelect({
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  id: idProp,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: Props) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const buttonId = idProp ?? `${autoId}-btn`;

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelStyle = useFixedListboxPosition(open, btnRef);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? value;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className={`relative ${className}`.trim()}>
      <button
        ref={btnRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="flex w-full min-h-[3.25rem] items-center rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-left text-[16px] text-neutral-900 outline-none ring-0 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{label}</span>
        <span className="ml-2 shrink-0 text-neutral-600" aria-hidden>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && panelStyle ? (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          style={panelStyle}
          className="overflow-y-auto overscroll-contain rounded-[22px] border border-neutral-200/80 bg-white p-2 shadow-[0_12px_40px_rgba(17,17,17,0.12)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full rounded-[18px] px-3 py-2.5 text-left text-[15px] font-medium transition active:scale-[0.99] ${
                    active
                      ? 'bg-[#E29595] text-white shadow-[0_6px_18px_rgba(226,149,149,0.35)]'
                      : 'text-neutral-900 hover:bg-[#F1EFEF]'
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    close();
                    btnRef.current?.focus();
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
