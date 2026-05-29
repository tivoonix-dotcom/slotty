-- Billing RLS hardening: запрет self-upgrade подписки и plan-полей профиля.

drop policy if exists master_subscriptions_write_own on public.master_subscriptions;

create or replace function public.guard_master_profiles_plan_self_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.master_id then
    if new.master_plan is distinct from old.master_plan
       or new.pro_status is distinct from old.pro_status
       or new.pro_started_at is distinct from old.pro_started_at
       or new.pro_expires_at is distinct from old.pro_expires_at
       or new.pro_interested is distinct from old.pro_interested
    then
      raise exception 'subscription fields are read-only for masters'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_master_profiles_guard_plan_self_edit on public.master_profiles;

create trigger trg_master_profiles_guard_plan_self_edit
before update on public.master_profiles
for each row
execute function public.guard_master_profiles_plan_self_edit();

comment on function public.guard_master_profiles_plan_self_edit is
  'Мастер не может менять master_plan / pro_* через Supabase client; только backend service role.';
