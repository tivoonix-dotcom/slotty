import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminBottomSheet } from '../../shared/AdminBottomSheet';
import { SettingsIconRail } from './SettingsIconRail';
import { SettingsSidebar } from './SettingsSidebar';
import { SETTINGS_WORKSPACE_BG } from './settingsWorkspaceTheme';

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsLayout() {
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  return (
    <div className={`flex min-h-dvh ${SETTINGS_WORKSPACE_BG} text-[#111827]`}>
      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <SettingsIconRail />
      </div>

      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <SettingsSidebar search={search} onSearchChange={setSearch} />
      </div>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-[56px] items-center gap-3 border-b border-[#eef0f5] bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-[12px] bg-[#F3F4F6] text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/40"
            aria-label="Открыть меню настроек"
            aria-expanded={sidebarOpen}
          >
            <IconMenu />
          </button>
          <p className="truncate text-[17px] font-bold">Настройки</p>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-3xl min-w-0 pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminBottomSheet open={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Настройки">
        <div className="-mx-1 flex max-h-[min(70dvh,520px)] flex-col">
          <SettingsSidebar
            search={search}
            onSearchChange={setSearch}
            onNavigate={() => setSidebarOpen(false)}
            className="!w-full !max-h-[min(70dvh,520px)] !border-0"
          />
        </div>
      </AdminBottomSheet>
    </div>
  );
}
