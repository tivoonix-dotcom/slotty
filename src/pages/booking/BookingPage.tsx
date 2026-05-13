import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { getProfilePath, getMasterPath, SERVICES_PATH } from '../../app/paths';
import { createClientAppointment } from '../../features/appointments/api/clientAppointments';
import { fetchPublicSlots, type PublicSlotDto } from '../../features/booking/api/publicSlotsApi';
import { buildBookingSlotDaysFromPublicSlots } from '../../features/booking/model/apiBookingSlotGrid';
import { openBookingVoucherPrint } from '../../features/booking/lib/bookingConfirmationVoucherPrint';
import {
  fetchMasterPublicDetail,
  mapMasterDetailToDemoProfile,
} from '../../features/masters/api/masterPublicApi';
import {
  formatReviewsCountLabel,
  getDemoMasterProfile,
  resolveDemoServiceForBooking,
} from '../../features/services/model/demoMasters';
import { formatBookingHowToFind, formatPublicAddress } from '../../features/profile/model/masterLocation';
import { useAuth } from '../../features/auth/AuthProvider';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';
import {
  buildBookingSlotDays,
  formatMonthTitle,
  pickFirstSlot,
  startOfDay,
  toIsoDate,
  type DemoBookingGridDay as BookingSlotDay,
} from '../../features/booking/model/demoBookingSlotGrid';

function looksLikeBookingUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

type CalendarMonth = {
  key: string;
  title: string;
  cells: Array<BookingSlotDay | null>;
};

