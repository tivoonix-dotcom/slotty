import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthProvider';
import {
  fetchAuthSessions,
  revokeAuthSession,
  revokeOtherAuthSessions,
} from '../api/authApi';
import type { AuthSessionRowDto } from '../types';

function formatSessionWhen(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SessionDeviceIcon({ title }: { title: string }) {
  const mobile = /iPhone|Android|Telegram/i.test(title);
  return (
    <svg
      className="h-5 w-5 text-[#6B7280]"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      {mobile ? (
        <path
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm4 14v.01"
        />
      ) : (
        <path
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16v10H4V6Zm2 14h12"
        />
      )}
    </svg>
  );
}

export function ActiveSessionsSection() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<AuthSessionRowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAuthSessions();
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить сеансы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRevoke = async (row: AuthSessionRowDto) => {
    if (busyId) return;
    const ok = row.isCurrent
      ? window.confirm('Завершить сеанс на этом устройстве? Потребуется войти снова.')
      : window.confirm(`Завершить сеанс «${row.title}»?`);
    if (!ok) return;
    setBusyId(row.id);
    setError(null);
    try {
      const out = await revokeAuthSession(row.id);
      if (out.revokedCurrent) {
        logout();
        return;
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось завершить сеанс');
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeOthers = async () => {
    const others = sessions.filter((s) => !s.isCurrent);
    if (!others.length || revokingOthers) return;
    if (!window.confirm(`Завершить ${others.length} других сеансов?`)) return;
    setRevokingOthers(true);
    setError(null);
    try {
      await revokeOtherAuthSessions();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось завершить другие сеансы');
    } finally {
      setRevokingOthers(false);
    }
  };

  const okxBtn =
    'shrink-0 rounded-[10px] bg-[#F5F5F5] px-4 py-2 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB] disabled:opacity-50';
  const hasOthers = sessions.some((s) => !s.isCurrent);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#111827]">Активные сеансы</h3>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Устройства, с которых выполнен вход. Завершите лишние, если не узнаёте сеанс.
          </p>
        </div>
        {hasOthers ? (
          <button
            type="button"
            disabled={loading || revokingOthers || Boolean(busyId)}
            onClick={() => void handleRevokeOthers()}
            className={okxBtn}
          >
            {revokingOthers ? '…' : 'Завершить остальные'}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-[16px] bg-white divide-y divide-[#EBEBEB]">
        {loading ? (
          <p className="px-5 py-6 text-[14px] text-[#6B7280]">Загрузка сеансов…</p>
        ) : sessions.length === 0 ? (
          <p className="px-5 py-6 text-[14px] leading-relaxed text-[#6B7280]">
            Список появится после следующего входа в аккаунт с этого раздела.
          </p>
        ) : (
          sessions.map((row) => (
            <div key={row.id} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5]">
                <SessionDeviceIcon title={row.title} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#111827]">
                  {row.title}
                  {row.isCurrent ? (
                    <span className="ml-2 text-[12px] font-semibold text-[#16A34A]">Сейчас</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{row.subtitle}</p>
                <p className="mt-1 text-[12px] text-[#9CA3AF]">
                  Активность: {formatSessionWhen(row.lastActiveAt)}
                </p>
              </div>
              {!row.isCurrent ? (
                <button
                  type="button"
                  disabled={Boolean(busyId) || revokingOthers}
                  onClick={() => void handleRevoke(row)}
                  className={okxBtn}
                >
                  {busyId === row.id ? '…' : 'Завершить'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={Boolean(busyId) || revokingOthers}
                  onClick={() => void handleRevoke(row)}
                  className={`${okxBtn} text-[#B91C1C] hover:bg-[#FEE2E2]`}
                >
                  {busyId === row.id ? '…' : 'Выйти'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
