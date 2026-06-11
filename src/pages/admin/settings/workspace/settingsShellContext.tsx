import { createContext, useContext } from 'react';

type SettingsShellContextValue = {
  openSettingsMenu: () => void;
};

const SettingsShellContext = createContext<SettingsShellContextValue | null>(null);

export function SettingsShellProvider({
  openSettingsMenu,
  children,
}: {
  openSettingsMenu: () => void;
  children: React.ReactNode;
}) {
  return (
    <SettingsShellContext.Provider value={{ openSettingsMenu }}>
      {children}
    </SettingsShellContext.Provider>
  );
}

export function useSettingsShell(): SettingsShellContextValue | null {
  return useContext(SettingsShellContext);
}
