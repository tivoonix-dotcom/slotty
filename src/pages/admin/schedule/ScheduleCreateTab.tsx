import type { WindowTemplate } from './scheduleTypes';
import { primaryBtnClass, secondaryBtnClass } from './scheduleUi';
import { WindowTemplateList } from './WindowTemplateList';

type Props = {
  templates: WindowTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string) => void;
  onCreateTemplate: () => void;
  onOpenNewWindow: () => void;
  onOpenWithoutTemplate: () => void;
};

export function ScheduleCreateTab({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onCreateTemplate,
  onOpenNewWindow,
  onOpenWithoutTemplate,
}: Props) {
  return (
    <div className="space-y-5">
      <WindowTemplateList
        templates={templates}
        selectedId={selectedTemplateId}
        onSelect={onTemplateSelect}
        onCreate={onCreateTemplate}
      />

      <div className="space-y-2.5">
        <button type="button" className={primaryBtnClass} onClick={onOpenNewWindow}>
          <span className="mr-2 text-[20px] leading-none" aria-hidden>
            +
          </span>
          Новое окно
        </button>
        <button type="button" className={secondaryBtnClass} onClick={onOpenWithoutTemplate}>
          Без шаблона — указать время вручную
        </button>
      </div>
    </div>
  );
}
