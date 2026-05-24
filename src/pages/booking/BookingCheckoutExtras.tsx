import { Link } from 'react-router-dom';
import { HiCheck, HiCreditCard } from 'react-icons/hi2';
import { LEGAL_PD_CONSENT_PATH, LEGAL_TERMS_PATH } from '../../app/paths';
import {
  catalogFieldClass,
  catalogPrimaryBtn,
} from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingDesktopSectionTitle } from './bookingDesktopTheme';
import { bookingMutedPanel } from './bookingUi';

const TRUST_ITEMS = [
  'Бесплатная отмена за 24 часа',
  'Напоминание в Telegram',
  'Оплата на месте у мастера',
] as const;

type Props = {
  bookError: string | null;
  submitting: boolean;
  canConfirm: boolean;
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onConfirm: () => void;
  className?: string;
};

export function BookingCheckoutExtras({
  bookError,
  submitting,
  canConfirm,
  acceptedTerms,
  onAcceptedTermsChange,
  comment,
  onCommentChange,
  onConfirm,
  className = '',
}: Props) {
  const canSubmit = canConfirm && acceptedTerms && !submitting;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`${bookingMutedPanel} p-4`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#6B7280]">
            <HiCreditCard className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={bookingDesktopSectionTitle}>Оплата</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
              Оплата на месте после визита. SLOTTY не списывает деньги с карты при записи.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2.5">
        {TRUST_ITEMS.map((label) => (
          <li key={label} className="flex items-center gap-2.5 text-[13px] font-medium text-[#374151]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#15803D]">
              <HiCheck className="h-4 w-4" aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>

      <label className="block">
        <span className={bookingDesktopSectionTitle}>Комментарий мастеру</span>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Пожелания, аллергии, уточнения…"
          rows={3}
          className={`${catalogFieldClass} mt-2 w-full resize-none px-3.5 py-3 text-[14px]`}
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-[10px] bg-[#FAFAFA] px-3.5 py-3">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => onAcceptedTermsChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] text-[#F47C8C] focus:ring-[#F47C8C]/30"
        />
        <span className="text-[13px] leading-relaxed text-[#374151]">
          Принимаю{' '}
          <Link to={LEGAL_TERMS_PATH} className="font-semibold text-[#F47C8C] hover:underline">
            пользовательское соглашение
          </Link>{' '}
          и{' '}
          <Link to={LEGAL_PD_CONSENT_PATH} className="font-semibold text-[#F47C8C] hover:underline">
            согласие на обработку персональных данных
          </Link>
        </span>
      </label>

      {bookError ? (
        <p className="text-center text-[14px] font-medium text-red-600" role="alert">
          {bookError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={onConfirm}
        className={`${catalogPrimaryBtn} w-full min-h-[48px] text-[15px] disabled:opacity-45`}
      >
        {submitting ? 'Отправляем…' : 'Подтвердить запись'}
      </button>

      {!acceptedTerms && canConfirm ? (
        <p className="text-center text-[12px] text-[#9CA3AF]">
          Отметьте согласие с условиями, чтобы продолжить
        </p>
      ) : null}
    </div>
  );
}
