type Mode = 'template' | 'manual';

type Props = {
  mode: Mode;
  onTemplate: () => void;
  onManual: () => void;
};

export function AddWindowModeSwitch({ mode, onTemplate, onManual }: Props) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-[18px] border border-[#EAECEF] bg-[#f6f7fb] p-1"
      role="tablist"
      aria-label="Способ создания окна"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'template'}
        onClick={onTemplate}
        className={`rounded-[14px] px-3 py-2.5 text-[13px] font-bold transition active:scale-[0.98] ${
          mode === 'template'
            ? 'bg-white text-[#ff5f7a] shadow-[0_4px_14px_rgba(255,95,122,0.15)] ring-1 ring-[#FDE8ED]'
            : 'text-[#6B7280] hover:text-[#374151]'
        }`}
      >
        По шаблону
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'manual'}
        onClick={onManual}
        className={`rounded-[14px] px-3 py-2.5 text-[13px] font-bold transition active:scale-[0.98] ${
          mode === 'manual'
            ? 'bg-white text-[#ff5f7a] shadow-[0_4px_14px_rgba(255,95,122,0.15)] ring-1 ring-[#FDE8ED]'
            : 'text-[#6B7280] hover:text-[#374151]'
        }`}
      >
        Вручную
      </button>
    </div>
  );
}
