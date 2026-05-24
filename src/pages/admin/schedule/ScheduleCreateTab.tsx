import type { ReactNode } from 'react';
import { HiPlus } from 'react-icons/hi2';
import { scheduleTabScrollBottomPad, scheduleTemplatesTray } from './adminScheduleTheme';
import type { WindowTemplate } from './scheduleTypes';
import { secondaryBtnClass } from './scheduleUi';
import { WindowTemplateList } from './WindowTemplateList';

type Props = {
  templates: WindowTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string) => void;
  onTemplateMenu: (template: WindowTemplate) => void;
  onCreateTemplate: () => void;
  onOpenWithoutTemplate: () => void;
  /** Блок «Идеи для акций» — на desktop справа. */
  aside?: ReactNode;
};

export function ScheduleCreateTab({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onTemplateMenu,
  onCreateTemplate,
  onOpenWithoutTemplate,
  aside,
}: Props) {
  return (
    <div className={`${scheduleTabScrollBottomPad}`}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
            <p className="max-w-[36rem] text-[14px] font-semibold leading-relaxed text-[#6B7280]">
              Нажмите на шаблон или{' '}
              <span className="font-black text-[#ff5f7a]">+</span> внизу справа — откроется форма
              нового окна.
            </p>
            <button
              type="button"
              onClick={onOpenWithoutTemplate}
              className="shrink-0 rounded-[14px] border border-[#FDE8ED] bg-[#FFF1F4] px-4 py-2.5 text-[13px] font-bold text-[#ff5f7a] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
            >
              Без шаблона
            </button>
          </div>

          <div className={scheduleTemplatesTray}>
            <WindowTemplateList
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={onTemplateSelect}
              onOpenMenu={onTemplateMenu}
              onCreate={onCreateTemplate}
            />
          </div>

          <div className="space-y-2.5 lg:hidden">
            <button type="button" className={secondaryBtnClass} onClick={onOpenWithoutTemplate}>
              Без шаблона — указать время вручную
            </button>
            <p className="text-center text-[12px] font-semibold text-[#9CA3AF]">
              Или кнопка{' '}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] align-middle text-white">
                <HiPlus className="h-3.5 w-3.5 stroke-[3px]" aria-hidden />
              </span>{' '}
              внизу справа
            </p>
          </div>
        </div>

        {aside ? (
          <aside className="mt-4 hidden lg:mt-0 lg:block lg:sticky lg:top-[calc(var(--slotty-admin-desktop-topbar-h,4.75rem)+6.5rem)] lg:max-h-[calc(100dvh-var(--slotty-admin-desktop-topbar-h,4.75rem)-8rem)] lg:overflow-y-auto">
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
