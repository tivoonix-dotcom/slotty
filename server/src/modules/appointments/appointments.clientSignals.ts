import { ApiError } from '../../utils/ApiError.js';

export type ClientSignalKind = 'on_the_way' | 'running_late' | 'reported_arrived';

export async function clientBookingSignal(
  clientId: string,
  appointmentId: string,
  kind: ClientSignalKind,
  _options?: { comment?: string | null; lateMinutes?: number | null },
): Promise<void> {
  void clientId;
  void appointmentId;
  void kind;
  throw ApiError.conflict(
    'Сообщения «в пути / на месте» больше не поддерживаются',
    'CLIENT_SIGNAL_DEPRECATED',
  );
}
