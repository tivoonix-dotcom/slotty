import type { FC } from 'react';
import { HiEnvelope } from 'react-icons/hi2';
import { GoogleBrandIcon, TelegramBrandIcon } from '../admin/settings/workspace/integrationBrandIcons';

export type LandingDemoCursorPoint = { x: number; y: number };

export type LandingNotifyChannel = 'telegram' | 'google' | 'mail';

export function centerInLandingStage(el: HTMLElement, stage: HTMLElement): LandingDemoCursorPoint {
  const er = el.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  const pad = 10;
  const x = er.left - sr.left + er.width * 0.5;
  const y = er.top - sr.top + er.height * 0.5;
  return {
    x: Math.min(Math.max(x, pad), Math.max(pad, sr.width - pad)),
    y: Math.min(Math.max(y, pad), Math.max(pad, sr.height - pad)),
  };
}

/** Кончик стрелки — в (point.x, point.y). */
/** Кончик стрелки — строго в (point.x, point.y). */
export const LandingDemoCursor: FC<{
  point: LandingDemoCursorPoint;
  visible: boolean;
  pressing: boolean;
}> = ({ point, visible, pressing }) => (
  <div
    aria-hidden
    className={[
      'pointer-events-none absolute z-50',
      'will-change-[left,top,transform,opacity]',
      visible ? 'opacity-100' : 'opacity-0',
    ].join(' ')}
    style={{
      left: point.x,
      top: point.y,
      transform: pressing ? 'scale(0.92)' : 'scale(1)',
      transformOrigin: '0 0',
      transition:
        'opacity 260ms ease-out, transform 120ms ease-out, left 620ms cubic-bezier(0.22, 1, 0.36, 1), top 620ms cubic-bezier(0.22, 1, 0.36, 1)',
    }}
  >
    {pressing ? (
      <span
        className="absolute -left-4 -top-4 size-8 rounded-full border border-pink-300/70 bg-pink-300/15"
        style={{
          animation: 'landingCursorClick 420ms ease-out forwards',
        }}
      />
    ) : null}

    <svg
      width="28"
      height="32"
      viewBox="-3 -3 31 36"
      fill="none"
      aria-hidden
      className="block overflow-visible"
      style={{
        filter:
          'drop-shadow(0 10px 18px rgba(15, 23, 42, 0.22)) drop-shadow(0 2px 5px rgba(15, 23, 42, 0.24))',
      }}
    >
      <path
        d="M0 0L0.35 25.7L7.7 18.8L11.45 29.2L16.25 27.45L12.35 17.3H22.9L0 0Z"
        fill="white"
        stroke="rgba(15,23,42,0.88)"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />

      <path
        d="M2.15 4.35L2.35 20.45L7.95 15.15L10.75 22.95"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M0 0L0.35 25.7L7.7 18.8L11.45 29.2L16.25 27.45L12.35 17.3H22.9L0 0Z"
        fill="url(#cursorSoftGradient)"
        opacity="0.18"
      />

      <defs>
        <linearGradient
          id="cursorSoftGradient"
          x1="1"
          y1="1"
          x2="17"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="0.48" stopColor="#FCE7F3" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const CHANNEL_ICON_SIZE = 48;
const NOTIFY_PANEL_ICON_SIZE = 52;

function MailBrandIcon({ size = CHANNEL_ICON_SIZE }: { size?: number }) {
  const icon = Math.max(18, Math.round(size * 0.46));
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#6366F1]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <HiEnvelope size={icon} className="text-white" />
    </span>
  );
}

const CHANNEL_ACTIVE_CLASS: Record<LandingNotifyChannel, string> = {
  telegram: 'scale-110 drop-shadow-[0_10px_24px_rgba(42,171,238,0.42)]',
  google: 'scale-110 drop-shadow-[0_10px_24px_rgba(66,133,244,0.38)]',
  mail: 'scale-110 drop-shadow-[0_10px_24px_rgba(99,102,241,0.38)]',
};

export const LandingNotifyChannelIcons: FC<{ activeChannel?: LandingNotifyChannel | null }> = ({
  activeChannel = null,
}) => (
  <div className="flex items-center justify-center gap-5 sm:gap-7">
    <div
      data-landing-channel="telegram"
      className={`rounded-full transition duration-300 ${
        activeChannel === 'telegram' ? CHANNEL_ACTIVE_CLASS.telegram : 'scale-100'
      }`}
    >
      <TelegramBrandIcon size={CHANNEL_ICON_SIZE} />
    </div>
    <div
      data-landing-channel="google"
      className={`rounded-full transition duration-300 ${
        activeChannel === 'google' ? CHANNEL_ACTIVE_CLASS.google : 'scale-100'
      }`}
    >
      <GoogleBrandIcon size={CHANNEL_ICON_SIZE} />
    </div>
    <div
      data-landing-channel="mail"
      className={`rounded-full transition duration-300 ${
        activeChannel === 'mail' ? CHANNEL_ACTIVE_CLASS.mail : 'scale-100'
      }`}
    >
      <MailBrandIcon />
    </div>
  </div>
);

export const LandingNotifyChannelLogo: FC<{
  channel: LandingNotifyChannel;
  size?: number;
}> = ({ channel, size = NOTIFY_PANEL_ICON_SIZE }) => {
  if (channel === 'telegram') return <TelegramBrandIcon size={size} />;
  if (channel === 'google') return <GoogleBrandIcon size={size} />;
  return <MailBrandIcon size={size} />;
};
