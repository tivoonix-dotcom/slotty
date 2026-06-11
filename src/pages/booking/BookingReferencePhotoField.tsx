import { useRef, useState } from 'react';
import { HiArrowTopRightOnSquare, HiPhoto, HiXMark } from 'react-icons/hi2';
import { SiPinterest } from 'react-icons/si';
import { uploadBookingReferencePhoto } from '../../features/appointments/api/clientAppointments';
import {
  referencePhotoHint,
  referencePhotoPinterestUrl,
  referencePhotoSectionTitle,
} from '../../features/booking/lib/referencePhotoCategories';
import { catalogFieldClass, catalogSecondaryBtn } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingDesktopSectionTitle } from './bookingDesktopTheme';

type Props = {
  categoryCode: string | null | undefined;
  photoUrl: string | null;
  onPhotoUrlChange: (url: string | null) => void;
  disabled?: boolean;
};

export function BookingReferencePhotoField({
  categoryCode,
  photoUrl,
  onPhotoUrlChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinterestUrl = referencePhotoPinterestUrl(categoryCode);

  const onPickFile = (file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    void (async () => {
      try {
        const url = await uploadBookingReferencePhoto(file);
        onPhotoUrlChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
        onPhotoUrlChange(null);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    })();
  };

  return (
    <div className="block">
      <span className={bookingDesktopSectionTitle}>{referencePhotoSectionTitle(categoryCode)}</span>
      <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{referencePhotoHint(categoryCode)}</p>

      <a
        href={pinterestUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${catalogSecondaryBtn} mt-2.5 inline-flex w-full items-center justify-center gap-2`}
      >
        <SiPinterest className="h-4 w-4 shrink-0 text-[#E60023]" aria-hidden />
        <span>Идеи на Pinterest</span>
        <HiArrowTopRightOnSquare className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
      </a>

      {photoUrl ? (
        <div className="relative mt-3 overflow-hidden rounded-[12px] ring-1 ring-[#EEEEEE]">
          <img src={photoUrl} alt="Референс для мастера" className="max-h-48 w-full object-cover" />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => onPhotoUrlChange(null)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
            aria-label="Удалить фото"
          >
            <HiXMark className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={`${catalogFieldClass} mt-3 flex w-full min-h-[88px] flex-col items-center justify-center gap-2 border-dashed px-4 py-5 text-center transition hover:border-[#F47C8C] hover:bg-[#FFFBFC] disabled:opacity-50`}
        >
          <HiPhoto className="h-6 w-6 text-[#9CA3AF]" aria-hidden />
          <span className="text-[14px] font-semibold text-[#374151]">
            {uploading ? 'Загружаем…' : 'Выбрать фото'}
          </span>
          <span className="text-[12px] text-[#9CA3AF]">JPEG, PNG или WebP · до 5 МБ</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
      />

      {error ? (
        <p className="mt-2 text-[13px] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
