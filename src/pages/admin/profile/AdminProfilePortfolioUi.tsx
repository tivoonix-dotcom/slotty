import { useState, type ReactNode } from 'react';
import type { MasterDraft, MasterPortfolioItem } from '../../../features/profile/lib/demoMasterStorage';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { CabinetIcon, type CabinetIconName } from './cabinetIcons';
import { normalizeMasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { cabinetCard } from './adminProfileCabinetTheme';
import {
  profileDesktopFlatSection,
  profileDesktopStack,
  profileDesktopStackItem,
} from './adminProfileDashboardTheme';

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

const trustSectionCard = `${cabinetCard} p-[18px] shadow-[0_8px_32px_rgba(17,24,39,0.05)] ${profileDesktopFlatSection}`;

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
  icon: CabinetIconName;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
};

function SheetActionRow({
  label,
  icon,
  onClick,
  disabled = false,
  tone = 'default',
}: {
  label: string;
  icon: CabinetIconName;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  const isDanger = tone === 'danger';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-12 w-full items-center gap-3 rounded-[17px] px-3.5 transition active:scale-[0.99] disabled:opacity-45 ${
        isDanger ? 'bg-[#FFF1F4] active:bg-[#FFE4EA]' : 'bg-[#F7F7F8] active:bg-[#F3F4F6]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isDanger ? 'bg-white text-red-500' : 'bg-[#FFF1F4] text-[#F47C8C]'
        }`}
      >
        <CabinetIcon name={icon} size={18} />
      </span>
      <span
        className={`min-w-0 flex-1 text-left text-[15px] font-semibold ${
          isDanger ? 'text-red-600' : 'text-[#111827]'
        }`}
      >
        {label}
      </span>
      <CabinetIcon name="chevron-right" size={16} className="shrink-0 text-[#D1D5DB]" />
    </button>
  );
}

function CardOverflowMenu({
  items,
  ariaLabel,
  sheetTitle = 'Действия',
}: {
  items: OverflowMenuItem[];
  ariaLabel: string;
  sheetTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111827] shadow-[0_4px_14px_rgba(17,24,39,0.12)] transition active:scale-[0.95]"
      >
        <CabinetIcon name="more" size={20} />
      </button>
      <AdminBottomSheet open={open} onClose={close} title={sheetTitle}>
        <div className="flex flex-col gap-2 pb-1" role="menu" aria-label={sheetTitle}>
          {items.map((item) => (
            <SheetActionRow
              key={item.id}
              label={item.label}
              icon={item.icon}
              tone={item.tone}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                close();
                item.onClick();
              }}
            />
          ))}
        </div>
      </AdminBottomSheet>
    </>
  );
}

function TrustBlockHeader({
  title,
  description,
  countLabel,
  showBadge = true,
}: {
  title: string;
  description?: string;
  countLabel?: string;
  showBadge?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 pr-1">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">{title}</h2>
        {description?.trim() ? (
          <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{description}</p>
        ) : null}
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
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-[20px] bg-[#FAFAFA] px-4 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
        {icon}
      </span>
      <p className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-[#6B7280]">{subtitle}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className={`${trustAddBtn} mt-5 max-w-full disabled:opacity-45`}
      >
        <CabinetIcon name="plus" size={20} className="shrink-0" />
        {actionLabel.replace(/^\+ /, '')}
      </button>
    </div>
  );
}

function TrustAddButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${trustAddBtn} disabled:opacity-45`}>
      <CabinetIcon name="plus" size={20} className="shrink-0" />
      {label.replace(/^\+ /, '')}
    </button>
  );
}

function CareerTimelineIcon({ type }: { type: CareerItemType }) {
  if (type === 'education' || type === 'course') {
    return <CabinetIcon name="graduation" size={18} />;
  }
  return <CabinetIcon name="briefcase" size={18} />;
}

function formatCareerPeriod(startYear?: string, endYear?: string): string | null {
  const start = startYear?.trim();
  const end = endYear?.trim();
  if (!start && !end) return null;
  return `${start || '…'} — ${end || 'сейчас'}`;
}

const portfolioTextBreak = 'break-words [overflow-wrap:anywhere]';

