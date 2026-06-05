import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import {
  ADMIN_SCHEDULE_PATH,
  ADMIN_SERVICES_PATH,
  getMasterAdminAppointmentsPath,
} from '../../../app/paths';
import { PinkArcHighlight } from '../../../shared/ui/PinkArcUnderline';
import type { DailyHubState } from '../masterReadiness';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';

type Props = {
  state: DailyHubState;
  pendingCount: number;
  masterId: string | null | undefined;
  profileReady: boolean;
};

export function DailyHubStateBanner({ state, pendingCount, masterId, profileReady }: Props) {
  if (state === 'default') return null;

  if (state === 'no_services') {
    return (
      <div className="rounded-[16px] bg-[#f6f7fb] p-5 lg:rounded-[20px] lg:p-6">
        <p className="text-[16px] font-bold text-[#111827]">
          Добавьте первую услугу, чтобы клиенты понимали, на что можно записаться
        </p>
        <Link
          to={ADMIN_SERVICES_PATH}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]"
        >
          Добавить услугу
        </Link>
      </div>
    );
  }

  if (state === 'no_slots') {
    return (
      <div className="rounded-[16px] bg-[#FFF7ED] p-5 ring-1 ring-[#FED7AA] lg:rounded-[20px] lg:p-6">
        <p className="text-[16px] font-bold text-[#111827]">
          Услуги готовы, но клиенты пока не могут выбрать время
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
          Создайте окна для записи — на неделю или месяц.
        </p>
        <Link
          to={`${ADMIN_SCHEDULE_PATH}?tab=create&wizard=month`}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]"
        >
          Создать окна на месяц
        </Link>
      </div>
    );
  }

  if (state === 'has_pending') {
    return (
      <Link
        to={getMasterAdminAppointmentsPath({ tab: 'requests' })}
        className="flex items-center justify-between gap-3 rounded-[16px] bg-[#FFF1F4] px-4 py-4 ring-1 ring-[#FDE8ED] transition hover:bg-[#FFE4EA] active:scale-[0.99] lg:rounded-[20px] lg:px-5"
      >
        <div>
          <p className="text-[15px] font-bold text-[#111827]">У вас {pendingCount} новых заявок</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">Нужен ваш ответ</p>
        </div>
        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#F47C8C]">
          Ответить
          <HiArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
    );
  }

  if (state === 'ready_no_requests') {
    return (
      <div className="rounded-[16px] bg-[#ECFDF5] p-5 lg:rounded-[20px] lg:p-6">
        <p className="text-[16px] font-bold text-[#111827]">
          Профиль <PinkArcHighlight>готов к записи</PinkArcHighlight> — клиенты могут выбрать
          свободное время
        </p>
        <p className="mt-2 text-[13px] text-[#6B7280]">Если заявок пока нет — это нормально на старте.</p>
        <div className="mt-4">
          <MasterPublicPreviewLink masterId={masterId} ready={profileReady} variant="primary" />
        </div>
      </div>
    );
  }

  return null;
}
