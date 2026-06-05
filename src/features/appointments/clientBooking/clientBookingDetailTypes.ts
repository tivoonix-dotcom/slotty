import type { ServerClientAppointment } from '../api/clientAppointments';

export type ClientBookingActionId =
  | 'on_the_way'
  | 'running_late'
  | 'reported_arrived'
  | 'contact_master'
  | 'add_comment'
  | 'cancel'
  | 'reschedule'
  | 'confirm_completed'
  | 'dispute'
  | 'leave_review'
  | 'rebook'
  | 'download_pdf'
  | 'open_route';

export type ClientBookingDetail = ServerClientAppointment & {
  status_label?: string;
  status_hint?: string;
  service_duration_minutes?: number | null;
  cancel_reason?: string | null;
  cancel_reason_category?: string | null;
  can_leave_review?: boolean;
  completed_at?: string | null;
  auto_completed_at?: string | null;
  master_marked_completed_at?: string | null;
  client_confirmed_completed_at?: string | null;
  dispute?: {
    id: string;
    reason: string;
    comment: string | null;
    status: string;
    createdByRole: string;
  } | null;
  hero?: {
    title: string;
    subtitle: string;
    countdown: string | null;
    lateBadge: string | null;
  };
  client_signal?: {
    kind: 'on_the_way' | 'running_late' | 'reported_arrived' | null;
    lateMinutes: number | null;
    comment: string | null;
    at: string | null;
  };
  available_actions?: ClientBookingActionId[];
  address?: {
    line: string | null;
    hint: string | null;
    map_available: boolean;
  };
  master?: {
    id: string;
    display_name: string;
    photo_url: string | null;
    slug: string | null;
    profile_path: string;
    specialty: string | null;
    rating: number;
    reviews_count: number;
    contacts_visible: boolean;
    contact_actions: Array<{
      type: 'telegram' | 'phone' | 'email' | 'whatsapp' | 'slotty';
      label: string;
      href: string | null;
    }>;
  };
  timeline?: Array<{
    id: string;
    eventType: string;
    label: string;
    createdAt: string;
    timeLabel: string;
  }>;
};
