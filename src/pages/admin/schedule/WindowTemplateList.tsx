import { useMemo, useState } from 'react';
import { HiMagnifyingGlass, HiPlus } from 'react-icons/hi2';
import { scheduleInput } from './scheduleUi';
import type { WindowTemplate } from './scheduleTypes';
import { templateDisplayLabel } from './scheduleUtils';
import { WindowTemplateCard } from './WindowTemplateCard';

const SEARCH_THRESHOLD = 5;

type Props = {
  templates: WindowTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenMenu: (template: WindowTemplate) => void;
  onCreate: () => void;
};

export function WindowTemplateList({ templates, selectedId, onSelect, onOpenMenu, onCreate }: Props) {
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

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-black tracking-[-0.04em] text-[#111827] lg:text-[20px]">
            Шаблоны окон
          </h3>
          <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#6B7280] lg:text-[14px]">
            Тап по шаблону — сразу форма окна с услугой и временем
          </p>
        </div>
        {templates.length > 0 ? (
          <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[12px] font-bold text-[#ff5f7a]">
            {countLabel}
          </span>
        ) : null}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#FDE8ED] bg-white px-4 py-6 text-center">
          <p className="text-[14px] font-semibold text-[#6B7280]">
            Шаблонов пока нет — создайте первый для частой услуги
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,95,122,0.3)]"
          >
            <HiPlus className="h-5 w-5" aria-hidden />
            Создать шаблон
          </button>
        </div>
      ) : null}

      {showSearch ? (
        <label className="relative block">
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти шаблон…"
            className={`${scheduleInput} pl-11`}
          />
        </label>
      ) : null}

      {templates.length > 0 ? (
        <>
          <div role="list" aria-label="Шаблоны окон">
            {filtered.length === 0 ? (
              <p className="rounded-[16px] bg-white px-4 py-3 text-[13px] font-semibold text-[#6B7280]">
                Ничего не найдено
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 lg:gap-3 xl:grid-cols-3">
                {filtered.map((t) => (
                  <WindowTemplateCard
                    key={t.id}
                    template={t}
                    selected={selectedId === t.id}
                    onSelect={() => onSelect(t.id)}
                    onOpenMenu={() => onOpenMenu(t)}
                    compact
                  />
                ))}
                <button
                  type="button"
                  onClick={onCreate}
                  className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-[#FDE8ED] bg-white text-[13px] font-bold text-[#ff5f7a] transition hover:border-[#ff5f7a]/40 hover:bg-[#FFF9FB] active:scale-[0.98] lg:min-h-[6.25rem]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF1F4]">
                    <HiPlus className="h-5 w-5" aria-hidden />
                  </span>
                  <span>Шаблон</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
