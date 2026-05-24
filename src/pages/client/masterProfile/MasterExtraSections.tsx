import { useState, type ReactNode } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import { MasterAddressBlock } from './MasterAddressBlock';
import { MasterPaymentMethodsBlock } from './MasterPaymentMethodsBlock';
import type { ExtendedMasterProfile } from './types';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = { master: ExtendedMasterProfile; layout?: 'stack' | 'desktop' };

function Accordion({
  title,
  children,
  defaultOpen = false,
  desktop = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  desktop?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || desktop);
  return (
    <div
      className={
        desktop
          ? 'overflow-hidden rounded-[16px] bg-white'
          : 'overflow-hidden bg-white'
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-[#FAFAFA]"
      >
        <span className="text-[16px] font-semibold text-[#111827]">{title}</span>
        <HiChevronDown
          className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[#F3F4F6] px-4 pb-4 pt-3">{children}</div>
      ) : null}
    </div>
  );
}

export function MasterExtraSections({ master, layout = 'stack' }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = master.bio?.trim();
  const paymentMethods = master.paymentMethods ?? [];
  const isDesktop = layout === 'desktop';
  const hasRulesContent = Boolean(
    master.bookingRules?.trim() ||
      master.cancellationPolicy?.trim() ||
      master.paymentNote?.trim() ||
      paymentMethods.length > 0,
  );

  return (
    <section className={`${isDesktop ? '' : 'mt-0'} space-y-2.5 ${isDesktop ? 'divide-y divide-[#EEEEEE] rounded-[16px] bg-white' : `${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}`}>
      {bio ? (
        <Accordion title="О мастере" desktop={isDesktop}>
          <p
            className={`text-[14px] leading-relaxed text-[#4B5563] ${
              bioExpanded ? '' : 'line-clamp-4'
            }`}
          >
            {bio}
          </p>
          {bio.length > 160 ? (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="mt-2.5 text-[13px] font-semibold text-[#F47C8C]"
            >
              {bioExpanded ? 'Свернуть' : 'Показать полностью'}
            </button>
          ) : null}
        </Accordion>
      ) : null}

      <Accordion title="Адрес и формат" defaultOpen desktop={isDesktop}>
        <MasterAddressBlock location={master.location} />
      </Accordion>

      {hasRulesContent ? (
        <Accordion title="Правила записи" desktop={isDesktop}>
          <div className="space-y-3">
            {master.bookingRules?.trim() ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Запись
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#4B5563]">
                  {master.bookingRules.trim()}
                </p>
              </div>
            ) : null}
            {master.cancellationPolicy?.trim() ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Отмена и перенос
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#4B5563]">
                  {master.cancellationPolicy.trim()}
                </p>
              </div>
            ) : null}
            {paymentMethods.length > 0 || master.paymentNote?.trim() ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Оплата
                </p>
                <MasterPaymentMethodsBlock
                  methods={paymentMethods}
                  note={master.paymentNote}
                  compact
                />
              </div>
            ) : null}
          </div>
        </Accordion>
      ) : null}
    </section>
  );
}
