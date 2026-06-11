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

import { isIP } from 'node:net';

/** Нормализует IP перед сохранением и сравнением сеансов. */
export function normalizeStoredClientIp(ip: string | null | undefined): string | null {
  let raw = (ip ?? '').trim();
  if (!raw || raw === 'unknown') return null;

  // IPv4 с портом (127.0.0.1:49366) — только адрес.
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) {
    raw = raw.split(':')[0]!;
  }

  if (raw.startsWith('::ffff:')) {
    const v4 = raw.slice(7);
    if (isIP(v4) === 4) return v4;
  }
  if (raw === '::1') return '127.0.0.1';

  return isIP(raw) ? raw : null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip.startsWith('127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

export function maskClientIp(ip: string | null | undefined): string | null {
  const normalized = normalizeStoredClientIp(ip);
  if (!normalized) return null;
  if (isPrivateOrLocalIp(normalized)) return 'Локальная сеть';

  if (normalized.includes(':')) {
    const parts = normalized.split(':').filter(Boolean);
    if (parts.length >= 2) return `${parts.slice(0, 2).join(':')}:…`;
    return null;
  }

  const octets = normalized.split('.');
  if (octets.length === 4) return `${octets[0]}.${octets[1]}.*.*`;
  return null;
}
