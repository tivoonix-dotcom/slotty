import { HiLink } from 'react-icons/hi2';
import { SiInstagram, SiTelegram, SiViber, SiVk, SiWhatsapp } from 'react-icons/si';
import {
  CONTACT_CHANNEL_META,
  canAddContactChannel,
  type ContactType,
  type MasterContactRow,
} from '../../features/master-onboarding/model/masterContacts';

/** Компактное поле контакта: на всю ширину колонки, placeholder мельче, чтобы длинные подсказки помещались. */
const contactInputClass = `
  w-full min-w-0
  rounded-[18px]
  bg-white
  px-3 py-2.5
  text-[15px] font-semibold
  text-neutral-950
  outline-none ring-0
  placeholder:text-[12px] placeholder:font-medium placeholder:leading-snug placeholder:text-neutral-400
  sm:px-3.5 sm:placeholder:text-[13px]
  transition
  focus:shadow-[0_8px_22px_rgba(17,17,17,0.06)]
`;

function ContactChannelBrandIcon({
  type,
  className,
  tone = 'brand',
}: {
  type: ContactType;
  className: string;
  tone?: 'brand' | 'onAccent';
}) {
  const cls = `${className} shrink-0`;
  if (tone === 'onAccent') {
    switch (type) {
      case 'telegram':
        return <SiTelegram className={`${cls} text-white`} aria-hidden title="Telegram" />;
      case 'viber':
        return <SiViber className={`${cls} text-white`} aria-hidden title="Viber" />;
      case 'vk':
        return <SiVk className={`${cls} text-white`} aria-hidden title="VK" />;
      case 'instagram':
        return <SiInstagram className={`${cls} text-white`} aria-hidden title="Instagram" />;
      case 'whatsapp':
        return <SiWhatsapp className={`${cls} text-white`} aria-hidden title="WhatsApp" />;
      default:
        return <HiLink className={`${cls} text-white`} aria-hidden title="Другое" />;
    }
  }
  switch (type) {
    case 'telegram':
      return <SiTelegram className={`${cls} text-[#229ED9]`} aria-hidden title="Telegram" />;
    case 'viber':
      return <SiViber className={`${cls} text-[#665CAC]`} aria-hidden title="Viber" />;
    case 'vk':
      return <SiVk className={`${cls} text-[#0077FF]`} aria-hidden title="VK" />;
    case 'instagram':
      return <SiInstagram className={`${cls} text-[#E4405F]`} aria-hidden title="Instagram" />;
    case 'whatsapp':
      return <SiWhatsapp className={`${cls} text-[#25D366]`} aria-hidden title="WhatsApp" />;
    default:
      return <HiLink className={`${cls} text-neutral-400`} aria-hidden title="Другое" />;
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
    <div className="mt-7 space-y-3">
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
                className={`flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                  present
                    ? 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)]'
                    : 'bg-[#F1EFEF] text-neutral-600'
                }`}
              >
                <ContactChannelBrandIcon
                  type={ch.type}
                  className="h-3.5 w-3.5"
                  tone={present ? 'onAccent' : 'brand'}
                />
                {ch.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 max-w-full text-[12px] leading-snug text-neutral-500">
          Нажмите канал и вставьте ссылку, ник или номер в поле ниже — можно из буфера обмена.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-neutral-400">Добавьте удобные способы связи</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const meta = CONTACT_CHANNEL_META.find((c) => c.type === row.type)!;
            const err = rowErrors[row.id];
            const showErr = showRowError(row.id) && err;
            return (
              <li key={row.id} className="overflow-hidden rounded-[22px] bg-[#F1EFEF] p-2.5 sm:p-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(17,17,17,0.06)]"
                    aria-hidden
                  >
                    <ContactChannelBrandIcon type={row.type} className="h-[22px] w-[22px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[13px] font-semibold leading-tight text-neutral-700">{meta.label}</p>
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-semibold leading-none text-neutral-400 shadow-[0_2px_8px_rgba(17,17,17,0.06)] transition hover:text-neutral-700 active:scale-[0.96]"
                      aria-label={`Удалить ${meta.label}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <input
                  value={row.value}
                  onChange={(e) => onChange(row.id, e.target.value)}
                  onBlur={() => onBlurRow(row.id)}
                  placeholder={meta.placeholder}
                  maxLength={row.type === 'other' ? 200 : 460}
                  autoComplete="off"
                  className={`${contactInputClass} mt-2`}
                />
                {showErr ? (
                  <p className="mt-1 text-[11px] font-medium leading-snug text-red-600">{err}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
