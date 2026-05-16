import { useState } from 'react';
import type { RepeatKind } from './scheduleTypes';

export type RepeatCount = 4 | 8 | 12;

type Props = {
  repeatKind: RepeatKind;
  onRepeatKindChange: (k: RepeatKind) => void;
  repeatCount: RepeatCount;
  onRepeatCountChange: (n: RepeatCount) => void;
};

const KIND_OPTIONS: { value: RepeatKind; label: string }[] = [
  { value: 'none', label: 'Не повторять' },
  { value: 'weekly', label: 'Каждую неделю' },
  { value: 'biweekly', label: 'Каждые 2 недели' },
  { value: 'weekdays', label: 'Каждый будний день' },
];

const COUNT_OPTIONS: RepeatCount[] = [4, 8, 12];

export function RepeatSettings({
  repeatKind,
  onRepeatKindChange,
  repeatCount,
  onRepeatCountChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const summary =
    repeatKind === 'none'
      ? 'Не повторять'
      : `${KIND_OPTIONS.find((o) => o.value === repeatKind)?.label ?? ''} · ${repeatCount} раз`;

  return (
    <section className="rounded-[22px] bg-[#FAFAFA] ring-1 ring-black/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div>
          <p className="text-[14px] font-semibold text-neutral-900">Повторять</p>
          <p className="mt-0.5 text-[12px] text-neutral-500">{summary}</p>
        </div>
        <span className="text-[18px] text-neutral-400" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-black/[0.05] px-4 pb-4 pt-3">
          <p className="text-[12px] leading-snug text-neutral-500">
            Повторение можно использовать, если график одинаковый каждую неделю
          </p>
          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onRepeatKindChange(o.value)}
                className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                  repeatKind === o.value
                    ? 'bg-[#E29595] text-white shadow-[0_6px_18px_rgba(226,149,149,0.22)]'
                    : 'bg-[#F1EFEF] text-neutral-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {repeatKind !== 'none' ? (
            <div>
              <p className="text-[12px] font-semibold text-neutral-500">Сколько раз</p>
              <div className="mt-2 flex gap-2">
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onRepeatCountChange(n)}
                    className={`flex-1 rounded-[16px] py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
                      repeatCount === n
                        ? 'bg-[#E29595] text-white'
                        : 'bg-[#F1EFEF] text-neutral-700'
                    }`}
                  >
                    {n} раз
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
