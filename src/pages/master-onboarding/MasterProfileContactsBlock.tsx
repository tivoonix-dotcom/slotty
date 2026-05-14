import type { ReactNode } from 'react';
import {
  CONTACT_CHANNEL_META,
  canAddContactChannel,
  type ContactType,
  type MasterContactRow,
} from '../../features/master-onboarding/model/masterContacts';

const rowFieldClass = `
  mt-1.5
  w-full
  rounded-[24px]
  bg-white
  px-4
  py-3.5
  text-[16px]
  font-semibold
  text-neutral-950
  outline-none
  ring-0
  placeholder:text-neutral-400
  transition
  focus:shadow-[0_10px_28px_rgba(17,17,17,0.05)]
`;

function ContactChannelIcon({ type, className }: { type: ContactType; className: string }): ReactNode {
  const cls = className;
  switch (type) {
    case 'telegram':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="m22 2-7 20-4-9-9-4Z" strokeLinejoin="round" />
          <path d="M22 2 11 13" strokeLinecap="round" />
        </svg>
      );
    case 'viber':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path
            d="M10.5 4.5c-3.5 0-6.5 2.6-6.5 6.2 0 1.4.4 2.7 1.1 3.8L4 20l5.7-1.5c1 .6 2.2 1 3.5 1 3.6 0 6.8-2.8 6.8-6.5 0-3.4-3.2-6.5-7.5-6.5Z"
            strokeLinejoin="round"
          />
          <path d="M9.5 9.5h.01M12 9.5h.01M14.5 9.5h.01" strokeLinecap="round" strokeWidth="2" />
        </svg>
      );
    case 'vk':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path
            d="M16 8c1.5 1.2 2.5 3 2.5 5.2 0 3.7-3 6.8-6.8 6.8a6.8 6.8 0 0 1-6.8-6.8c0-3.8 3-6.8 6.8-6.8 1.4 0 2.7.4 3.8 1.1"
            strokeLinecap="round"
          />
          <path d="M8 16c2-2 6-2 8 0M9 10h.01M15 10h.01" strokeLinecap="round" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M17.5 6.5h.01" strokeLinecap="round" strokeWidth="2.5" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path
            d="M12 3c4.97 0 9 3.58 9 8 0 2.4-1.2 4.5-3 5.9L21 21l-4.3-1.1A8.9 8.9 0 0 1 12 19c-4.97 0-9-3.58-9-8s4.03-8 9-8Z"
            strokeLinejoin="round"
          />
          <path d="M9.5 10.5h.01M12 12.5h.01M14.5 10.5h.01" strokeLinecap="round" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M10 13a5 5 0 0 0 7.07 0l1.42-1.42a5 5 0 0 0-7.07-7.07L9 5" strokeLinecap="round" />
          <path d="m14 11-5 5" strokeLinecap="round" />
          <path d="M14 17H7a2 2 0 0 1-2-2v0" strokeLinecap="round" />
        </svg>
      );
  }
}

type Props = {
  rows: MasterContactRow[];
  onAdd: (type: ContactType) => void;
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onBlurRow: (id: string) => void;
  rowErrors: Record<string, string>;
  showRowError: (id: string) => boolean;
};

export function MasterProfileContactsBlock({
  rows,
  onAdd,
  onChange,
  onRemove,
  onBlurRow,
  rowErrors,
  showRowError,
}: Props) {
  return (
    <div className="mt-7 space-y-4">
      <div>
        <p className="text-[13px] font-semibold text-neutral-500">Контакты для клиентов</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {CONTACT_CHANNEL_META.map((ch) => {
            const present = !canAddContactChannel(rows, ch.type);
            const addBlocked = ch.type === 'other' ? !canAddContactChannel(rows, 'other') : present;
            return (
              <button
                key={ch.type}
                type="button"
                disabled={addBlocked}
                onClick={() => {
                  if (!canAddContactChannel(rows, ch.type)) return;
                  onAdd(ch.type);
                }}
                className={`min-h-10 rounded-full px-3 text-[12px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                  present
                    ? 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)]'
                    : 'bg-[#F1EFEF] text-neutral-600'
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-neutral-400">Добавьте удобные способы связи</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const meta = CONTACT_CHANNEL_META.find((c) => c.type === row.type)!;
            const err = rowErrors[row.id];
            const showErr = showRowError(row.id) && err;
            return (
              <li
                key={row.id}
                className="flex gap-2 rounded-[26px] bg-[#F1EFEF] p-3 sm:gap-3 sm:p-3.5"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-white text-neutral-500 shadow-[0_4px_14px_rgba(17,17,17,0.06)]"
                  aria-hidden
                >
                  <ContactChannelIcon type={row.type} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-neutral-600">{meta.label}</p>
                  <input
                    value={row.value}
                    onChange={(e) => onChange(row.id, e.target.value)}
                    onBlur={() => onBlurRow(row.id)}
                    placeholder={meta.placeholder}
                    maxLength={row.type === 'other' ? 200 : 460}
                    className={rowFieldClass}
                  />
                  {showErr ? <p className="mt-1 text-[12px] font-medium text-red-600">{err}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full bg-white text-[18px] font-semibold text-neutral-400 shadow-[0_4px_12px_rgba(17,17,17,0.05)] transition hover:text-neutral-700 active:scale-[0.96]"
                  aria-label={`Удалить ${meta.label}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
