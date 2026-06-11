import type { Request } from 'express';
import { isIP } from 'node:net';

export type ClientIpSource = 'cf-connecting-ip' | 'req.ip' | 'socket';

export type ClientIpDebug = {
  clientIp: string;
  reqIp: string | null;
  socketIp: string | null;
  usedHeader: ClientIpSource;
};

function nodeEnv(): string {
  return process.env.NODE_ENV ?? 'development';
}

function isNonProd(): boolean {
  const n = nodeEnv();
  return n === 'development' || n === 'test';
}

function headerFirst(req: Request, name: string): string | undefined {
  const raw = req.headers[name];
  if (typeof raw === 'string' && raw.trim()) return raw.split(',')[0]!.trim();
  if (Array.isArray(raw) && raw[0]?.trim()) return raw[0].trim();
  return undefined;
}

function parseTrustProxyEnv(): boolean | number {
  const raw = process.env.TRUST_PROXY?.trim().toLowerCase();
  if (!raw || raw === 'false' || raw === '0' || raw === 'off') return false;
  if (raw === 'true' || raw === 'on') return true;
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 0) return n;
  return nodeEnv() === 'production' ? 1 : false;
}

/**
 * Express trust proxy (Railway / Nginx / Cloudflare).
 * production по умолчанию: 1 hop · dev/test: false
 * TRUST_PROXY=2 — два hop (CF + edge)
 */
export function resolveTrustProxySetting(): boolean | number {
  if (process.env.TRUST_PROXY !== undefined) {
    return parseTrustProxyEnv();
  }
  return nodeEnv() === 'production' ? 1 : false;
}

/**
 * CF-Connecting-IP только в production и только если явно разрешено:
 * TRUST_CLOUDFLARE_HEADERS=true или TRUST_PROXY=2
 */
function mayTrustCloudflareConnectingIp(): boolean {
  if (isNonProd()) return false;
  if (process.env.TRUST_CLOUDFLARE_HEADERS === 'true') return true;
  return process.env.TRUST_PROXY?.trim() === '2';
}

function normalizeClientIpValue(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    const v4 = ip.slice(7);
    if (isIP(v4) === 4) return v4;
  }
  if (ip === '::1') return '127.0.0.1';
  return ip;
}

function normalizeSocketIp(remote: string | undefined): string | null {
  if (!remote?.trim()) return null;
  const r = remote.trim();
  if (r.startsWith('::ffff:')) {
    const v4 = r.slice(7);
    return isIP(v4) ? v4 : r;
  }
  return isIP(r) ? r : r;
}

/**
 * IP клиента для rate limit.
 * - dev/test: только req.ip → socket (заголовки CF/X-Real-IP игнорируются)
 * - production: req.ip (trust proxy) или CF-Connecting-IP при TRUST_CLOUDFLARE_HEADERS / TRUST_PROXY=2
 */
export function resolveClientIpDebug(req: Request): ClientIpDebug {
  const reqIpRaw = req.ip?.trim();
  const reqIp = reqIpRaw && reqIpRaw !== 'unknown' ? reqIpRaw : null;
  const socketIp = normalizeSocketIp(req.socket.remoteAddress);

  if (mayTrustCloudflareConnectingIp()) {
    const cf = headerFirst(req, 'cf-connecting-ip');
    if (cf && isIP(cf)) {
      return { clientIp: cf, reqIp, socketIp, usedHeader: 'cf-connecting-ip' };
    }
  }

  if (reqIp) {
    return { clientIp: normalizeClientIpValue(reqIp), reqIp, socketIp, usedHeader: 'req.ip' };
  }

  if (socketIp) {
    return { clientIp: normalizeClientIpValue(socketIp), reqIp, socketIp, usedHeader: 'socket' };
  }

  return { clientIp: 'unknown', reqIp, socketIp, usedHeader: 'socket' };
}

export function resolveClientIp(req: Request): string {
  return resolveClientIpDebug(req).clientIp;
}

/** Dev-only: лог для отладки rate limit / proxy. */
export function logClientIpDebug(req: Request, tag = 'client-ip'): void {
  if (!isNonProd()) return;
  const d = resolveClientIpDebug(req);
  console.warn(`[${tag}]`, {
    clientIp: d.clientIp,
    reqIp: d.reqIp,
    socketIp: d.socketIp,
    usedHeader: d.usedHeader,
  });
}
