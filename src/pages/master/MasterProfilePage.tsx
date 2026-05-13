import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBookingPath, SERVICES_PATH } from '../../app/paths';
import {
  getDemoMasterProfile,
  formatReviewsCountLabel,
} from '../../features/services/model/demoMasters';
import {
  formatFullAddress,
  formatPublicAddress,
  masterLocationDetailRows,
} from '../../features/profile/model/masterLocation';
import { useAuth } from '../../features/auth/AuthProvider';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import {
  fetchMasterPublicDetail,
  mapCareerToDraftItems,
  mapCertificatesFromDetail,
  mapMasterDetailToDemoProfile,
  mapPortfolioFromDetail,
} from '../../features/masters/api/masterPublicApi';
import {
  addMyFavoriteMaster,
  fetchMyFavorites,
  removeMyFavoriteMaster,
} from '../../features/profile/api/clientFavorites';
import type { MasterDraftCareerItem } from '../../features/profile/lib/demoMasterStorage';
import { normalizeMasterCareerItemType } from '../../features/profile/lib/demoMasterStorage';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';

type MasterProfile = NonNullable<ReturnType<typeof getDemoMasterProfile>>;

type MasterCareerItem = {
  id: string;
  type: 'education' | 'course' | 'practice' | 'work';
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

type MasterCertificate = {
  id: string;
  title: string;
  issuer: string;
  year?: string;
  imageUrl?: string;
  description?: string;
};

type MasterPortfolioItem = {
  id: string;
  title?: string;
  imageUrl?: string;
  description?: string;
};

type ExtendedMasterProfile = MasterProfile & {
  careerItems?: MasterDraftCareerItem[];
  experience?: string;
  certificates?: MasterCertificate[];
  portfolio?: MasterPortfolioItem[];
  bookingRules?: string;
  cancellationPolicy?: string;
  paymentMethods?: string[];
  paymentNote?: string;
};

type DetailTab = 'about' | 'trust' | 'address' | 'rules' | 'reviews';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMasterUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function detailSheetHeading(tab: DetailTab): string {
  switch (tab) {
    case 'about':
      return 'О мастере';
    case 'trust':
      return 'Доверие';
    case 'address':
      return 'Адрес';
    case 'rules':
      return 'Правила записи и оплаты';
    case 'reviews':
      return 'Отзывы';
  }
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconRules({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMap({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.924 4.618a1.012 1.012 0 0 0-.391-.392L2.02 10.257a1.01 1.01 0 0 0 .015 1.884l4.378 1.35 1.69 5.43a.75.75 0 0 0 1.18.35l2.42-1.97 4.95 3.63a1 1 0 0 0 1.57-.58l3.45-16.35c.09-.42-.12-.85-.5-1.02ZM17.1 7.35 9.53 14.91l-.22 2.47-1.35-4.33 9.6-8.7Z" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3l1.5 5.2L19 10l-5.5 1.8L12 17l-1.5-5.2L5 10l5.5-1.8L12 3Z" strokeLinejoin="round" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconHeartOutline({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHeartFilled({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="flex gap-0.5" aria-label={`Оценка ${rating.toFixed(1)} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar
          key={i}
          className={`h-4 w-4 shrink-0 ${i < filled ? 'text-[#E29595]' : 'text-neutral-200'}`}
        />
      ))}
    </div>
  );
}

function buildTelHref(phone: string): string | null {
  const compact = phone.trim().replace(/[^\d+]/g, '');
  if (!compact.replace(/\D/g, '')) return null;
  const normalized = compact.startsWith('+') ? compact : `+${compact.replace(/\D/g, '')}`;
  return `tel:${normalized}`;
}

function telegramUrlFromContact(contact: string): string | null {
  const s = contact.trim();
  const embedded = s.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
  if (embedded) return `https://t.me/${embedded[1]}`;
  const at = s.match(/@([a-zA-Z0-9_]{3,32})/);
  if (at) return `https://t.me/${at[1]}`;
  return null;
}

function MasterContactActions({ master }: { master: ExtendedMasterProfile }) {
  const phone = master.phone?.trim();
  const contact = master.contact?.trim();
  if (!phone && !contact) return null;

  const telHref = phone ? buildTelHref(phone) : null;
  const tgHref = contact ? telegramUrlFromContact(contact) : null;

  const linkClass =
    'flex items-start gap-3 rounded-[22px] bg-[#F1EFEF] px-4 py-3 transition hover:bg-[#e8e4e4] active:scale-[0.99]';

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Связь с мастером</p>

      {phone ? (
        telHref ? (
          <a href={telHref} className={linkClass}>
            <IconPhone className="mt-0.5 shrink-0 text-[#E29595]" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-500">Позвонить</p>
              <p className="mt-0.5 text-[16px] font-semibold leading-snug text-neutral-950">{phone}</p>
            </div>
          </a>
        ) : (
          <div className={`${linkClass} cursor-default`}>
            <IconPhone className="mt-0.5 shrink-0 text-neutral-400" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-500">Телефон</p>
              <p className="mt-0.5 text-[16px] font-semibold text-neutral-950">{phone}</p>
            </div>
          </div>
        )
      ) : null}

      {contact ? (
        tgHref ? (
          <a href={tgHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <IconTelegram className="mt-0.5 shrink-0 text-[#2AABEE]" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-500">Написать в Telegram</p>
              <p className="mt-0.5 break-words text-[15px] font-medium leading-snug text-neutral-800">{contact}</p>
            </div>
          </a>
        ) : (
          <div className={`${linkClass} cursor-default`}>
            <IconTelegram className="mt-0.5 shrink-0 text-neutral-400" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-500">Контакт</p>
              <p className="mt-0.5 whitespace-pre-wrap text-[15px] font-medium leading-snug text-neutral-800">{contact}</p>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

function careerTypeLabel(type: MasterCareerItem['type']): string {
  switch (type) {
    case 'education':
      return 'Образование';
    case 'course':
      return 'Курс';
    case 'practice':
      return 'Практика';
    case 'work':
      return 'Работа';
  }
}

function normalizeCareerItems(master: ExtendedMasterProfile): MasterCareerItem[] {
  if (master.careerItems?.length) {
    return master.careerItems.map((item) => ({
      ...item,
      type: normalizeMasterCareerItemType(item.type),
    }));
  }

  if (master.experience?.trim()) {
    return [
      {
        id: 'legacy-experience',
        type: 'work',
        title: 'Опыт работы',
        place: '',
        description: master.experience.trim(),
      },
    ];
  }

  return [];
}

function formatPrice(service: MasterProfile['services'][number] & { priceType?: 'fixed' | 'from' }) {
  if (service.price === 0) return 'Бесплатно';
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${service.price} BYN`;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const v = value?.trim();

  if (!v) return null;

  return (
    <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-[15px] font-semibold leading-relaxed text-neutral-950">
        {v}
      </p>
    </div>
  );
}

function EmptyMini({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[26px] bg-[#F1EFEF] px-5 py-6 text-center">
      <p className="text-[17px] font-semibold tracking-[-0.04em] text-neutral-950">{title}</p>
      <p className="mx-auto mt-2 max-w-[20rem] text-[14px] leading-relaxed text-neutral-500">{text}</p>
    </div>
  );
}

function SheetSection({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
      <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.055em] text-neutral-950">
        {title}
      </h3>
      {text ? <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{text}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailsSheet({
  master,
  activeTab,
  onClose,
}: {
  master: ExtendedMasterProfile;
  activeTab: DetailTab;
  onClose: () => void;
}) {
  const careerItems = normalizeCareerItems(master);
  const certificates = master.certificates ?? [];
  const portfolio = master.portfolio ?? [];
  const detailRows = masterLocationDetailRows(master.location).filter((row) => row.label !== 'Адрес');
  const paymentMethods = master.paymentMethods ?? [];

  const phoneTrim = master.phone?.trim() ?? '';
  const telHrefSheet = phoneTrim ? buildTelHref(phoneTrim) : null;
  const contactTrim = master.contact?.trim() ?? '';
  const tgHrefSheet = contactTrim ? telegramUrlFromContact(contactTrim) : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-3 pb-3 pt-12 backdrop-blur-[2px] sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Закрыть подробности"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-details-title"
        className="relative w-full max-w-lg overflow-hidden rounded-t-[38px] bg-white p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:rounded-[38px]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 sm:hidden" aria-hidden />

        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              SLOTTY
            </p>
            <h2 id="master-details-title" className="mt-1 text-[28px] font-semibold tracking-[-0.06em] text-neutral-950">
              {detailSheetHeading(activeTab)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[24px] font-light leading-none text-neutral-800 transition active:scale-[0.96]"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="mt-4 max-h-[62dvh] overflow-y-auto rounded-[34px] bg-[#F1EFEF] p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeTab === 'about' ? (
            <div className="space-y-3">
              <SheetSection title="О мастере">
                <div className="space-y-3">
                  <InfoRow label="Направление" value={master.category} />
                  <InfoRow label="Описание" value={master.bio} />
                  {phoneTrim ? (
                    <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Телефон</p>
                      {telHrefSheet ? (
                        <a
                          href={telHrefSheet}
                          className="mt-2 inline-flex items-center gap-2 text-[16px] font-semibold text-[#c47878] underline decoration-[#E29595]/50 underline-offset-2"
                        >
                          <IconPhone className="h-4 w-4 shrink-0" />
                          {phoneTrim}
                        </a>
                      ) : (
                        <p className="mt-2 text-[15px] font-semibold text-neutral-950">{phoneTrim}</p>
                      )}
                    </div>
                  ) : null}
                  {contactTrim ? (
                    <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Мессенджеры</p>
                      {tgHrefSheet ? (
                        <a
                          href={tgHrefSheet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-2 text-[16px] font-semibold text-[#2AABEE] underline decoration-[#2AABEE]/40 underline-offset-2"
                        >
                          <IconTelegram className="h-4 w-4 shrink-0" />
                          Открыть чат в Telegram
                        </a>
                      ) : null}
                      <p
                        className={`whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-neutral-800 ${
                          tgHrefSheet ? 'mt-2 text-[14px] text-neutral-600' : 'mt-2'
                        }`}
                      >
                        {contactTrim}
                      </p>
                    </div>
                  ) : null}
                </div>
              </SheetSection>
            </div>
          ) : null}

          {activeTab === 'trust' ? (
            <div className="space-y-3">
              <SheetSection
                title="Образование и опыт"
                text="Колледж, курсы, практика, стажировка и работа мастера."
              >
                {careerItems.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {careerItems.map((item) => (
                      <li key={item.id} className="rounded-[26px] bg-[#F1EFEF] p-4">
                        <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-600">
                          {careerTypeLabel(item.type)}
                        </span>
                        <p className="mt-3 text-[17px] font-semibold tracking-[-0.045em] text-neutral-950">
                          {item.title}
                        </p>
                        {item.place ? (
                          <p className="mt-1 text-[14px] font-semibold text-neutral-600">
                            {item.place}
                          </p>
                        ) : null}
                        {item.startYear || item.endYear ? (
                          <p className="mt-1 text-[13px] font-medium text-neutral-400">
                            {item.startYear || '—'} — {item.endYear || 'сейчас'}
                          </p>
                        ) : null}
                        {item.description ? (
                          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-500">
                            {item.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyMini title="Пока не заполнено" text="Мастер ещё не добавил образование, практику или опыт работы." />
                )}
              </SheetSection>

              <SheetSection title="Сертификаты" text="Курсы, дипломы и документы мастера.">
                {certificates.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {certificates.map((certificate) => (
                      <li key={certificate.id} className="rounded-[26px] bg-[#F1EFEF] p-3">
                        {certificate.imageUrl ? (
                          <div className="mb-3 overflow-hidden rounded-[22px] bg-white">
                            <img
                              src={certificate.imageUrl}
                              alt=""
                              className="h-36 w-full object-cover"
                              decoding="async"
                            />
                          </div>
                        ) : null}
                        <p className="text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                          {certificate.title}
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-neutral-500">
                          {certificate.issuer}
                          {certificate.year ? ` · ${certificate.year}` : ''}
                        </p>
                        {certificate.description ? (
                          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                            {certificate.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyMini title="Сертификатов пока нет" text="Мастер сможет добавить сертификаты позже." />
                )}
              </SheetSection>

              <SheetSection title="Портфолио" text="Примеры работ мастера.">
                {portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {portfolio.map((item) => (
                      <article key={item.id} className="overflow-hidden rounded-[24px] bg-[#F1EFEF]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="aspect-square w-full object-cover"
                            decoding="async"
                          />
                        ) : (
                          <div className="aspect-square bg-white" />
                        )}
                        <div className="px-3 py-3">
                          <p className="truncate text-[14px] font-semibold text-neutral-950">
                            {item.title || 'Работа'}
                          </p>
                          {item.description ? (
                            <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-neutral-500">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyMini title="Работ пока нет" text="Мастер ещё не добавил портфолио." />
                )}
              </SheetSection>
            </div>
          ) : null}

          {activeTab === 'address' ? (
            <div className="space-y-3">
              <SheetSection title="Адрес">
                <div className="space-y-3">
                  <InfoRow label="Кратко" value={formatPublicAddress(master.location)} />
                  <InfoRow label="Полный адрес" value={formatFullAddress(master.location)} />
                  {detailRows.length > 0 ? (
                    <div className="space-y-2">
                      {detailRows.map((row) => (
                        <InfoRow key={row.label} label={row.label} value={row.value} />
                      ))}
                    </div>
                  ) : (
                    <EmptyMini title="Деталей пока нет" text="Мастер ещё не добавил подробные инструкции." />
                  )}
                </div>
              </SheetSection>
            </div>
          ) : null}

          {activeTab === 'rules' ? (
            <div className="space-y-3">
              <SheetSection title="Правила записи">
                <div className="space-y-3">
                  <InfoRow label="Правила записи" value={master.bookingRules} />
                  <InfoRow label="Правила отмены" value={master.cancellationPolicy} />

                  <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Оплата
                    </p>

                    {paymentMethods.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {paymentMethods.map((method) => (
                          <span
                            key={method}
                            className="rounded-full bg-white px-3 py-2 text-[13px] font-semibold text-neutral-700"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[15px] font-semibold text-neutral-950">—</p>
                    )}

                    {master.paymentNote?.trim() ? (
                      <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
                        {master.paymentNote}
                      </p>
                    ) : null}
                  </div>

                  {!master.bookingRules?.trim() && !master.cancellationPolicy?.trim() && paymentMethods.length === 0 ? (
                    <EmptyMini title="Правила пока не заполнены" text="Мастер сможет добавить условия записи позже." />
                  ) : null}
                </div>
              </SheetSection>
            </div>
          ) : null}

          {activeTab === 'reviews' ? (
            <div className="space-y-3">
              <SheetSection title="Отзывы" text={formatReviewsCountLabel(master.reviewsCount)}>
                {master.reviews.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {master.reviews.map((review) => (
                      <li key={review.id} className="rounded-[26px] bg-[#F1EFEF] px-4 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-[16px] font-semibold text-neutral-950">{review.author}</p>
                          <time className="text-[13px] font-medium text-neutral-400">{review.date}</time>
                        </div>
                        <div className="mt-2">
                          <ReviewStars rating={review.rating} />
                        </div>
                        <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">«{review.text}»</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyMini title="Пока нет отзывов" text="После первой записи здесь появятся оценки клиентов." />
                )}
              </SheetSection>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MasterProfilePage() {
  const { id: rawId } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const masterId = useMemo(() => (rawId ? decodeURIComponent(rawId) : ''), [rawId]);

  /** `undefined` — ещё грузим с API; `null` — нет данных / ошибка; иначе профиль. */
  const [apiProfile, setApiProfile] = useState<ExtendedMasterProfile | null | undefined>(undefined);

  const demoMaster = useMemo(() => {
    if (!masterId) return undefined;
    if (getApiBaseUrl() && isMasterUuid(masterId)) return undefined;
    return getDemoMasterProfile(masterId);
  }, [masterId]);

  useEffect(() => {
    if (!masterId) {
      setApiProfile(undefined);
      return;
    }
    if (!getApiBaseUrl() || !isMasterUuid(masterId)) {
      setApiProfile(undefined);
      return;
    }

    let cancelled = false;
    setApiProfile(undefined);

    void (async () => {
      try {
        const detail = await fetchMasterPublicDetail(masterId);
        if (cancelled) return;
        const base = mapMasterDetailToDemoProfile(detail);
        const extended: ExtendedMasterProfile = {
          ...base,
          careerItems: mapCareerToDraftItems(detail.career),
          certificates: mapCertificatesFromDetail(detail),
          portfolio: mapPortfolioFromDetail(detail),
          bookingRules: detail.bookingRules?.bookingRules ?? undefined,
          cancellationPolicy: detail.bookingRules?.cancellationPolicy ?? undefined,
          paymentNote: detail.bookingRules?.paymentNote ?? undefined,
        };
        setApiProfile(extended);
      } catch {
        if (!cancelled) setApiProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [masterId]);

  const master = useMemo((): ExtendedMasterProfile | undefined => {
    if (getApiBaseUrl() && masterId && isMasterUuid(masterId)) {
      return apiProfile === undefined ? undefined : apiProfile ?? undefined;
    }
    return demoMaster ? (demoMaster as ExtendedMasterProfile) : undefined;
  }, [apiProfile, demoMaster, masterId]);

  const profileLoading = Boolean(getApiBaseUrl() && masterId && isMasterUuid(masterId) && apiProfile === undefined);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('about');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!masterId) {
      setIsFavorite(false);
      return;
    }
    if (!isAuthenticated || !getApiBaseUrl()) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchMyFavorites();
        if (!cancelled) setIsFavorite(list.some((f) => f.masterId === masterId));
      } catch {
        if (!cancelled) setIsFavorite(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [masterId, isAuthenticated]);

  const onFavoriteToggle = useCallback(async () => {
    if (!masterId || !isAuthenticated || !getApiBaseUrl()) return;
    try {
      if (isFavorite) {
        await removeMyFavoriteMaster(masterId);
        setIsFavorite(false);
      } else {
        await addMyFavoriteMaster(masterId);
        setIsFavorite(true);
      }
    } catch {
      /* ignore */
    }
  }, [masterId, isAuthenticated, isFavorite]);

  if (!masterId) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-10 pt-[calc(5rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={SERVICES_PATH}
            className="mb-8 inline-flex h-11 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:opacity-80"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <NothingFoundCard
            title="Мастер не найден"
            text="Попробуйте вернуться к поиску услуг."
            action={
              <Link
                to={SERVICES_PATH}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#E29595] px-8 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90"
              >
                К услугам
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-4 text-neutral-600">
        <p className="text-[15px] font-medium">Загрузка профиля…</p>
      </div>
    );
  }

  if (!master) {
    const failedPublicFetch = Boolean(
      getApiBaseUrl() && masterId && isMasterUuid(masterId) && apiProfile === null,
    );
    return (
      <div className="min-h-dvh bg-white px-4 pb-10 pt-[calc(5rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={SERVICES_PATH}
            className="mb-8 inline-flex h-11 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:opacity-80"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <NothingFoundCard
            title={failedPublicFetch ? 'Не удалось загрузить профиль' : 'Мастер не найден'}
            text={
              failedPublicFetch
                ? 'Проверьте соединение с сервером или попробуйте открыть страницу позже.'
                : 'Попробуйте вернуться к поиску услуг.'
            }
            action={
              <Link
                to={SERVICES_PATH}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#E29595] px-8 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90"
              >
                К услугам
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const firstServiceId = master.services[0]?.id;
  const bookingDefaultTo = getBookingPath(master.masterId, firstServiceId ?? undefined);
  const previewReviews = master.reviews.slice(0, 2);
  const careerCount = normalizeCareerItems(master).length;
  const certificatesCount = master.certificates?.length ?? 0;
  const portfolioCount = master.portfolio?.length ?? 0;

  const openDetails = (tab: DetailTab) => {
    setDetailTab(tab);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <div className="fixed inset-x-0 top-0 z-40 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <div className="flex items-center gap-2 rounded-[30px] bg-[#e4e4e4]/95 px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md sm:px-4">
            <Link
              to={SERVICES_PATH}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-black/5 active:scale-95"
              aria-label="Назад к поиску"
            >
              <IconChevronLeft />
            </Link>

            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-neutral-900">
              Профиль мастера
            </span>

            <button
              type="button"
              onClick={() => void onFavoriteToggle()}
              disabled={!isAuthenticated || !getApiBaseUrl()}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                isFavorite
                  ? 'bg-[#E29595] text-white shadow-[0_6px_18px_rgba(226,149,149,0.35)]'
                  : 'text-neutral-600 hover:bg-black/5'
              }`}
            >
              {isFavorite ? <IconHeartFilled className="h-[1.15rem] w-[1.15rem]" /> : <IconHeartOutline className="h-[1.15rem] w-[1.15rem]" />}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1100px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:px-6">
        <div className="mx-auto max-w-lg space-y-5">
          <section className="rounded-[38px] bg-[#F1EFEF] p-3 shadow-[0_20px_60px_rgba(17,17,17,0.05)]">
            <div className="rounded-[32px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
              <div className="flex gap-4">
                <div className="h-[7.25rem] w-[7.25rem] shrink-0 overflow-hidden rounded-[28px] bg-[#F1EFEF] shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
                  <img
                    src={master.photoUrl}
                    alt=""
                    width={180}
                    height={180}
                    className="h-full w-full object-cover"
                    decoding="async"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    {master.category}
                  </p>

                  <h1 className="mt-1 break-words text-[28px] font-semibold leading-[1.02] tracking-[-0.065em] text-neutral-950">
                    {master.masterName}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[13px] font-semibold text-neutral-900">
                      <IconStar className="h-3.5 w-3.5 text-[#E29595]" />
                      {master.rating.toFixed(1)}
                    </span>

                    <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[13px] font-semibold text-neutral-600">
                      {formatReviewsCountLabel(master.reviewsCount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[26px] bg-[#F1EFEF] px-4 py-3">
                <div className="flex items-start gap-2">
                  <IconMap className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <p className="text-[15px] font-semibold leading-snug text-neutral-950">
                    {formatPublicAddress(master.location)}
                  </p>
                </div>
              </div>

              <MasterContactActions master={master} />

              {master.bio ? (
                <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-neutral-600">
                  {master.bio}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[34px] bg-[#F1EFEF] p-3 shadow-[0_14px_42px_rgba(17,17,17,0.045)]">
            <div className="rounded-[30px] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
              <h2 className="text-[24px] font-semibold tracking-[-0.055em] text-neutral-950">
                Услуги
              </h2>


            </div>

            {master.services.length === 0 ? (
              <NothingFoundCard
                className="mt-3"
                title="Услуги пока не добавлены"
                text="Мастер скоро заполнит список услуг."
              />
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {master.services.map((service) => (
                  <li key={service.id}>
                    <Link
                      to={getBookingPath(master.masterId, service.id)}
                      className="block rounded-[30px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)] transition active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.045em] text-neutral-950">
                            {service.title}
                          </h3>

                          <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500">
                            <IconClock className="h-4 w-4" />
                            {service.duration} мин
                          </p>

                          {service.description ? (
                            <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-neutral-500">
                              {service.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[20px] font-semibold leading-none tracking-[-0.055em] text-neutral-950">
                            {formatPrice(service)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.22)]">
                        Записаться
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[34px] bg-[#F1EFEF] p-3 shadow-[0_14px_42px_rgba(17,17,17,0.045)]">
            <div className="rounded-[30px] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
              <h2 className="text-[24px] font-semibold tracking-[-0.055em] text-neutral-950">
                О мастере
              </h2>

              <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                Образование, сертификаты, портфолио и правила записи вынесены отдельно, чтобы не мешать выбору услуги.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openDetails('about')}
                className="rounded-[26px] bg-white px-4 py-4 text-left shadow-[0_8px_24px_rgba(17,17,17,0.035)] transition active:scale-[0.98]"
              >
                <IconUser className="h-4 w-4 text-[#E29595]" />
                <p className="mt-3 text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">О мастере</p>
                <p className="mt-1 text-[13px] leading-snug text-neutral-500">
                  {master.bio?.trim() ? 'Описание и контакты' : 'Категория и контакты'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => openDetails('trust')}
                className="rounded-[26px] bg-white px-4 py-4 text-left shadow-[0_8px_24px_rgba(17,17,17,0.035)] transition active:scale-[0.98]"
              >
                <IconSparkles className="h-4 w-4 text-[#E29595]" />
                <p className="mt-3 text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                  Доверие
                </p>
                <p className="mt-1 text-[13px] leading-snug text-neutral-500">
                  {careerCount + certificatesCount + portfolioCount > 0
                    ? `${careerCount + certificatesCount + portfolioCount} пунктов`
                    : 'Пока пусто'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => openDetails('address')}
                className="rounded-[26px] bg-white px-4 py-4 text-left shadow-[0_8px_24px_rgba(17,17,17,0.035)] transition active:scale-[0.98]"
              >
                <IconMap className="h-4 w-4 text-[#E29595]" />
                <p className="mt-3 text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                  Адрес
                </p>
                <p className="mt-1 text-[13px] leading-snug text-neutral-500">
                  Как пройти
                </p>
              </button>

              <button
                type="button"
                onClick={() => openDetails('rules')}
                className="rounded-[26px] bg-white px-4 py-4 text-left shadow-[0_8px_24px_rgba(17,17,17,0.035)] transition active:scale-[0.98]"
              >
                <IconRules className="h-4 w-4 text-[#E29595]" />
                <p className="mt-3 text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                  Правила
                </p>
                <p className="mt-1 text-[13px] leading-snug text-neutral-500">Запись и оплата</p>
              </button>
            </div>
          </section>

          <section className="rounded-[34px] bg-[#F1EFEF] p-3 shadow-[0_14px_42px_rgba(17,17,17,0.045)]">
            <div className="rounded-[30px] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-semibold tracking-[-0.055em] text-neutral-950">
                    Отзывы
                  </h2>

                  <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                    {formatReviewsCountLabel(master.reviewsCount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openDetails('reviews')}
                  className="shrink-0 rounded-full bg-[#F1EFEF] px-4 py-2.5 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
                >
                  Все
                </button>
              </div>
            </div>

            {previewReviews.length === 0 ? (
              <NothingFoundCard
                className="mt-3"
                title="Пока нет отзывов"
                text="После первой записи здесь появятся оценки клиентов."
              />
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {previewReviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-[30px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[16px] font-semibold text-neutral-950">{review.author}</p>
                      <time className="text-[13px] font-medium text-neutral-400">{review.date}</time>
                    </div>

                    <div className="mt-2">
                      <ReviewStars rating={review.rating} />
                    </div>

                    <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-neutral-600">
                      «{review.text}»
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {firstServiceId ? (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-6">
          <div className="mx-auto max-w-lg">
            <Link
              to={bookingDefaultTo}
              className="flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90 active:scale-[0.99]"
            >
              Записаться
            </Link>
          </div>
        </div>
      ) : null}

      {detailsOpen ? (
        <DetailsSheet
          master={master}
          activeTab={detailTab}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}
    </div>
  );
}