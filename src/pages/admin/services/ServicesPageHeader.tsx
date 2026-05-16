import type { ServicesTabId } from './servicesTypes';
import { SERVICES_TAB_SUBTITLES } from './servicesTypes';

type Props = {
  activeTab: ServicesTabId;
};

export function ServicesPageHeader({ activeTab }: Props) {
  return (
    <header className="pb-4">
      <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#111827]">Услуги</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280]">
        {SERVICES_TAB_SUBTITLES[activeTab]}
      </p>
    </header>
  );
}
