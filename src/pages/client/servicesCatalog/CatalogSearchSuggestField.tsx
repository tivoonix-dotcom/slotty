import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HiClock, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import {
  fetchSearchSuggestions,
  recordSearchQuery,
  type CatalogSearchSuggestionDto,
} from '../../../features/services/api/catalogListingsApi';
import {
  clearCatalogSearchRecent,
  pushCatalogSearchRecent,
  readCatalogSearchRecent,
  removeCatalogSearchRecent,
} from './catalogSearchRecent';
import {
  selectionFromSuggestion,
  type CatalogSearchSuggestSelection,
} from './catalogSearchSuggestTypes';
import { catalogDesktopPanel } from './servicesCatalogTheme';
import { useCatalogSearchDropdownPosition } from './useCatalogSearchDropdownPosition';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: CatalogSearchSuggestSelection) => void;
  placeholder: string;
  disabled?: boolean;
  inputClassName: string;
  iconClassName?: string;
  trailing?: ReactNode;
  dropdownClassName?: string;
};

function SuggestRow({
  icon,
  title,
  subtitle,
  onClick,
  onRemove,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex w-full items-stretch">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className="flex min-w-0 flex-1 items-start gap-3 px-4 py-2.5 text-left transition hover:bg-[#FAFAFA]"
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#9CA3AF]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-[#111827]">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-[12px] text-[#8E8E93]">{subtitle}</span>
          ) : null}
        </span>
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Удалить «${title}» из истории`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex shrink-0 items-center justify-center px-3 text-[#9CA3AF] transition hover:text-[#111827]"
        >
          <HiXMark className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function recentToSuggestions(recent: string[]): CatalogSearchSuggestionDto[] {
  return recent.map((text) => ({
    id: `recent:${text}`,
    type: 'query',
    title: text,
    group: 'recent',
  }));
}

export function CatalogSearchSuggestField({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled = false,
  inputClassName,
  iconClassName = 'pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8E8E93]',
  trailing,
  dropdownClassName = '',
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLLabelElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState<CatalogSearchSuggestionDto[]>([]);
  const [items, setItems] = useState<CatalogSearchSuggestionDto[]>([]);
  const [recent, setRecent] = useState<string[]>(() => readCatalogSearchRecent());

  const applySelection = useCallback(
    async (item: CatalogSearchSuggestionDto) => {
      const selection = selectionFromSuggestion(item);
      if (selection.kind === 'text' || selection.kind === 'service') {
        pushCatalogSearchRecent(selection.text);
        setRecent(readCatalogSearchRecent());
        void recordSearchQuery(selection.text).catch(() => undefined);
      }
      onSelect(selection);
      setOpen(false);
      setFocused(false);
    },
    [onSelect],
  );

  const loadSuggestions = useCallback(async (raw: string) => {
    setLoading(true);
    try {
      const res = await fetchSearchSuggestions(raw, 12);
      setPopular(res.popular ?? []);
      setItems(res.items ?? []);
      setOpen(true);
    } catch {
      setPopular([]);
      setItems([]);
      setOpen(focused);
    } finally {
      setLoading(false);
    }
  }, [focused]);

  useEffect(() => {
    if (!focused) return undefined;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadSuggestions(value);
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, focused, loadSuggestions]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
      setFocused(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const recentItems = value.trim() ? [] : recentToSuggestions(recent);
  const showRecent = recentItems.length > 0;
  const showPopular = popular.length > 0;
  const showItems = items.length > 0;
  const showPanel = open && focused && (showRecent || showPopular || showItems || loading);
  const panelStyle = useCatalogSearchDropdownPosition(showPanel, anchorRef);

  const dropdownPanel = showPanel && panelStyle ? (
    <div
      ref={panelRef}
      role="listbox"
      style={panelStyle}
      className={`${dropdownClassName} ${catalogDesktopPanel} overflow-y-auto overscroll-y-contain py-2 shadow-[0_12px_40px_rgba(17,24,39,0.16)] scrollbar-hidden`}
    >
      {loading && !showRecent && !showPopular && !showItems ? (
        <p className="px-4 py-3 text-[13px] text-[#8E8E93]">Ищем подсказки…</p>
      ) : null}

      {showRecent ? (
        <section>
          <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-1">
            <p className="text-[12px] font-semibold text-[#8E8E93]">Вы искали</p>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                clearCatalogSearchRecent();
                setRecent([]);
              }}
              className="shrink-0 text-[12px] font-semibold text-[#F47C8C] transition hover:text-[#E2577A]"
            >
              Очистить
            </button>
          </div>
          {recentItems.map((item) => (
            <SuggestRow
              key={item.id}
              icon={<HiClock className="h-4 w-4" aria-hidden />}
              title={item.title}
              onClick={() => void applySelection(item)}
              onRemove={() => setRecent(removeCatalogSearchRecent(item.title))}
            />
          ))}
        </section>
      ) : null}

      {showPopular ? (
        <section className={showRecent ? 'mt-1 border-t border-[#F0F0F0] pt-1' : ''}>
          <p className="px-4 pb-1 pt-1 text-[12px] font-semibold text-[#8E8E93]">Часто ищут</p>
          {popular.map((item) => (
            <SuggestRow
              key={item.id}
              icon={<HiMagnifyingGlass className="h-4 w-4" aria-hidden />}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => void applySelection(item)}
            />
          ))}
        </section>
      ) : null}

      {showItems ? (
        <section className={showRecent || showPopular ? 'mt-1 border-t border-[#F0F0F0] pt-1' : ''}>
          {!value.trim() ? null : (
            <p className="px-4 pb-1 pt-1 text-[12px] font-semibold text-[#8E8E93]">Похожее</p>
          )}
          {items.map((item) => (
            <SuggestRow
              key={item.id}
              icon={<HiMagnifyingGlass className="h-4 w-4" aria-hidden />}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => void applySelection(item)}
            />
          ))}
        </section>
      ) : null}
    </div>
  ) : null;

  return (
    <div ref={wrapRef} className="relative z-20 min-w-0 flex-1">
      <label ref={anchorRef} className="relative block">
        <span className="sr-only">Поиск</span>
        <HiMagnifyingGlass className={iconClassName} aria-hidden />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          role="searchbox"
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setRecent(readCatalogSearchRecent());
            void loadSuggestions(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              setFocused(false);
            }
            if (e.key === 'Enter' && value.trim()) {
              pushCatalogSearchRecent(value);
              setRecent(readCatalogSearchRecent());
              void recordSearchQuery(value).catch(() => undefined);
              onSelect({ kind: 'text', text: value.trim() });
              setOpen(false);
            }
          }}
          className={inputClassName}
        />
        {trailing}
      </label>

      {typeof document !== 'undefined' && dropdownPanel
        ? createPortal(dropdownPanel, document.body)
        : null}
    </div>
  );
}
