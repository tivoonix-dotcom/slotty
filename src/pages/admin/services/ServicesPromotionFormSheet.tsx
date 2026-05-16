import { useEffect, useMemo, useState } from 'react';
import { HiCalendarDays } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { servicesCard, servicesInput, servicesPinkBtn } from './adminServicesTheme';
import { isoDateLocal, resolvePromotionImage } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import { loadServiceBundles, newPromotionId } from './servicesStorage';
import type {
  ServicePromotion,
  ServicePromotionImageSource,
  ServicePromotionTemplate,
} from './servicesTypes';
import { PROMOTION_TEMPLATE_META } from './servicesTypes';

const TEMPLATE_ORDER: ServicePromotionTemplate[] = [
  'percent',
  'first_visit',
  'weekly_combo',
  'seasonal',
  'bundle',
  'gift',
  'happy_hours',
];

type TargetKind = 'service' | 'bundle';

type Props = {
  open: boolean;
  draft: MasterDraft;
  services: ManagedService[];
  initial: ServicePromotion | null;
  onClose: () => void;
  onSave: (promo: ServicePromotion, publish: boolean) => void;
};

function formatDdMmRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function ServicesPromotionFormSheet({
  open,
  draft,
  services,
  initial,
  onClose,
  onSave,
}: Props) {
  const bundles = useMemo(() => loadServiceBundles(), [open]);
  const today = isoDateLocal(new Date());
  const inWeek = isoDateLocal(new Date(Date.now() + 7 * 86400000));

  const [template, setTemplate] = useState<ServicePromotionTemplate>('percent');
  const [targetKind, setTargetKind] = useState<TargetKind>('service');
  const [targetId, setTargetId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountLabel, setDiscountLabel] = useState('-15%');
  const [startsAt, setStartsAt] = useState(today);
  const [endsAt, setEndsAt] = useState(inWeek);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageSource, setImageSource] = useState<ServicePromotionImageSource>('service');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTemplate(initial.template);
      setTargetKind(initial.bundleId ? 'bundle' : 'service');
      setTargetId(initial.serviceId ?? initial.bundleId ?? '');
      setTitle(initial.title);
      setDescription(initial.description);
      setDiscountLabel(initial.discountLabel);
      setStartsAt(initial.startsAt);
      setEndsAt(initial.endsAt);
      setImageUrl(initial.imageUrl);
      setImageSource(initial.imageSource);
      return;
    }
    const meta = PROMOTION_TEMPLATE_META.percent;
    setTemplate('percent');
    setTargetKind('service');
    setTargetId(services[0]?.id ?? '');
    setTitle(meta.defaultTitle);
    setDescription(meta.defaultDescription);
    setDiscountLabel(meta.defaultDiscount);
    setStartsAt(today);
    setEndsAt(inWeek);
    setImageUrl(undefined);
    setImageSource('service');
  }, [open, initial, services, today, inWeek]);

  useEffect(() => {
    if (!open || initial) return;
    const meta = PROMOTION_TEMPLATE_META[template];
    setTitle(meta.defaultTitle);
    setDescription(meta.defaultDescription);
    setDiscountLabel(meta.defaultDiscount);
  }, [template, open, initial]);

  const previewImage = useMemo(() => {
    if (imageSource === 'upload' && imageUrl) return imageUrl;
    return resolvePromotionImage({
      serviceId: targetKind === 'service' ? targetId : undefined,
      bundleId: targetKind === 'bundle' ? targetId : undefined,
      services,
      bundles,
      draft,
      fallback: imageUrl,
    });
  }, [bundles, draft, imageSource, imageUrl, services, targetId, targetKind]);

  const handleSave = (publish: boolean) => {
    const promo: ServicePromotion = {
      id: initial?.id ?? newPromotionId(),
      title: title.trim() || PROMOTION_TEMPLATE_META[template].defaultTitle,
      description: description.trim() || PROMOTION_TEMPLATE_META[template].defaultDescription,
      template,
      status: publish ? 'active' : 'draft',
      discountLabel: discountLabel.trim() || '-10%',
      serviceId: targetKind === 'service' ? targetId || undefined : undefined,
      bundleId: targetKind === 'bundle' ? targetId || undefined : undefined,
      imageUrl: previewImage ?? undefined,
      imageSource,
      startsAt,
      endsAt,
    };
    onSave(promo, publish);
  };

  const portfolioUrls = (draft.portfolio ?? [])
    .map((p) => p.imageUrl)
    .filter((u): u is string => Boolean(u?.trim()));

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Редактировать акцию' : 'Новая акция'}
    >
      <div className="max-h-[min(72dvh,640px)] space-y-4 overflow-y-auto pb-2 [-webkit-overflow-scrolling:touch]">
        <div>
          <p className="text-[13px] font-semibold text-[#6B7280]">Шаблон акции</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TEMPLATE_ORDER.map((id) => {
              const meta = PROMOTION_TEMPLATE_META[id];
              const selected = template === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTemplate(id)}
                  className={`rounded-[16px] border px-3 py-3 text-left text-[12px] font-bold transition active:scale-[0.98] ${
                    selected
                      ? 'border-[#F9A8B4] bg-[#FFF1F4] text-[#F47C8C]'
                      : 'border-[#EAECEF] bg-white text-[#374151]'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-[#6B7280]">Услуга или набор</p>
          <div className="mt-2 flex gap-2">
            {(['service', 'bundle'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setTargetKind(kind);
                  setTargetId(kind === 'service' ? (services[0]?.id ?? '') : (bundles[0]?.id ?? ''));
                  setImageSource('service');
                }}
                className={`flex-1 rounded-full py-2 text-[13px] font-bold ${
                  targetKind === kind
                    ? 'bg-[#FFF1F4] text-[#F47C8C]'
                    : 'bg-[#F3F4F6] text-[#6B7280]'
                }`}
              >
                {kind === 'service' ? 'Услуга' : 'Набор'}
              </button>
            ))}
          </div>
          <select
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              setImageSource('service');
              setImageUrl(undefined);
            }}
            className={`${servicesInput} mt-2`}
          >
            {targetKind === 'service'
              ? services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))
              : bundles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
          </select>
        </div>

        <label className="block">
          <span className="text-[13px] font-semibold text-[#6B7280]">Название акции</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${servicesInput} mt-1.5`} />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-[#6B7280]">Описание</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={`${servicesInput} mt-1.5 resize-none`}
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-[#6B7280]">Скидка или бонус</span>
          <input
            value={discountLabel}
            onChange={(e) => setDiscountLabel(e.target.value)}
            className={`${servicesInput} mt-1.5`}
            placeholder="-15%"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[13px] font-semibold text-[#6B7280]">Дата начала</span>
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={`${servicesInput} mt-1.5`}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-[#6B7280]">Дата окончания</span>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={`${servicesInput} mt-1.5`}
            />
          </label>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-[#6B7280]">Фото акции</p>
          <div className="mt-2 overflow-hidden rounded-[18px] border border-[#EAECEF]">
            {previewImage ? (
              <img src={previewImage} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#FFF1F4] to-[#FFE4EA] text-[#F47C8C]">
                Шаблонный фон
              </div>
            )}
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-[#9CA3AF]">
            {imageSource === 'service'
              ? 'Фото взято из услуги'
              : imageSource === 'portfolio'
                ? 'Фото из портфолио'
                : imageSource === 'upload'
                  ? 'Загруженное фото'
                  : 'Шаблон'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[#EAECEF] bg-white px-3 py-2 text-[12px] font-bold text-[#374151]"
              onClick={() => {
                setImageSource('service');
                setImageUrl(undefined);
              }}
            >
              Из услуги
            </button>
            <button
              type="button"
              className="rounded-full border border-[#EAECEF] bg-white px-3 py-2 text-[12px] font-bold text-[#374151]"
              onClick={() => {
                const url = portfolioUrls[0] ?? draft.photoUrl;
                if (url) {
                  setImageUrl(url);
                  setImageSource('portfolio');
                }
              }}
            >
              Из портфолио
            </button>
            <label className="cursor-pointer rounded-full border border-[#EAECEF] bg-white px-3 py-2 text-[12px] font-bold text-[#374151]">
              Загрузить
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setImageUrl(reader.result);
                      setImageSource('upload');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-[#6B7280]">Превью для клиента</p>
          <div className={`${servicesCard} mt-2 overflow-hidden p-0`}>
            <div className="relative min-h-[140px]">
              {previewImage ? (
                <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFF1F4] to-[#FDE8ED]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F47C8C]/85 via-[#F47C8C]/40 to-transparent" />
              <div className="relative p-4 text-white">
                <span className="inline-flex rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold text-[#F47C8C]">
                  {discountLabel}
                </span>
                <h3 className="mt-2 text-[17px] font-bold leading-tight">{title || 'Акция'}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] text-white/90">{description}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold">
                  <HiCalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {formatDdMmRu(startsAt)} — {formatDdMmRu(endsAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button type="button" onClick={() => handleSave(false)} className={servicesPinkBtn}>
            Сохранить черновик
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#FDE8ED] bg-[#FFF1F4] text-[15px] font-bold text-[#F47C8C] transition active:scale-[0.98]"
          >
            Опубликовать
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center text-[14px] font-semibold text-[#6B7280]"
          >
            Отмена
          </button>
        </div>
      </div>
    </AdminBottomSheet>
  );
}
