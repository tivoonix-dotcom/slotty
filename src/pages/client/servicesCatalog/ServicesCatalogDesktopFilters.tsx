import {
  catalogDesktopChipActive,
  catalogDesktopChipIdle,
  catalogDesktopSectionLabel,
} from './servicesCatalogTheme';

type Chip = { id: string; label: string };

type Props = {
  chips: Chip[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
};

export function ServicesCatalogDesktopFilters({ chips, activeIds, onToggle, onClear }: Props) {
  const hasActive = activeIds.size > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className={catalogDesktopSectionLabel}>Быстрые фильтры</p>
        {hasActive ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[13px] font-semibold text-[#F47C8C] transition hover:opacity-80"
          >
            Сбросить
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        {chips.map((c) => {
          const on = activeIds.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={`rounded-[14px] px-3.5 py-2.5 text-left text-[14px] font-semibold transition ${
                on ? catalogDesktopChipActive : catalogDesktopChipIdle
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
