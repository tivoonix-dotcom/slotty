import { useState, type ReactNode } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { MINI_PICTURE } from '../../../shared/ui/miniPictureSrc';
import type { MiniPictureKey } from '../../../shared/ui/miniPictureSrc';
import {
  APPOINTMENTS_EMPTY_ILLUSTRATION_SRC,
  apptDetailNextStepsCard,
  apptCardShell,
  apptListGap,
} from './adminAppointmentsTheme';
import { AppointmentsCardDetailFooter } from './AppointmentsCardDetailFooter';
import { APPOINTMENTS_REQUESTS_GUIDE_DEMOS } from './appointmentsRequestsGuideDemos';

function AppointmentsGuideStepDemo({ demoKey }: { demoKey?: string }) {
  if (!demoKey) return null;
  const Demo = APPOINTMENTS_REQUESTS_GUIDE_DEMOS[demoKey];
  if (!Demo) return null;
  return (
    <div className="mt-3">
      <Demo />
    </div>
  );
}

export type AppointmentsEmptyDetailStep = {
  title: string;
  text: string;
  demoKey?: string;
};

export type AppointmentsEmptyDetail = {
  title: string;
  paragraphs?: string[];
  intro?: string;
  steps?: AppointmentsEmptyDetailStep[];
  tips?: {
    title: string;
    items: string[];
    demoKey?: string;
  };
  useLogo?: boolean;
  picture?: MiniPictureKey;
  illustrationSrc?: string;
};

type Props = {
  title: string;
  text: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
  picture?: MiniPictureKey;
  illustrationSrc?: string;
  detail?: AppointmentsEmptyDetail;
};

function resolveIllustrationSrc({
  picture,
  illustrationSrc,
}: Pick<Props, 'picture' | 'illustrationSrc'>): string | null {
  if (picture) return MINI_PICTURE[picture];
  if (illustrationSrc) return illustrationSrc;
  return APPOINTMENTS_EMPTY_ILLUSTRATION_SRC;
}

function AppointmentsEmptyGuideContent({
  detail,
  detailArtSrc,
}: {
  detail: AppointmentsEmptyDetail;
  detailArtSrc: string | null;
}) {
  const hasRichGuide = Boolean(detail.intro || detail.steps?.length || detail.tips);

  if (!hasRichGuide) {
    return (
      <div className="w-full space-y-3 text-left">
        {(detail.paragraphs ?? []).map((paragraph) => (
          <p key={paragraph} className="text-[14px] leading-relaxed text-[#6B7280]">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-left">
      {detail.useLogo ? (
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[16px] bg-[#F5F5F5]">
            <img
              src={HEADER_LOGO_SRC}
              alt=""
              className="h-10 w-auto max-w-none object-contain object-center scale-[1.35]"
            />
          </div>
        </div>
      ) : detailArtSrc ? (
        <img
          src={detailArtSrc}
          alt=""
          decoding="async"
          draggable={false}
          className="mx-auto w-full max-w-[15rem] select-none object-contain sm:max-w-[17rem]"
        />
      ) : detail.picture ? (
        <MiniPicture name={detail.picture} variant="hero" />
      ) : null}

      {detail.intro ? (
        <p className="text-[14px] font-medium leading-relaxed text-[#374151]">{detail.intro}</p>
      ) : null}

      {detail.steps?.length ? (
        <ul className="rounded-[20px] bg-white px-4 py-4 sm:px-5 sm:py-5">
          {detail.steps.map((step, index) => {
            const isLast = index === detail.steps!.length - 1;

            return (
              <li key={step.title} className="relative flex gap-3.5 last:pb-0">
                <div className="flex w-9 shrink-0 flex-col items-center">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[15px] font-black tabular-nums text-[#F47C8C] ring-4 ring-white"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  {!isLast ? (
                    <div className="mt-1 flex flex-1 flex-col items-center pb-1" aria-hidden>
                      <span className="w-0.5 min-h-[0.75rem] flex-1 bg-gradient-to-b from-[#F47C8C]/55 via-[#FCD5DE] to-[#F5F5F5]" />
                      <HiChevronDown className="h-4 w-4 shrink-0 text-[#F47C8C]" />
                      <span className="w-0.5 min-h-[0.5rem] flex-1 bg-gradient-to-b from-[#F5F5F5] to-transparent" />
                    </div>
                  ) : null}
                </div>

                <div className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                  <p className="pt-1.5 text-[14px] font-bold tracking-[-0.02em] text-[#111827]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{step.text}</p>
                  <AppointmentsGuideStepDemo demoKey={step.demoKey} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {detail.tips ? (
        <div className={apptDetailNextStepsCard}>
          <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827]">{detail.tips.title}</p>
          <AppointmentsGuideStepDemo demoKey={detail.tips.demoKey} />
          <ul className="mt-3 space-y-2.5">
            {detail.tips.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#6B7280]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47C8C]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(detail.paragraphs ?? []).map((paragraph) => (
        <p key={paragraph} className="text-[14px] leading-relaxed text-[#6B7280]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function AppointmentsEmptyState({
  title,
  text,
  hint,
  action,
  icon,
  picture,
  illustrationSrc,
  detail,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const artSrc = resolveIllustrationSrc({ picture, illustrationSrc });
  const detailArtSrc =
    detail?.useLogo
      ? null
      : detail?.illustrationSrc ??
        (detail?.picture ? MINI_PICTURE[detail.picture] : null) ??
        artSrc;

  return (
    <>
      <section className={apptCardShell}>
        <div className="flex flex-col items-center px-5 py-8 text-center sm:px-8 sm:py-10">
          {icon ? <div className="mb-4">{icon}</div> : null}

          {artSrc ? (
            <img
              src={artSrc}
              alt=""
              width={320}
              height={280}
              decoding="async"
              draggable={false}
              className="mx-auto mb-4 w-full max-w-[15rem] select-none object-contain sm:max-w-[16.5rem]"
            />
          ) : null}

          <h3 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] sm:text-[20px]">
            {title}
          </h3>
          <p className="mt-2 max-w-[22rem] text-[14px] leading-relaxed text-[#6B7280] sm:leading-7">
            {text}
          </p>
          {hint ? (
            <p className="mt-2 max-w-[22rem] text-[13px] leading-relaxed text-[#9CA3AF]">{hint}</p>
          ) : null}
          {action ? (
            <div className={`mt-6 w-full max-w-[22rem] ${apptListGap}`}>{action}</div>
          ) : null}
        </div>

        {detail ? (
          <AppointmentsCardDetailFooter onClick={() => setDetailOpen(true)} />
        ) : null}
      </section>

      {detail ? (
        <AdminBottomSheet
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={detail.title}
          variant="catalog"
        >
          <AppointmentsEmptyGuideContent detail={detail} detailArtSrc={detailArtSrc} />
        </AdminBottomSheet>
      ) : null}
    </>
  );
}
