import { HiEllipsisVertical } from 'react-icons/hi2';
import type { WindowTemplate } from './scheduleTypes';
import { formatDurationRu, templateDisplayLabel } from './scheduleUtils';

type Props = {
  template: WindowTemplate;
  selected: boolean;
  onSelect: () => void;
  onOpenMenu?: () => void;
  compact?: boolean;
  hideMenu?: boolean;
};

export function WindowTemplateCard({
  template,
  selected,
  onSelect,
  onOpenMenu,
  compact = false,
  hideMenu = false,
}: Props) {
  const label = templateDisplayLabel(template);
  const showServiceSubtitle =
    Boolean(template.title?.trim()) &&
    template.title.trim() !== template.serviceName &&
    template.serviceName !== label;

  return (
    <div
      className={`relative rounded-[20px] border-2 bg-white shadow-[0_4px_14px_rgba(17,24,39,0.04)] transition hover:border-[#FDE8ED] ${
        compact ? 'min-h-[5.5rem] lg:min-h-[6.25rem]' : 'min-h-[5.75rem]'
      } ${
        selected
          ? 'border-[#ff5f7a] bg-[#FFF9FB] shadow-[0_8px_24px_rgba(255,95,122,0.18)] ring-2 ring-[#ff5f7a]/15'
          : 'border-[#EAECEF]'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex h-full w-full flex-col gap-1.5 rounded-[18px] p-3 text-left active:scale-[0.98] ${hideMenu ? '' : 'pr-10'}`}
      >
        <span
          className="h-1.5 w-8 rounded-full"
          style={{ backgroundColor: template.accent }}
          aria-hidden
        />
        <span className="line-clamp-2 text-[13px] font-bold leading-snug text-[#111827] lg:text-[14px]">
          {label}
        </span>
        {showServiceSubtitle ? (
          <span className="line-clamp-1 text-[11px] font-semibold text-[#6B7280]">{template.serviceName}</span>
        ) : null}
        <span className="text-[11px] font-bold text-[#ff5f7a]">{formatDurationRu(template.durationMinutes)}</span>
      </button>
      {!hideMenu && onOpenMenu ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenMenu();
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-[12px] text-[#9CA3AF] transition hover:bg-[#f6f7fb] hover:text-[#6B7280] active:scale-[0.95]"
          aria-label={`Действия: ${label}`}
        >
          <HiEllipsisVertical className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
