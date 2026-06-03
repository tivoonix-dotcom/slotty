import type { Request } from 'express';
import { resolveClientIp } from '../../lib/clientIp.js';
import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { isMissingAuthSessionsTable, timestampToIso } from './authSessions.db.js';
import { maskClientIp, parseClientDevice } from './authSessions.userAgent.js';

let sessionsTableMissingLogged = false;

function warnSessionsTableMissing(op: string): void {
  if (sessionsTableMissingLogged) return;
  sessionsTableMissingLogged = true;
  console.warn(
    `[SLOTTY] auth sessions: таблица profile_auth_sessions отсутствует (${op}). ` +
      'Примените миграцию: npm run db:v2:migrate (056_profile_auth_sessions.sql)',
  );
}

export type IssueSessionContext = {
  userAgent?: string | null;
  clientIp?: string | null;
};

export type AuthSessionListItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

type SessionRow = {
  id: string;
  profile_id: string;
  user_agent: string | null;
  client_ip: string | null;
  device_label: string;
  created_at: Date | string;
  last_active_at: Date | string;
  revoked_at: Date | null;
};

export function issueSessionContextFromRequest(req: Request): IssueSessionContext {
  const ua = req.headers['user-agent'];
  return {
    userAgent: typeof ua === 'string' ? ua.slice(0, 500) : null,
    clientIp: resolveClientIp(req),
  };
}

/** null — таблица сеансов ещё не создана (миграция 056); JWT выдаётся без sid. */
export async function createAuthSession(
  profileId: string,
  ctx?: IssueSessionContext,
): Promise<string | null> {
  const parsed = parseClientDevice(ctx?.userAgent);
  try {
    const inserted = await query<{ id: string }>(
      `insert into public.profile_auth_sessions (
         profile_id, user_agent, client_ip, device_label
       ) values ($1, $2, $3, $4)
       returning id`,
      [profileId, ctx?.userAgent ?? null, ctx?.clientIp ?? null, parsed.deviceLabel],
    );
    const id = inserted.rows[0]?.id;
    if (!id) throw ApiError.internal('Failed to create auth session', 'SESSION_CREATE_FAILED');
    return id;
  } catch (e) {
    if (isMissingAuthSessionsTable(e)) {
      warnSessionsTableMissing('create');
      return null;
    }
    throw e;
  }
}

export async function assertAuthSessionActive(sessionId: string, profileId: string): Promise<void> {
  try {
    const found = await query<{ id: string }>(
      `select id from public.profile_auth_sessions
       where id = $1 and profile_id = $2 and revoked_at is null`,
      [sessionId, profileId],
    );
    if (!found.rows[0]) {
      throw ApiError.unauthorized('Сеанс завершён. Войдите снова.', 'SESSION_REVOKED');
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (isMissingAuthSessionsTable(e)) {
      warnSessionsTableMissing('assert');
      return;
    }
    throw e;
  }
}

const touchThrottleMs = 5 * 60 * 1000;
const lastTouchAt = new Map<string, number>();

export async function touchAuthSession(sessionId: string): Promise<void> {
  const now = Date.now();
  const prev = lastTouchAt.get(sessionId) ?? 0;
  if (now - prev < touchThrottleMs) return;
  lastTouchAt.set(sessionId, now);
  await query(
    `update public.profile_auth_sessions
     set last_active_at = now()
     where id = $1 and revoked_at is null`,
    [sessionId],
  ).catch(() => {
    lastTouchAt.delete(sessionId);
  });
}

function buildSessionSubtitle(row: SessionRow, isCurrent: boolean): string {
  const parts: string[] = [];
  const ip = maskClientIp(row.client_ip);
  if (ip) parts.push(ip);
  const parsed = parseClientDevice(row.user_agent);
  if (parsed.subtitle && !parts.includes(parsed.subtitle)) parts.push(parsed.subtitle);
  if (isCurrent) parts.push('Это устройство');
  return parts.length ? parts.join(' · ') : 'Подключение';
}

function rowToListItem(row: SessionRow, currentSessionId: string | null): AuthSessionListItem {
  const parsed = parseClientDevice(row.user_agent);
  const isCurrent = Boolean(currentSessionId && row.id === currentSessionId);
  return {
    id: row.id,
    title: row.device_label?.trim() || parsed.deviceLabel,
    subtitle: buildSessionSubtitle(row, isCurrent),
    createdAt: timestampToIso(row.created_at),
    lastActiveAt: timestampToIso(row.last_active_at),
    isCurrent,
  };
}

export async function listAuthSessionsForProfile(
  profileId: string,
  currentSessionId: string | null,
): Promise<AuthSessionListItem[]> {
  try {
    const result = await query<SessionRow>(
      `select id, profile_id, user_agent, client_ip, device_label, created_at, last_active_at, revoked_at
       from public.profile_auth_sessions
       where profile_id = $1 and revoked_at is null
       order by last_active_at desc
       limit 30`,
      [profileId],
    );
    return result.rows.map((r) => rowToListItem(r, currentSessionId));
  } catch (e) {
    if (isMissingAuthSessionsTable(e)) {
      warnSessionsTableMissing('list');
      return [];
    }
    throw e;
  }
}

async function revokeSessionRow(profileId: string, sessionId: string): Promise<boolean> {
  try {
    const revoked = await query<{ id: string }>(
      `update public.profile_auth_sessions
       set revoked_at = now()
       where id = $1 and profile_id = $2 and revoked_at is null
       returning id`,
      [sessionId, profileId],
    );
    return Boolean(revoked.rows[0]);
  } catch (e) {
    if (isMissingAuthSessionsTable(e)) {
      warnSessionsTableMissing('revoke');
      return false;
    }
    throw e;
  }
}

export async function revokeAuthSession(
  profileId: string,
  sessionId: string,
  currentSessionId: string | null,
): Promise<{ revokedCurrent: boolean }> {
  const isCurrent = Boolean(currentSessionId && sessionId === currentSessionId);
  const ok = await revokeSessionRow(profileId, sessionId);
  if (!ok) throw ApiError.notFound('Сеанс не найден', 'SESSION_NOT_FOUND');
  if (currentSessionId) lastTouchAt.delete(currentSessionId);
  lastTouchAt.delete(sessionId);
  return { revokedCurrent: isCurrent };
}

export async function revokeOtherAuthSessions(
  profileId: string,
  currentSessionId: string | null,
): Promise<{ revokedCount: number }> {
  if (!currentSessionId) {
    throw ApiError.badRequest('Текущий сеанс не определён', 'NO_CURRENT_SESSION');
  }
  try {
    const revoked = await query<{ id: string }>(
      `update public.profile_auth_sessions
       set revoked_at = now()
       where profile_id = $1 and id <> $2 and revoked_at is null
       returning id`,
      [profileId, currentSessionId],
    );
    for (const r of revoked.rows) lastTouchAt.delete(r.id);
    return { revokedCount: revoked.rows.length };
  } catch (e) {
    if (isMissingAuthSessionsTable(e)) {
      warnSessionsTableMissing('revoke-others');
      return { revokedCount: 0 };
    }
    throw e;
  }
}

export async function logAuthSessionsTableStatus(): Promise<void> {
  try {
    await query(`select 1 from public.profile_auth_sessions limit 1`);
    console.info('[SLOTTY] auth sessions: таблица profile_auth_sessions доступна');
  } catch (e) {
    if (isMissingAuthSessionsTable(e)) {
      warnSessionsTableMissing('startup');
    } else {
      console.error('[SLOTTY] auth sessions: проверка таблицы не удалась', e);
    }
  }
}
