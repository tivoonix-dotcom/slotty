import { useState, type ReactNode } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import {
  formatBookingHowToFind,
  formatPublicAddress,
  masterVisitTypeLabel,
} from '../../../features/profile/model/masterLocation';
import type { ExtendedMasterProfile } from './types';

type Props = { master: ExtendedMasterProfile };

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[20px] bg-white shadow-[0_4px_20px_rgba(17,24,39,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
      >
        <span className="text-[16px] font-semibold text-[#111827]">{title}</span>
        <HiChevronDown
          className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-[#F3F4F6] px-4 pb-4 pt-2">{children}</div> : null}
    </div>
  );
}

export function MasterExtraSections({ master }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = master.bio?.trim();
  const rules = [master.bookingRules, master.cancellationPolicy, master.paymentNote]
    .filter(Boolean)
    .join('\n\n');

  return (
    <section className="mt-8 space-y-2">
      {bio ? (
        <Accordion title="О мастере">
          <p className={`text-[14px] leading-relaxed text-[#4B5563] ${bioExpanded ? '' : 'line-clamp-3'}`}>
            {bio}
          </p>
          {bio.length > 120 ? (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="mt-2 text-[13px] font-semibold text-[#F47C8C]"
            >
              {bioExpanded ? 'Свернуть' : 'Показать полностью'}
            </button>
          ) : null}
        </Accordion>
      ) : null}

      <Accordion title="Адрес и формат">
        <p className="text-[14px] font-medium text-[#111827]">
          {formatPublicAddress(master.location)}
        </p>
        <p className="mt-1 text-[13px] text-[#6B7280]">{masterVisitTypeLabel(master.location.visitType)}</p>
        {master.location.showExactAddressAfterBooking ? (
          <p className="mt-2 text-[13px] text-[#9CA3AF]">
            Точный адрес будет доступен после подтверждения записи
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-[#6B7280]">{formatBookingHowToFind(master.location)}</p>
        )}
      </Accordion>

      {rules ? (
        <Accordion title="Правила записи">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#4B5563]">{rules}</p>
        </Accordion>
      ) : null}
    </section>
  );
}
