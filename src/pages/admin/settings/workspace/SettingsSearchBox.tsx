import { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SettingsSearchBox({ value, onChange, placeholder = 'Поиск настроек' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative px-3 pb-2 pt-1">
      <svg
        className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" strokeWidth="1.75" />
        <path d="m21 21-4.35-4.35" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[12px] border border-[#EAECEF] bg-[#FAFAFA] py-2.5 pl-10 pr-16 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#ff5f7a]/40 focus:bg-white focus:ring-2 focus:ring-[#ff5f7a]/15"
        aria-label={placeholder}
      />
      <kbd className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#EAECEF] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#9CA3AF] sm:inline">
        ⌘K
      </kbd>
    </div>
  );
}
