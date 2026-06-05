import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildBookingLink, buildBookingPath, normalizeBookingCode } from './buildBookingLink.js';
import {
  formatClientName,
  formatServiceName,
  isBlockedDisplayValue,
  pickClientFullNameForDisplay,
} from './displayFormat.js';
import { clientBookingRequestCreated } from '../modules/notifications/templates/appointmentNotificationTemplates.js';
import { clientBookingTelegramKeyboard, masterBookingTelegramKeyboard } from '../modules/notifications/telegramAppointmentKeyboard.js';
import type { AppointmentNotifyContext } from '../modules/appointments/appointmentNotifyContext.js';

const sampleCtx: AppointmentNotifyContext = {
  appointmentId: '00000000-0000-4000-8000-000000000001',
  clientId: '00000000-0000-4000-8000-000000000002',
  masterId: '00000000-0000-4000-8000-000000000003',
  serviceTitle: 'Маникюр с укреплением',
  startsAt: '2026-06-04T09:00:00.000Z',
  voucherNumber: 'SL-ABD1866E7CCE',
  clientName: 'Татьяна Дудко',
  clientPhone: '+375291234567',
  masterName: 'Анна Иванова',
};

describe('buildBookingLink', () => {
  it('builds client and master paths', () => {
    assert.equal(
      buildBookingPath('client', 'sl-abd1866e7cce'),
      '/client/appointments/SL-ABD1866E7CCE',
    );
    assert.equal(buildBookingPath('master', 'SL-ABD1866E7CCE'), '/master/appointments/SL-ABD1866E7CCE');
  });

  it('rejects invalid voucher', () => {
    assert.throws(() => normalizeBookingCode('BAD'));
  });

  it('includes source query param', () => {
    const url = buildBookingLink({
      role: 'client',
      bookingCode: 'SL-ABD1866E7CCE',
      source: 'telegram',
    });
    assert.match(url, /\/client\/appointments\/SL-ABD1866E7CCE/);
    assert.match(url, /source=telegram/);
  });
});

describe('displayFormat', () => {
  it('never shows чат as client name', () => {
    assert.equal(
      formatClientName({ full_name: 'чат', phone: '+375291234567' }),
      '+375291234567',
    );
    assert.equal(formatClientName({ full_name: 'чат' }), 'Клиент SLOTTY');
  });

  it('strips копия from service title', () => {
    assert.equal(formatServiceName('Маникюр с укреплением копия'), 'Маникюр с укреплением');
  });

  it('blocks technical tokens', () => {
    assert.equal(isBlockedDisplayValue('undefined'), true);
    assert.equal(isBlockedDisplayValue('Анна'), false);
  });

  it('prefers profile name when snapshot is phone', () => {
    assert.equal(
      pickClientFullNameForDisplay('+375 44 543 45 32', 'Иванова Мария'),
      'Иванова Мария',
    );
    assert.equal(
      formatClientName({
        full_name: pickClientFullNameForDisplay('+375 44 543 45 32', 'Иванова Мария'),
        phone: '+375 44 543 45 32',
      }),
      'Иванова Мария',
    );
  });
});

describe('notification payloads', () => {
  it('telegram html has no чат or копия', () => {
    const badCtx: AppointmentNotifyContext = {
      ...sampleCtx,
      clientName: formatClientName({ full_name: 'чат', phone: '+3750000000' }),
      serviceTitle: formatServiceName('Маникюр копия'),
    };
    const payload = clientBookingRequestCreated(badCtx);
    const html = payload.telegramHtml ?? '';
    assert.doesNotMatch(html, /чат/i);
    assert.doesNotMatch(html, /копия/i);
    assert.doesNotMatch(html, /undefined|null/i);
  });

  it('client telegram keyboard contains open booking button', () => {
    const kb = clientBookingTelegramKeyboard(sampleCtx, { allowCancel: true });
    const flat = kb.inline_keyboard.flat();
    assert.ok(flat.some((b) => b.text === 'Открыть запись' && b.web_app?.url?.includes('SL-ABD1866E7CCE')));
  });

  it('master keyboard opens admin appointments', () => {
    const kb = masterBookingTelegramKeyboard(sampleCtx);
    const flat = kb.inline_keyboard.flat();
    assert.ok(flat.some((b) => b.text === 'К заявкам' && b.web_app?.url?.includes('/admin/appointments')));
    assert.ok(flat.some((b) => b.web_app?.url?.includes('focus=')));
  });
});
