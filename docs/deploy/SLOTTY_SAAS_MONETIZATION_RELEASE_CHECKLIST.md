# SLOTTY — SaaS Monetization Release Checklist

Production-safe rollout for trial + EntitlementsService + catalog Pro boost.

## Pre-deploy (staging + production)

- [ ] Apply migrations `075_master_pro_trial.sql` and `076_catalog_pro_boost.sql`
  - `npm run db:v2:status`
  - `npm run db:v2:migrate`
- [ ] Set **`AUTO_START_PRO_TRIAL_ENABLED=true`** on Railway/production
- [ ] Confirm billing worker / `expireDueSubscriptions` runs (subscription billing jobs enabled)
- [ ] Confirm checkout env (BePaid / manual payment) if paid conversion is expected

## Smoke after deploy

### Trial flow
- [ ] New master completes onboarding → `GET /api/masters/me/entitlements`:
  - `effectivePlan = trial_pro`
  - `isProEntitled = true`
  - `trial.daysLeft ≈ 7`
  - `limits.scheduleHorizonDays = 90`
- [ ] Existing master (pre-migration) does **not** get trial (`trial_consumed = true`)
- [ ] Repeat onboarding/publish does **not** restart trial
- [ ] Artificially expire trial → worker → Free limits (3 services, 14 days)

### Entitlements / API enforcement
- [ ] Free master: analytics/bundles/smart-promotions/data-export → `PRO_REQUIRED`
- [ ] Free master: 4th service → `LIMIT_SERVICES_REACHED`
- [ ] Free master: slot beyond 14 days → `LIMIT_SCHEDULE_DAYS_REACHED`
- [ ] Trial/Pro: above limits allowed where configured

### Frontend
- [ ] Trial banner in admin layout (not on billing page duplicate only)
- [ ] Settings → Billing shows trial / paid / expired states from entitlements
- [ ] Schedule horizon: Free 14 / Trial+Pro 90 in live mode (not localStorage)
- [ ] No false Pro badge without `isProEntitled` from catalog API

### Catalog
- [ ] `recommended` sort stable; Pro boost capped (max ~10)
- [ ] Pro without slots does not outrank masters with slots
- [ ] Pro badge visible only when `isProEntitled = true`

### Marketing
- [ ] Landing Pro features: «мягкое продвижение», no «первое место», no Telegram as Pro-only
- [ ] Trial 7 days mentioned where appropriate (onboarding/billing)

## Automated checks

```bash
cd server && npm run typecheck
cd server && npm run test:subscription-billing
cd server && npx tsx --test src/modules/billing/entitlements.unit.test.ts
cd server && npx tsx src/scripts/e2eProTrialSmoke.ts   # needs DATABASE_URL + JWT_SECRET

cd .. && npm run build
npx vitest run src/features/billing/billingSaasRelease.unit.test.ts  # if vitest configured
```

## Rollback notes

- Migrations are additive (`IF NOT EXISTS`, `CREATE OR REPLACE` functions). Rollback = redeploy previous app version; DB columns/functions can remain.
- Disable trial instantly: `AUTO_START_PRO_TRIAL_ENABLED=false` (existing trials continue until `trial_ends_at`).
- Catalog boost: migration `076` can be re-run with previous RPC body if needed.

## Blockers before limited ads

- Trial not starting in production (`AUTO_START_PRO_TRIAL_ENABLED` unset)
- Frontend showing 90-day horizon for Free masters
- API allows Pro features without `isProEntitled`

## Blockers before wide ads

- No monitoring on trial conversion / expiry events
- Paid checkout not verified end-to-end on production
- Catalog boost perceived as unfair (monitor support feedback)
