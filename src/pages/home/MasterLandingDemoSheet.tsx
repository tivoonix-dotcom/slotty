import type { FC, ReactNode, RefObject } from 'react';
import {
  servicesSheetPrimaryBtn,
  servicesSheetSecondaryBtn,
} from '../admin/services/adminServicesTheme';
import {
  catalogSheetCanvas,
  catalogSheetCloseBtn,
  catalogSheetFooter,
  catalogSheetHeader,
  catalogSheetScrollPad,
  catalogSheetScrollPadFlush,
  catalogSheetTitle,
} from '../admin/shared/adminCatalogSheetTheme';

type MasterLandingDemoSheetProps = {
  title: string;
  stepper?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  stageRef?: RefObject<HTMLDivElement | null>;
  scrollRef?: RefObject<HTMLDivElement | null>;
  ariaLabel: string;
};

const DEMO_SHEET_INTERACTION =
  'pointer-events-none select-none touch-none [&_*]:!cursor-default';

const DEMO_SCROLL_HIDE =
  'overflow-y-auto overflow-x-hidden overscroll-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

export const MasterLandingDemoSheet: FC<MasterLandingDemoSheetProps> = ({
  title,
  stepper,
  footer,
  children,
  overlay,
  stageRef,
  scrollRef,
  ariaLabel,
}) => (
  <div
    ref={stageRef}
    className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[inherit] bg-[#F5F5F5] ${DEMO_SHEET_INTERACTION}`}
    aria-label={ariaLabel}
    aria-hidden
  >
    <header className={`${catalogSheetHeader} shrink-0 !px-3.5 !pb-2 !pt-3 sm:!px-4`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 pr-1">
          <h2 className={`${catalogSheetTitle} m-0 !text-[16px] leading-snug sm:!text-[17px]`}>{title}</h2>
        </div>
        <span
          className={`${catalogSheetCloseBtn} !h-9 !w-9 !rounded-[10px] !text-[18px]`}
          aria-hidden
        >
          ×
        </span>
      </div>

      {stepper ? <div className="origin-top scale-[0.9] pb-0 pt-2">{stepper}</div> : null}
    </header>

    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 ${DEMO_SCROLL_HIDE} ${catalogSheetCanvas} ${
          stepper ? `${catalogSheetScrollPadFlush} !pt-2` : `${catalogSheetScrollPad} !pt-2`
        } !px-3.5 !pb-3 sm:!px-4`}
      >
        <div className="relative">{children}</div>
      </div>

      <div className={`${catalogSheetFooter} shrink-0 !px-3.5 !py-2.5 sm:!px-4`}>{footer}</div>
    </div>

    {overlay}
  </div>
);

export function demoFooterPair({
  leftLabel,
  rightLabel,
  rightPressing,
  rightDataAttr,
  accent = 'brand',
}: {
  leftLabel: string;
  rightLabel: string;
  rightPressing?: boolean;
  rightDataAttr: string;
  accent?: 'brand' | 'schedule';
}) {
  const primaryClass =
    accent === 'schedule'
      ? 'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#3B4CCA] px-4 text-[14px] font-semibold text-white sm:text-[15px]'
      : servicesSheetPrimaryBtn;

  return (
    <div className="flex w-full gap-3">
      <div className={`${servicesSheetSecondaryBtn} !min-h-10 !text-[13px] sm:!text-[14px]`}>{leftLabel}</div>
      <div
        data-master-demo-primary={rightDataAttr}
        className={`${primaryClass} !min-h-10 !text-[13px] sm:!text-[14px] ${rightPressing ? '!scale-[0.97] !opacity-95' : ''}`}
      >
        {rightLabel}
      </div>
    </div>
  );
}

export function scrollDemoToTop(scrollEl: HTMLElement | null) {
  scrollEl?.scrollTo({ top: 0, behavior: 'auto' });
}

export function scrollDemoToSelector(scrollEl: HTMLElement | null, selector: string) {
  const target = scrollEl?.querySelector<HTMLElement>(selector);
  if (!scrollEl || !target) return;
  const scrollRect = scrollEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const top = scrollEl.scrollTop + (targetRect.top - scrollRect.top) - 8;
  scrollEl.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
}

export function afterDemoLayout(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}
