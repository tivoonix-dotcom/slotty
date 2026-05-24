import type { MySlotDto } from '../../../features/admin/api/adminSlotsApi';

/** create — шаблоны и быстрое добавление; calendar — календарь; list — все окна */
export type SchedulePageTab = 'create' | 'calendar' | 'list';

export type ScheduleSlotsStatusFilter = 'all' | 'free' | 'booked' | 'blocked';

export type RepeatKind = 'none' | 'weekly' | 'biweekly' | 'weekdays' | 'pick_weekdays';

export type WindowTemplate = {
  id: string;
  title: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  accent: string;
};

export type ScheduleWindowStatus = 'free' | 'booked' | 'blocked';

export type ScheduleWindowView = {
  id: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  serviceId: string | null;
  serviceName: string;
  status: ScheduleWindowStatus;
  clientName?: string;
  clientPhone?: string;
  slot: MySlotDto;
};

export type PlannedSlot = {
  dateIso: string;
  startTime: string;
  endTime: string;
  serviceId: string | null;
};

export type PlannedSlotRejectReason = 'invalid_time' | 'short' | 'past' | 'horizon';

export const TEMPLATE_ACCENTS = ['#E29595', '#C9A0DC', '#7CB8A8', '#E8B86D', '#6BA3D6'] as const;

export const MSG_SLOTS_ALL_BUSY = 'Не удалось создать окна: выбранное время уже занято';

export const errorBoxClass =
  'rounded-[20px] bg-[#FFF0F0] px-4 py-3 text-left text-[14px] font-semibold leading-snug text-[#9B2C2C] break-words [overflow-wrap:anywhere] min-w-0';
