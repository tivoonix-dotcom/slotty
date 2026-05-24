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
import type { SlottySelectTone } from './SlottySelect';
import { anchorBelowPopoverStyle, getSheetClampBounds } from './popoverSheetPosition';
import { type PickerLayer, resolvePickerLayer } from './pickerLayer';
import { PickerSheet, pickerSheetPrimaryBtn } from './PickerSheet';
import { formatDisplayRu, SlottyDatePickerCalendar } from './SlottyDatePickerCalendar';

type Props = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  tone?: SlottySelectTone;
  allowClear?: boolean;
  /** В админ-шите по умолчанию — вторая модалка. */
  pickerLayer?: PickerLayer;
  sheetTitle?: string;
  sheetSubtitle?: string;
  'aria-label'?: string;
};

const GAP = 8;
const VIEW_PAD = 8;
const PANEL_MIN_WIDTH = 280;
const PANEL_HEIGHT = 340;
const TONE_TRIGGER: Record<SlottySelectTone, string> = {
  neutral:
    'flex w-full min-h-[3rem] items-center justify-between rounded-[18px] border border-neutral-200/60 bg-white px-4 py-3 text-left text-[16px] font-semibold text-neutral-900 outline-none transition focus:border-[#E29595] disabled:cursor-not-allowed disabled:opacity-50',
  admin:
    'flex w-full min-h-[3rem] items-center justify-between rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-left text-[15px] font-medium text-[#111827] outline-none transition focus:border-[#F9A8B4] focus:ring-2 focus:ring-[#FFF1F4] disabled:cursor-not-allowed disabled:opacity-50',
  catalog:
    'inline-flex h-10 min-w-[200px] shrink-0 items-center rounded-[10px] border-0 bg-[#F5F5F5] px-3.5 text-left text-[13px] font-semibold text-[#111827] outline-none transition hover:bg-[#EBEBEB] focus:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-50',
};

type ClampBounds = { left: number; top: number; right: number; bottom: number };

function getClampBounds(anchor: HTMLElement): ClampBounds {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const viewport: ClampBounds = {
    left: VIEW_PAD,
    top: VIEW_PAD,
    right: vw - VIEW_PAD,
    bottom: vh - VIEW_PAD,
  };
  const sheet = getSheetClampBounds(anchor);
  return sheet ?? viewport;
}

function useFixedCalendarPosition(open: boolean, anchorRef: RefObject<HTMLElement | null>): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el || !open) return;
    const r = el.getBoundingClientRect();
    const bounds = getClampBounds(el);
    const maxHeight = bounds.bottom - bounds.top;
    const width = Math.min(Math.max(r.width, PANEL_MIN_WIDTH), bounds.right - bounds.left);
    const panelHeight = Math.min(PANEL_HEIGHT, maxHeight);
    setStyle(anchorBelowPopoverStyle(r, bounds, width, panelHeight, GAP));
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

export function SlottyDatePicker({
  value,
  onChange,
  min,
  max,
  className = '',
  disabled = false,
  placeholder = 'Выберите дату',
  tone = 'neutral',
  allowClear = true,
  pickerLayer = 'auto',
  sheetTitle = 'Выберите дату',
  sheetSubtitle = 'День, когда слот появится в расписании',
  'aria-label': ariaLabel,
}: Props) {
  const autoId = useId();
  const buttonId = `${autoId}-btn`;
  const panelId = `${autoId}-panel`;

  const [open, setOpen] = useState(false);
  const [useSheet, setUseSheet] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelStyle = useFixedCalendarPosition(open && !useSheet, btnRef);

  const parseForView = (v: string) => {
    const [y, mo, d] = v.split('-').map(Number);
    return new Date(y, (mo || 1) - 1, d || 1);
  };
  const base = value.trim() ? parseForView(value) : new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  const close = useCallback(() => setOpen(false), []);

  const openPicker = () => {
    if (disabled) return;
    const layer = resolvePickerLayer(btnRef.current, pickerLayer);
    setUseSheet(layer === 'sheet');
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const b = value.trim() ? parseForView(value) : new Date();
    setViewYear(b.getFullYear());
    setViewMonth(b.getMonth());
  }, [open, value]);

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

  const pickDay = (iso: string) => {
    onChange(iso);
    close();
    btnRef.current?.focus();
  };

  const display = value.trim() ? formatDisplayRu(value) : '';

  const calendar = (
    <SlottyDatePickerCalendar
      value={value}
      viewYear={viewYear}
      viewMonth={viewMonth}
      onViewYearChange={setViewYear}
      onViewMonthChange={setViewMonth}
      min={min}
      max={max}
      allowClear={allowClear}
      tone={tone}
      onPick={pickDay}
    />
  );

  const popoverPanel =
    open && !useSheet && panelStyle ? (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Выбор даты"
        style={panelStyle}
        className="rounded-[22px] border border-[#EAECEF]/80 bg-white p-3 shadow-[0_16px_48px_rgba(17,24,39,0.14)]"
      >
        {calendar}
      </div>
    ) : null;

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        ref={btnRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open && !useSheet ? panelId : undefined}
        aria-label={ariaLabel}
        onClick={openPicker}
        className={TONE_TRIGGER[tone]}
      >
        <span className={display ? (tone === 'admin' ? 'text-[#111827]' : 'text-neutral-900') : 'font-medium text-[#9CA3AF]'}>
          {display || placeholder}
        </span>
        <svg
          className={`shrink-0 ${tone === 'admin' ? 'text-[#9CA3AF]' : 'text-neutral-500'}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {popoverPanel && typeof document !== 'undefined' ? createPortal(popoverPanel, document.body) : null}

      <PickerSheet
        open={open && useSheet}
        onClose={close}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        footer={
          <button type="button" className={pickerSheetPrimaryBtn} onClick={close}>
            Готово
          </button>
        }
      >
        {calendar}
      </PickerSheet>
    </div>
  );
}
