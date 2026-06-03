export type ParsedClientDevice = {
  deviceLabel: string;
  subtitle: string;
};

function has(ua: string, re: RegExp): boolean {
  return re.test(ua);
}

/** Короткая подпись устройства/браузера для списка сеансов. */
export function parseClientDevice(userAgent: string | null | undefined): ParsedClientDevice {
  const ua = (userAgent ?? '').trim();
  if (!ua) {
    return { deviceLabel: 'Устройство', subtitle: 'Браузер или приложение' };
  }

  if (/Telegram/i.test(ua)) {
    return { deviceLabel: 'Telegram', subtitle: 'Mini App или клиент Telegram' };
  }

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);

  let os = 'Компьютер';
  if (/iPhone|iPod/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Браузер';
  if (has(ua, /Edg\//i)) browser = 'Edge';
  else if (has(ua, /OPR\/|Opera/i)) browser = 'Opera';
  else if (has(ua, /Firefox\//i)) browser = 'Firefox';
  else if (has(ua, /Chrome\//i) && !has(ua, /Edg\//i)) browser = 'Chrome';
  else if (has(ua, /Safari\//i) && !has(ua, /Chrome\//i)) browser = 'Safari';

  if (isTablet) {
    return { deviceLabel: `${os} · ${browser}`, subtitle: 'Планшет' };
  }
  if (isMobile) {
    return { deviceLabel: `${os} · ${browser}`, subtitle: 'Телефон' };
  }

  return { deviceLabel: `${os} · ${browser}`, subtitle: 'Компьютер' };
}

export function maskClientIp(ip: string | null | undefined): string | null {
  const raw = (ip ?? '').trim();
  if (!raw || raw === 'unknown') return null;
  if (raw.includes(':')) {
    const parts = raw.split(':').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}:…`;
    return null;
  }
  const octets = raw.split('.');
  if (octets.length === 4) return `${octets[0]}.${octets[1]}.*.*`;
  return null;
}
