import type { BatchCreateSlotsResult } from '../../../features/admin/api/adminSlotsApi';

export function batchSkipReasonLabel(
  reason: BatchCreateSlotsResult['skippedReasons'][number]['reason'],
): string {
  switch (reason) {
    case 'overlap':
      return 'Это время уже занято';
    case 'past':
      return 'В прошлом';
    case 'plan_limit':
      return 'За пределом тарифа';
    case 'service_does_not_fit':
      return 'Услуга не помещается';
    default:
      return 'Не удалось создать';
  }
}

export function summarizeBatchSkipped(result: Pick<BatchCreateSlotsResult, 'skipped' | 'skippedReasons'>): string {
  if (result.skipped <= 0) return '';
  const byReason = new Map<string, number>();
  for (const row of result.skippedReasons) {
    const label = batchSkipReasonLabel(row.reason);
    byReason.set(label, (byReason.get(label) ?? 0) + 1);
  }
  const parts = [...byReason.entries()].map(([label, n]) => `${n} — ${label.toLowerCase()}`);
  return parts.length ? parts.join('; ') : `${result.skipped} пропущено`;
}

export function formatBatchSuccessSummary(result: BatchCreateSlotsResult): string {
  if (result.created <= 0) {
    return summarizeBatchSkipped(result) || 'Ни одного окна не создано';
  }
  if (result.skipped <= 0) {
    return `Создано ${result.created} ${windowCountLabel(result.created)}`;
  }
  return `Создано ${result.created} ${windowCountLabel(result.created)}, пропущено ${result.skipped}`;
}

function windowCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'окон';
  if (mod10 === 1) return 'окно';
  if (mod10 >= 2 && mod10 <= 4) return 'окна';
  return 'окон';
}
