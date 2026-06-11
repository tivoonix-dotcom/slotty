import { ADMIN_DESKTOP_LOGO_SRC } from '../../app/headerLogo';

/** Логотип: по центру, прижат к низу ячейки хедера (как в кабинете). */
export function MasterLandingDemoCabinetLogo() {
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <img
        src={ADMIN_DESKTOP_LOGO_SRC}
        alt=""
        className="absolute bottom-0 left-1/2 h-[6.5rem] w-auto max-w-[92%] -translate-x-1/2 translate-y-[38px] object-contain sm:h-[7rem]"
        draggable={false}
      />
    </div>
  );
}

export const masterLandingDemoSidebarColClass = 'minmax(118px,26%)';

export const masterLandingDemoDrawerClass =
  'absolute inset-y-0 right-0 z-10 flex w-[54%] min-w-[180px] max-w-[360px] flex-col overflow-hidden rounded-l-[18px] border-l border-[#EEEEEE] bg-[#F5F5F5] shadow-[-10px_0_28px_rgba(17,24,39,0.1)] sm:max-w-[400px] lg:max-w-[480px] xl:max-w-[540px]';

export const masterLandingDemoShellRound = 'overflow-hidden rounded-[16px] sm:rounded-[18px] lg:rounded-[20px]';

/** Внутренняя белая область: ниже в рамке, с запасом снизу — не обрезает анимацию. */
export const masterDemoFrameInsetClass =
  'absolute top-[10%] right-[5%] bottom-[5%] left-[5%] min-h-0 overflow-hidden sm:top-[11%] sm:right-[5.5%] sm:bottom-[4.5%] sm:left-[5.5%] lg:top-[12%] lg:bottom-[4%]';

export const masterDemoFrameInsetInnerClass = 'h-full min-h-0 w-full';

/** Hero: широкая панель демо снизу на фоновой рамке. */
export const masterDemoHeroPhoneInsetClass =
  'absolute inset-0 flex items-end justify-center px-[2%] pb-0 pt-[4%] sm:px-[2.5%] sm:pt-[5%]';

export const masterDemoHeroPhonePanelClass =
  'flex h-full w-full max-w-[28rem] flex-col overflow-hidden rounded-t-[22px] sm:max-w-[34rem] sm:rounded-t-[26px] lg:max-w-[40rem] lg:rounded-t-[28px]';

export const masterLandingDemoHeaderRowPx = '3.25rem';
