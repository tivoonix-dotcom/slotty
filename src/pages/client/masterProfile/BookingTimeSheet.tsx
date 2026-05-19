import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientAppointment } from '../../../features/appointments/api/clientAppointments';
import { fetchPublicSlots } from '../../../features/booking/api/publicSlotsApi';
import { buildBookingSlotDaysFromPublicSlots } from '../../../features/booking/model/apiBookingSlotGrid';
import {
  buildBookingSlotDays,
  pickFirstSlot,
  startOfDay,
  type DemoBookingGridDay,
} from '../../../features/booking/model/demoBookingSlotGrid';
import { useAuth } from '../../../features/auth/AuthProvider';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { BookingSuccessCelebration } from '../../booking/BookingSuccessModal';
import { clientPinkBtn } from '../clientTheme';
import { ClientSheetShell } from './ClientSheetShell';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';
import type { ExtendedMasterProfile } from './types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  open: boolean;
  onClose: () => void;
  master: ExtendedMasterProfile;
  initialServiceId?: string | null;
};

export function BookingTimeSheet({ open, onClose, master, initialServiceId }: Props) {
  const { token, isAuthenticated } = useAuth();
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId ?? null);
  const [slotDays, setSlotDays] = useState<DemoBookingGridDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const service = useMemo(
    () => master.services.find((s) => s.id === serviceId) ?? null,
    [master.services, serviceId],
  );

  useEffect(() => {
    if (!open) return;
    setServiceId(initialServiceId ?? master.services[0]?.id ?? null);
    setSuccess(false);
    setError(null);
  }, [open, initialServiceId, master.services]);

  useEffect(() => {
    if (!open || !service) {
      setSlotDays([]);
      return;
    }

    const useApi = Boolean(getApiBaseUrl() && UUID_RE.test(master.masterId));
    if (!useApi) {
      const days = buildBookingSlotDays({
        anchorDate: startOfDay(new Date()),
        masterId: master.masterId,
        serviceId: service.id,
        duration: service.duration,
      });
      setSlotDays(days);
      const first = pickFirstSlot(days);
      setSelectedDate(first?.day.date ?? null);
      setSelectedSlotId(first?.slot.slotId ?? null);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    void (async () => {
      try {
        const slots = await fetchPublicSlots({
          masterId: master.masterId,
          serviceId: service.id,
        });
        if (cancelled) return;
        const days = buildBookingSlotDaysFromPublicSlots(startOfDay(new Date()), slots);
        setSlotDays(days);
        const first = pickFirstSlot(days);
        setSelectedDate(first?.day.date ?? null);
        setSelectedSlotId(first?.slot.slotId ?? null);
      } catch {
        if (!cancelled) setSlotDays([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, service, master.masterId]);

  const selectedDay = slotDays.find((d) => d.date === selectedDate) ?? null;
  const selectedSlot = selectedDay?.times.find((t) => t.slotId === selectedSlotId) ?? null;
  const quickDays = slotDays.filter((d) => d.times.length > 0).slice(0, 14);

  const onSubmit = useCallback(() => {
    if (!service || !selectedSlot) return;
    const useApi = Boolean(getApiBaseUrl() && UUID_RE.test(selectedSlot.slotId));
    if (useApi) {
      if (!token || !isAuthenticated) {
        setError('Откройте приложение через Telegram, чтобы записаться.');
        return;
      }
      setSubmitting(true);
      setError(null);
      void (async () => {
        try {
          await createClientAppointment({ slotId: selectedSlot.slotId, serviceId: service.id });
          setSuccess(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Не удалось отправить заявку');
        } finally {
          setSubmitting(false);
        }
      })();
      return;
    }
    setSuccess(true);
  }, [isAuthenticated, selectedSlot, service, token]);

  const pickService = (s: DemoMasterService) => {
    setServiceId(s.id);
    setSelectedDate(null);
    setSelectedSlotId(null);
  };

  if (!open) return null;

  return (
    <ClientSheetShell
      open={open}
      onClose={onClose}
      title={success ? 'Готово' : 'Выберите время'}
      footer={
        success ? (
          <button type="button" onClick={onClose} className={`${clientPinkBtn} w-full`}>
            Закрыть
          </button>
        ) : service && selectedSlot ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className={`${clientPinkBtn} w-full`}
          >
            {submitting ? 'Отправляем…' : 'Отправить заявку'}
          </button>
        ) : undefined
      }
    >
      {success ? (
        <div className="pb-2 pt-2">
          <BookingSuccessCelebration compact />
          <p className="mt-4 text-center text-[20px] font-semibold text-[#111827]">
            Заявка отправлена
          </p>
          <p className="mt-2 text-center text-[14px] leading-snug text-[#6B7280]">
            Мастер подтвердит запись
          </p>
        </div>
      ) : !service ? (
        <ul className="space-y-2">
          {master.services.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pickService(s)}
                className="flex w-full items-center justify-between rounded-[18px] bg-[#FAFAFA] px-4 py-3 text-left active:scale-[0.99]"
              >
                <div>
                  <p className="font-semibold text-[#111827]">{s.title}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{serviceDurationLabel(s.duration)}</p>
                </div>
                <span className="font-semibold text-[#111827]">{formatServicePrice(s)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setServiceId(null)}
            className="mb-3 text-[13px] font-semibold text-[#F47C8C]"
          >
            ← Сменить услугу
          </button>
          <p className="text-[16px] font-semibold text-[#111827]">{service.title}</p>
          <p className="text-[13px] text-[#9CA3AF]">
            {serviceDurationLabel(service.duration)} · {formatServicePrice(service)}
          </p>

          {loadingSlots ? (
            <p className="mt-6 text-center text-[14px] text-[#9CA3AF]">Загружаем окна…</p>
          ) : quickDays.length === 0 ? (
            <p className="mt-6 text-center text-[14px] text-[#6B7280]">
              Свободных окон пока нет. Попробуйте другую дату.
            </p>
          ) : (
            <>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quickDays.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedSlotId(day.times[0]?.slotId ?? null);
                    }}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${
                      selectedDate === day.date
                        ? 'bg-[#FFF1F4] text-[#F47C8C]'
                        : 'bg-[#F1EFEF] text-[#6B7280]'
                    }`}
                  >
                    {day.dateLabel}
                  </button>
                ))}
              </div>

              {selectedDay ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedDay.times.map((slot) => {
                    const active = selectedSlotId === slot.slotId;
                    const promo = slot.promotion;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.slotId)}
                        className={`min-w-[4.5rem] rounded-full px-4 py-2.5 text-[14px] font-semibold ${
                          active ? 'bg-[#F47C8C] text-white' : 'bg-[#F1EFEF] text-[#374151]'
                        }`}
                      >
                        <span className="block">{slot.timeLabel}</span>
                        {promo ? (
                          <span
                            className={`mt-0.5 block text-[10px] font-bold leading-none ${
                              active ? 'text-white/90' : 'text-[#F47C8C]'
                            }`}
                          >
                            {promo.discountLabel}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {selectedSlot && service ? (
                <div className="mt-6 rounded-[18px] bg-[#FAFAFA] p-4 text-[14px] text-[#374151]">
                  <p>
                    <span className="text-[#9CA3AF]">Мастер:</span> {master.masterName}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#9CA3AF]">Дата:</span> {selectedDay?.fullDateLabel}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#9CA3AF]">Время:</span> {selectedSlot.timeLabel}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#9CA3AF]">Цена:</span>{' '}
                    {selectedSlot.promotion &&
                    selectedSlot.promotion.discountedPrice < selectedSlot.promotion.originalPrice ? (
                      <>
                        <span className="text-[#9CA3AF] line-through">
                          {Math.round(selectedSlot.promotion.originalPrice)} BYN
                        </span>{' '}
                        <span className="font-semibold text-[#F47C8C]">
                          {Math.round(selectedSlot.promotion.discountedPrice)} BYN
                        </span>
                      </>
                    ) : (
                      formatServicePrice(service)
                    )}
                  </p>
                  {selectedSlot.promotion?.isSlotBound ? (
                    <p className="mt-1 text-[13px] font-semibold text-[#F47C8C]">Акция на это окно</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
          {error ? <p className="mt-3 text-[13px] text-red-600">{error}</p> : null}
        </>
      )}
    </ClientSheetShell>
  );
}
