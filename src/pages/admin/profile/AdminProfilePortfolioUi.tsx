import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  HiAcademicCap,
  HiBriefcase,
  HiCamera,
  HiDocumentText,
  HiEllipsisHorizontal,
  HiPhoto,
  HiPlus,
} from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { normalizeMasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { cabinetCard } from './adminProfileCabinetTheme';

type CareerItemType = MasterCareerItemType;

type MasterCareerItem = {
  id: string;
  type: CareerItemType;
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

const trustSectionCard = `${cabinetCard} p-[18px] shadow-[0_8px_32px_rgba(17,24,39,0.05)]`;

const trustAddBtn =
  'mt-4 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-[17px] border border-[#FDE8ED] bg-white text-[15px] font-semibold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:bg-[#FFF1F4] active:scale-[0.99]';

function worksCountLabel(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} работ`;
  if (mod10 === 1) return `${n} работа`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} работы`;
  return `${n} работ`;
}

function certsCountLabel(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} сертификатов`;
  if (mod10 === 1) return `${n} сертификат`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} сертификата`;
  return `${n} сертификатов`;
}

function careerCountLabel(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} записей`;
  if (mod10 === 1) return `${n} запись`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} записи`;
  return `${n} записей`;
}

function careerTypeLabel(type: CareerItemType): string {
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

function normalizeCareerType(raw: string | CareerItemType | undefined): CareerItemType {
  return normalizeMasterCareerItemType(raw);
}

function normalizeCareerItems(draft: MasterDraft): MasterCareerItem[] {
  if (draft.careerItems?.length) {
    return draft.careerItems.map((item) => ({
      ...item,
      type: normalizeCareerType(item.type),
    }));
  }

  if (draft.experience?.trim()) {
    return [
      {
        id: 'legacy-experience',
        type: 'work',
        title: 'Опыт работы',
        place: '',
        description: draft.experience.trim(),
      },
    ];
  }

  return [];
}

type OverflowMenuItem = {
  id: string;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
};

function CardOverflowMenu({ items, ariaLabel }: { items: OverflowMenuItem[]; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111827] shadow-[0_4px_14px_rgba(17,24,39,0.12)] transition active:scale-[0.95]"
      >
        <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[11.5rem] overflow-hidden rounded-[16px] bg-white py-1 shadow-[0_16px_40px_rgba(17,24,39,0.12)] ring-1 ring-[#EAECEF]"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onClick();
              }}
              className={`flex min-h-11 w-full items-center px-4 text-left text-[14px] font-semibold transition active:bg-[#F7F7F8] disabled:opacity-40 ${
                item.tone === 'danger' ? 'text-red-600' : 'text-[#111827]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TrustBlockHeader({
  title,
  description,
  countLabel,
  showBadge = true,
}: {
  title: string;
  description: string;
  countLabel?: string;
  showBadge?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 pr-1">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">{title}</h2>
        <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{description}</p>
      </div>
      {showBadge && countLabel ? (
        <span className="shrink-0 rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#F47C8C]">
          {countLabel}
        </span>
      ) : null}
    </div>
  );
}

function TrustEmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-[20px] bg-[#FAFAFA] px-4 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
        {icon}
      </span>
      <p className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-[#6B7280]">{subtitle}</p>
      <button type="button" onClick={onAction} className={`${trustAddBtn} mt-5 max-w-full`}>
        <HiPlus className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        {actionLabel.replace(/^\+ /, '')}
      </button>
    </div>
  );
}

function TrustAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={trustAddBtn}>
      <HiPlus className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      {label.replace(/^\+ /, '')}
    </button>
  );
}

function CareerTimelineIcon({ type }: { type: CareerItemType }) {
  const className = 'h-[18px] w-[18px]';
  if (type === 'education' || type === 'course') {
    return <HiAcademicCap className={className} strokeWidth={2} aria-hidden />;
  }
  return <HiBriefcase className={className} strokeWidth={2} aria-hidden />;
}

function formatCareerPeriod(startYear?: string, endYear?: string): string | null {
  const start = startYear?.trim();
  const end = endYear?.trim();
  if (!start && !end) return null;
  return `${start || '…'} — ${end || 'сейчас'}`;
}

export function TrustSection({
  draft,
  onAddCareer,
  onEditCareer,
  onDeleteCareer,
  onAddCert,
  onEditCert,
  onDeleteCert,
  onAddPortfolio,
  onEditPortfolio,
  onDeletePortfolio,
  onSetPortfolioCover,
}: {
  draft: MasterDraft;
  onAddCareer: () => void;
  onEditCareer: (id: string) => void;
  onDeleteCareer: (id: string) => void;
  onAddCert: () => void;
  onEditCert: (id: string) => void;
  onDeleteCert: (id: string) => void;
  onAddPortfolio: () => void;
  onEditPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
  onSetPortfolioCover: (imageUrl: string) => void;
}) {
  const careerItems = normalizeCareerItems(draft);
  const certificates = draft.certificates ?? [];
  const portfolio = draft.portfolio ?? [];
  const coverPhoto = draft.photoUrl?.trim() ?? '';
  const categoryHint = draft.category?.trim() ?? '';

  return (
    <div className="-mx-4 space-y-4 bg-[#F7F7F8] px-4 pb-2 pt-1">
      {/* Работы */}
      <section className={trustSectionCard}>
        <TrustBlockHeader
          title="Работы"
          description="Добавьте фото работ, чтобы клиенты быстрее выбрали вас"
          countLabel={worksCountLabel(portfolio.length)}
        />

        {portfolio.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              {portfolio.map((item, i) => {
                const imageUrl = item.imageUrl?.trim() ?? '';
                const isCover = Boolean(imageUrl && coverPhoto && imageUrl === coverPhoto);
                const title = item.title?.trim() || 'Без названия';
                const subtitle = item.description?.trim() || categoryHint;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[20px] bg-[#FAFAFA] shadow-[0_4px_16px_rgba(17,24,39,0.05)]"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-[#F3F4F6]">
                      <div className="absolute right-2 top-2 z-20">
                        <CardOverflowMenu
                          ariaLabel="Действия с работой"
                          items={[
                            {
                              id: 'cover',
                              label: isCover ? 'Уже обложка' : 'Сделать обложкой',
                              onClick: () => onSetPortfolioCover(imageUrl),
                              disabled: !imageUrl || isCover,
                            },
                            {
                              id: 'edit',
                              label: 'Редактировать',
                              onClick: () => onEditPortfolio(item.id),
                            },
                            {
                              id: 'delete',
                              label: 'Удалить',
                              onClick: () => onDeletePortfolio(item.id),
                              tone: 'danger',
                            },
                          ]}
                        />
                      </div>
                      {isCover ? (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-[#111827]/80 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                          Обложка
                        </span>
                      ) : null}
                      {imageUrl ? (
                        <ImageReveal
                          src={imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading={i < 4 ? 'eager' : 'lazy'}
                          fetchPriority={i < 2 ? 'high' : 'low'}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
                          <HiPhoto className="h-10 w-10" strokeWidth={1.5} aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="px-3 pb-3 pt-2.5">
                      <p className="truncate text-[14px] font-semibold text-[#111827]">{title}</p>
                      {subtitle ? (
                        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#6B7280]">{subtitle}</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <TrustAddButton label="Добавить работу" onClick={onAddPortfolio} />
          </>
        ) : (
          <TrustEmptyState
            icon={<HiCamera className="h-7 w-7" strokeWidth={1.8} aria-hidden />}
            title="Пока нет работ"
            subtitle="Добавьте первые фото, чтобы клиенты увидели ваш стиль"
            actionLabel="Добавить работу"
            onAction={onAddPortfolio}
          />
        )}
      </section>

      {/* Сертификаты */}
      <section className={trustSectionCard}>
        <TrustBlockHeader
          title="Сертификаты"
          description="Покажите клиентам документы, подтверждающие вашу квалификацию"
          countLabel={certsCountLabel(certificates.length)}
        />

        {certificates.length > 0 ? (
          <>
            <div className="mt-4 -mx-0.5 flex gap-3 overflow-x-auto pb-1 pl-0.5 pr-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {certificates.map((certificate, i) => {
                const meta = [certificate.issuer?.trim(), certificate.year?.trim()]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <article
                    key={certificate.id}
                    className="relative flex w-[min(72vw,11.5rem)] shrink-0 snap-start flex-col rounded-[20px] bg-[#FAFAFA] p-3 shadow-[0_4px_16px_rgba(17,24,39,0.05)]"
                  >
                    <div className="absolute right-2 top-2 z-10">
                      <CardOverflowMenu
                        ariaLabel="Действия с сертификатом"
                        items={[
                          { id: 'edit', label: 'Редактировать', onClick: () => onEditCert(certificate.id) },
                          {
                            id: 'delete',
                            label: 'Удалить',
                            onClick: () => onDeleteCert(certificate.id),
                            tone: 'danger',
                          },
                        ]}
                      />
                    </div>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EAECEF]/80">
                      {certificate.imageUrl?.trim() ? (
                        <ImageReveal
                          src={certificate.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading={i === 0 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                          <HiDocumentText className="h-9 w-9" strokeWidth={1.5} aria-hidden />
                          <span className="text-[10px] font-medium text-[#9CA3AF]">Документ</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug text-[#111827]">
                      {certificate.title}
                    </p>
                    {meta ? (
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#6B7280]">{meta}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <TrustAddButton label="Добавить сертификат" onClick={onAddCert} />
          </>
        ) : (
          <TrustEmptyState
            icon={<HiDocumentText className="h-7 w-7" strokeWidth={1.8} aria-hidden />}
            title="Сертификаты не добавлены"
            subtitle="Добавьте документы, чтобы повысить доверие клиентов"
            actionLabel="Добавить сертификат"
            onAction={onAddCert}
          />
        )}
      </section>

      {/* Опыт и образование */}
      <section className={trustSectionCard}>
        <TrustBlockHeader
          title="Опыт и образование"
          description="Расскажите, где учились и сколько работаете в сфере"
          countLabel={careerCountLabel(careerItems.length)}
          showBadge={careerItems.length > 0}
        />

        {careerItems.length > 0 ? (
          <>
            <ul className="relative mt-5 space-y-0">
              {careerItems.map((item, index) => {
                const isLegacy = item.id === 'legacy-experience';
                const period = formatCareerPeriod(item.startYear, item.endYear);
                const isLast = index === careerItems.length - 1;

                return (
                  <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {!isLast ? (
                      <span
                        className="absolute left-[17px] top-10 bottom-0 w-px bg-[#FDE8ED]"
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C] ring-4 ring-white">
                      <CareerTimelineIcon type={item.type} />
                    </span>
                    <div className="min-w-0 flex-1 rounded-[18px] bg-[#FAFAFA] p-3.5 pr-2">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-[#FFF1F4] px-2.5 py-0.5 text-[11px] font-semibold text-[#F47C8C]">
                            {careerTypeLabel(item.type)}
                          </span>
                          <p className="mt-2 text-[15px] font-semibold leading-snug text-[#111827]">{item.title}</p>
                          {item.place ? (
                            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{item.place}</p>
                          ) : null}
                          {period ? (
                            <p className="mt-1 text-[12px] font-semibold text-[#F47C8C]">{period}</p>
                          ) : null}
                          {item.description ? (
                            <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-[#6B7280]">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                        {!isLegacy ? (
                          <CardOverflowMenu
                            ariaLabel="Действия с записью"
                            items={[
                              { id: 'edit', label: 'Редактировать', onClick: () => onEditCareer(item.id) },
                              {
                                id: 'delete',
                                label: 'Удалить',
                                onClick: () => onDeleteCareer(item.id),
                                tone: 'danger',
                              },
                            ]}
                          />
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <TrustAddButton label="Добавить опыт" onClick={onAddCareer} />
          </>
        ) : (
          <TrustEmptyState
            icon={<HiAcademicCap className="h-7 w-7" strokeWidth={1.8} aria-hidden />}
            title="Опыт пока не добавлен"
            subtitle="Расскажите клиентам о вашем образовании и практике"
            actionLabel="Добавить опыт"
            onAction={onAddCareer}
          />
        )}
      </section>
    </div>
  );
}
