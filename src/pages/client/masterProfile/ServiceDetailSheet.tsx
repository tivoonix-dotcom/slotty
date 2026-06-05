import type { ReactNode } from 'react';
import { HiClock, HiCreditCard, HiWallet } from 'react-icons/hi2';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from '../../../features/catalog/categoryWorkPhotos';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { clientPinkBtn } from '../clientTheme';
import { ClientSheetShell } from './ClientSheetShell';
import { MasterPaymentMethodsBlock } from './MasterPaymentMethodsBlock';
import type { MasterPublicPaymentDto } from '../../../shared/payments/paymentMethodCodes';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';

type Props = {
  open: boolean;
  service: DemoMasterService | null;
  categoryCode?: string;
  categoryLabel?: string;
  paymentMethods?: string[];
  payment?: MasterPublicPaymentDto | null;
  paymentNote?: string;
  onClose: () => void;
  onChooseTime: () => void;
};

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="flex min-h-[5.5rem] flex-col justify-between rounded-[16px] bg-[#F6F7FB] px-4 py-3.5 ring-1 ring-[#EEEEEE]">
      <div className="flex items-center gap-2 text-[#9CA3AF]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE]">
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.06em]">{label}</span>
      </div>
      <p className="mt-2 text-[1.35rem] font-bold tabular-nums leading-none tracking-[-0.03em] text-[#111827]">
        {value}
      </p>
    </article>
  );
}

export function ServiceDetailSheet({
  open,
  service,
  categoryCode,
  categoryLabel,
  paymentMethods = [],
  payment,
  paymentNote,
  onClose,
  onChooseTime,
}: Props) {
  if (!service) return null;

  const workPhotoCode = resolveCategoryWorkCode(categoryCode ?? categoryLabel);
  const coverUrl = getCategoryWorkPhotoUrl(workPhotoCode);
  const priceLabel = formatServicePrice(service);
  const durationLabel = serviceDurationLabel(service.duration);
  const description = service.description?.trim();
  const hasPayment =
    paymentMethods.length > 0 ||
    Boolean(payment?.methods?.length) ||
    Boolean(paymentNote?.trim()) ||
    Boolean(payment?.comment?.trim());

  return (
    <ClientSheetShell
      open={open}
      onClose={onClose}
      title={service.title}
      footer={
        <button
          type="button"
          onClick={() => {
            onClose();
            onChooseTime();
          }}
          className={`${clientPinkBtn} w-full`}
        >
          Выбрать время
        </button>
      }
    >
      <div className="space-y-5">
        <ImageReveal
          src={coverUrl}
          alt=""
          className="h-[148px] w-full rounded-[18px] object-cover ring-1 ring-[#EEEEEE] lg:h-[168px]"
          loading="lazy"
        />

        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            icon={<HiClock className="h-4 w-4" aria-hidden />}
            label="Длительность"
            value={durationLabel}
          />
          <MetricTile
            icon={<HiWallet className="h-4 w-4" aria-hidden />}
            label={service.priceType === 'from' ? 'Цена от' : 'Стоимость'}
            value={priceLabel}
          />
        </div>

        <section>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Описание
          </h3>
          {description ? (
            <p className="mt-2.5 text-[15px] leading-relaxed text-[#374151]">{description}</p>
          ) : (
            <p className="mt-2.5 rounded-[14px] bg-[#FAFAFA] px-4 py-3 text-[14px] leading-relaxed text-[#9CA3AF] ring-1 ring-[#F3F4F6]">
              Мастер скоро добавит описание услуги. Вы можете записаться и уточнить детали при
              визите.
            </p>
          )}
        </section>

        {hasPayment ? (
          <section className="overflow-hidden rounded-[18px] bg-white ring-1 ring-[#EEEEEE]">
            <div className="flex items-center gap-3 border-b border-[#F3F4F6] px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#F6F7FB] text-[#6B7280]">
                <HiCreditCard className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-[#111827]">Способы оплаты</h3>
                <p className="mt-0.5 text-[12px] text-[#9CA3AF]">Принимает мастер на визите</p>
              </div>
            </div>
            <div className="px-4 py-4">
              <MasterPaymentMethodsBlock
                methods={paymentMethods}
                payment={payment}
                note={paymentNote}
                variant="sheet"
              />
            </div>
          </section>
        ) : null}

        <p className="text-center text-[12px] leading-relaxed text-[#9CA3AF]">
          После выбора времени вы подтвердите запись в пару шагов
        </p>
      </div>
    </ClientSheetShell>
  );
}