function PortfolioWorkDetailSheet({
  item,
  isCover,
  categoryLabel,
  open,
  onClose,
  onEdit,
  onDelete,
  onSetCover,
  actionsDisabled,
}: {
  item: MasterPortfolioItem;
  isCover: boolean;
  categoryLabel: string;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetCover: () => void;
  actionsDisabled?: boolean;
}) {
  const imageUrl = item.imageUrl?.trim() ?? '';
  const title = item.title?.trim() || 'Без названия';
  const description = item.description?.trim() ?? '';

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Работа">
      <div className="space-y-4 pb-1">
        <div className="overflow-hidden rounded-[20px] bg-[#F3F4F6]">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="aspect-[4/5] w-full object-cover" decoding="async" />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center text-[#9CA3AF]">
              <CabinetIcon name="photo" size={48} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {isCover ? (
            <span className="inline-flex rounded-full bg-[#111827] px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Обложка портфолио
            </span>
          ) : null}
          <h3 className={`text-[18px] font-bold leading-snug tracking-[-0.03em] text-[#111827] ${portfolioTextBreak}`}>
            {title}
          </h3>
          {categoryLabel ? (
            <p className={`text-[14px] font-medium text-[#6B7280] ${portfolioTextBreak}`}>{categoryLabel}</p>
          ) : null}
          {description ? (
            <p className={`text-[15px] leading-relaxed text-[#374151] ${portfolioTextBreak}`}>{description}</p>
          ) : (
            <p className="text-[14px] text-[#9CA3AF]">Описание не добавлено</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <SheetActionRow
            label="Редактировать"
            icon="pencil"
            disabled={actionsDisabled}
            onClick={() => {
              onClose();
              onEdit();
            }}
          />
          <SheetActionRow
            label={isCover ? 'Уже обложка' : 'Сделать обложкой'}
            icon="star"
            disabled={actionsDisabled || !imageUrl || isCover}
            onClick={() => {
              onSetCover();
              onClose();
            }}
          />
          <SheetActionRow
            label="Удалить"
            icon="trash"
            tone="danger"
            disabled={actionsDisabled}
            onClick={() => {
              onClose();
              onDelete();
            }}
          />
        </div>
      </div>
    </AdminBottomSheet>
  );
}

function PortfolioWorkCard({
  item,
  index,
  isCover,
  categoryLabel,
  onOpenDetail,
  onEditPortfolio,
  onDeletePortfolio,
  onSetPortfolioCover,
}: {
  item: MasterPortfolioItem;
  index: number;
  isCover: boolean;
  categoryLabel: string;
  onOpenDetail: () => void;
  onEditPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
  onSetPortfolioCover: (portfolioItemId: string) => void;
}) {
  const imageUrl = item.imageUrl?.trim() ?? '';
  const title = item.title?.trim() || 'Без названия';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] bg-[#FAFAFA] shadow-[0_4px_16px_rgba(17,24,39,0.05)]">
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-t-[20px] bg-[#F3F4F6]">
        <button
          type="button"
          onClick={onOpenDetail}
          className="absolute inset-0 z-0 block h-full w-full text-left"
          aria-label={`Подробнее: ${title}`}
        >
          {imageUrl ? (
            <ImageReveal
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading={index < 4 ? 'eager' : 'lazy'}
              fetchPriority={index < 2 ? 'high' : 'low'}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
              <CabinetIcon name="photo" size={40} />
            </span>
          )}
        </button>
        {isCover ? (
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-[#111827]/80 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            Обложка
          </span>
        ) : null}
        <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
          <CardOverflowMenu
            ariaLabel="Действия с работой"
            sheetTitle="Работа"
            items={[
              {
                id: 'detail',
                label: 'Подробнее',
                icon: 'photo',
                onClick: onOpenDetail,
              },
              {
                id: 'cover',
                label: isCover ? 'Уже обложка' : 'Сделать обложкой',
                icon: 'star',
                onClick: () => onSetPortfolioCover(item.id),
                disabled: !imageUrl || isCover,
              },
              {
                id: 'edit',
                label: 'Редактировать',
                icon: 'pencil',
                onClick: () => onEditPortfolio(item.id),
              },
              {
                id: 'delete',
                label: 'Удалить',
                icon: 'trash',
                onClick: () => onDeletePortfolio(item.id),
                tone: 'danger',
              },
            ]}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`Подробнее: ${title}`}
        className="flex min-h-[5.5rem] flex-1 flex-col px-3 pb-3 pt-2.5 text-left"
      >
        <p
          className={`line-clamp-2 min-h-[2.75rem] text-[14px] font-semibold leading-[1.375rem] text-[#111827] ${portfolioTextBreak}`}
        >
          {title}
        </p>
        <p
          className={`mt-1 line-clamp-2 min-h-[2.5rem] text-[12px] leading-[1.25rem] text-[#6B7280] ${portfolioTextBreak} ${categoryLabel ? '' : 'invisible'}`}
        >
          {categoryLabel || '\u00a0'}
        </p>
      </button>
    </article>
  );
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
  actionsDisabled = false,
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
  onSetPortfolioCover: (portfolioItemId: string) => void;
  actionsDisabled?: boolean;
}) {
  const [portfolioDetailId, setPortfolioDetailId] = useState<string | null>(null);
  const careerItems = normalizeCareerItems(draft);
  const certificates = draft.certificates ?? [];
  const portfolio = draft.portfolio ?? [];
  const portfolioCoverId = draft.portfolioCoverId?.trim() ?? '';
  const categoryHint = draft.category?.trim() ?? '';
  const portfolioDetailItem = portfolioDetailId
    ? portfolio.find((p) => p.id === portfolioDetailId)
    : undefined;

  return (
    <div className={profileDesktopStack}>
      {/* Работы */}
      <section className={`${trustSectionCard} ${profileDesktopStackItem}`}>
        <TrustBlockHeader title="Работы" countLabel={worksCountLabel(portfolio.length)} />

        {portfolio.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-1 items-stretch gap-3 min-[380px]:grid-cols-2">
              {portfolio.map((item, i) => {
                const isCover = Boolean(portfolioCoverId && item.id === portfolioCoverId);
                const categoryLabel = item.description?.trim() || categoryHint || '';

                return (
                  <PortfolioWorkCard
                    key={item.id}
                    item={item}
                    index={i}
                    isCover={isCover}
                    categoryLabel={categoryLabel}
                    onOpenDetail={() => setPortfolioDetailId(item.id)}
                    onEditPortfolio={onEditPortfolio}
                    onDeletePortfolio={onDeletePortfolio}
                    onSetPortfolioCover={onSetPortfolioCover}
                  />
                );
              })}
            </div>
            {portfolioDetailItem ? (
              <PortfolioWorkDetailSheet
                item={portfolioDetailItem}
                isCover={Boolean(
                  portfolioCoverId && portfolioDetailItem.id === portfolioCoverId,
                )}
                categoryLabel={
                  portfolioDetailItem.description?.trim() || categoryHint || ''
                }
                open={Boolean(portfolioDetailId)}
                onClose={() => setPortfolioDetailId(null)}
                onEdit={() => onEditPortfolio(portfolioDetailItem.id)}
                onDelete={() => {
                  setPortfolioDetailId(null);
                  onDeletePortfolio(portfolioDetailItem.id);
                }}
                onSetCover={() => onSetPortfolioCover(portfolioDetailItem.id)}
                actionsDisabled={actionsDisabled}
              />
            ) : null}
            <TrustAddButton label="Добавить работу" onClick={onAddPortfolio} disabled={actionsDisabled} />
          </>
        ) : (
          <TrustEmptyState
            icon={<CabinetIcon name="camera" size={28} />}
            title="Пока нет работ"
            subtitle="Добавьте первые фото, чтобы клиенты увидели ваш стиль"
            actionLabel="Добавить работу"
            onAction={onAddPortfolio}
            disabled={actionsDisabled}
          />
        )}
      </section>

      {/* Сертификаты */}
      <section className={`${trustSectionCard} ${profileDesktopStackItem}`}>
        <TrustBlockHeader title="Сертификаты" countLabel={certsCountLabel(certificates.length)} />

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
                        sheetTitle="Сертификат"
                        items={[
                          {
                            id: 'edit',
                            label: 'Редактировать',
                            icon: 'pencil',
                            onClick: () => onEditCert(certificate.id),
                          },
                          {
                            id: 'delete',
                            label: 'Удалить',
                            icon: 'trash',
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
                          <CabinetIcon name="certificate" size={36} />
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
            <TrustAddButton label="Добавить сертификат" onClick={onAddCert} disabled={actionsDisabled} />
          </>
        ) : (
          <TrustEmptyState
            icon={<CabinetIcon name="certificate" size={28} />}
            title="Сертификаты не добавлены"
            subtitle="Добавьте документы, чтобы повысить доверие клиентов"
            actionLabel="Добавить сертификат"
            onAction={onAddCert}
            disabled={actionsDisabled}
          />
        )}
      </section>

      {/* Опыт и образование */}
      <section className={`${trustSectionCard} ${profileDesktopStackItem}`}>
        <TrustBlockHeader
          title="Опыт и образование"
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
                            sheetTitle="Запись опыта"
                            items={[
                              {
                                id: 'edit',
                                label: 'Редактировать',
                                icon: 'pencil',
                                onClick: () => onEditCareer(item.id),
                              },
                              {
                                id: 'delete',
                                label: 'Удалить',
                                icon: 'trash',
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
            <TrustAddButton label="Добавить опыт" onClick={onAddCareer} disabled={actionsDisabled} />
          </>
        ) : (
          <TrustEmptyState
            icon={<CabinetIcon name="graduation" size={28} />}
            title="Опыт пока не добавлен"
            subtitle="Расскажите клиентам о вашем образовании и практике"
            actionLabel="Добавить опыт"
            onAction={onAddCareer}
            disabled={actionsDisabled}
          />
        )}
      </section>
    </div>
  );
}
