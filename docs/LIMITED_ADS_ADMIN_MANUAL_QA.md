# Slotty Platform Admin Manual QA before Limited Ads

## Цель

Проверить, что ops-команда может быстро найти мастера, запись, слот, уведомление и отзыв во время первых рекламных запусков.

**Окружение:** staging или production-like с реальными данными.  
**Роль:** аккаунт с `platform_admin`.  
**Время:** ~30–45 минут.

---

## A. Login/RBAC

| Step | Expected | Result | Notes |
| ---- | -------- | ------ | ----- |
| Open `/platform-admin` without auth | Redirect to login or forbidden | | |
| Login as `platform_admin` | Admin dashboard opens | | |
| Login as master/client | 403 / «Нет доступа» | | |

---

## B. Master diagnostics

| Step | Expected | Result | Notes |
| ---- | -------- | ------ | ----- |
| Open `/platform-admin/masters` | Masters list loads | | |
| Search test master | Master found | | |
| Open detail | Profile status, services count, slots count, bookings count, plan | | |
| Open public profile link | Public profile opens | | |

---

## C. Booking lifecycle visibility

| Step | Expected | Result | Notes |
| ---- | -------- | ------ | ----- |
| Client creates booking | Booking code/voucher created (SL-…) | | |
| Search booking by SL-code in `/platform-admin/bookings` | Booking found | | Use exact code, then lowercase |
| Open detail | Client, master, service, time, status visible | | |
| Check «Подтвердить до» for pending | Deadline shown if status pending | | |
| Check notification jobs count | Shown in detail header | | |
| Click «Аудит записи» | Scrolls to events/notifications | | |
| Master confirms | Status becomes confirmed in admin | | |
| Master completes | Status becomes completed in admin | | |
| Client leaves review | Detail shows «Отзыв: Оставлен» or audit event | | |

---

## D. Notifications/jobs diagnostics

| Step | Expected | Result | Notes |
| ---- | -------- | ------ | ----- |
| Open `/platform-admin/notifications?tab=diagnostics` | Diagnostics loads | | |
| Check `NOTIFICATION_JOBS_ENABLED` | Enabled (да) | | |
| Check failed jobs | No critical failures | | |
| Test by SL-code in diagnostics | Booking notification test works | | Optional |

---

## E. Billing safety

| Step | Expected | Result | Notes |
| ---- | -------- | ------ | ----- |
| Open master billing detail | Free/Pro status visible | | |
| Check mock subscription | Disabled in production | | `ALLOW_SUBSCRIPTION_MOCK` unset |
| Grant Pro action | Requires reason + appears in audit | | Only if testing ops flow |

---

## Launch decision

- **PASS all critical checks (A, B, C search, D enabled)** → **GO limited ads**
- **SL-code search fails** → **FIX before ads**
- **Admin cannot find booking/master** → **NO GO**

---

## Workarounds (если что-то сломалось)

| Problem | Workaround |
| ------- | ---------- |
| SL-code search | API: `GET /api/platform-admin/bookings?q=SL-...` или diagnostics test-booking |
| Master not bookable | Public profile + master detail counts (services/slots/publication) |
| Notification missing | Booking detail → Аудит → вкладка «Уведомления» |

---

## Sign-off

| Role | Name | Date | Verdict |
| ---- | ---- | ---- | ------- |
| QA / Ops | | | PASS / FAIL |
| Engineering | | | |
