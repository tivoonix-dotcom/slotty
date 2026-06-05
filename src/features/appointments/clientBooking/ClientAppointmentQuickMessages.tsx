import type { ClientAppointmentQuickMessage } from './clientAppointmentViewModel';
import { quickMessageLabel } from './clientAppointmentViewModel';
import { ClientBookingSectionTitle } from './clientBookingDetailUi';
import { clientBookingPanel } from './clientBookingDetailTheme';

type Props = {
  messages: ClientAppointmentQuickMessage[];
  disabled?: boolean;
  onSelect: (message: ClientAppointmentQuickMessage) => void;
};

export function ClientAppointmentQuickMessages({ messages, disabled, onSelect }: Props) {
  if (!messages.length) return null;

  return (
    <div className={`${clientBookingPanel} p-4 lg:p-5`}>
      <ClientBookingSectionTitle>Сообщить мастеру</ClientBookingSectionTitle>
      <p className="mt-1 text-[13px] text-[#6B7280]">Быстрое сообщение — мастер получит уведомление.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {messages.map((message) => (
          <button
            key={message}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(message)}
            className="inline-flex min-h-9 items-center rounded-full bg-[#F5F5F5] px-4 text-[13px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB] disabled:opacity-50"
          >
            {quickMessageLabel(message)}
          </button>
        ))}
      </div>
    </div>
  );
}
