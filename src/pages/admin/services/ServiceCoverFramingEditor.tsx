import { useCallback, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { HiArrowTopRightOnSquare } from 'react-icons/hi2';
import { SiPinterest } from 'react-icons/si';
import { uploadMasterPortfolioImageFile } from '../../../features/admin/api/masterCabinetApi';
import {
  getServiceCoverStockPhotoUrl,
  serviceCoverPinterestUrl,
  uploadServiceCoverStockPhoto,
} from '../../../features/catalog/serviceCoverStockPhoto';
import {
  CATALOG_SERVICE_CARD_ASPECT_CLASS,
  clampCoverFocal,
  serviceCoverImageStyle,
} from '../../../features/catalog/serviceCoverPresentation';
import { AdminSheetFieldLabel } from '../shared/AdminFormFieldLabel';
import { sheetLabelClass, sheetPinkPillBtnClass } from '../profile/adminProfileCabinetTheme';
import { CabinetIcon } from '../profile/cabinetIcons';
import { servicesSheetFormPanel } from './adminServicesTheme';

export type ServiceCoverDraft = {
  imageUrl: string;
  focalX: number;
  focalY: number;
};

type Props = {
  value: ServiceCoverDraft | null;
  onChange: (next: ServiceCoverDraft | null) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  useCabinetApi: boolean;
  disabled?: boolean;
  error?: string | null;
  titlePreview?: string;
  categoryLabel?: string | null;
  categoryCode?: string | null;
  pricePreview?: string;
};

function CatalogCardMiniPreview({
  imageUrl,
  focalX,
  focalY,
  title,
  categoryLabel,
  pricePreview,
}: {
  imageUrl: string;
  focalX: number;
  focalY: number;
  title: string;
  categoryLabel?: string | null;
  pricePreview?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#EEEEEE] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
      <div className={`relative ${CATALOG_SERVICE_CARD_ASPECT_CLASS} w-full overflow-hidden bg-[#EBEBEB]`}>
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={serviceCoverImageStyle({ focalX, focalY })}
          decoding="async"
        />
      </div>
      <div className="space-y-1 p-3">
        {categoryLabel ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F47C8C]">{categoryLabel}</p>
        ) : null}
        <p className="line-clamp-2 text-[15px] font-bold leading-snug text-[#111827]">
          {title.trim() || 'Название услуги'}
        </p>
        {pricePreview ? (
          <p className="text-[16px] font-bold text-[#111827]">{pricePreview}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Загрузка и кадрирование фото услуги — превью 1:1 с карточкой каталога. */
export function ServiceCoverFramingEditor({
  value,
  onChange,
  uploading,
  onUploadingChange,
  useCabinetApi,
  disabled = false,
  error,
  titlePreview = '',
  categoryLabel,
  categoryCode,
  pricePreview,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; focalX: number; focalY: number } | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewUrl = value?.imageUrl?.trim() ?? '';
  const stockPhotoUrl = getServiceCoverStockPhotoUrl(categoryCode, categoryLabel);
  const pinterestUrl = serviceCoverPinterestUrl(categoryCode, categoryLabel);
  const focalX = value?.focalX ?? 50;
  const focalY = value?.focalY ?? 50;
  const busy = disabled || uploading;
  const stockActive =
    Boolean(previewUrl) &&
    (previewUrl === stockPhotoUrl || previewUrl.includes('catalog-services'));

  const selectStockPhoto = useCallback(() => {
    if (busy) return;
    setUploadErr(null);

    if (!useCabinetApi) {
      onChange({ imageUrl: stockPhotoUrl, focalX: 50, focalY: 50 });
      return;
    }

    onUploadingChange(true);
    void uploadServiceCoverStockPhoto(stockPhotoUrl)
      .then((url) => onChange({ imageUrl: url, focalX: 50, focalY: 50 }))
      .catch((err: unknown) => {
        setUploadErr(err instanceof Error ? err.message : 'Не удалось применить готовое фото');
      })
      .finally(() => onUploadingChange(false));
  }, [busy, onChange, onUploadingChange, stockPhotoUrl, useCabinetApi]);

  const applyFocal = useCallback(
    (nextX: number, nextY: number) => {
      if (!previewUrl) return;
      onChange({
        imageUrl: previewUrl,
        focalX: clampCoverFocal(nextX),
        focalY: clampCoverFocal(nextY),
      });
    },
    [onChange, previewUrl],
  );

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadErr(null);

    const preview = URL.createObjectURL(file);
    onChange({ imageUrl: preview, focalX: 50, focalY: 50 });

    if (!useCabinetApi) {
      const reader = new FileReader();
      reader.onload = () => {
        URL.revokeObjectURL(preview);
        const result = reader.result;
        if (typeof result === 'string') {
          onChange({ imageUrl: result, focalX: 50, focalY: 50 });
        }
      };
      reader.onerror = () => {
        URL.revokeObjectURL(preview);
        setUploadErr('Не удалось прочитать файл');
        onChange(null);
      };
      reader.readAsDataURL(file);
      return;
    }

    onUploadingChange(true);
    void uploadMasterPortfolioImageFile(file)
      .then((url) => {
        URL.revokeObjectURL(preview);
        onChange({ imageUrl: url, focalX: 50, focalY: 50 });
      })
      .catch((err: unknown) => {
        URL.revokeObjectURL(preview);
        onChange(null);
        setUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
      })
      .finally(() => onUploadingChange(false));
  };

  const onFramePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!previewUrl || busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, focalX, focalY };
    setDragging(true);
  };

  const onFramePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    applyFocal(drag.focalX - dx, drag.focalY - dy);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const fieldError = error ?? uploadErr;

  return (
    <div className={servicesSheetFormPanel}>
      <AdminSheetFieldLabel required className={`block ${sheetLabelClass}`}>
        Фото услуги
      </AdminSheetFieldLabel>
      <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#6B7280]">
        Сначала выберите готовое фото для категории или загрузите своё. Кадр можно подстроить перетаскиванием.
      </p>

      <div className="mt-3 rounded-[14px] border border-[#FDE8ED] bg-[#FFFBFC] p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#F47C8C]">
          Готовое фото Slotty
        </p>
        <p className="mt-1 text-[12px] font-medium leading-snug text-[#6B7280]">
          {categoryLabel?.trim()
            ? `Для категории «${categoryLabel.trim()}» — можно сразу опубликовать в каталоге`
            : 'Фото из каталога Slotty для вашей категории'}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={selectStockPhoto}
          className={`mt-3 block w-full overflow-hidden rounded-[12px] ring-2 transition active:scale-[0.99] ${
            stockActive ? 'ring-[#F47C8C]' : 'ring-[#EEEEEE] hover:ring-[#F47C8C]/45'
          }`}
        >
          <div className={`relative ${CATALOG_SERVICE_CARD_ASPECT_CLASS} w-full bg-[#EBEBEB]`}>
            <img
              src={stockPhotoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              decoding="async"
            />
            {stockActive ? (
              <span className="absolute left-2 top-2 rounded-full bg-[#F47C8C] px-2.5 py-0.5 text-[11px] font-bold text-white">
                Выбрано
              </span>
            ) : null}
          </div>
        </button>
        <p className="mt-2 text-center text-[11px] font-medium text-[#9CA3AF]">
          Нажмите на превью, чтобы использовать это фото
        </p>
      </div>

      <a
        href={pinterestUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#EEEEEE] bg-white px-4 py-3 text-[14px] font-semibold text-[#111827] transition hover:border-[#F47C8C]/35 hover:bg-[#FFF8F9]"
      >
        <SiPinterest className="h-4 w-4 shrink-0 text-[#E60023]" aria-hidden />
        <span>Найти идеи на Pinterest</span>
        <HiArrowTopRightOnSquare className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
      </a>

      <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
        Или своё фото
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
        disabled={busy}
      />

      <div className="mt-3 space-y-4">
        <div className="mx-auto w-full max-w-[360px]">
          <div
            ref={frameRef}
            className={`relative ${CATALOG_SERVICE_CARD_ASPECT_CLASS} overflow-hidden rounded-[14px] bg-[#EBEBEB] ${
              previewUrl ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
            } ${fieldError ? 'ring-2 ring-red-300/80' : 'ring-1 ring-[#EEEEEE]'}`}
            onPointerDown={onFramePointerDown}
            onPointerMove={onFramePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="absolute inset-0 h-full w-full select-none touch-none"
                style={serviceCoverImageStyle({ focalX, focalY })}
                draggable={false}
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                <CabinetIcon name="photo" size={40} />
                <span className="text-[13px] font-medium">Загрузите фото</span>
              </div>
            )}
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-[13px] font-semibold text-white">
                Загрузка…
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className={sheetPinkPillBtnClass}
            >
              {uploading ? 'Загрузка…' : previewUrl ? 'Сменить фото' : 'Загрузить фото'}
            </button>
            {previewUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setUploadErr(null);
                  onChange(null);
                }}
                className="rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[12px] font-semibold text-[#6B7280]"
              >
                Удалить
              </button>
            ) : null}
          </div>

          {previewUrl ? (
            <p className="mt-2 text-center text-[11px] font-medium text-[#9CA3AF]">
              Перетащите фото в рамке, чтобы настроить кадр
            </p>
          ) : null}
        </div>

        {previewUrl ? (
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
              Как в каталоге
            </p>
            <div className="mx-auto max-w-[220px]">
              <CatalogCardMiniPreview
                imageUrl={previewUrl}
                focalX={focalX}
                focalY={focalY}
                title={titlePreview}
                categoryLabel={categoryLabel}
                pricePreview={pricePreview}
              />
            </div>
          </div>
        ) : null}
      </div>

      {fieldError ? (
        <p className="mt-2 text-center text-[12px] font-medium text-red-600">{fieldError}</p>
      ) : null}
    </div>
  );
}
