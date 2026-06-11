import type { FC } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import { catalogSheetField, catalogSheetLabel } from '../admin/shared/adminCatalogSheetTheme';
import { masterDemoFieldActiveSchedule } from './homeLandingMasterDemoTheme';

export const MASTER_LANDING_SCHEDULE_DEMO_SERVICES = [
  { id: 'manicure', label: 'Маникюр с покрытием' },
  { id: 'pedicure', label: 'Педикюр классический' },
  { id: 'gel', label: 'Гель-лак' },
] as const;

export type MasterLandingScheduleDemoServiceId =
  (typeof MASTER_LANDING_SCHEDULE_DEMO_SERVICES)[number]['id'];

export const MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID: MasterLandingScheduleDemoServiceId =
  'manicure';

export function masterLandingScheduleDemoServiceLabel(
  serviceId: MasterLandingScheduleDemoServiceId | null,
): string {
  if (!serviceId) return '';
  return (
    MASTER_LANDING_SCHEDULE_DEMO_SERVICES.find((item) => item.id === serviceId)?.label ?? ''
  );
}

type Props = {
  open: boolean;
  selectedId: MasterLandingScheduleDemoServiceId | null;
  triggerActive?: boolean;
  highlightedOptionId?: MasterLandingScheduleDemoServiceId | null;
  optionPressing?: boolean;
};

export const MasterLandingScheduleDemoServiceSelect: FC<Props> = ({
  open,
  selectedId,
  triggerActive = false,
  highlightedOptionId = null,
  optionPressing = false,
}) => {
  const selectedLabel = masterLandingScheduleDemoServiceLabel(selectedId);

  return (
    <div className="block">
      <p className={`${catalogSheetLabel} !text-[11px]`}>Услуга</p>
      <div
        data-master-demo-service
        className={`${catalogSheetField} mt-1 flex !min-h-0 items-center justify-between gap-2 !py-2 !text-[13px] ${
          triggerActive || open ? masterDemoFieldActiveSchedule : ''
        }`}
      >
        <span className="min-w-0 truncate">
          {selectedLabel ? selectedLabel : <span className="text-[#8E8E93]">Выберите услугу</span>}
        </span>
        <HiChevronDown
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </div>

      {open ? (
        <div
          className="mt-1.5 overflow-hidden rounded-[10px] bg-white p-1 shadow-[0_8px_24px_rgba(17,24,39,0.1)] ring-1 ring-[#EAECEF]"
          data-master-demo="service-dropdown"
        >
          {MASTER_LANDING_SCHEDULE_DEMO_SERVICES.map((option) => {
            const selected = selectedId === option.id;
            const highlighted = highlightedOptionId === option.id;
            return (
              <div
                key={option.id}
                data-master-demo={`service-option-${option.id}`}
                className={[
                  'rounded-[8px] px-2.5 py-2 text-[12px] font-medium leading-snug transition',
                  selected
                    ? 'bg-[#EEF0FC] font-semibold text-[#3B4CCA]'
                    : 'text-[#374151]',
                  highlighted && !selected ? 'bg-[#F6F7FB]' : '',
                  highlighted && optionPressing ? 'scale-[0.98]' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
