import { useEffect, useMemo, useState } from 'react';
import { PortfolioImagePreview } from '../client/masterProfile/PortfolioImagePreview';
import { HiAcademicCap, HiPhoto, HiShieldCheck } from 'react-icons/hi2';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import { CertificatePreviewCard } from './CertificatePreviewCard';
import {
  formatEducationPeriod,
  sortEducationItemsChronologically,
  type OnboardingEducationItem,
} from './onboardingEducation';

export type OnboardingReviewTrustTab = 'portfolio' | 'certificates' | 'education';

type TabDef = {
  id: OnboardingReviewTrustTab;
  label: string;
  icon: typeof HiPhoto;
  count: number;
};

type Props = {
  certificates: MasterCertificate[];
  educationItems: OnboardingEducationItem[];
  className?: string;
};

function certsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'сертификат'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'сертификата'
        : 'сертификатов';
  return `${count} ${word}`;
}

function pickDefaultTab(
  certificates: MasterCertificate[],
  educationCount: number,
): OnboardingReviewTrustTab {
  if (certificates.length > 0) return 'certificates';
  if (educationCount > 0) return 'education';
  return 'portfolio';
}

function PortfolioEmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] bg-[#FAFAFA] px-4 py-10 text-center ring-1 ring-[#EEEEEE]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#F47C8C]">
        <HiPhoto className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 text-[14px] font-semibold text-[#111827]">Пока нет работ</p>
      <p className="mt-1 max-w-[16rem] text-[12px] font-medium leading-snug text-[#6B7280]">
        После публикации добавьте фото в кабинете — они появятся в портфолио на профиле
      </p>
    </div>
  );
}

function CertificatesPanel({ certificates }: { certificates: MasterCertificate[] }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const imageUrls = useMemo(
    () =>
      certificates
        .map((c) => c.imageUrl?.trim())
        .filter((url): url is string => Boolean(url)),
    [certificates],
  );

  if (certificates.length === 0) {
    return (
      <p className="rounded-[14px] bg-[#FAFAFA] px-4 py-8 text-center text-[13px] font-medium leading-snug text-[#6B7280] ring-1 ring-[#EEEEEE]">
        Сертификаты не добавлены — можно заполнить на предыдущем шаге или позже в кабинете
      </p>
    );
  }

  const openPreview = (certificate: MasterCertificate) => {
    const url = certificate.imageUrl?.trim();
    if (!url) return;
    const index = imageUrls.indexOf(url);
    setPreviewIndex(index >= 0 ? index : 0);
  };

  return (
    <>
      <div className="pointer-events-auto -mx-0.5 flex gap-3 overflow-x-auto pb-1 pl-0.5 pr-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {certificates.map((certificate, i) => (
          <CertificatePreviewCard
            key={certificate.id}
            certificate={{
              id: certificate.id,
              title: certificate.title,
              organization: certificate.organization,
              year: certificate.year,
              imageUrl: certificate.imageUrl,
            }}
            loading={i === 0 ? 'eager' : 'lazy'}
            onImageClick={
              certificate.imageUrl?.trim() ? () => openPreview(certificate) : undefined
            }
          />
        ))}
      </div>
      {previewIndex != null && imageUrls.length > 0 ? (
        <PortfolioImagePreview
          urls={imageUrls}
          index={previewIndex}
          singleLabel="Сертификат"
          onClose={() => setPreviewIndex(null)}
          onIndexChange={setPreviewIndex}
        />
      ) : null}
    </>
  );
}

function EducationPanel({ items }: { items: OnboardingEducationItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-[14px] bg-[#FAFAFA] px-4 py-8 text-center text-[13px] font-medium leading-snug text-[#6B7280] ring-1 ring-[#EEEEEE]">
        Образование не указано — можно добавить на шаге «Доверие» или позже в кабинете
      </p>
    );
  }

  return (
    <ul className="relative space-y-0">
      {items.map((item, index) => {
        const period = formatEducationPeriod(item.startYear, item.endYear);
        const meta = [item.place.trim(), period].filter(Boolean).join(' · ');
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[15px] top-9 bottom-0 w-px bg-[#FDE8ED]"
                aria-hidden
              />
            ) : null}
            <span
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[11px] font-bold text-[#F47C8C] ring-4 ring-white"
              aria-hidden
            >
              У
            </span>
            <div className="min-w-0 flex-1 rounded-[14px] bg-[#FAFAFA] p-3 ring-1 ring-[#EEEEEE]">
              <p className="text-[14px] font-semibold leading-snug text-[#111827]">{item.title}</p>
              {meta ? (
                <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{meta}</p>
              ) : null}
              {item.description?.trim() ? (
                <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-[#6B7280]">
                  {item.description.trim()}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OnboardingReviewTrustTabs({ certificates, educationItems, className = '' }: Props) {
  const education = useMemo(
    () =>
      sortEducationItemsChronologically(
        educationItems.filter((e) => e.title.trim().length >= 2),
      ),
    [educationItems],
  );

  const tabs: TabDef[] = useMemo(
    () => [
      { id: 'portfolio', label: 'Портфолио', icon: HiPhoto, count: 0 },
      { id: 'certificates', label: 'Сертификаты', icon: HiShieldCheck, count: certificates.length },
      { id: 'education', label: 'Образование', icon: HiAcademicCap, count: education.length },
    ],
    [certificates.length, education.length],
  );

  const [active, setActive] = useState<OnboardingReviewTrustTab>(() =>
    pickDefaultTab(certificates, education.length),
  );

  useEffect(() => {
    setActive((prev) => {
      if (prev === 'certificates' && certificates.length === 0) {
        return pickDefaultTab(certificates, education.length);
      }
      if (prev === 'education' && education.length === 0) {
        return pickDefaultTab(certificates, education.length);
      }
      return prev;
    });
  }, [certificates.length, education.length]);

  const activeMeta =
    active === 'certificates' && certificates.length > 0
      ? certsCountLabel(certificates.length)
      : active === 'education' && education.length > 0
        ? education.length === 1
          ? '1 запись'
          : education.length < 5
            ? `${education.length} записи`
            : `${education.length} записей`
        : null;

  return (
    <section
      className={`overflow-visible rounded-[16px] bg-white ring-1 ring-[#EAECEF] ${className}`.trim()}
      aria-label="Портфолио, сертификаты и образование"
    >
      <div className="border-b border-[#F3F4F6] px-2 pt-2 sm:px-3">
        <nav
          className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Разделы доверия"
        >
          {tabs.map((tab) => {
            const selected = active === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(tab.id)}
                className={`relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-[12px] px-3 py-3 transition ${
                  selected
                    ? 'bg-white text-[#F47C8C]'
                    : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#374151]'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span className="text-[12px] font-semibold sm:text-[13px]">{tab.label}</span>
                {tab.count > 0 ? (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      selected ? 'bg-[#FFF1F4] text-[#F47C8C]' : 'bg-[#F3F4F6] text-[#6B7280]'
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
                {selected ? (
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pointer-events-none p-4 sm:p-5">
        {activeMeta ? (
          <p className="mb-3 text-[12px] font-medium text-[#6B7280]">{activeMeta}</p>
        ) : null}
        {active === 'portfolio' ? <PortfolioEmptyPanel /> : null}
        {active === 'certificates' ? <CertificatesPanel certificates={certificates} /> : null}
        {active === 'education' ? <EducationPanel items={education} /> : null}
      </div>
    </section>
  );
}
