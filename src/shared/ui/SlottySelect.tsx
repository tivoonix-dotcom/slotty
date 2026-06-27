import type { CSSProperties, RefObject } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { anchorBelowPopoverStyle, getSheetClampBounds } from './popoverSheetPosition';
import { type PickerLayer, resolvePickerLayer } from './pickerLayer';
import { PickerSheet, pickerSheetPrimaryBtn } from './PickerSheet';

export type SlottySelectOption = { value: string; label: string };

export type SlottySelectTone = 'neutral' | 'admin' | 'catalog' | 'cabinet';

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SlottySelectOption[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  tone?: SlottySelectTone;
  pickerLayer?: PickerLayer;
  sheetTitle?: string;
  sheetSubtitle?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

const GAP = 6;
const VIEW_PAD = 8;
const MAX_PANEL = 320;
const LIST_MIN_WIDTH = 260;
const LIST_PANEL_HEIGHT = 300;

const TONE_TRIGGER: Record<SlottySelectTone, string> = {
  neutral:
    'flex w-full min-h-[3.25rem] items-center rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-left text-[16px] text-neutral-900 outline-none ring-0 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
  admin:
    'flex w-full min-h-[3rem] items-center rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-left text-[15px] font-medium text-[#111827] outline-none transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
  catalog:
    'flex w-full min-h-12 items-center rounded-[10px] border-0 bg-[#EBEBEB] px-4 text-left text-[15px] font-medium text-[#111827] outline-none transition hover:bg-[#E4E4E4] focus:bg-[#E4E4E4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
  cabinet:
    'flex w-full min-h-12 items-center rounded-[10px] border-0 bg-[#F5F5F5] px-4 py-3 text-left text-[15px] font-medium text-[#111827] outline-none transition hover:bg-[#EBEBEB] focus:bg-[#EBEBEB] focus:ring-2 focus:ring-[#ff5f7a]/15 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
};

const TONE_OPTION_ACTIVE: Record<SlottySelectTone, string> = {
  neutral: 'bg-[#E29595] text-white shadow-[0_6px_18px_rgba(226,149,149,0.35)]',
  admin: 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_8px_20px_rgba(255,95,122,0.28)]',
  catalog: 'bg-[#FFF1F4] text-[#F47C8C] font-semibold ring-1 ring-[#F47C8C]/15',
  cabinet: 'bg-[#FFF1F4] text-[#ff5f7a] font-semibold',
};

const TONE_OPTION_IDLE: Record<SlottySelectTone, string> = {
  neutral: 'text-neutral-900 hover:bg-[#F1EFEF]',
  admin: 'text-[#111827] hover:bg-[#FFF1F4]',
  catalog: 'font-medium text-[#374151] hover:bg-[#FAFAFA]',
  cabinet: 'font-medium text-[#111827] hover:bg-[#FAFAFA]',
};

const TONE_POPOVER_PANEL: Record<SlottySelectTone, string> = {
  neutral:
    'overflow-y-auto overscroll-contain rounded-[22px] border border-neutral-200/80 bg-white p-2 shadow-[0_12px_40px_rgba(17,17,17,0.12)]',
  admin:
    'overflow-y-auto overscroll-contain rounded-[16px] border border-[#EAECEF] bg-white p-2 shadow-[0_12px_40px_rgba(17,17,17,0.12)]',
  catalog:
    'scrollbar-hidden overflow-y-auto overscroll-contain rounded-[12px] bg-white p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
  cabinet:
    'overflow-y-auto overscroll-contain rounded-[16px] bg-white p-1.5 shadow-[0_12px_40px_rgba(17,24,39,0.1)]',
};

