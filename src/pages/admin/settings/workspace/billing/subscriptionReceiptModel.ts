import {
  formatBillingDate,
  formatBillingMoney,
  formatMaskedCard,
  formatRenewalSchedule,
} from '../../../billing/billingFormat';
import { ADMIN_DESKTOP_LOGO_SRC } from '../../../../../app/headerLogo';
import type { BillingSubscriptionResponse } from '../../../../../features/billing/api/masterBillingApi';

export const SUBSCRIPTION_RECEIPT_BG_SRC = '/photos/xtr/1.png';

export type SubscriptionReceiptRow = { label: string; value: string };

export type SubscriptionReceiptTotalLine = {
  label: string;
  value: string;
  bold?: boolean;
};

export type SubscriptionReceiptDocumentData = {
  receiptNumber: string;
  issuedDate: string;
  issuedTime: string;
  statusLabel: string;
  planName: string;
  periodRange: string | null;
  summaryLine: string;
  lineItemTitle: string;
  lineItemSubtitle: string | null;
  lineItemQty: string;
  lineItemUnitPrice: string;
  lineItemAmount: string;
  totals: SubscriptionReceiptTotalLine[];
  detailRows: SubscriptionReceiptRow[];
  paymentMethod: string | null;
  paymentAmount: string;
};

function formatLimitServices(n: number | null): string {
  return n === null ? 'Безлимит' : `До ${n}`;
}

function formatLimitAppointments(n: number | null): string {
  return n === null ? 'Безлимит' : `До ${n} в месяц`;
}

function formatPeriodRange(start: string, end: string): string | null {
  const from = formatBillingDate(start);
  const to = formatBillingDate(end);
  if (!from || !to) return null;
  return `${from} — ${to}`;
}

export function buildSubscriptionReceiptRows(
  uiState: string,
  billing: BillingSubscriptionResponse,
  isProEntitled: boolean,
): SubscriptionReceiptRow[] {
  const periodUnit = billing.billingPeriod === 'year' ? 'год' : 'месяц';
  const { limits } = billing;

  const limitRows: SubscriptionReceiptRow[] = [
    { label: 'Услуги', value: formatLimitServices(limits.maxServices) },
    { label: 'Записи', value: formatLimitAppointments(limits.maxMonthlyAppointments) },
    { label: 'Расписание', value: `На ${limits.maxScheduleDaysAhead} дней вперёд` },
  ];

  if (!isProEntitled) {
    return [{ label: 'Стоимость', value: '0 BYN' }, ...limitRows];
  }

  const price = formatBillingMoney(billing.priceAmount, billing.currency);
  const rows: SubscriptionReceiptRow[] = [
    { label: 'Тариф', value: 'Master Pro' },
    { label: 'Стоимость', value: `${price} / ${periodUnit}` },
  ];

  const renewal = formatRenewalSchedule(billing, uiState);
  if (renewal) rows.push({ label: 'Продление', value: renewal });

  const periodRange = formatPeriodRange(billing.currentPeriodStart, billing.currentPeriodEnd);
  if (periodRange) rows.push({ label: 'Текущий период', value: periodRange });

  if (uiState === 'pro_active') {
    rows.push({
      label: 'Автопродление',
      value: billing.cancelAtPeriodEnd ? 'Выключено' : 'Включено',
    });
    if (!billing.cancelAtPeriodEnd) {
      rows.push({ label: 'Оплата', value: 'Списание по привязанной карте' });
    }
  } else if (uiState === 'pro_canceled_at_period_end') {
    const end = formatBillingDate(billing.currentPeriodEnd);
    if (end) rows.push({ label: 'Доступ до', value: end });
    rows.push({ label: 'Автопродление', value: 'Выключено' });
  } else if (uiState === 'past_due') {
    rows.push({ label: 'Автопродление', value: 'Приостановлено — требуется оплата' });
    const end = formatBillingDate(billing.currentPeriodEnd);
    if (end) rows.push({ label: 'Период истекает', value: end });
  } else if (uiState === 'expired') {
    rows.push({ label: 'Статус', value: 'Подписка завершена' });
  }

  const card = formatMaskedCard(billing.cardBrand, billing.cardLast4);
  if (card) rows.push({ label: 'Карта', value: card });

  return [...rows, ...limitRows];
}

