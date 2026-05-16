import { useMemo, useState } from 'react';
import type { WindowTemplate } from './scheduleTypes';
import { templateDisplayLabel } from './scheduleUtils';
import { WindowTemplateCard } from './WindowTemplateCard';

const SEARCH_THRESHOLD = 5;

type Props = {
  templates: WindowTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export function WindowTemplateList({ templates, selectedId, onSelect, onCreate }: Props) {
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
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-neutral-950">Шаблоны окон</h3>
          <p className="mt-1 text-[13px] leading-snug text-neutral-500">
            Создай шаблоны для частых услуг и добавляй окна быстрее
          </p>
        </div>
        {templates.length > 0 ? (
          <span className="shrink-0 rounded-full bg-[#F1EFEF] px-2.5 py-1 text-[12px] font-semibold text-neutral-600">
            {countLabel}
          </span>
        ) : null}
      </div>

      {templates.length === 0 ? (
        <p className="rounded-[20px] bg-[#F1EFEF] px-4 py-3 text-[13px] font-medium text-neutral-600">
          Шаблонов пока нет. Создай первый шаблон для своей услуги.
        </p>
      ) : null}

      {showSearch ? (
        <label className="block">
          <span className="sr-only">Поиск шаблона</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти шаблон…"
            className="w-full rounded-[16px] border border-[#E8E4E4] bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 outline-none ring-[#E29595]/30 placeholder:text-neutral-400 focus:border-[#E29595] focus:ring-2"
          />
        </label>
      ) : null}

      {templates.length > 0 ? (
        <div className="space-y-2.5">
          <div role="list" aria-label="Шаблоны окон">
            {filtered.length === 0 ? (
              <p className="rounded-[20px] bg-[#F1EFEF] px-4 py-3 text-[13px] font-medium text-neutral-600">
                Ничего не найдено. Попробуйте другой запрос.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filtered.map((t) => (
                  <WindowTemplateCard
                    key={t.id}
                    template={t}
                    selected={selectedId === t.id}
                    onSelect={() => onSelect(t.id)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#E29595]/50 bg-white px-4 py-3 text-[14px] font-semibold text-[#C97B7B] transition active:scale-[0.98]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF5F5] text-[20px] leading-none">
              +
            </span>
            Создать шаблон
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#E29595]/50 bg-white px-4 py-3.5 text-[14px] font-semibold text-[#C97B7B] transition active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5F5] text-[22px] leading-none">
            +
          </span>
          Создать шаблон
        </button>
      )}
    </section>
  );
}
