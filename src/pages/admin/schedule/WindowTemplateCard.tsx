import type { WindowTemplate } from './scheduleTypes';
import { formatDurationRu } from './scheduleUtils';

type Props = {
  template: WindowTemplate;
  selected: boolean;
  onSelect: () => void;
};

export function WindowTemplateCard({ template, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-[9.5rem] shrink-0 flex-col gap-2 rounded-[22px] border-2 p-3.5 text-left transition active:scale-[0.98] ${
        selected
          ? 'border-[#E29595] bg-[#FFF5F5] shadow-[0_8px_24px_rgba(226,149,149,0.18)]'
          : 'border-transparent bg-[#F1EFEF]'
      }`}
    >
      <span
        className="h-2 w-8 rounded-full"
        style={{ backgroundColor: template.accent }}
        aria-hidden
      />
      <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-900">
        {template.serviceName}
      </span>
      <span className="text-[12px] font-medium text-neutral-500">
        {formatDurationRu(template.durationMinutes)}
      </span>
    </button>
  );
}
