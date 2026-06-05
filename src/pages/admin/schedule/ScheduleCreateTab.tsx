import { useState } from 'react';
import { scheduleTabContentPad } from './adminScheduleTheme';
import type { ScheduleTabMetrics } from './scheduleTabMetrics';
import type { WindowTemplate } from './scheduleTypes';
import { ScheduleCreateTabStats } from './ScheduleCreateTabStats';
import { WindowTemplateList } from './WindowTemplateList';
import { ScheduleMentalModelCard, ScheduleQuickSetup } from './ScheduleSetupHub';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';

type Props = {
  templates: WindowTemplate[];
  selectedTemplateId: string | null;
  createMetrics: ScheduleTabMetrics['create'];
  activeSlotCount: number;
  masterId: string | null | undefined;
  slotsLoadError?: string | null;
  onTemplateSelect: (id: string) => void;
  onTemplateMenu: (template: WindowTemplate) => void;
  onCreateTemplate: () => void;
  onOpenWithoutTemplate: () => void;
  onAddToday: () => void;
  onCreateWeek: () => void;
  onCreateMonth: () => void;
  onCreateFromSchedule: () => void;
};

export function ScheduleCreateTab({
  templates,
  selectedTemplateId,
  createMetrics,
  activeSlotCount,
  masterId,
  slotsLoadError,
  onTemplateSelect,
  onTemplateMenu,
  onCreateTemplate,
  onOpenWithoutTemplate,
  onAddToday,
  onCreateWeek,
  onCreateMonth,
  onCreateFromSchedule,
}: Props) {
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <div className={`${scheduleTabContentPad} w-full min-w-0 max-w-none max-lg:pb-[calc(3.5rem+1rem)]`}>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-5 lg:gap-6">
        {slotsLoadError ? (
          <p className="rounded-[16px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[14px] font-semibold text-[#92400E] lg:rounded-[20px]">
            {slotsLoadError}
          </p>
        ) : null}
        <header className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#111827] lg:text-[24px] lg:tracking-[-0.05em]">
                Расписание
              </h2>

            </div>
            <MasterPublicPreviewLink
              masterId={masterId}
              ready={activeSlotCount > 0}
              variant="secondary"
              className="shrink-0"
            />
          </div>
        </header>

        <ScheduleMentalModelCard
          activeSlotCount={activeSlotCount}
          hideEmptyHint={Boolean(slotsLoadError)}
          onCreateFirst={onCreateMonth}
        />

        <ScheduleQuickSetup
          onAddToday={onAddToday}
          onCreateWeek={onCreateWeek}
          onCreateMonth={onCreateMonth}
          onCreateFromSchedule={onCreateFromSchedule}
        />

        <ScheduleCreateTabStats metrics={createMetrics} />

        <section className="relative overflow-hidden rounded-[16px]">
          <img
            src={SCHEDULE_QUICK_SETUP_IMAGES.templatesBg}
            alt=""
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="relative z-10 p-3.5 sm:p-4">
            <button
              type="button"
              onClick={() => setTemplatesOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-[12px] bg-white/95 px-3.5 py-3 text-left ring-1 ring-white/80 sm:px-4"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#111827] sm:text-[15px]">
                  Шаблоны для быстрого создания
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280] sm:text-[13px]">
                  Шаблон сам по себе не открывает запись — он помогает быстрее создать реальные окна.
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-bold text-[#3B4CCA]">
                {templatesOpen ? 'Скрыть' : 'Показать'}
              </span>
            </button>
            {templatesOpen ? (
              <div className="mt-3 rounded-[12px] bg-white/96 p-3 ring-1 ring-white/80 sm:p-4">
                <WindowTemplateList
                  templates={templates}
                  selectedId={selectedTemplateId}
                  onSelect={onTemplateSelect}
                  onOpenMenu={onTemplateMenu}
                  onCreate={onCreateTemplate}
                  onOpenWithoutTemplate={onOpenWithoutTemplate}
                  fullWidth
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
