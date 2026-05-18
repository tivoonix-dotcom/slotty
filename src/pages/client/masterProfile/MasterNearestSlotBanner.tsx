import { HiClock } from 'react-icons/hi2';
import { clientPinkBtn } from '../clientTheme';
import type { NearestSlotInfo } from './types';

type Props = {
  nearest: NearestSlotInfo | null;
  loading?: boolean;
  onChooseTime: () => void;
};

export function MasterNearestSlotBanner({ nearest, loading, onChooseTime }: Props) {
  const hasSlot = Boolean(nearest?.label);

  return (
    <section
      className={`mt-5 flex items-center gap-3 rounded-[22px] px-4 py-3.5 ${
        hasSlot
          ? 'bg-gradient-to-r from-[#FFF1F4] to-[#FFE8EE]'
          : 'bg-[#FAFAFA]'
      }`}
    >
      <HiClock className={`h-6 w-6 shrink-0 ${hasSlot ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#111827]">
          {loading
            ? 'Ищем ближайшее окно…'
            : hasSlot
              ? `Ближайшее окно: ${nearest!.label.toLowerCase()}`
              : 'Свободных окон пока нет'}
        </p>
      </div>
      <button
        type="button"
        onClick={onChooseTime}
        className={`${clientPinkBtn} shrink-0 !min-h-10 !px-4 !text-[13px]`}
      >
        {hasSlot ? 'Выбрать время' : 'Услуги'}
      </button>
    </section>
  );
}
