export type AppointmentsTabId = 'requests' | 'upcoming' | 'history';

export type ServiceFilter = 'all' | string;

export type RequestsSort = 'newest' | 'oldest';

export type UpcomingSort = 'date' | 'newest';

export type HistoryStatusFilter = 'all' | 'completed' | 'cancelled';

export type HistoryPeriodFilter = 'all' | 'month' | 'quarter';

export type HistorySort = 'newest' | 'oldest' | 'price_high' | 'price_low';
