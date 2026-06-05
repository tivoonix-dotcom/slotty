import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { billingPlanDisplayFromEntitlements, trialDaysLabel } from './billingTrialCopy.js';
import { resolveScheduleHorizonDays } from './resolveScheduleHorizonDays.js';
import type { MasterEntitlementsDto } from './api/masterEntitlementsApi.js';

describe('billingTrialCopy', () => {
  it('formats trial days in Russian', () => {
    assert.equal(trialDaysLabel(1), '1 день');
    assert.equal(trialDaysLabel(3), '3 дня');
    assert.equal(trialDaysLabel(7), '7 дней');
  });

  it('active trial shows trial pro, not free', () => {
    const ent: MasterEntitlementsDto = {
      effectivePlan: 'trial_pro',
      isProEntitled: true,
      source: 'trial',
      trial: { isActive: true, startedAt: null, endsAt: null, daysLeft: 5, consumed: true },
      subscription: { status: 'trialing', currentPeriodEnd: null, cancelAtPeriodEnd: false },
      limits: { maxServices: null, maxMonthlyAppointments: null, scheduleHorizonDays: 90, maxPortfolioPhotos: 30 },
      features: {
        advancedAnalytics: true,
        bundlesAndPromotions: true,
        smartPromotions: true,
        catalogBoost: true,
        priorityListing: true,
        proBadge: true,
        pdfExport: true,
        dataExport: true,
        advancedCrm: false,
      },
    };
    const d = billingPlanDisplayFromEntitlements(ent, 'pro_active');
    assert.equal(d.title, 'Pro бесплатно');
    assert.equal(d.badge, 'Trial Pro');
  });

  it('expired trial shows free with upgrade hint', () => {
    const ent: MasterEntitlementsDto = {
      effectivePlan: 'free',
      isProEntitled: false,
      source: 'free',
      trial: { isActive: false, startedAt: null, endsAt: null, daysLeft: 0, consumed: true },
      subscription: { status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false },
      limits: { maxServices: 3, maxMonthlyAppointments: 20, scheduleHorizonDays: 14, maxPortfolioPhotos: 3 },
      features: {
        advancedAnalytics: false,
        bundlesAndPromotions: false,
        smartPromotions: false,
        catalogBoost: false,
        priorityListing: false,
        proBadge: false,
        pdfExport: false,
        dataExport: false,
        advancedCrm: false,
      },
    };
    const d = billingPlanDisplayFromEntitlements(ent, 'free');
    assert.match(d.subtitle, /Пробный Pro закончился/);
    assert.equal(d.showUpgradeCta, true);
  });
});

describe('resolveScheduleHorizonDays', () => {
  it('live free master sees 14 days', () => {
    assert.equal(resolveScheduleHorizonDays(true, { scheduleHorizonDays: 14 }, false), 14);
  });

  it('live trial/pro sees 90 days', () => {
    assert.equal(resolveScheduleHorizonDays(true, { scheduleHorizonDays: 90 }, false), 90);
  });

  it('production without API defaults to 14, not 90', () => {
    assert.equal(resolveScheduleHorizonDays(false, null, false), 14);
  });

  it('dev demo without API may use 90', () => {
    assert.equal(resolveScheduleHorizonDays(false, null, true), 90);
  });
});
