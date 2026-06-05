export type NotificationJobType =
  | 'booking_client_pending'
  | 'booking_master_new'
  | 'booking_client_confirmed'
  | 'booking_client_cancelled'
  | 'booking_master_client_cancelled'
  | 'booking_reminder_1h'
  | 'booking_reminder_24h'
  | 'booking_visit_start'
  | 'booking_master_pending_reminder'
  | 'booking_master_pending_deadline';

export type NotificationJobChannel = 'email' | 'telegram' | 'in_app';

export type NotificationJobStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled'
  | 'skipped';

export type NotificationJobRow = {
  id: string;
  job_type: NotificationJobType;
  channel: NotificationJobChannel;
  recipient_user_id: string;
  appointment_id: string;
  scheduled_at: Date | string;
  status: NotificationJobStatus;
  attempts: number;
  last_error: string | null;
  provider_message_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const NOTIFICATION_JOB_MAX_ATTEMPTS = 5;
export const NOTIFICATION_JOB_RETRY_MINUTES = 10;
