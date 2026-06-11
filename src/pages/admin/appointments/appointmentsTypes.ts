export type AppointmentsTabId = 'requests' | 'upcoming' | 'history';

export type ServiceFilter = 'all' | string;

export type RequestsSort = 'newest' | 'oldest' | 'price_high' | 'price_low';

export type RequestsPeriodFilter = 'all' | 'today' | 'week' | 'month';

/** Доп. критерии заявок: срочность ответа и фото-референс. */
export type RequestsFeatureFilter = 'all' | 'expiring' | 'with_photo';

export type UpcomingSort = 'date' | 'newest';

export type UpcomingViewMode = 'list' | 'calendar';

export type HistoryStatusFilter = 'all' | 'completed' | 'cancelled';

export type HistoryPeriodFilter = 'all' | 'month' | 'quarter';

export type HistorySort = 'newest' | 'oldest' | 'price_high' | 'price_low';
