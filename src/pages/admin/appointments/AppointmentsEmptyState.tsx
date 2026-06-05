import { useState, type ReactNode } from 'react';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { MINI_PICTURE } from '../../../shared/ui/miniPictureSrc';
import type { MiniPictureKey } from '../../../shared/ui/miniPictureSrc';
import {
  APPOINTMENTS_EMPTY_ILLUSTRATION_SRC,
  apptCardShell,
  apptListGap,
} from './adminAppointmentsTheme';
import { AppointmentsCardDetailFooter } from './AppointmentsCardDetailFooter';

export type AppointmentsEmptyDetail = {
  title: string;
  paragraphs: string[];
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
    detail?.illustrationSrc ??
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
          <div className="flex flex-col items-center px-1 pb-2 pt-1 text-center">
            {detailArtSrc ? (
              <img
                src={detailArtSrc}
                alt=""
                decoding="async"
                draggable={false}
                className="mx-auto mb-3 w-full max-w-[15rem] select-none object-contain sm:max-w-[17rem]"
              />
            ) : detail?.picture ? (
              <MiniPicture name={detail.picture} variant="hero" className="mb-2" />
            ) : null}
            <div className="w-full space-y-3 text-left">
              {detail.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[14px] leading-7 text-[#6B7280]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </AdminBottomSheet>
      ) : null}
    </>
  );
}