const TONE_POPOVER_OPTION: Record<SlottySelectTone, string> = {
  neutral: 'rounded-[18px] px-3 py-2.5 text-[15px]',
  admin: 'rounded-[12px] px-3 py-2.5 text-[14px]',
  catalog: 'rounded-[8px] px-3 py-2 text-[13px]',
  cabinet: 'rounded-[10px] px-3 py-2.5 text-[15px]',
};

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
    const sheetBounds = getSheetClampBounds(el);
    const bounds = sheetBounds ?? {
      left: VIEW_PAD,
      top: VIEW_PAD,
      right: vw - VIEW_PAD,
      bottom: vh - VIEW_PAD,
    };
    const width = Math.min(Math.max(r.width, LIST_MIN_WIDTH), bounds.right - bounds.left);
    const maxHeight = Math.min(LIST_PANEL_HEIGHT, MAX_PANEL);
    setStyle(anchorBelowPopoverStyle(r, bounds, width, maxHeight, GAP));
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
    window.visualViewport?.addEventListener('scroll', onWin, true);
    window.addEventListener('scroll', onWin, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('scroll', onWin, true);
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
  placeholder,
  tone = 'neutral',
  pickerLayer = 'auto',
  sheetTitle = 'Выберите время',
  sheetSubtitle = 'Когда начинается приём',
  id: idProp,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: Props) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const buttonId = idProp ?? `${autoId}-btn`;

  const [open, setOpen] = useState(false);
  const [useSheet, setUseSheet] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelStyle = useFixedListboxPosition(open && !useSheet, btnRef);

  const selected = options.find((o) => o.value === value);
  const isPlaceholder = !selected && Boolean(placeholder) && value === '';
  const label = selected?.label ?? (isPlaceholder ? placeholder! : value);

  const close = useCallback(() => setOpen(false), []);

  const togglePicker = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    const layer = resolvePickerLayer(btnRef.current, pickerLayer);
    setUseSheet(layer === 'sheet');
    setOpen(true);
  };

  const pick = (v: string) => {
    onChange(v);
    close();
    btnRef.current?.focus();
  };

  useEffect(() => {
    if (!open || useSheet) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
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
  }, [open, useSheet, close]);

  const optionList = (
    <ul className="space-y-1.5" role="listbox" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <li key={opt.value || '__empty'} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={active}
              className={`flex w-full min-h-[3rem] items-center rounded-[16px] px-4 text-left text-[16px] font-bold transition active:scale-[0.99] ${
                active ? TONE_OPTION_ACTIVE[tone] : TONE_OPTION_IDLE[tone]
              }`}
              onClick={() => pick(opt.value)}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const popoverPanel =
    open && !useSheet && panelStyle ? (
      <ul
        ref={panelRef}
        id={listId}
        role="listbox"
        tabIndex={-1}
        style={panelStyle}
        className={TONE_POPOVER_PANEL[tone]}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <li key={opt.value || '__empty'} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={active}
                className={`flex w-full text-left font-medium transition active:scale-[0.99] ${TONE_POPOVER_OPTION[tone]} ${
                  active ? TONE_OPTION_ACTIVE[tone] : TONE_OPTION_IDLE[tone]
                }`}
                onClick={() => pick(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div ref={wrapRef} className={`relative ${className}`.trim()}>
      <button
        ref={btnRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open && !useSheet ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={togglePicker}
        className={TONE_TRIGGER[tone]}
      >
        <span className={`min-w-0 flex-1 truncate ${isPlaceholder ? 'text-[#9CA3AF] font-normal' : ''}`}>
          {label}
        </span>
        <span
          className={`ml-2 shrink-0 ${tone === 'admin' || tone === 'catalog' || tone === 'cabinet' ? 'text-[#9CA3AF]' : 'text-neutral-600'}`}
          aria-hidden
        >
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

      {typeof document !== 'undefined' && popoverPanel ? createPortal(popoverPanel, document.body) : null}

      <PickerSheet
        open={open && useSheet}
        onClose={close}
        title={ariaLabel?.trim() || sheetTitle}
        subtitle={sheetSubtitle}
        footer={
          <button type="button" className={pickerSheetPrimaryBtn} onClick={close}>
            Готово
          </button>
        }
      >
        {optionList}
      </PickerSheet>
    </div>
  );
}
