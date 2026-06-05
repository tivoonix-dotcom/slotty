import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listLoadErrorTitle, tabSummaryCopy } from './appointmentsTabSummaryModel';

describe('tabSummaryCopy', () => {
  it('shows compact requests summary when pending count is zero', () => {
    const copy = tabSummaryCopy('requests', { requests: 0, upcoming: 2, history: 3 });
    assert.equal(copy.title, 'Новые заявки: 0');
    assert.equal(copy.badge, undefined);
    assert.match(copy.subtitle, /появится в списке ниже/);
  });

  it('shows badge for pending requests', () => {
    const copy = tabSummaryCopy('requests', { requests: 1, upcoming: 0, history: 0 });
    assert.equal(copy.title, 'Новая заявка: 1');
    assert.equal(copy.badge, '1');
  });

  it('shows upcoming summary with count', () => {
    const copy = tabSummaryCopy('upcoming', { requests: 0, upcoming: 2, history: 1 });
    assert.equal(copy.title, 'Предстоящие записи: 2');
    assert.equal(copy.badge, '2');
  });

  it('shows history summary with plural records', () => {
    const copy = tabSummaryCopy('history', { requests: 0, upcoming: 0, history: 3 });
    assert.equal(copy.title, 'История: 3 записи');
    assert.equal(copy.badge, '3');
  });
});

describe('listLoadErrorTitle', () => {
  it('uses tab-specific error titles', () => {
    assert.equal(listLoadErrorTitle('requests'), 'Не удалось загрузить заявки');
    assert.equal(listLoadErrorTitle('upcoming'), 'Не удалось загрузить записи');
    assert.equal(listLoadErrorTitle('history'), 'Не удалось загрузить историю');
  });
});
