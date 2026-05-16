import type { WindowTemplate } from './scheduleTypes';
import { WindowTemplateCard } from './WindowTemplateCard';

type Props = {
  templates: WindowTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export function WindowTemplateList({ templates, selectedId, onSelect, onCreate }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-neutral-950">Шаблоны окон</h3>
        <p className="mt-1 text-[13px] leading-snug text-neutral-500">
          Создай шаблоны для частых услуг и добавляй окна быстрее
        </p>
      </div>

      {templates.length === 0 ? (
        <p className="rounded-[20px] bg-[#F1EFEF] px-4 py-3 text-[13px] font-medium text-neutral-600">
          Шаблонов пока нет. Создай первый шаблон для своей услуги.
        </p>
      ) : null}

      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {templates.map((t) => (
          <WindowTemplateCard
            key={t.id}
            template={t}
            selected={selectedId === t.id}
            onSelect={() => onSelect(t.id)}
          />
        ))}
        <button
          type="button"
          onClick={onCreate}
          className="flex w-[9.5rem] shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[#E29595]/50 bg-white p-3.5 text-[14px] font-semibold text-[#C97B7B] transition active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF5F5] text-[22px] leading-none">
            +
          </span>
          Создать шаблон
        </button>
      </div>
    </section>
  );
}
