import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { clientPinkBtn } from '../clientTheme';
import { ClientSheetShell } from './ClientSheetShell';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';

type Props = {
  open: boolean;
  service: DemoMasterService | null;
  onClose: () => void;
  onChooseTime: () => void;
};

export function ServiceDetailSheet({ open, service, onClose, onChooseTime }: Props) {
  if (!service) return null;

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
      <p className="text-[14px] text-[#6B7280]">
        {serviceDurationLabel(service.duration)} · {formatServicePrice(service)}
      </p>
      {service.description?.trim() ? (
        <p className="mt-4 text-[15px] leading-relaxed text-[#374151]">{service.description}</p>
      ) : (
        <p className="mt-4 text-[14px] text-[#9CA3AF]">Описание скоро появится</p>
      )}
    </ClientSheetShell>
  );
}
