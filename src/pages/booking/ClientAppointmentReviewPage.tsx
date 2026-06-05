import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiArrowLeft, HiStar } from 'react-icons/hi2';
import {
  getClientAppointmentPath,
  getMasterPath,
  getProfilePath,
  LOGIN_PATH,
} from '../../app/paths';
import { fetchClientAppointmentByVoucher } from '../../features/appointments/api/bookingByVoucher';
import { afterBookingMutation } from '../../features/appointments/bookingDataSync';
import { ClientReviewForm } from '../../features/appointments/clientBooking/ClientReviewForm';
import {
  composeReviewBody,
  evaluateReviewEligibility,
  REVIEW_TEXT_MIN,
} from '../../features/appointments/clientBooking/clientReviewFlow';
import { clientBookingBackLink, clientBookingPrimaryBtnClass } from '../../features/appointments/clientBooking/clientBookingDetailTheme';
import type { ClientBookingDetail } from '../../features/appointments/clientBooking/clientBookingDetailTypes';
import { BookingAccessGate } from '../../features/appointments/components/BookingAccessGate';
import { formatServiceName } from '../../shared/lib/displayFormat';
import { postClientReview } from '../../features/profile/api/clientReviews';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { normalizeBookingCode } from '../../shared/lib/buildBookingLink';
import { CLIENT_CONTENT_PAD_BOTTOM } from '../client/clientNavConstants';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

type Phase = 'loading' | 'blocked' | 'form' | 'success' | 'error';

function ReviewPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-dvh bg-white text-neutral-900 lg:bg-[#F5F5F5] ${CLIENT_CONTENT_PAD_BOTTOM} lg:pb-10`}>
      <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-4 sm:px-5 lg:max-w-xl lg:px-8 lg:pt-8">
        {children}
      </div>
    </div>
  );
}

function ClientAppointmentReviewContent() {
  const { bookingCode = '' } = useParams();
  const [detail, setDetail] = useState<ClientBookingDetail | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [blocked, setBlocked] = useState<{ title: string; body: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizedCode = useMemo(() => {
    try {
      return normalizeBookingCode(bookingCode);
    } catch {
      return '';
    }
  }, [bookingCode]);

  const appointmentPath = normalizedCode ? getClientAppointmentPath(normalizedCode) : getProfilePath('appointments');

  const masterName = detail?.master?.display_name ?? detail?.master_display_name ?? 'Мастер';
  const serviceTitle = formatServiceName(detail?.service_title_snapshot) || 'Услуга';

  const load = useCallback(async () => {
    if (!getApiBaseUrl()) {
      setLoadError('Сервер недоступен');
      setPhase('error');
      return;
    }
    if (!normalizedCode) {
      setLoadError('Некорректный номер записи');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setLoadError(null);
    try {
      const appt = await fetchClientAppointmentByVoucher(normalizedCode);
      const eligibility = evaluateReviewEligibility(appt);
      setDetail(appt);
      if (!eligibility.ok) {
        setBlocked({ title: eligibility.title, body: eligibility.body });
        setPhase('blocked');
        return;
      }
      setPhase('form');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить запись';
      if (msg.toLowerCase().includes('доступ') || msg.includes('403')) {
        setLoadError('У вас нет доступа к этой записи');
      } else if (/не найден/i.test(msg)) {
        setLoadError('Запись не найдена');
      } else {
        setLoadError(msg);
      }
      setPhase('error');
    }
  }, [normalizedCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const textOk = text.trim().length >= REVIEW_TEXT_MIN;
  const canSubmit = rating >= 1 && textOk && !submitting;

  const submit = async () => {
    if (!detail || !canSubmit) return;
    if (rating < 1) {
      setSubmitError('Поставьте оценку');
      return;
    }
    if (!textOk) {
      setSubmitError(`Напишите не менее ${REVIEW_TEXT_MIN} символов`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await postClientReview(detail.id, rating, composeReviewBody(text, tags));
      afterBookingMutation();
      setPhase('success');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh bg-white lg:bg-[#F5F5F5]">
        <LoadingScreen className="bg-white lg:bg-[#F5F5F5]" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <ReviewPageShell>
        <Link to={getProfilePath('appointments')} className={clientBookingBackLink}>
          <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Мои записи
        </Link>
        <div className="mt-6 rounded-[22px] bg-white p-6 ring-1 ring-[#EEEEEE] lg:shadow-sm">
          <p className="text-[15px] text-[#6B7280]">{loadError ?? 'Запись не найдена'}</p>
          {loadError?.includes('доступ') ? (
            <Link
              to={`${LOGIN_PATH}?from=${encodeURIComponent(window.location.pathname)}`}
              className={`${clientBookingPrimaryBtnClass} mt-5`}
            >
              Войти
            </Link>
          ) : null}
        </div>
      </ReviewPageShell>
    );
  }

  if (phase === 'blocked' && blocked) {
    return (
      <ReviewPageShell>
        <Link to={appointmentPath} className={clientBookingBackLink}>
          <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          К записи
        </Link>
        <div className="mt-6 rounded-[22px] bg-white p-6 ring-1 ring-[#EEEEEE] lg:shadow-sm">
          <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[#111827]">{blocked.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">{blocked.body}</p>
          <Link to={appointmentPath} className={`${clientBookingPrimaryBtnClass} mt-5`}>
            Вернуться к записи
          </Link>
        </div>
      </ReviewPageShell>
    );
  }

  if (phase === 'success' && detail) {
    const masterPath = detail.master?.profile_path ?? getMasterPath(detail.master_id);
    return (
      <ReviewPageShell>
        <div className="rounded-[22px] bg-white p-8 text-center ring-1 ring-[#EEEEEE] lg:shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiStar className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">
            Спасибо за отзыв
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            Ваше мнение поможет другим клиентам выбрать мастера.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={masterPath}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)]"
            >
              Открыть профиль мастера
            </a>
            <Link
              to={appointmentPath}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900"
            >
              Вернуться к записи
            </Link>
          </div>
        </div>
      </ReviewPageShell>
    );
  }

  if (!detail) return null;

  return (
    <ReviewPageShell>
      <Link to={appointmentPath} className={clientBookingBackLink}>
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        К записи
      </Link>

      <div className="mt-4 lg:mt-6">
        <ClientReviewForm
          masterName={masterName}
          serviceTitle={serviceTitle}
          rating={rating}
          onRatingChange={setRating}
          text={text}
          onTextChange={setText}
          tags={tags}
          onToggleTag={toggleTag}
          submitError={submitError}
          submitting={submitting}
          canSubmit={canSubmit}
          onSubmit={() => void submit()}
        />
      </div>
    </ReviewPageShell>
  );
}

export function ClientAppointmentReviewPage() {
  return (
    <BookingAccessGate role="client">
      <ClientAppointmentReviewContent />
    </BookingAccessGate>
  );
}