type SuccessPayload = {
  masterName: string;
  serviceTitle: string;
  dateLabel: string;
  timeLabel: string;
  locationLine?: string;
};

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M7 4v3M17 4v3M5.5 9.5h13" strokeLinecap="round" />
      <path
        d="M6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6Z"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPdf({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M10 13h4M10 17h4M10 9h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="flex gap-0.5" aria-label={`Оценка ${rating.toFixed(1)} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar
          key={i}
          className={`h-4 w-4 shrink-0 ${
            i < filled ? 'text-[#E29595]' : 'text-neutral-200'
          }`}
        />
      ))}
    </div>
  );
}

function formatServicePrice(price: number): string {
  if (price === 0) return 'Бесплатно';

  return `${price} BYN`;
}

function buildCalendarMonths(slotDays: BookingSlotDay[]): CalendarMonth[] {
  const byDate = new Map(slotDays.map((day) => [day.date, day]));
  const monthKeys = Array.from(new Set(slotDays.map((day) => day.date.slice(0, 7))));

  return monthKeys.map((monthKey) => {
    const [yearRaw, monthRaw] = monthKey.split('-');
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    const firstDate = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const leadingEmptyCells = (firstDate.getDay() + 6) % 7;

    const cells: Array<BookingSlotDay | null> = Array.from(
      { length: leadingEmptyCells },
      () => null,
    );

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      const iso = toIsoDate(date);

      cells.push(byDate.get(iso) ?? null);
    }

    return {
      key: monthKey,
      title: formatMonthTitle(firstDate),
      cells,
    };
  });
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const { masterId: telegramMasterId } = useTelegram();
  const { token, isAuthenticated } = useAuth();

  const masterIdFromUrl = searchParams.get('master_id')?.trim() || null;
  const serviceIdFromUrl = searchParams.get('service_id')?.trim() || null;
  const fromServices = searchParams.get('from') === 'services';
  const slotFromUrl = searchParams.get('slot')?.trim() || '';

  const effectiveMasterId = masterIdFromUrl ?? telegramMasterId ?? null;

  const wantsApiBooking = Boolean(
    getApiBaseUrl() &&
      effectiveMasterId &&
      serviceIdFromUrl &&
      looksLikeBookingUuid(effectiveMasterId) &&
      looksLikeBookingUuid(serviceIdFromUrl),
  );

  type ApiBookingBundle =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ok'; profile: ReturnType<typeof mapMasterDetailToDemoProfile>; slots: PublicSlotDto[] }
    | { status: 'error' };

  const [apiBundle, setApiBundle] = useState<ApiBookingBundle>({ status: 'idle' });

  useEffect(() => {
    if (!wantsApiBooking || !effectiveMasterId || !serviceIdFromUrl) {
      setApiBundle({ status: 'idle' });
      return;
    }

    setApiBundle({ status: 'loading' });
    let cancelled = false;

    (async () => {
      try {
        const [detail, slots] = await Promise.all([
          fetchMasterPublicDetail(effectiveMasterId),
          fetchPublicSlots({ masterId: effectiveMasterId, serviceId: serviceIdFromUrl }),
        ]);
        if (cancelled) return;
        const activeOnly = { ...detail, services: detail.services.filter((s) => s.isActive) };
        const profile = mapMasterDetailToDemoProfile(activeOnly);
        setApiBundle({ status: 'ok', profile, slots });
      } catch {
        if (cancelled) return;
        setApiBundle({ status: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wantsApiBooking, effectiveMasterId, serviceIdFromUrl]);

  const demoMaster = effectiveMasterId ? getDemoMasterProfile(effectiveMasterId) : undefined;

  const master = useMemo(() => {
    if (apiBundle.status === 'ok') return apiBundle.profile;
    if (wantsApiBooking) return undefined;
    return demoMaster;
  }, [apiBundle, demoMaster, wantsApiBooking]);

  const service = useMemo(() => {
    if (!master) return undefined;
    if (wantsApiBooking && apiBundle.status === 'ok' && serviceIdFromUrl && looksLikeBookingUuid(serviceIdFromUrl)) {
      return master.services.find((s) => s.id === serviceIdFromUrl);
    }
    return resolveDemoServiceForBooking(master, serviceIdFromUrl);
  }, [apiBundle.status, master, serviceIdFromUrl, wantsApiBooking]);

  const isApiSlotGrid = wantsApiBooking && apiBundle.status === 'ok';

  const bookingAnchorDate = useMemo(() => startOfDay(new Date()), []);

  const slotDays = useMemo(() => {
    if (!master || !service) return [];

    if (isApiSlotGrid && apiBundle.status === 'ok') {
      return buildBookingSlotDaysFromPublicSlots(
        bookingAnchorDate,
        apiBundle.slots.map((s) => ({ id: s.id, startsAt: s.startsAt })),
      );
    }

    return buildBookingSlotDays({
      anchorDate: bookingAnchorDate,
      masterId: master.masterId,
      serviceId: service.id,
      duration: service.duration,
    });
  }, [apiBundle, bookingAnchorDate, isApiSlotGrid, master, service]);

  const calendarMonths = useMemo(() => buildCalendarMonths(slotDays), [slotDays]);
  const quickDateDays = useMemo(() => slotDays.slice(0, 14), [slotDays]);

  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (slotFromUrl && slotDays.length > 0) {
      for (const day of slotDays) {
        const hit = day.times.find((t) => t.slotId === slotFromUrl);
        if (hit) {
          setSelectedDateIso(day.date);
          setSelectedSlotId(hit.slotId);
          return;
        }
      }
      // slot из URL не найден в текущем списке — не оставляем «висячий» выбор
    }

    const first = pickFirstSlot(slotDays);

    if (first) {
      setSelectedDateIso(first.day.date);
      setSelectedSlotId(first.slot.slotId);
    } else {
      setSelectedDateIso(null);
      setSelectedSlotId(null);
    }
  }, [slotDays, slotFromUrl]);

  useEffect(() => {
    setBookError(null);
  }, [selectedSlotId, selectedDateIso, service?.id]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isCalendarOpen]);

  const selectedDay = useMemo(
    () => slotDays.find((day) => day.date === selectedDateIso) ?? null,
    [slotDays, selectedDateIso],
  );

  const selectedSlot = useMemo(
    () => selectedDay?.times.find((slot) => slot.slotId === selectedSlotId) ?? null,
    [selectedDay, selectedSlotId],
  );

  const onPickDate = useCallback(
    (dateIso: string) => {
      setSelectedDateIso(dateIso);

      const day = slotDays.find((item) => item.date === dateIso);
      const firstSlot = day?.times[0];

      setSelectedSlotId(firstSlot?.slotId ?? null);
    },
    [slotDays],
  );

  const onPickCalendarDate = useCallback(
    (dateIso: string) => {
      onPickDate(dateIso);
      setIsCalendarOpen(false);
    },
    [onPickDate],
  );

  const confirmBooking = useCallback(() => {
    if (!master || !service || !selectedDay || !selectedSlot) return;

    if (isApiSlotGrid && looksLikeBookingUuid(selectedSlot.slotId)) {
      if (submitting) return;
      if (!token || !isAuthenticated) {
        setBookError('Откройте приложение через Telegram, чтобы записаться.');
        return;
      }
      setSubmitting(true);
      setBookError(null);
      void (async () => {
        try {
          const res = await createClientAppointment({
            slotId: selectedSlot.slotId,
            serviceId: service.id,
          });
          const start = new Date(res.startsAt);
          const timeLabel = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const dateLabel = Number.isNaN(start.getTime())
            ? (selectedDay?.fullDateLabel ?? '—')
            : start.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
          setSuccess({
            masterName: master.masterName,
            serviceTitle: res.serviceTitle || service.title,
            dateLabel,
            timeLabel,
            locationLine: formatPublicAddress(master.location),
          });
        } catch (e) {
          setBookError(e instanceof Error ? e.message : 'Не удалось создать запись');
        } finally {
          setSubmitting(false);
        }
      })();
      return;
    }

    // Демо: локальное подтверждение без бэкенда.
    setSuccess({
      masterName: master.masterName,
      serviceTitle: service.title,
      dateLabel: selectedDay.fullDateLabel,
      timeLabel: selectedSlot.timeLabel,
      locationLine: formatPublicAddress(master.location),
    });
  }, [isApiSlotGrid, isAuthenticated, master, selectedDay, selectedSlot, service, submitting, token]);

  const backTo = fromServices
    ? SERVICES_PATH
    : master
      ? getMasterPath(master.masterId)
      : SERVICES_PATH;

  const bookingBareBackPath = fromServices ? SERVICES_PATH : getProfilePath('appointments');

  if (wantsApiBooking && apiBundle.status === 'error') {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={bookingBareBackPath}
            className="mb-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>
          <NothingFoundCard
            title="Не удалось загрузить данные для записи"
            text="Проверьте соединение с сервером или откройте страницу мастера из каталога услуг."
            action={
              <Link
                to={SERVICES_PATH}
                className="inline-flex min-h-[3.25rem] w-full max-w-xs items-center justify-center self-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90"
              >
                К услугам
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (wantsApiBooking && (apiBundle.status === 'idle' || apiBundle.status === 'loading')) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={bookingBareBackPath}
            className="mb-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>
          <p className="text-center text-[16px] font-medium text-neutral-600">Загрузка…</p>
        </div>
      </div>
    );
  }

  if (!effectiveMasterId) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={bookingBareBackPath}
            className="mb-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <NothingFoundCard
            title="Запись"
            text="Откройте эту страницу из профиля мастера или по ссылке из Telegram."
            action={
              <Link
                to={bookingBareBackPath}
                className="inline-flex min-h-[3.25rem] w-full max-w-xs items-center justify-center self-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90"
              >
                {fromServices ? 'К услугам' : 'Мой профиль'}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (!master) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={SERVICES_PATH}
            className="mb-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <NothingFoundCard
            title="Мастер не найден"
            text="Попробуйте выбрать другого специалиста."
            action={
              <Link
                to={SERVICES_PATH}
                className="inline-flex min-h-[3.25rem] w-full max-w-xs items-center justify-center self-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90"
              >
                К услугам
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const missingChosenService =
    wantsApiBooking &&
    apiBundle.status === 'ok' &&
    master &&
    serviceIdFromUrl &&
    looksLikeBookingUuid(serviceIdFromUrl) &&
    !master.services.some((s) => s.id === serviceIdFromUrl);

  if (!service) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={backTo}
            className="mb-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <NothingFoundCard
            title={missingChosenService ? 'Услуга недоступна' : 'Услуги пока не добавлены'}
            text={
              missingChosenService
                ? 'Вернитесь в профиль мастера и выберите услугу из актуального списка.'
                : 'Мастер скоро заполнит список услуг.'
            }
          />
        </div>
      </div>
    );
  }

  const hasSlots = slotDays.length > 0 && pickFirstSlot(slotDays) !== null;
  const canConfirm = Boolean(selectedDay && selectedSlot && !submitting);

  if (!hasSlots) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <Link
            to={backTo}
            className="mb-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <NothingFoundCard
            title="Свободных слотов нет"
            text="Попробуйте выбрать другую услугу или день."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-neutral-900">
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <Link
            to={backTo}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4e4e4] px-4 text-[15px] font-semibold text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
          >
            <IconChevronLeft className="shrink-0" />
            Назад
          </Link>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900">
            Запись
          </h1>

          <p className="mt-1 text-[16px] text-neutral-500">
            Выберите удобную дату и время
          </p>
        </div>

        <div className="overflow-hidden rounded-[30px] bg-[#F1EFEF] p-5 shadow-[0_12px_40px_rgba(17,17,17,0.06)]">
          <div className="flex gap-4">
            <div className="h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-[22px] bg-white shadow-sm">
              <img
                src={master.photoUrl}
                alt=""
                width={176}
                height={176}
                className="h-full w-full object-cover"
                decoding="async"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-lg font-bold leading-tight text-neutral-900">
                {master.masterName}
              </p>

              <p className="text-[15px] text-neutral-500">
                {master.category}
              </p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <ReviewStars rating={master.rating} />
                <span className="text-[14px] font-semibold tabular-nums text-neutral-700">
                  {master.rating.toFixed(1)}
                </span>
              </div>

              <p className="text-[14px] leading-snug text-neutral-500">
                {formatPublicAddress(master.location)}
              </p>

              <p className="text-[12px] text-neutral-400">
                {formatReviewsCountLabel(master.reviewsCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-[#F1EFEF] px-5 py-5 shadow-[0_10px_32px_rgba(17,17,17,0.05)]">
          <p className="text-[17px] font-bold text-neutral-900">
            {service.title}
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-[15px] font-medium text-neutral-500">
              {service.duration} мин
            </span>

            <span className="text-[20px] font-bold tabular-nums text-neutral-900">
              {formatServicePrice(service.price)}
            </span>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-neutral-400">
              ДАТА
            </p>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-800 shadow-[0_2px_12px_rgba(17,17,17,0.04)] transition active:scale-[0.98]"
            >
              <IconCalendar className="h-4 w-4 text-[#E29595]" />
              Календарь
            </button>
          </div>

          <div className="mb-3 rounded-[28px] bg-[#F1EFEF] px-5 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
            <p className="text-[13px] font-medium text-neutral-400">
              Выбранная дата
            </p>

            <p className="mt-1 text-[20px] font-bold tracking-[-0.04em] text-neutral-950">
              {selectedDay?.fullDateLabel ?? '—'}
            </p>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickDateDays.map((day) => {
              const hasTimes = day.times.length > 0;
              const active = day.date === selectedDateIso;

              return (
                <button
                  key={day.id}
                  type="button"
                  disabled={!hasTimes}
                  onClick={() => onPickDate(day.date)}
                  className={`shrink-0 rounded-full px-5 py-3 text-[15px] font-semibold shadow-[0_2px_12px_rgba(17,17,17,0.06)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? 'bg-[#E29595] text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)]'
                      : 'bg-[#F1EFEF] text-neutral-900'
                  }`}
                >
                  {day.dateLabel}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-3 text-[13px] font-semibold tracking-[0.14em] text-neutral-400">
            ВРЕМЯ
          </p>

          {selectedDay && selectedDay.times.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {selectedDay.times.map((slot) => {
                const active = slot.slotId === selectedSlotId;

                return (
                  <button
                    key={slot.slotId}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.slotId)}
                    className={`min-h-[3rem] min-w-[4.25rem] rounded-full px-5 text-[15px] font-semibold shadow-[0_2px_10px_rgba(17,17,17,0.05)] transition active:scale-[0.98] ${
                      active
                        ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.35)]'
                        : 'bg-white text-neutral-900'
                    }`}
                  >
                    {slot.timeLabel}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-[24px] bg-[#F1EFEF] px-4 py-5 text-center text-[15px] leading-snug text-neutral-500">
              На этот день свободных слотов нет
            </p>
          )}
        </section>

        <div className="rounded-[28px] bg-[#F1EFEF] px-5 py-5 shadow-[0_10px_32px_rgba(17,17,17,0.05)]">
          <div className="space-y-3 text-[15px]">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-neutral-500">Мастер</dt>
              <dd className="text-right font-semibold text-neutral-900">
                {master.masterName}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-neutral-500">Услуга</dt>
              <dd className="text-right font-semibold text-neutral-900">
                {service.title}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-neutral-500">Дата</dt>
              <dd className="text-right font-semibold text-neutral-900">
                {selectedDay?.fullDateLabel ?? '—'}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-neutral-500">Время</dt>
              <dd className="text-right font-semibold text-neutral-900">
                {selectedSlot?.timeLabel ?? '—'}
              </dd>
            </div>

            <div className="rounded-[20px] bg-white/80 px-3 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Адрес</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-neutral-900">
                {formatPublicAddress(master.location)}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                <span className="font-semibold text-neutral-700">Как пройти: </span>
                {formatBookingHowToFind(master.location)}
              </p>
            </div>

            <div className="flex justify-between gap-4 border-t border-white/60 pt-3">
              <dt className="shrink-0 text-neutral-500">Стоимость</dt>
              <dd className="text-right text-lg font-bold tabular-nums text-neutral-900">
                {formatServicePrice(service.price)}
              </dd>
            </div>
          </div>
        </div>

        {bookError ? (
          <p className="text-center text-[14px] font-medium text-red-600" role="alert">
            {bookError}
          </p>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100/80 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              disabled={!canConfirm}
              onClick={confirmBooking}
              className="flex min-h-[3.35rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[17px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition enabled:hover:opacity-90 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Подтвердить запись
            </button>
          </div>
        </div>
      </div>

      {isCalendarOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-3 pb-3 pt-12 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-title"
            className="flex max-h-[86dvh] w-full max-w-lg flex-col overflow-hidden rounded-[36px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.2)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white px-5 pb-4 pt-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Календарь
                </p>

                <h2
                  id="calendar-title"
                  className="mt-1 text-[24px] font-bold tracking-[-0.05em] text-neutral-950"
                >
                  Выберите дату
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-800 transition active:scale-[0.96]"
                aria-label="Закрыть календарь"
              >
                <IconClose />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="mb-5 rounded-[28px] bg-[#F1EFEF] px-5 py-4">
                <p className="text-[13px] font-medium text-neutral-500">
                  Можно выбрать дату на ближайшие 2 месяца.
                </p>

                <p className="mt-1 text-[15px] font-bold text-neutral-950">
                  {selectedDay?.fullDateLabel ?? 'Дата не выбрана'}
                  {selectedSlot ? ` · ${selectedSlot.timeLabel}` : ''}
                </p>
              </div>

              <div className="space-y-7">
                {calendarMonths.map((month) => (
                  <section key={month.key}>
                    <h3 className="mb-4 text-[18px] font-bold tracking-[-0.04em] text-neutral-950">
                      {month.title}
                    </h3>

                    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                      <span>Пн</span>
                      <span>Вт</span>
                      <span>Ср</span>
                      <span>Чт</span>
                      <span>Пт</span>
                      <span>Сб</span>
                      <span>Вс</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {month.cells.map((day, index) => {
                        if (!day) {
                          return <div key={`empty_${month.key}_${index}`} />;
                        }

                        const active = day.date === selectedDateIso;
                        const disabled = day.times.length === 0;

                        return (
                          <button
                            key={day.date}
                            type="button"
                            disabled={disabled}
                            onClick={() => onPickCalendarDate(day.date)}
                            className={`flex aspect-square flex-col items-center justify-center rounded-[18px] text-center transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30 ${
                              active
                                ? 'bg-[#E29595] text-white shadow-[0_10px_28px_rgba(226,149,149,0.32)]'
                                : 'bg-[#F1EFEF] text-neutral-900'
                            }`}
                          >
                            <span className="text-[15px] font-bold leading-none">
                              {day.dayNumber}
                            </span>

                            <span
                              className={`mt-1 h-1.5 w-1.5 rounded-full ${
                                day.times.length > 0
                                  ? active
                                    ? 'bg-white'
                                    : 'bg-[#E29595]'
                                  : 'bg-transparent'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-12 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-success-title"
            className="w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
          >
            <h2
              id="booking-success-title"
              className="text-center text-xl font-bold text-neutral-900"
            >
              Запись создана
            </h2>

            <p className="mt-2 text-center text-[15px] text-neutral-500">
              Мы напомним вам о визите в Telegram
            </p>

            <div className="mt-6 space-y-2 rounded-[24px] bg-[#F1EFEF] px-4 py-4 text-[15px]">
              <p>
                <span className="text-neutral-500">Мастер: </span>
                <span className="font-semibold text-neutral-900">
                  {success.masterName}
                </span>
              </p>

              <p>
                <span className="text-neutral-500">Услуга: </span>
                <span className="font-semibold text-neutral-900">
                  {success.serviceTitle}
                </span>
              </p>

              <p>
                <span className="text-neutral-500">Дата: </span>
                <span className="font-semibold text-neutral-900">
                  {success.dateLabel}
                </span>
              </p>

              <p>
                <span className="text-neutral-500">Время: </span>
                <span className="font-semibold text-neutral-900">
                  {success.timeLabel}
                </span>
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                to={getProfilePath('appointments')}
                className="flex min-h-[3rem] items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition hover:opacity-90"
              >
                Мои записи
              </Link>

              <button
                type="button"
                title="Откроется диалог печати — выберите «Сохранить как PDF»"
                onClick={() =>
                  openBookingVoucherPrint(
                    {
                      masterName: success.masterName,
                      serviceTitle: success.serviceTitle,
                      dateLabel: success.dateLabel,
                      timeLabel: success.timeLabel,
                      locationLine: success.locationLine,
                    },
                    HEADER_LOGO_SRC,
                  )
                }
                className="flex min-h-[3rem] items-center justify-center gap-2 rounded-full border-2 border-[#E29595] bg-white text-[16px] font-semibold text-[#c47878] transition hover:bg-[#fff8f8] active:scale-[0.99]"
              >
                <IconPdf className="h-[18px] w-[18px] shrink-0" />
                Скачать PDF
              </button>

              <Link
                to={SERVICES_PATH}
                className="flex min-h-[3rem] items-center justify-center rounded-full bg-[#F1EFEF] text-[16px] font-semibold text-neutral-900 transition hover:opacity-90"
              >
                К услугам
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}