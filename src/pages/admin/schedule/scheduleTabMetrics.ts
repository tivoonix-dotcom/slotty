import type { ScheduleWindowView, WindowTemplate } from './scheduleTypes';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type ScheduleTabMetrics = {
  create: {
    templates: number;
    windowsTotal: number;
    upcomingFree: number;
    servicesInCatalog: number;
  };
  calendar: {
    total: number;
    free: number;
    booked: number;
    blocked: number;
  };
  list: {
    total: number;
    free: number;
    booked: number;
    blocked: number;
  };
};

export function computeScheduleTabMetrics(
  windows: ScheduleWindowView[],
  templates: WindowTemplate[],
  servicesCount: number,
): ScheduleTabMetrics {
  const today = todayIso();
  let free = 0;
  let booked = 0;
  let blocked = 0;

  for (const w of windows) {
    if (w.status === 'free') free += 1;
    else if (w.status === 'booked') booked += 1;
    else blocked += 1;
  }

  const total = windows.length;
  const upcomingFree = windows.filter((w) => w.status === 'free' && w.dateIso >= today).length;

  const slots = { total, free, booked, blocked };

  return {
    create: {
      templates: templates.length,
      windowsTotal: total,
      upcomingFree,
      servicesInCatalog: servicesCount,
    },
    calendar: slots,
    list: slots,
  };
}
