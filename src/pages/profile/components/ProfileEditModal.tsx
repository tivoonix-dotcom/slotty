import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BY } from 'country-flag-icons/react/1x1';
import type { BackendProfile } from '../../../features/auth/types';
import {
  formatBelarusPhoneDisplay,
  normalizeBelarusPhone,
  sanitizeBelarusPhoneInput,
} from '../../../features/profile/lib/belarusPhone';
import { profileDisplayAvatarUrl, profileDisplayInitials } from '../../../features/profile/lib/profileDisplayAvatar';
import { apiFetch } from '../../../shared/api/backendClient';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { ServicesFilterAddressInput } from '../../services/ServicesFilterAddressInput';
import { ProfileSheetShell } from './ProfileSheetShell';

type Props = {
  open: boolean;
  onClose: () => void;
  profile: BackendProfile | null;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  telegramUserPhotoUrl: string | null;  
};

export function ProfileEditModal({
  open,
  onClose,
  profile,
  isAuthenticated,
  refreshProfile,
  telegramUserPhotoUrl,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<'ok' | 'err' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBanner(null);
      setPhoneErr(null);
      setNameErr(null);
      return;
    }
    if (!profile) return;
    setFullName(profile.full_name.trim());
    setPhone(profile.phone ? formatBelarusPhoneDisplay(profile.phone) : '');
    setAddress((profile.address ?? '').trim());
  }, [open, profile]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const applyTelegramAvatar = useCallback(async () => {
    if (!telegramUserPhotoUrl || !isAuthenticated) return;
    setBanner(null);
    setBusy(true);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: telegramUserPhotoUrl }),
      });
      if (!res.ok) {
        setBanner('err');
        return;
      }
      await refreshProfile();
      setBanner('ok');
    } catch {
      setBanner('err');
    } finally {
      setBusy(false);
    }
  }, [isAuthenticated, refreshProfile, telegramUserPhotoUrl]);

  const onAvatarFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file?.type.startsWith('image/') || !isAuthenticated) return;
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setBusy(true);
      setBanner(null);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await apiFetch('/api/me/avatar', { method: 'POST', body: fd });
        if (!res.ok) {
          setBanner('err');
          return;
        }
        await refreshProfile();
        setLocalPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setBanner('ok');
      } catch {
        setBanner('err');
      } finally {
        setBusy(false);
      }
    },
    [isAuthenticated, refreshProfile],
  );

  const save = useCallback(async () => {
    if (!isAuthenticated || !profile) return;
    const name = fullName.trim();
    if (!name) {
      setNameErr('Укажите имя');
      return;
    }
    setNameErr(null);
    const ph = normalizeBelarusPhone(phone);
    if (!ph.ok) {
      setPhoneErr(ph.message);
      return;
    }
    setPhoneErr(null);
    setBusy(true);
    setBanner(null);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: name,
          phone: ph.compact,
          address: address.trim() ? address.trim() : null,
        }),
      });
      if (!res.ok) {
        setBanner('err');
        return;
      }
      await refreshProfile();
      setBanner('ok');
    } catch {
      setBanner('err');
    } finally {
      setBusy(false);
    }
  }, [address, fullName, isAuthenticated, phone, profile]);

  if (!open) return null;

  const avatarSrc = localPreview ?? profileDisplayAvatarUrl(profile);

  return (
    <ProfileSheetShell onClose={onClose} labelledBy="profile-edit-title">
      <h2 id="profile-edit-title" className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">
        Редактировать профиль
      </h2>

      <div className="mt-5 flex flex-col items-center gap-3">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onAvatarFile} />

        <button
          type="button"
          disabled={!isAuthenticated || busy}
          onClick={() => fileRef.current?.click()}
          className="relative flex h-20 w-20 overflow-hidden rounded-[26px] bg-[#E29595] text-2xl font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.26)] transition active:scale-[0.97] disabled:opacity-50"
        >
          {avatarSrc ? (
            <ImageReveal src={avatarSrc} alt="" className="h-full w-full object-cover" loading="eager" />
          ) : (
            <span className="flex h-full w-full items-center justify-center tracking-tight">
              {profileDisplayInitials(profile?.full_name ?? '')}
            </span>
          )}
        </button>

        <div className="flex w-full max-w-xs flex-col gap-2">
          {telegramUserPhotoUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void applyTelegramAvatar()}
              className="flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              Обновить фото из Telegram
            </button>
          ) : null}
          <button
            type="button"
            disabled={!isAuthenticated || busy}
            onClick={() => fileRef.current?.click()}
            className="flex min-h-11 w-full items-center justify-center rounded-full border-2 border-[#E29595] bg-white px-4 text-[14px] font-semibold text-[#c47878] transition active:scale-[0.98] disabled:opacity-50"
          >
            Загрузить фото
          </button>
        </div>
      </div>

      <label className="mt-6 block">
        <span className="text-[13px] font-semibold text-neutral-500">Имя</span>
        <input
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameErr(null);
          }}
          className="mt-1.5 w-full rounded-[22px] bg-[#F1EFEF] px-4 py-3 text-[16px] font-semibold text-neutral-950 outline-none"
          autoComplete="name"
        />
        {nameErr ? <p className="mt-1.5 text-[13px] font-medium text-red-600">{nameErr}</p> : null}
      </label>

      <label className="mt-4 block">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-500">
          Телефон
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white"
            aria-hidden
          >
            <BY title="Беларусь" className="h-full w-full object-cover" />
          </span>
        </span>
        <input
          value={phone}
          onChange={(e) => {
            setPhone(sanitizeBelarusPhoneInput(e.target.value));
            setPhoneErr(null);
          }}
          inputMode="tel"
          placeholder="+375 29 123 45 67"
          autoComplete="tel"
          maxLength={19}
          className="mt-1.5 w-full rounded-[22px] bg-[#F1EFEF] px-4 py-3 text-[16px] font-semibold text-neutral-950 outline-none"
        />
        {phoneErr ? <p className="mt-1.5 text-[13px] font-medium text-red-600">{phoneErr}</p> : null}
      </label>

      <label htmlFor="profile-edit-address" className="mt-4 block">
        <span className="text-[13px] font-semibold text-neutral-500">Адрес</span>
        <div className="mt-1.5">
          <ServicesFilterAddressInput
            id="profile-edit-address"
            value={address}
            onChange={setAddress}
            viewportDropdown
            placeholder="Можно указать адрес, чтобы быстрее находить мастеров рядом"
            inputClassName="rounded-[22px] bg-[#F1EFEF] px-4 py-3 text-[15px] font-semibold text-neutral-950 placeholder:font-medium placeholder:text-neutral-400"
          />
        </div>
      </label>

      {banner === 'ok' ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-900">Изменения сохранены</p>
      ) : null}
      {banner === 'err' ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">Не удалось сохранить профиль</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !isAuthenticated}
          onClick={() => void save()}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Закрыть
        </button>
      </div>
    </ProfileSheetShell>
  );
}
