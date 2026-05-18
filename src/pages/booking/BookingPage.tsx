import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProfilePath, getMasterPath, SERVICES_PATH } from '../../app/paths';
import { createClientAppointment } from '../../features/appointments/api/clientAppointments';
import { fetchPublicSlots, type PublicSlotDto } from '../../features/booking/api/publicSlotsApi';
import { buildBookingSlotDaysFromPublicSlots } from '../../features/booking/model/apiBookingSlotGrid';
import {
  fetchMasterPublicDetail,
  mapMasterDetailToDemoProfile,
} from '../../features/masters/api/masterPublicApi';
import { formatPublicAddress } from '../../features/profile/model/masterLocation';
import {
  getDemoMasterProfile,
  resolveDemoServiceForBooking,
} from '../../features/services/model/demoMasters';
import { useAuth } from '../../features/auth/AuthProvider';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { LoadingVideo } from '../../shared/ui/LoadingVideo';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';
import {
  buildBookingSlotDays,
  pickFirstSlot,
  startOfDay,
} from '../../features/booking/model/demoBookingSlotGrid';
import { BookingFlowView } from './BookingFlowView';
import { BookingPageShell } from './BookingPageShell';
import { BookingStateScreen } from './BookingStateScreen';
import { buildCalendarMonths } from './bookingCalendar';

function looksLikeBookingUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

type SuccessPayload = {
  masterName: string;
  serviceTitle: string;
  dateLabel: string;
  timeLabel: string;
  locationLine?: string;
};

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
      <BookingStateScreen
        backTo={bookingBareBackPath}
        action={{ to: SERVICES_PATH, label: 'К услугам' }}
      >
        <NothingFoundCard
          title="Не удалось загрузить данные для записи"
          text="Проверьте соединение с сервером или откройте страницу мастера из каталога услуг."
        />
      </BookingStateScreen>
    );
  }

  if (wantsApiBooking && (apiBundle.status === 'idle' || apiBundle.status === 'loading')) {
    return (
      <BookingPageShell backTo={bookingBareBackPath}>
        <div className="flex min-h-[min(70dvh,28rem)] w-full items-center justify-center">
          <LoadingVideo size="xl" />
        </div>
      </BookingPageShell>
    );
  }

  if (!effectiveMasterId) {
    return (
      <BookingStateScreen
        backTo={bookingBareBackPath}
        action={{
          to: bookingBareBackPath,
          label: fromServices ? 'К услугам' : 'Мой профиль',
        }}
      >
        <NothingFoundCard
          title="Запись"
          text="Откройте эту страницу из профиля мастера или по ссылке из Telegram."
        />
      </BookingStateScreen>
    );
  }

  if (!master) {
    return (
      <BookingStateScreen backTo={SERVICES_PATH} action={{ to: SERVICES_PATH, label: 'К услугам' }}>
        <NothingFoundCard
          title="Мастер не найден"
          text="Попробуйте выбрать другого специалиста."
        />
      </BookingStateScreen>
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
      <BookingPageShell backTo={backTo}>
        <NothingFoundCard
          title={missingChosenService ? 'Услуга недоступна' : 'Услуги пока не добавлены'}
          text={
            missingChosenService
              ? 'Вернитесь в профиль мастера и выберите услугу из актуального списка.'
              : 'Мастер скоро заполнит список услуг.'
          }
        />
      </BookingPageShell>
    );
  }

  const hasSlots = slotDays.length > 0 && pickFirstSlot(slotDays) !== null;
  const canConfirm = Boolean(selectedDay && selectedSlot && !submitting);

  if (!hasSlots) {
    return (
      <BookingPageShell backTo={backTo}>
        <NothingFoundCard
          title="Свободных слотов нет"
          text="Попробуйте выбрать другую услугу или день."
        />
      </BookingPageShell>
    );
  }

  return (
    <BookingPageShell backTo={backTo}>
      <BookingFlowView
        master={master}
        service={service}
        selectedDay={selectedDay}
        selectedSlot={
          selectedSlot
            ? { slotId: selectedSlot.slotId, timeLabel: selectedSlot.timeLabel }
            : null
        }
        quickDateDays={quickDateDays}
        calendarMonths={calendarMonths}
        bookError={bookError}
        submitting={submitting}
        canConfirm={canConfirm}
        isCalendarOpen={isCalendarOpen}
        success={success}
        onPickDate={onPickDate}
        onPickSlot={setSelectedSlotId}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onCloseCalendar={() => setIsCalendarOpen(false)}
        onPickCalendarDate={onPickCalendarDate}
        onConfirm={confirmBooking}
      />
    </BookingPageShell>
  );
}
