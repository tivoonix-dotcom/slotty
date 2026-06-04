import { useCallback, useEffect, useState } from 'react';
import { ConfirmModal } from '../../../../../shared/ui/ConfirmModal';
import { SettingsDangerZone } from '../settingsCards';
import {
  cancelAccountDeletionRequest,
  createAccountDeletionRequest,
  fetchMyAccountDeletionRequest,
  isAccountDeletionApiAvailable,
  type AccountDeletionRequest,
} from './accountDeletionApi';
import {
  settingsCabinetFieldClass,
  settingsCabinetLabelClass,
  settingsCabinetOutlineBtn,
} from '../settingsCabinetUi';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusHint(request: AccountDeletionRequest): string {
  if (request.status === 'pending') {
    return `Запрос отправлен ${formatWhen(request.requestedAt)}. Администратор SLOTTY рассмотрит его и подтвердит удаление или отклонит с комментарием.`;
  }
  if (request.status === 'approved') {
    return 'Аккаунт удалён по вашему запросу.';
  }
  if (request.status === 'rejected') {
    return request.adminNote
      ? `Запрос отклонён: ${request.adminNote}`
      : 'Запрос на удаление отклонён администратором.';
  }
  return 'Запрос отменён.';
}

export function AccountDeletionSection() {
  const apiReady = isAccountDeletionApiAvailable();
  const [request, setRequest] = useState<AccountDeletionRequest | null>(null);
  const [loading, setLoading] = useState(apiReady);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!apiReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRequest(await fetchMyAccountDeletionRequest());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить статус');
    } finally {
      setLoading(false);
    }
  }, [apiReady]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = request?.status === 'pending';

  async function submitRequest() {
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createAccountDeletionRequest({
        message: message.trim(),
        confirmIrreversible: true,
      });
      setRequest(created);
      setModalOpen(false);
      setMessage('');
      setConfirmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить запрос');
    } finally {
      setBusy(false);
    }
  }

  async function cancelRequest() {
    setBusy(true);
    setError(null);
    try {
      const updated = await cancelAccountDeletionRequest();
      setRequest(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отменить запрос');
    } finally {
      setBusy(false);
    }
  }

  if (!apiReady) {
    return (
      <SettingsDangerZone
        disabled
        hint="Подключите backend API, чтобы отправить запрос на удаление из кабинета."
      />
    );
  }

  return (
    <>
      <SettingsDangerZone
        disabled={loading || pending}
        actionLabel={pending ? 'Ожидает решения' : 'Запросить удаление'}
        onDelete={pending ? undefined : () => setModalOpen(true)}
        hint={
          loading ? (
            'Загрузка…'
          ) : pending && request ? (
            <span>{statusHint(request)}</span>
          ) : request && request.status !== 'cancelled' ? (
            <span>{statusHint(request)}</span>
          ) : (
            'Запрос уйдёт администратору SLOTTY. После подтверждения аккаунт будет удалён без возможности восстановления.'
          )
        }
      />

      {error ? (
        <p className="mt-2 text-[13px] font-medium text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}

      {pending ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void cancelRequest()}
          className={`${settingsCabinetOutlineBtn} mt-3 min-h-[44px] w-full sm:w-auto`}
        >
          Отменить запрос
        </button>
      ) : null}

      <ConfirmModal
        open={modalOpen}
        danger
        busy={busy}
        title="Запросить удаление аккаунта"
        description="Администратор проверит запрос и удалит аккаунт вручную. Профиль мастера, записи и настройки станут недоступны."
        confirmLabel="Отправить запрос"
        confirmDisabled={!confirmed}
        onClose={() => {
          if (busy) return;
          setModalOpen(false);
          setConfirmed(false);
        }}
        onConfirm={() => void submitRequest()}
        overlayInsetClassName="lg:left-[var(--master-sidebar-width,0px)]"
      >
        <div className="space-y-4 text-left">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[#D1D5DB]"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-[14px] leading-relaxed text-[#374151]">
              Я понимаю, что удаление необратимо и данные кабинета нельзя будет восстановить.
            </span>
          </label>
          <div>
            <label className={settingsCabinetLabelClass} htmlFor="deletion-message">
              Комментарий (необязательно)
            </label>
            <textarea
              id="deletion-message"
              rows={3}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${settingsCabinetFieldClass} mt-1.5 resize-y`}
              placeholder="Причина или уточнение для администратора"
            />
          </div>
          <p className="text-[12px] text-[#9CA3AF]">
            После отправки вы сможете отменить запрос, пока администратор его не обработал.
          </p>
        </div>
      </ConfirmModal>
    </>
  );
}
