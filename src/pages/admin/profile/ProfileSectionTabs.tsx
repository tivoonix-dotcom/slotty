import { CabinetIcon, type CabinetIconName } from './cabinetIcons';

export type ProfileSectionId = 'main' | 'address' | 'portfolio' | 'rules';

const TABS: Array<{ id: ProfileSectionId; label: string; icon: CabinetIconName }> = [
  { id: 'main', label: 'Профиль', icon: 'user' },
  { id: 'portfolio', label: 'Портфолио', icon: 'photo' },
  { id: 'address', label: 'Адрес', icon: 'map-pin' },
  { id: 'rules', label: 'Правила', icon: 'rules' },
];

type Props = {
  active: ProfileSectionId;
  onChange: (section: ProfileSectionId) => void;
  className?: string;
};

/** Вкладки профиля: иконка + текст, на всю ширину, розовая линия у активной (как в макете кабинета). */
export function ProfileSectionTabs({ active, onChange, className = '' }: Props) {
  return (
    <nav
      className={`flex w-full border-t border-[#eef0f5] ${className}`.trim()}
      aria-label="Разделы профиля"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 px-1 pb-3.5 pt-3.5 transition active:scale-[0.98] ${
              selected ? 'text-[#ff5f7a]' : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            <CabinetIcon
              name={tab.icon}
              size={18}
              className={selected ? 'text-[#ff5f7a]' : 'text-[#9CA3AF]'}
            />
            <span className="truncate text-[13px] font-semibold sm:text-[14px]">{tab.label}</span>
            {selected ? (
              <span
                className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
