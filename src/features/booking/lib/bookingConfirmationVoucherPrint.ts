/** Печать / «Сохранить как PDF» подтверждения записи — в стиле справки о подписке. */

import { SUBSCRIPTION_RECEIPT_BG_SRC } from '../../../pages/admin/settings/workspace/billing/subscriptionReceiptModel';

export type BookingVoucherPayload = {
  masterName: string;
  serviceTitle: string;
  dateLabel: string;
  timeLabel: string;
  /** Краткий адрес / формат приёма — для бланка */
  locationLine?: string;
  /** Стоимость, напр. «45 BYN» */
  priceLabel?: string;
  /** Статус записи на русском */
  statusLabel?: string;
  /** Номер талона (SL-…) с бэкенда */
  voucherNumber?: string;
};

type BookingReceiptRow = { label: string; value: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildBookingReceiptRows(payload: BookingVoucherPayload): BookingReceiptRow[] {
  const rows: BookingReceiptRow[] = [
    { label: 'Мастер', value: payload.masterName },
    { label: 'Услуга', value: payload.serviceTitle },
    { label: 'Когда', value: `${payload.dateLabel}, ${payload.timeLabel}` },
  ];

  if (payload.locationLine?.trim()) {
    rows.push({ label: 'Адрес', value: payload.locationLine.trim() });
  }
  if (payload.priceLabel?.trim()) {
    rows.push({ label: 'Стоимость', value: payload.priceLabel.trim() });
  }
  if (payload.statusLabel?.trim()) {
    rows.push({ label: 'Статус', value: payload.statusLabel.trim() });
  }
  if (payload.voucherNumber?.trim()) {
    rows.push({ label: 'Талон', value: payload.voucherNumber.trim() });
  }

  return rows;
}

function buildVoucherHtml(payload: BookingVoucherPayload, logoAbsoluteUrl: string): string {
  const issuedAt = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const issuedTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptNumber =
    payload.voucherNumber?.trim() || `SL-${Date.now().toString().slice(-8)}`;
  const logoUrl = escapeHtml(logoAbsoluteUrl);
  const bgUrl = escapeHtml(new URL(SUBSCRIPTION_RECEIPT_BG_SRC, window.location.origin).href);
  const whenLine = escapeHtml(`${payload.dateLabel}, ${payload.timeLabel}`);
  const statusLabel = escapeHtml(payload.statusLabel?.trim() || 'Подтверждено');
  const rows = buildBookingReceiptRows(payload);

  const renderRows = (items: BookingReceiptRow[]) =>
    items
      .map(
        (r) => `
          <div class="receipt-row">
            <span class="receipt-label">${escapeHtml(r.label)}</span>
            <span class="receipt-value">${escapeHtml(r.value)}</span>
          </div>
        `,
      )
      .join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>Подтверждение записи SLOTTY — ${escapeHtml(payload.serviceTitle)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #fafafa;
    color: #111827;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 680px;
    margin: 0 auto;
    padding: 12px;
  }

  .receipt {
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #ebebeb;
    border-radius: 20px;
  }

  .hero-card {
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid #f3f4f6;
    margin-bottom: 14px;
    background: #ffffff;
  }

  .hero-card-bg {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 2.4 / 1;
    object-fit: cover;
    object-position: center;
  }

  .hero-card-body {
    padding: 16px 18px;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .brand-logo-img {
    display: block;
    height: 48px;
    width: auto;
    max-width: 210px;
    object-fit: contain;
    object-position: left center;
  }

  .receipt-id {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-align: right;
    white-space: nowrap;
  }

  .receipt-id strong {
    display: block;
    margin-top: 2px;
    color: #6b7280;
    font-weight: 700;
  }

  .intro {
    padding: 18px 24px 0;
  }

  .eyebrow {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9ca3af;
  }

  .title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111827;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    background: #ecfdf5;
    color: #15803d;
  }

  .subtitle {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: #6b7280;
  }

  .content {
    padding: 16px 24px 20px;
  }

  .hero-plan {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111827;
  }

  .hero-price {
    margin: 6px 0 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: #111827;
    text-transform: capitalize;
  }

  .hero-meta {
    margin: 8px 0 0;
    font-size: 11px;
    color: #9ca3af;
  }

  .section {
    overflow: hidden;
    border: 1px solid #f3f4f6;
    border-radius: 16px;
    background: #ffffff;
  }

  .section-title {
    margin: 0;
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    background: #fafafa;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 16px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 12px;
    line-height: 1.4;
  }

  .receipt-row:last-child { border-bottom: 0; }

  .receipt-label { color: #6b7280; flex-shrink: 0; }

  .receipt-value {
    max-width: 60%;
    text-align: right;
    font-weight: 600;
    color: #111827;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    font-size: 10px;
    line-height: 1.45;
    color: #9ca3af;
  }

  .footer-brand {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #ff5f7a;
  }

  @media print {
    body { background: #fff; }
    .page { padding: 0; max-width: none; }
    .receipt {
      border: 0;
      border-radius: 0;
      box-shadow: none;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .head { padding: 14px 18px 12px; }
    .brand-logo-img { height: 42px; }
    .intro { padding: 14px 18px 0; }
    h1 { font-size: 20px; }
    .content { padding: 12px 18px 14px; }
    .hero-card { margin-bottom: 10px; }
    .hero-card-body { padding: 12px 14px; }
    .hero-card-bg {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hero-price { font-size: 22px; }
    .receipt-row { padding: 7px 14px; font-size: 11px; }
    .footer { margin-top: 10px; padding-top: 8px; }
    .hero-card, .section, .footer {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
  <main class="page">
    <article class="receipt">
      <header class="head">
        <img src="${logoUrl}" alt="SLOTTY" class="brand-logo-img" crossorigin="anonymous" />
        <div class="receipt-id">
          Подтверждение
          <strong>№ ${escapeHtml(receiptNumber)}</strong>
        </div>
      </header>

      <div class="intro">
        <p class="eyebrow">Онлайн-запись</p>
        <div class="title-row">
          <h1>Запись подтверждена</h1>
          <span class="pill">${statusLabel}</span>
        </div>
        <p class="subtitle">Напомним о визите в Telegram · ${escapeHtml(issuedAt)}, ${escapeHtml(issuedTime)}</p>
      </div>

      <div class="content">
        <div class="hero-card">
          <img src="${bgUrl}" alt="" class="hero-card-bg" crossorigin="anonymous" />
          <div class="hero-card-body">
            <p class="hero-plan">${escapeHtml(payload.serviceTitle)}</p>
            <p class="hero-price">${whenLine}</p>
            <p class="hero-meta">${escapeHtml(payload.masterName)} · SLOTTY</p>
          </div>
        </div>

        <section class="section">
          <h2 class="section-title">Детали записи</h2>
          ${renderRows(rows)}
        </section>

        <footer class="footer">
          <div>
            <div class="footer-brand">SLOTTY</div>
            Онлайн-запись к мастерам
          </div>
          <div style="text-align:right;">
            slotty.by<br/>
            Документ сформирован автоматически
          </div>
        </footer>
      </div>
    </article>
  </main>
</body>
</html>`;
}

/**
 * Готовит бланк во встроенном iframe и вызывает печать (в диалоге — «Сохранить как PDF»).
 * Без `window.open`: так не блокируется как всплывающее окно (Telegram WebView и др.).
 */
export function openBookingVoucherPrint(payload: BookingVoucherPayload, logoPathFromRoot: string): void {
  const logoUrl = new URL(logoPathFromRoot, window.location.origin).href;
  const html = buildVoucherHtml(payload, logoUrl);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'SLOTTY — подтверждение записи');
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
    window.alert('Не удалось подготовить печать. Попробуйте ещё раз.');
    return;
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
      window.alert('Печать недоступна в этом окружении.');
    }
  };

  const logoImg = win.document.querySelector('.brand-logo-img');
  const bgImg = win.document.querySelector('.hero-card-bg');
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
}
