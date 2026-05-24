import type { DemoAppointmentStatus } from '../../features/appointments/model/demoAppointments';

export function statusLabelRu(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Подтверждена';
    case 'pending':
      return 'Ожидает';
    case 'completed':
      return 'Завершена';
    case 'cancelled':
      return 'Отменена';
    default:
      return status;
  }
}

export function statusClassName(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-[#EAFBF2] text-[#2F8A5B]';
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B66A24]';
    case 'completed':
      return 'bg-[#EEF2FF] text-[#5B63B7]';
    case 'cancelled':
      return 'bg-[#F3F1F1] text-neutral-500';
    default:
      return 'bg-[#F3F1F1] text-neutral-500';
  }
}

export function statusDetailsRu(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Подтверждена';
    case 'pending':
      return 'Ожидает подтверждения';
    case 'completed':
      return 'Завершена';
    case 'cancelled':
      return 'Отменена';
    default:
      return status;
  }
}

export function formatPriceByn(price: number): string {
  return `${price} BYN`;
}
