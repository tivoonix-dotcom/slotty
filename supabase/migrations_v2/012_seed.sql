-- SLOTTY DB v2 — reference seed (categories, payment methods, subscription plans)
-- Deterministic UUIDs for stable references in fixtures / tests.

insert into public.service_categories (id, code, name, sort_order)
values
  ('11111111-1111-4111-8111-111111110001', 'manicure', 'Маникюр', 10),
  ('11111111-1111-4111-8111-111111110002', 'barbers', 'Барберы', 20),
  ('11111111-1111-4111-8111-111111110003', 'brows-lashes', 'Брови и ресницы', 30),
  ('11111111-1111-4111-8111-111111110004', 'massage', 'Массаж', 40),
  ('11111111-1111-4111-8111-111111110005', 'fitness', 'Фитнес', 50),
  ('11111111-1111-4111-8111-111111110006', 'tattoo', 'Тату', 60)
on conflict (code) do nothing;

insert into public.payment_methods (id, code, name, sort_order)
values
  ('33333333-3333-4333-8333-333333330001', 'cash', 'Наличные', 10),
  ('33333333-3333-4333-8333-333333330002', 'card', 'Карта', 20),
  ('33333333-3333-4333-8333-333333330003', 'transfer', 'Перевод', 30),
  ('33333333-3333-4333-8333-333333330004', 'online_later', 'Онлайн позже', 40)
on conflict (code) do nothing;

insert into public.subscription_plans (
  id,
  code,
  name,
  price_month,
  price_year,
  max_services,
  max_monthly_appointments,
  max_schedule_days_ahead,
  can_use_analytics,
  can_use_pdf,
  can_use_priority_listing,
  sort_order
)
values
  (
    '22222222-2222-4222-8222-222222220001',
    'free',
    'Free',
    0,
    0,
    3,
    20,
    14,
    false,
    false,
    false,
    10
  ),
  (
    '22222222-2222-4222-8222-222222220002',
    'pro',
    'Pro',
    29,
    290,
    null,
    null,
    90,
    true,
    true,
    true,
    20
  )
on conflict (code) do nothing;
