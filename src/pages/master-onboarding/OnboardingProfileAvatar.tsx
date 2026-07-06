import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { HiCamera } from 'react-icons/hi2';
import type { BackendProfile } from '../../features/auth/types';
import {
  isOnboardingAvatarPhotoUrl,
  profileDisplayInitials,
} from '../../features/profile/lib/profileDisplayAvatar';
import { apiFetch } from '../../shared/api/backendClient';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { optimizeAvatarUrl } from '../../shared/lib/optimizeAvatarUrl';
import { onboardingLabelClass } from './onboardingFormField';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

type Props = {
  name: string;
  isAuthenticated: boolean;
  avatarUrl: string | null;
  telegramPhotoUrl?: string | null;
  onAvatarUpdated?: () => void | Promise<void>;
};

function pickAvatarFromProfileResponse(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const url = (body as BackendProfile).avatar_url?.trim();
  return url && isOnboardingAvatarPhotoUrl(url) ? url : null;
}

export function OnboardingProfileAvatar({
  name,
  isAuthenticated,
  avatarUrl,
  telegramPhotoUrl,
  onAvatarUpdated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const displayName = name.trim() || 'Мастер';
  const initials = profileDisplayInitials(displayName);

  useEffect(() => {
    const next = avatarUrl?.trim();
    setSavedUrl(next && isOnboardingAvatarPhotoUrl(next) ? next : null);
  }, [avatarUrl]);

  const displaySrc = (() => {
    if (previewUrl) return previewUrl;
    const saved = savedUrl?.trim();
    if (!saved || !isOnboardingAvatarPhotoUrl(saved)) return null;
    const optimized = optimizeAvatarUrl(saved, 256);
    return optimized || null;
  })();

  useEffect(() => {
    setPhotoLoaded(false);
    setPhotoFailed(false);
  }, [displaySrc]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showRealPhoto = Boolean(displaySrc) && !photoFailed && photoLoaded;
  const statusTitle = previewUrl || showRealPhoto ? 'Фото добавлено' : 'Добавьте фото';

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Выберите изображение (JPEG, PNG или WebP)');
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        setError('Фото не больше 2 МБ');
        return;
      }
      if (!isAuthenticated) {
        setError('Войдите, чтобы загрузить фото');
        return;
      }

      setError(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await apiFetch('/api/me/avatar', { method: 'POST', body: fd });
        const body = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) {
          const j = body as { error?: { message?: string } } | null;
          setError(j?.error?.message ?? 'Не удалось загрузить фото');
          return;
        }
        const uploaded = pickAvatarFromProfileResponse(body);
        if (uploaded) setSavedUrl(uploaded);
        await onAvatarUpdated?.();
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } catch {
        setError('Нет соединения с сервером');
      } finally {
        setBusy(false);
      }
    },
    [isAuthenticated, onAvatarUpdated],
  );

  const applyTelegramPhoto = useCallback(async () => {
    const url = telegramPhotoUrl?.trim();
    if (!url || !isAuthenticated) return;
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: url }),
      });
      const body = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const j = body as { error?: { message?: string } } | null;
        setError(j?.error?.message ?? 'Не удалось взять фото из Telegram');
        return;
      }
      const saved = pickAvatarFromProfileResponse(body);
      if (saved) setSavedUrl(saved);
      await onAvatarUpdated?.();
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch {
      setError('Нет соединения с сервером');
    } finally {
      setBusy(false);
    }
  }, [isAuthenticated, onAvatarUpdated, telegramPhotoUrl]);

  const showTelegramAction =
    isAuthenticated && Boolean(telegramPhotoUrl?.trim()) && !previewUrl && !showRealPhoto && !busy;

  return (
    <div
      data-onboarding-field="avatar"
      className="scroll-mt-28 rounded-[4px] transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.45)] lg:scroll-mt-32"
    >
      <p className={onboardingLabelClass}>
        <span>Фото профиля</span>
        <span className="font-medium text-neutral-400"> · по желанию</span>
      </p>

      <div className="mt-2 flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => void onFileChange(e)}
        />

        <button
          type="button"
          disabled={!isAuthenticated || busy}
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-[22px] bg-[#FFF1F4] shadow-[0_10px_26px_rgba(244,124,140,0.2)] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 lg:h-24 lg:w-24 lg:rounded-[20px]"
          aria-label="Загрузить фото профиля"
        >
          <span
            key={initials}
            className="flex h-full w-full items-center justify-center text-[26px] font-bold text-[#F47C8C]"
            aria-hidden
          >
            {initials}
          </span>

          {displaySrc && !photoFailed ? (
            <ImageReveal
              key={displaySrc}
              src={displaySrc}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                photoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="eager"
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoFailed(true)}
            />
          ) : null}

          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#F47C8C] shadow-md ring-2 ring-white">
            <HiCamera className="h-4 w-4" aria-hidden />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-neutral-800">{statusTitle}</p>
          <p className="mt-1 text-[13px] leading-snug text-neutral-500">
            {statusTitle === 'Фото добавлено'
              ? 'Клиенты увидят его на карточке в каталоге.'
              : `Покажем «${initials}» из имени, пока нет снимка. Можно пропустить.`}
          </p>
          {!isAuthenticated ? (
            <p className="mt-2 text-[12px] font-medium text-[#B66A24]">
              Войдите через Google, Telegram или email, чтобы загрузить фото
            </p>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-[12px] font-medium leading-snug text-red-600">{error}</p> : null}

      {showTelegramAction ? (
        <button
          type="button"
          onClick={() => void applyTelegramPhoto()}
          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[13px] font-semibold text-neutral-800 transition active:scale-[0.98] lg:max-w-sm"
        >
          Использовать фото из Telegram
        </button>
      ) : null}

      {busy ? (
        <p className="mt-2 text-[12px] font-medium text-neutral-500" role="status">
          Загружаем…
        </p>
      ) : null}
    </div>
  );
}
