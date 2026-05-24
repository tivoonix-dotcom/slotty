import { Outlet } from 'react-router-dom';
import { SettingsSectionTabs } from './SettingsSectionTabs';

export function AdminSettingsLayout() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-10 pt-1 lg:max-w-4xl lg:pt-2">
      <div>
        <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-[-0.04em] text-[#111827]">
          Настройки
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
          Вход в аккаунт, связь с поддержкой и юридические документы.
        </p>
      </div>
      <SettingsSectionTabs />
      <Outlet />
    </div>
  );
}