export function buildSubscriptionReceiptDocumentData(params: {
  planName: string;
  statusLabel: string;
  rows: SubscriptionReceiptRow[];
  billing?: BillingSubscriptionResponse | null;
  isProEntitled?: boolean;
  uiState?: string;
}): SubscriptionReceiptDocumentData {
  const { planName, statusLabel, rows } = params;
  const billing = params.billing ?? null;
  const isProEntitled = params.isProEntitled ?? false;
  const priceAmount = billing?.priceAmount ?? 0;
  const currency = billing?.currency ?? 'BYN';
  const priceLabel = formatBillingMoney(priceAmount, currency);
  const zeroLabel = formatBillingMoney(0, currency);
  const periodRange =
    billing?.currentPeriodStart && billing?.currentPeriodEnd
      ? formatPeriodRange(billing.currentPeriodStart, billing.currentPeriodEnd)
      : rows.find((r) => r.label === 'Текущий период')?.value ?? null;

  const issuedDate = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const issuedTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const receiptNumber = `SL-${Date.now().toString().slice(-8)}`;

  const paidLike =
    statusLabel.toLowerCase().includes('актив') || statusLabel.toLowerCase().includes('оплачен');
  const amountForSummary = isProEntitled && priceAmount > 0 ? priceLabel : zeroLabel;
  const summaryLine = paidLike
    ? `${amountForSummary} · ${statusLabel} · ${issuedDate}`
    : `${amountForSummary} · ${statusLabel}`;

  const lineItemTitle = isProEntitled ? `Подписка ${planName}` : `Тариф ${planName}`;
  const lineItemSubtitle = periodRange;
  const lineItemQty = '1';
  const lineItemUnitPrice = isProEntitled && priceAmount > 0 ? priceLabel : zeroLabel;
  const lineItemAmount = lineItemUnitPrice;

  const totals: SubscriptionReceiptTotalLine[] = [
    { label: 'Подытог', value: lineItemAmount },
    { label: 'Без НДС', value: lineItemAmount },
    { label: 'Итого', value: lineItemAmount, bold: true },
    {
      label: paidLike ? 'Оплачено' : 'К оплате',
      value: lineItemAmount,
      bold: true,
    },
  ];

  const importantLabels = new Set([
    'Тариф',
    'Стоимость',
    'Продление',
    'Текущий период',
    'Доступ до',
    'Автопродление',
    'Оплата',
    'Карта',
  ]);
  const detailRows = rows.filter(
    (row) =>
      !importantLabels.has(row.label) &&
      row.label !== 'Стоимость' &&
      row.label !== 'Тариф' &&
      row.label !== 'Карта',
  );

  const paymentMethod =
    rows.find((row) => row.label === 'Карта')?.value ??
    (billing ? formatMaskedCard(billing.cardBrand, billing.cardLast4) : null);

  return {
    receiptNumber,
    issuedDate,
    issuedTime,
    statusLabel,
    planName,
    periodRange,
    summaryLine,
    lineItemTitle,
    lineItemSubtitle,
    lineItemQty,
    lineItemUnitPrice,
    lineItemAmount,
    totals,
    detailRows,
    paymentMethod,
    paymentAmount: lineItemAmount,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderDetailRows(rows: SubscriptionReceiptRow[]): string {
  if (!rows.length) return '';
  return `
    <section class="section-block">
      <h2 class="section-heading">Детали подписки</h2>
      ${rows
        .map(
          (row) => `
            <div class="detail-row">
              <span class="detail-label">${escapeHtml(row.label)}</span>
              <span class="detail-value">${escapeHtml(row.value)}</span>
            </div>
          `,
        )
        .join('')}
    </section>
  `;
}

function renderTotals(lines: SubscriptionReceiptTotalLine[]): string {
  return lines
    .map(
      (line) => `
        <div class="total-row${line.bold ? ' total-row-bold' : ''}">
          <span>${escapeHtml(line.label)}</span>
          <span>${escapeHtml(line.value)}</span>
        </div>
      `,
    )
    .join('');
}

function buildSubscriptionReceiptHtml(data: SubscriptionReceiptDocumentData): string {
  const logoUrl = escapeHtml(
    typeof window !== 'undefined'
      ? new URL(ADMIN_DESKTOP_LOGO_SRC, window.location.origin).href
      : ADMIN_DESKTOP_LOGO_SRC,
  );
  const bgUrl = escapeHtml(
    typeof window !== 'undefined'
      ? new URL(SUBSCRIPTION_RECEIPT_BG_SRC, window.location.origin).href
      : SUBSCRIPTION_RECEIPT_BG_SRC,
  );

  const paymentHistory = data.paymentMethod
    ? `
      <section class="section-block">
        <h2 class="section-heading">История оплаты</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Способ</th>
              <th>Дата</th>
              <th class="num">Сумма</th>
              <th class="num">№ квитанции</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(data.paymentMethod)}</td>
              <td>${escapeHtml(data.issuedDate)}</td>
              <td class="num">${escapeHtml(data.paymentAmount)}</td>
              <td class="num">${escapeHtml(data.receiptNumber)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>Квитанция SLOTTY — ${escapeHtml(data.planName)}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #ffffff;
    color: #111827;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 720px;
    margin: 0 auto;
    padding: 8px 0 24px;
  }

  .doc-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e5e5;
  }

  .doc-title {
    margin: 0;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: #111827;
  }

  .brand-logo {
    display: block;
    height: 34px;
    width: auto;
    max-width: 120px;
    object-fit: contain;
    object-position: right center;
  }

  .meta-block {
    padding: 16px 0;
    border-bottom: 1px solid #e5e5e5;
  }

  .meta-line {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    color: #525252;
  }

  .meta-label {
    display: inline-block;
    min-width: 9.5rem;
    font-weight: 600;
    color: #111827;
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 20px 0;
    border-bottom: 1px solid #e5e5e5;
    font-size: 11px;
    line-height: 1.6;
    color: #525252;
  }

  .columns strong {
    display: block;
    margin-bottom: 2px;
    color: #111827;
    font-weight: 600;
  }

  .columns p { margin: 0; }

  .hero-wrap {
    padding: 20px 0;
    border-bottom: 1px solid #e5e5e5;
  }

  .hero-img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 2.4 / 1;
    object-fit: cover;
    object-position: center;
  }

  .summary-line {
    margin: 0;
    padding: 20px 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #111827;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .items-table th {
    padding: 0 12px 8px 0;
    border-bottom: 1px solid #e5e5e5;
    font-weight: 500;
    color: #737373;
    text-align: left;
  }

  .items-table th.num,
  .items-table td.num {
    text-align: right;
    padding-right: 0;
  }

  .items-table td {
    padding: 12px 12px 12px 0;
    border-bottom: 1px solid #e5e5e5;
    vertical-align: top;
    color: #111827;
  }

  .item-title {
    margin: 0;
    font-weight: 500;
  }

  .item-sub {
    margin: 4px 0 0;
    color: #737373;
  }

  .totals {
    margin-left: auto;
    width: 100%;
    max-width: 16rem;
    padding-top: 16px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 2px 0;
    font-size: 12px;
    color: #525252;
  }

  .total-row-bold {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e5e5;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .section-block {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e5e5e5;
  }

  .section-heading {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 4px 0;
    font-size: 11px;
    line-height: 1.45;
  }

  .detail-label { color: #737373; }
  .detail-value { text-align: right; font-weight: 500; color: #111827; }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e5e5;
    font-size: 10px;
    color: #737373;
  }

  .doc-footer-brand {
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #111827;
  }

  @media print {
    body { background: #fff; }
    .page { padding: 0; max-width: none; }
    .hero-img {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <main class="page">
    <header class="doc-head">
      <h1 class="doc-title">Квитанция</h1>
      <img src="${logoUrl}" alt="SLOTTY" class="brand-logo" crossorigin="anonymous" />
    </header>

    <div class="meta-block">
      <p class="meta-line"><span class="meta-label">Номер квитанции</span>${escapeHtml(data.receiptNumber)}</p>
      <p class="meta-line"><span class="meta-label">Дата</span>${escapeHtml(data.issuedDate)}, ${escapeHtml(data.issuedTime)}</p>
      <p class="meta-line"><span class="meta-label">Статус</span>${escapeHtml(data.statusLabel)}</p>
    </div>

    <div class="columns">
      <div>
        <strong>SLOTTY</strong>
        <p>Онлайн-запись к мастерам</p>
        <p>slotty.by</p>
        <p>Республика Беларусь</p>
      </div>
      <div>
        <strong>Подписка</strong>
        <p>${escapeHtml(data.planName)}</p>
        ${data.periodRange ? `<p>${escapeHtml(data.periodRange)}</p>` : ''}
        <p>${escapeHtml(data.statusLabel)}</p>
      </div>
    </div>

    <div class="hero-wrap">
      <img src="${bgUrl}" alt="" class="hero-img" crossorigin="anonymous" />
    </div>

    <p class="summary-line">${escapeHtml(data.summaryLine)}</p>

    <table class="items-table">
      <thead>
        <tr>
          <th>Описание</th>
          <th class="num">Кол-во</th>
          <th class="num">Цена</th>
          <th class="num">Сумма</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <p class="item-title">${escapeHtml(data.lineItemTitle)}</p>
            ${data.lineItemSubtitle ? `<p class="item-sub">${escapeHtml(data.lineItemSubtitle)}</p>` : ''}
          </td>
          <td class="num">${escapeHtml(data.lineItemQty)}</td>
          <td class="num">${escapeHtml(data.lineItemUnitPrice)}</td>
          <td class="num">${escapeHtml(data.lineItemAmount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">${renderTotals(data.totals)}</div>

    ${renderDetailRows(data.detailRows)}
    ${paymentHistory}

    <footer class="doc-footer">
      <span class="doc-footer-brand">SLOTTY</span>
      <span>slotty.by · документ сформирован автоматически</span>
    </footer>
  </main>
</body>
</html>`;
}

function printHtmlDocument(html: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'SLOTTY — квитанция');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '816px',
    minHeight: '1056px',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win?.document) {
    iframe.remove();
    return false;
  }

  let finished = false;
  const detach = () => {
    if (finished) return;
    finished = true;
    if (iframe.isConnected) iframe.remove();
  };

  win.document.open();
  win.document.write(html);
  win.document.close();

  const triggerPrint = () => {
    try {
      win.addEventListener('afterprint', detach, { once: true });
      win.focus();
      win.print();
      window.setTimeout(detach, 90_000);
    } catch {
      detach();
    }
  };

  const logoImg = win.document.querySelector('.brand-logo');
  const bgImg = win.document.querySelector('.hero-img');
  const images = [logoImg, bgImg].filter((img): img is HTMLImageElement => img instanceof HTMLImageElement);

  const waitForImages = () => {
    const pending = images.filter((img) => !img.complete);
    if (pending.length === 0) {
      window.setTimeout(triggerPrint, 200);
      return;
    }
    let left = pending.length;
    const done = () => {
      left -= 1;
      if (left <= 0) window.setTimeout(triggerPrint, 120);
    };
    for (const img of pending) {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  };

  waitForImages();
  return true;
}

export function downloadSubscriptionReceiptPdf(
  planName: string,
  statusLabel: string,
  rows: SubscriptionReceiptRow[],
  billing?: BillingSubscriptionResponse | null,
  isProEntitled?: boolean,
): void {
  const data = buildSubscriptionReceiptDocumentData({
    planName,
    statusLabel,
    rows,
    billing,
    isProEntitled,
  });
  const html = buildSubscriptionReceiptHtml(data);
  const printed = printHtmlDocument(html);
  if (printed) return;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const slug = planName.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'subscription';
  anchor.href = url;
  anchor.download = `slotty-${slug}.html`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
