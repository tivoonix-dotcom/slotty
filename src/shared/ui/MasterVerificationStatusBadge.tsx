import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { HiCheckBadge } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_SECURITY_PATH } from '../../app/paths';
import type { AccountVerificationPendingStep } from '../../features/auth/lib/accountVerification';
import { MasterVerifiedBadge } from './MasterVerifiedBadge';

const TOOLTIP_Z = 280;
const TOOLTIP_GAP = 8;
const TOOLTIP_WIDTH = 280;
const MIN_SPACE = 120;

type Props = {
  verified: boolean;
  pendingSteps: AccountVerificationPendingStep[];
  className?: string;
  settingsHref?: string;
};

function tooltipFixedStyle(anchor: DOMRect): CSSProperties {
  const pad = 12;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const width = Math.min(TOOLTIP_WIDTH, vw - pad * 2);
  let left = anchor.left + anchor.width / 2 - width / 2;
  left = Math.max(pad, Math.min(left, vw - pad - width));

  const spaceBelow = vh - anchor.bottom - TOOLTIP_GAP;
  const spaceAbove = anchor.top - TOOLTIP_GAP;
  const openUp = spaceBelow < MIN_SPACE && spaceAbove >= spaceBelow;

  if (openUp) {
    return {
      position: 'fixed',
      left,
      width,
      bottom: vh - anchor.top + TOOLTIP_GAP,
      zIndex: TOOLTIP_Z,
      maxHeight: Math.max(100, spaceAbove - pad),
    };
  }

  return {
    position: 'fixed',
    left,
    width,
    top: anchor.bottom + TOOLTIP_GAP,
    zIndex: TOOLTIP_Z,
    maxHeight: Math.max(100, spaceBelow - pad),
  };
}

function VerificationTooltipPanel({
  tooltipId,
  steps,
  settingsHref,
  onClose,
}: {
  tooltipId: string;
  steps: AccountVerificationPendingStep[];
  settingsHref: string;
  onClose: () => void;
}) {
  return (
    <div
      id={tooltipId}
      role="tooltip"
      className="overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-3 text-left shadow-[0_8px_24px_rgba(17,24,39,0.12)]"
    >
      <p className="text-[13px] font-semibold text-[#111827]">Проверенный мастер</p>
      <p className="mt-1 text-[12px] leading-snug text-[#6B7280]">
        Подключите все способы входа — клиенты увидят галочку доверия.
      </p>
      {steps.length > 0 ? (
        <ul className="mt-2.5 space-y-2">
          {steps.map((step) => (
            <li key={step.label} className="text-[12px] leading-snug text-[#374151]">
              <span className="font-semibold text-[#111827]">{step.label}</span>
              <span className="text-[#6B7280]"> — {step.hint}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        to={settingsHref}
        className="mt-3 inline-flex text-[12px] font-semibold text-[#F47C8C] no-underline hover:underline"
        onClick={onClose}
      >
        Способы входа →
      </Link>
    </div>
  );
}

export function MasterVerificationStatusBadge({
  verified,
  pendingSteps,
  className = 'h-6 w-6 shrink-0',
  settingsHref = MASTER_SETTINGS_SECURITY_PATH,
}: Props) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  const visible = pinned || hover;
  const steps = pendingSteps.length > 0 ? pendingSteps : [];

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setStyle(tooltipFixedStyle(el.getBoundingClientRect()));
  }, []);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    const onReflow = () => updatePosition();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    window.visualViewport?.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
      window.visualViewport?.removeEventListener('resize', onReflow);
    };
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = anchorRef.current;
      if (!el?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [pinned]);

  if (verified) {
    return <MasterVerifiedBadge className={className} />;
  }

  let portal: ReactNode = null;
  if (visible && typeof document !== 'undefined') {
    portal = createPortal(
      <div style={style}>
        <VerificationTooltipPanel
          tooltipId={tooltipId}
          steps={steps}
          settingsHref={settingsHref}
          onClose={() => setPinned(false)}
        />
      </div>,
      document.body,
    );
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-expanded={visible}
        aria-describedby={visible ? tooltipId : undefined}
        onClick={() => {
          setPinned((v) => !v);
          updatePosition();
        }}
        onMouseEnter={() => {
          setHover(true);
          updatePosition();
        }}
        onMouseLeave={() => setHover(false)}
        onFocus={() => {
          setHover(true);
          updatePosition();
        }}
        onBlur={() => setHover(false)}
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-[#9CA3AF] p-0.5 text-[#9CA3AF] transition hover:border-[#F47C8C]/70 hover:text-[#F47C8C]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/35 active:scale-[0.97]"
      >
        <HiCheckBadge className={className} aria-hidden />
        <span className="sr-only">Статус проверки: не завершён</span>
      </button>
      {portal}
    </>
  );
}
