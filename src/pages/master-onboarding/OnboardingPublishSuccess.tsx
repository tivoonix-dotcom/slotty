import { HiArrowRight, HiCalendarDays, HiPhoto, HiShare, HiSparkles } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { ADMIN_PATH, ADMIN_SCHEDULE_PATH, getMasterPath } from '../../app/paths';
import {
  onboardingEyebrowClass,
  onboardingStepTitleClass,
} from './onboardingFormField';

import { MINI_PICTURE } from '../../shared/ui/miniPictureSrc';

const NEXT_STEPS = [
  {
    icon: HiCalendarDays,
    title: 'Окна для записи',
    text: 'Добавьте свободные слоты — без них клиенты не смогут выбрать время',
    href: `${ADMIN_SCHEDULE_PATH}?tab=create&wizard=month`,
    primary: true,
  },
  {
    icon: HiPhoto,
    title: 'Портфолио',
    text: 'Добавьте фото работ — клиенты чаще записываются',
    href: ADMIN_PATH,
  },
  {
    icon: HiShare,
    title: 'Публикация профиля',
    text: 'После слотов включите видимость профиля в кабинете',
    href: ADMIN_PATH,
  },
] as const;

type Props = {
  masterName?: string;
  onOpenProfile: () => void;
};

export function OnboardingPublishSuccess({ masterName, onOpenProfile }: Props) {
  const greeting = masterName?.trim() ? `${masterName.trim()}, профиль создан` : 'Профиль создан';

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#111827] lg:bg-[#F5F5F5]">
      <div className="flex flex-1 items-center px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:px-4 lg:px-6 lg:py-10">
        <div className="mx-auto w-full min-w-0 max-w-2xl lg:max-w-4xl">
          <div className="rounded-[42px] bg-[#F1EFEF] p-2 shadow-[0_24px_70px_rgba(17,17,17,0.06)] sm:p-2.5 lg:rounded-[28px] lg:p-3">
            <div className="overflow-hidden rounded-[34px] bg-white lg:rounded-[22px]">
              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
                <div className="px-5 py-8 sm:px-8 sm:py-10 lg:flex lg:flex-col lg:justify-center lg:py-10 lg:pl-10 lg:pr-6 xl:pl-12">
                  <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[12px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
                      <HiSparkles className="h-4 w-4 shrink-0" aria-hidden />
                      {greeting}
                    </span>

                    <p className={`${onboardingEyebrowClass} mt-4`}>Почти готово</p>
                    <h1 className={`${onboardingStepTitleClass} lg:text-[34px] xl:text-[38px]`}>
                      Осталось добавить окна записи
                    </h1>

                    <p className="mt-3 max-w-md text-[15px] font-medium leading-relaxed text-[#6B7280] lg:text-[16px]">
                      Услуги и профиль сохранены. Чтобы клиенты могли записаться онлайн, создайте окна в
                      расписании и опубликуйте профиль в кабинете.
                    </p>
                  </div>

                  <ul className="mt-8 space-y-2.5">
                    {NEXT_STEPS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li
                          key={item.title}
                          className="flex items-start gap-3 rounded-[14px] bg-[#FAFAFA] px-3.5 py-3 ring-1 ring-[#EEEEEE]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
                            <Icon className="h-[18px] w-[18px]" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 pt-0.5 text-left">
                            <span className="block text-[14px] font-semibold text-[#111827]">{item.title}</span>
                            <span className="mt-0.5 block text-[12px] font-medium leading-snug text-[#6B7280]">
                              {item.text}
                            </span>
                            {'primary' in item && item.primary ? (
                              <Link
                                to={item.href}
                                className="mt-2 inline-flex text-[13px] font-semibold text-[#F47C8C] hover:underline"
                              >
                                Добавить окна записи
                              </Link>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
                    <Link
                      to={`${ADMIN_SCHEDULE_PATH}?tab=create&wizard=month`}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#E29595] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition hover:opacity-95 active:scale-[0.98]"
                    >
                      Добавить окна записи
                      <HiArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={onOpenProfile}
                      className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[15px] font-semibold text-[#111827] transition hover:bg-[#EBE8E8] active:scale-[0.98]"
                    >
                      Перейти в профиль
                    </button>
                    <Link
                      to={ADMIN_PATH}
                      className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[15px] font-semibold text-[#111827] transition hover:bg-[#EBE8E8] active:scale-[0.98]"
                    >
                      Открыть кабинет
                    </Link>
                  </div>

                </div>

                <div className="relative border-t border-[#F3F4F6] bg-gradient-to-b from-[#FFF9FB] via-[#FFF1F4]/40 to-[#FAFAFA] px-6 py-8 lg:border-l lg:border-t-0 lg:px-5 lg:py-10">
                  <div
                    className="pointer-events-none absolute -right-8 top-6 h-24 w-24 rounded-full bg-[#F47C8C]/10 blur-2xl lg:right-4"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute bottom-8 left-4 h-20 w-20 rounded-full bg-[#E29595]/15 blur-2xl"
                    aria-hidden
                  />
                  <img
                    src={MINI_PICTURE.publishSuccess}
                    alt=""
                    aria-hidden
                    className="relative mx-auto w-full max-w-[15rem] object-contain drop-shadow-[0_18px_40px_rgba(244,124,140,0.12)] sm:max-w-[17rem] lg:max-w-full"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[12px] font-medium leading-snug text-[#9CA3AF] lg:mt-5">
            Тариф и настройки можно изменить в любой момент в кабинете мастера
          </p>
        </div>
      </div>
    </div>
  );
}

/** Навигация после публикации — вынесена для переиспользования в BecomeMasterPage. */
export function navigateAfterPublish(
  navigate: (path: string) => void,
  profileId: string | null | undefined,
): void {
  if (profileId) {
    navigate(getMasterPath(profileId));
    return;
  }
  navigate(ADMIN_PATH);
}
