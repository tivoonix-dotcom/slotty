import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterNotificationsForAudience,
  resolveNotificationAudience,
} from './notificationAudience.js';

describe('resolveNotificationAudience', () => {
  it('master booking completed → master', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_confirmed',
        title: 'Запись завершена',
        body: 'Клиент: Анна\nУслуга: Маникюр',
      }),
      'master',
    );
  });

  it('client booking confirmed → client', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_confirmed',
        title: 'Запись подтверждена',
        body: 'Запись подтверждена. Мастер ждёт вас.',
      }),
      'client',
    );
  });

  it('client pending request → client', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_pending',
        title: 'Заявка отправлена',
        body: 'Заявка отправлена мастеру.',
      }),
      'client',
    );
  });

  it('master pending reminder stored as appointment_pending → master', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_pending',
        title: 'Заявка ждёт решения',
        body: 'Заявка всё ещё ждёт решения.',
      }),
      'master',
    );
  });

  it('master booking expired → master (same title as client)', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_cancelled',
        title: 'Заявка истекла',
        body: 'Заявка истекла: Анна, Маникюр, 12 июня 2026 г. 17:15. Вы не успели подтвердить её — слот снова свободен.',
      }),
      'master',
    );
  });

  it('client booking expired → client', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_cancelled',
        title: 'Заявка истекла',
        body: 'Мастер не успел подтвердить заявку. Выберите другое время.',
      }),
      'client',
    );
  });

  it('master visit started reminder → master (booking_started_master)', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_reminder',
        title: 'Запись началась',
        body: 'Клиент должен быть у вас: Маникюр с укреплением, 12 июня 2026 г. 17:15.',
      }),
      'master',
    );
  });

  it('client booking reminder → client', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_reminder',
        title: 'Напоминание: через час запись',
        body: 'Маникюр — 2026-06-12T14:15:00.000Z',
      }),
      'client',
    );
  });

  it('master support reply → master', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'system',
        title: 'Ответ поддержки: TICKET-42',
        body: 'Ваш вопрос решён.',
      }),
      'master',
    );
  });

  it('master new booking → master', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_new',
        title: 'Новая запись',
        body: 'Клиент записался.',
      }),
      'master',
    );
  });
});

describe('filterNotificationsForAudience', () => {
  const rows = [
    {
      type: 'appointment_reminder',
      title: 'Запись началась',
      body: 'Клиент должен быть у вас: Маникюр, 12 июня 2026 г. 17:15.',
    },
    {
      type: 'appointment_confirmed',
      title: 'Запись подтверждена',
      body: 'Мастер ждёт вас.',
    },
    {
      type: 'appointment_cancelled',
      title: 'Заявка истекла',
      body: 'Мастер не успел подтвердить заявку. Выберите другое время.',
    },
  ];

  it('client API does not return master notifications', () => {
    const clientRows = filterNotificationsForAudience(rows, 'client');
    assert.equal(clientRows.length, 2);
    assert.ok(clientRows.every((r) => resolveNotificationAudience(r) === 'client'));
    assert.ok(!clientRows.some((r) => r.title === 'Запись началась'));
  });

  it('master API does not return client notifications', () => {
    const masterRows = filterNotificationsForAudience(rows, 'master');
    assert.equal(masterRows.length, 1);
    assert.equal(masterRows[0]?.title, 'Запись началась');
  });

  it('client counters exclude master notifications', () => {
    const unread = filterNotificationsForAudience(rows, 'client');
    assert.equal(unread.length, 2);
  });
});
