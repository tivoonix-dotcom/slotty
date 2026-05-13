export interface GenerateDaySlotsParams {
  /** Календарный день (используются только год-месяц-день; время сбрасывается внутри) */
  date: Date;
  /** Начало рабочего дня, «HH:mm» */
  workDayStart: string;
  /** Конец рабочего дня, «HH:mm» (последний слот заканчивается не позже этого времени) */
  workDayEnd: string;
  /** Длительность услуги, мин */
  serviceDurationMinutes: number;
  /** Перерыв между слотами (буфер), мин */
  bufferMinutes: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  /** Подпись вида «10:00» */
  label: string;
}

function parseClockToMinutes(clock: string): number {
  const [h, m] = clock.split(':').map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    throw new Error(`Некорректное время «${clock}», ожидается HH:mm`);
  }
  return h * 60 + m;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatLabel(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Генерирует доступные стартовые слоты: каждый следующий старт = предыдущий + длительность + буфер.
 * Слот не может выходить за пределы рабочего дня (конец услуги ≤ workDayEnd).
 */
export function generateDaySlots(params: GenerateDaySlotsParams): TimeSlot[] {
  const { date, workDayStart, workDayEnd, serviceDurationMinutes, bufferMinutes } = params;

  if (serviceDurationMinutes <= 0) return [];

  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const startMin = parseClockToMinutes(workDayStart);
  const endMin = parseClockToMinutes(workDayEnd);
  if (!(endMin > startMin)) return [];

  const slots: TimeSlot[] = [];
  let cursorMin = startMin;

  while (cursorMin + serviceDurationMinutes <= endMin) {
    const start = new Date(day);
    const hh = Math.floor(cursorMin / 60);
    const mm = cursorMin % 60;
    start.setHours(hh, mm, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + serviceDurationMinutes);

    slots.push({ start, end, label: formatLabel(start) });
    cursorMin += serviceDurationMinutes + Math.max(0, bufferMinutes);
  }

  return slots;
}
