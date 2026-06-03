import { useMemo, useState } from 'react';
import { HiMagnifyingGlass, HiPlus } from 'react-icons/hi2';
import { catalogSheetField } from '../shared/adminCatalogSheetTheme';
import {
  scheduleTemplateAddBtn,
  scheduleTemplateCellWrap,
  scheduleTemplatesGridFull,
  scheduleTemplatesTray,
} from './adminScheduleTheme';
import type { WindowTemplate } from './scheduleTypes';
import { templateDisplayLabel } from './scheduleUtils';
import { scheduleCabinetSecondaryBtn } from './scheduleUi';
import { WindowTemplateCard } from './WindowTemplateCard';

const SEARCH_THRESHOLD = 5;

const schedulePrimaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#ff5f7a] px-4 py-2.5 text-[14px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]';

type Props = {
  templates: WindowTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenMenu: (template: WindowTemplate) => void;
  onCreate: () => void;
  onOpenWithoutTemplate: () => void;
  fullWidth?: boolean;
};

export function WindowTemplateList({
  templates,
  selectedId,
  onSelect,
  onOpenMenu,
  onCreate,
  onOpenWithoutTemplate,
  fullWidth = false,
}: Props) {
  const [query, setQuery] = useState('');
  const showSearch = templates.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      const haystack = `${templateDisplayLabel(t)} ${t.serviceName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, templates]);

  const countLabel =
    templates.length === 1 ? '1 шаблон' : `${templates.length} ${templates.length < 5 ? 'шаблона' : 'шаблонов'}`;

  const gridClass = fullWidth
    ? scheduleTemplatesGridFull
    : 'grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3';

  const cellWrapClass = fullWidth ? scheduleTemplateCellWrap : 'w-full min-w-0';

  return (
    <section className="w-full min-w-0 space-y-4 lg:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Шаблоны окон
          </h3>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {templates.length > 0 ? (
            <span className="rounded-full bg-[#EBEBEB] px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]">
              {countLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onOpenWithoutTemplate}
            className={`${scheduleCabinetSecondaryBtn} !w-auto max-w-full shrink px-3 py-2.5 text-left text-[13px] leading-snug sm:max-w-none sm:px-4 sm:text-[14px]`}
          >
            Без шаблона — указать время вручную
          </button>
          <button type="button" onClick={onCreate} className={schedulePrimaryBtn}>
            <HiPlus className="h-5 w-5" aria-hidden />
            Новый шаблон
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="w-full rounded-[18px] bg-[#F6F7FB] px-4 py-10 text-center lg:py-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#FFF1F4] text-[#ff5f7a]">
            <HiPlus className="h-7 w-7" aria-hidden />
          </span>
          <p className="mt-4 text-[16px] font-bold text-[#111827]">Пока нет шаблонов</p>
          <p className="mx-auto mt-2 max-w-[18rem] text-[14px] font-medium leading-snug text-[#6B7280]">
            Нажмите «Новый шаблон» или «Без шаблона» выше
          </p>
        </div>
      ) : null}

      {templates.length > 0 ? (
        <div className="w-full min-w-0 space-y-3 lg:space-y-4">
          {showSearch ? (
            <label className="relative block w-full max-w-md">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Найти шаблон…"
                className={`${catalogSheetField} border-0 bg-[#EBEBEB] pl-11 focus:bg-[#E4E4E4]`}
              />
            </label>
          ) : null}

          <div className="w-full min-w-0" role="list" aria-label="Шаблоны окон">
            {filtered.length === 0 ? (
              <p className="rounded-[12px] bg-[#EBEBEB] px-4 py-3 text-center text-[13px] font-medium text-[#6B7280]">
                Ничего не найдено
              </p>
            ) : (
              <div
                className={`w-full min-w-0 ${scheduleTemplatesTray} max-lg:bg-transparent max-lg:p-0 max-lg:ring-0`}
              >
                <div className={gridClass}>
                  {filtered.map((t) => (
                    <div key={t.id} className={cellWrapClass}>
                      <WindowTemplateCard
                        template={t}
                        selected={selectedId === t.id}
                        onSelect={() => onSelect(t.id)}
                        onOpenMenu={() => onOpenMenu(t)}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={onCreate} className={scheduleTemplateAddBtn}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-[#ff5f7a]">
                      <HiPlus className="h-5 w-5" aria-hidden />
                    </span>
                    <span>Добавить</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
