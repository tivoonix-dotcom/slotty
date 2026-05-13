/** Печать / «Сохранить как PDF» подтверждения записи — без сторонних библиотек. */

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildVoucherHtml(
  payload: BookingVoucherPayload,
  logoAbsoluteUrl: string,
  issuedLabel: string,
  siteHost: string,
): string {
  const m = escapeHtml(payload.masterName);
  const s = escapeHtml(payload.serviceTitle);
  const d = escapeHtml(payload.dateLabel);
  const t = escapeHtml(payload.timeLabel);
  const loc = payload.locationLine?.trim()
    ? `<div class="row"><span class="lbl">Адрес</span><span class="val">${escapeHtml(payload.locationLine.trim())}</span></div>`
    : '';
  const price = payload.priceLabel?.trim()
    ? `<div class="row"><span class="lbl">Стоимость</span><span class="val">${escapeHtml(payload.priceLabel.trim())}</span></div>`
    : '';
  const status = payload.statusLabel?.trim()
    ? `<div class="row"><span class="lbl">Статус</span><span class="val">${escapeHtml(payload.statusLabel.trim())}</span></div>`
    : '';
  const voucher = payload.voucherNumber?.trim()
    ? `<div class="row"><span class="lbl">Талон</span><span class="val">${escapeHtml(payload.voucherNumber.trim())}</span></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SLOTTY — подтверждение записи</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #171717;
      background: #fdfcfb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 560px;
      margin: 0 auto;
      padding: 48px 40px 40px;
    }
    .logo-wrap {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-wrap img {
      height: 44px;
      width: auto;
      object-fit: contain;
    }
    .brand {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #a3a3a3;
      margin-bottom: 8px;
    }
    h1 {
      text-align: center;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.045em;
      margin: 0 0 8px;
      color: #0a0a0a;
    }
    .sub {
      text-align: center;
      font-size: 15px;
      color: #737373;
      line-height: 1.45;
      margin: 0 0 32px;
    }
    .card {
      background: #f1efef;
      border-radius: 28px;
      padding: 24px 22px;
      margin-bottom: 28px;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(23, 23, 23, 0.06);
      font-size: 15px;
      line-height: 1.4;
    }
    .row:last-child { border-bottom: none; padding-bottom: 0; }
    .row:first-child { padding-top: 0; }
    .lbl {
      color: #737373;
      font-weight: 500;
      min-width: 6.5rem;
    }
    .val {
      font-weight: 600;
      color: #171717;
      flex: 1;
      min-width: 12rem;
    }
    .accent {
      height: 4px;
      width: 72px;
      border-radius: 999px;
      background: #e29595;
      margin: 0 auto 28px;
    }
    .hint {
      text-align: center;
      font-size: 13px;
      color: #a3a3a3;
      line-height: 1.5;
      margin: 0 0 8px;
    }
    .issued {
      text-align: center;
      font-size: 12px;
      color: #a3a3a3;
      margin: 0;
    }
    @media print {
      body { background: #fff; }
      .sheet { padding: 24px 20px; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <p class="brand">SLOTTY</p>
    <div class="logo-wrap">
      <img src="${escapeHtml(logoAbsoluteUrl)}" alt="SLOTTY" crossorigin="anonymous" />
    </div>
    <div class="accent" aria-hidden="true"></div>
    <h1>Подтверждение записи</h1>
    <p class="sub">Сохраните бланк или распечатайте — напоминание также придёт в Telegram.</p>
    <div class="card">
      <div class="row"><span class="lbl">Мастер</span><span class="val">${m}</span></div>
      <div class="row"><span class="lbl">Услуга</span><span class="val">${s}</span></div>
      <div class="row"><span class="lbl">Дата</span><span class="val">${d}</span></div>
      <div class="row"><span class="lbl">Время</span><span class="val">${t}</span></div>
      ${loc}
      ${price}
      ${status}
      ${voucher}
    </div>
    <p class="hint">${escapeHtml(siteHost)} · запись к мастерам в Telegram</p>
    <p class="issued">Сформировано: ${escapeHtml(issuedLabel)}</p>
  </div>
</body>
</html>`;
}

/**
 * Готовит бланк во встроенном iframe и вызывает печать (в диалоге — «Сохранить как PDF»).
 * Без `window.open`: так не блокируется как всплывающее окно (Telegram WebView и др.).
 */
export function openBookingVoucherPrint(payload: BookingVoucherPayload, logoPathFromRoot: string): void {
  const logoUrl = new URL(logoPathFromRoot, window.location.origin).href;
  const issuedLabel = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  const html = buildVoucherHtml(payload, logoUrl, issuedLabel, window.location.host || 'SLOTTY');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'SLOTTY — печать бланка');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'absolute',
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
    win.removeEventListener('afterprint', onAfterPrint);
    if (iframe.isConnected) iframe.remove();
  };

  const onAfterPrint = () => {
    detach();
  };

  win.document.open();
  win.document.write(html);
  win.document.close();

  const triggerPrint = () => {
    try {
      win.addEventListener('afterprint', onAfterPrint, { once: true });
      win.focus();
      win.print();
      window.setTimeout(detach, 90_000);
    } catch {
      detach();
      window.alert('Печать недоступна в этом окружении.');
    }
  };

  const logoImg = win.document.querySelector('img');
  if (logoImg && !logoImg.complete) {
    logoImg.addEventListener('load', () => window.setTimeout(triggerPrint, 120), { once: true });
    logoImg.addEventListener('error', () => window.setTimeout(triggerPrint, 120), { once: true });
  } else {
    window.setTimeout(triggerPrint, 200);
  }
}
