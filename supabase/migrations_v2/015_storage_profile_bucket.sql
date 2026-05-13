-- SLOTTY — публичный bucket для аватаров клиентов (загрузка с бэкенда через service role).
-- Если bucket уже создан в Dashboard с именем `profile`, миграция только синхронизирует флаги.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile', 'profile', true, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  name = excluded.name;
