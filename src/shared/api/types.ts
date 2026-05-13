export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'master' | 'client';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

/** Row in `public.profiles` */
export interface Profile {
  id: string;
  /** Telegram user id (Postgres bigint → string in JSON transport when large) */
  tg_id: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** Row in `public.masters_metadata` */
export interface MastersMetadata {
  master_id: string;
  bio: string | null;
  rating: string;
  global_buffer_minutes: number;
  created_at: string;
  updated_at: string;
}

/** Row in `public.work_schedules` — day_of_week: 0 Sun … 6 Sat */
export interface WorkSchedule {
  id: string;
  master_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Row in `public.services` — price as decimal string from PostgREST */
export interface Service {
  id: string;
  master_id: string;
  name: string;
  duration_minutes: number;
  price: string;
  created_at: string;
  updated_at: string;
}

/** Row in `public.appointments` */
export interface Appointment {
  id: string;
  master_id: string;
  client_id: string | null;
  service_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  client_note: string | null;
  created_at: string;
  updated_at: string;
}

/** Supabase `Database` generic for `createClient<Database>()` */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          tg_id?: string | null;
          full_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tg_id?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      masters_metadata: {
        Row: MastersMetadata;
        Insert: {
          master_id: string;
          bio?: string | null;
          rating?: string;
          global_buffer_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          master_id?: string;
          bio?: string | null;
          rating?: string;
          global_buffer_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_schedules: {
        Row: WorkSchedule;
        Insert: {
          id?: string;
          master_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          master_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: Service;
        Insert: {
          id?: string;
          master_id: string;
          name: string;
          duration_minutes: number;
          price: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          master_id?: string;
          name?: string;
          duration_minutes?: number;
          price?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        Insert: {
          id?: string;
          master_id: string;
          client_id?: string | null;
          service_id: string;
          start_at: string;
          end_at: string;
          status?: AppointmentStatus;
          client_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          master_id?: string;
          client_id?: string | null;
          service_id?: string;
          start_at?: string;
          end_at?: string;
          status?: AppointmentStatus;
          client_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
