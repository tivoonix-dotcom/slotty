import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ADMIN_PATH } from '../../../app/paths';
import {
  SettingsCabinetList,
  SettingsCabinetSectionTitle,
  SettingsCabinetStatusPill,
  settingsCabinetActionBtn,
} from '../../../pages/admin/settings/workspace/settingsCabinetUi';
import { ADMIN_SIDEBAR_OVERLAY_INSET } from '../../../pages/admin/adminCabinetLayout';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';
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

type PendingConfirm =
  | { kind: 'revoke'; row: AuthSessionRowDto }
  | { kind: 'revokeOthers'; count: number };

export function ActiveSessionsSection() {
  const location = useLocation();
  const overlayInsetClassName = location.pathname.startsWith(ADMIN_PATH)
    ? ADMIN_SIDEBAR_OVERLAY_INSET
    : '';
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<AuthSessionRowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

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

  const performRevoke = async (row: AuthSessionRowDto) => {
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

  const performRevokeOthers = async () => {
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

  const handleConfirm = async () => {
    if (!pendingConfirm || busyId || revokingOthers) return;
    const action = pendingConfirm;
    setPendingConfirm(null);
    if (action.kind === 'revoke') {
      await performRevoke(action.row);
      return;
    }
    await performRevokeOthers();
  };

  const openRevokeConfirm = (row: AuthSessionRowDto) => {
    if (busyId || revokingOthers) return;
    setPendingConfirm({ kind: 'revoke', row });
  };

  const openRevokeOthersConfirm = () => {
    const others = sessions.filter((s) => !s.isCurrent);
    if (!others.length || revokingOthers || busyId) return;
    setPendingConfirm({ kind: 'revokeOthers', count: others.length });
  };

  const confirmBusy = Boolean(busyId) || revokingOthers;

  const confirmCopy =
    pendingConfirm?.kind === 'revokeOthers'
      ? {
          title: 'Завершить другие сеансы?',
          description: `Будут завершены ${pendingConfirm.count} ${
            pendingConfirm.count === 1
              ? 'другой сеанс'
              : pendingConfirm.count < 5
                ? 'других сеанса'
                : 'других сеансов'
          }. На этих устройствах потребуется войти снова.`,
          confirmLabel: 'Завершить остальные',
        }
      : pendingConfirm?.kind === 'revoke'
        ? pendingConfirm.row.isCurrent
          ? {
              title: 'Выйти на этом устройстве?',
              description: 'Текущий сеанс будет завершён. Чтобы продолжить работу, войдите снова.',
              confirmLabel: 'Выйти',
            }
          : {
              title: 'Завершить сеанс?',
              description: `Сеанс «${pendingConfirm.row.title}» будет завершён. На этом устройстве потребуется войти снова.`,
              confirmLabel: 'Завершить',
            }
        : null;

  const okxBtn = settingsCabinetActionBtn;
  const logoutBtn = `${settingsCabinetActionBtn} text-[#B91C1C] hover:bg-[#FEE2E2]`;
  const hasCurrent = sessions.some((s) => s.isCurrent);
  const hasOthers = sessions.some((s) => !s.isCurrent);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <SettingsCabinetSectionTitle
          title="Активные сеансы"
          description="Устройства, с которых выполнен вход. Завершите лишние, если не узнаёте сеанс."
        />
        {hasOthers && hasCurrent ? (
          <button
            type="button"
            disabled={loading || confirmBusy}
            onClick={openRevokeOthersConfirm}
            className={okxBtn}
          >
            {revokingOthers ? '…' : 'Завершить остальные'}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">{error}</p>
      ) : null}

      <SettingsCabinetList>
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
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-[#111827]">
                  {row.title}
                  {row.isCurrent ? <SettingsCabinetStatusPill tone="pink">Сейчас</SettingsCabinetStatusPill> : null}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{row.subtitle}</p>
                <p className="mt-1 text-[12px] text-[#9CA3AF]">
                  Активность: {formatSessionWhen(row.lastActiveAt)}
                </p>
              </div>
              {!row.isCurrent ? (
                <button
                  type="button"
                  disabled={confirmBusy}
                  onClick={() => openRevokeConfirm(row)}
                  className={okxBtn}
                >
                  {busyId === row.id ? '…' : 'Завершить'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={confirmBusy}
                  onClick={() => openRevokeConfirm(row)}
                  className={logoutBtn}
                >
                  {busyId === row.id ? '…' : 'Выйти'}
                </button>
              )}
            </div>
          ))
        )}
      </SettingsCabinetList>

      <ConfirmModal
        open={pendingConfirm !== null}
        danger
        busy={confirmBusy}
        title={confirmCopy?.title ?? ''}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel ?? 'Подтвердить'}
        overlayInsetClassName={overlayInsetClassName}
        onClose={() => {
          if (confirmBusy) return;
          setPendingConfirm(null);
        }}
        onConfirm={() => void handleConfirm()}
      />
    </section>
  );
};
