import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { HiCheck, HiClipboardDocument, HiEye, HiShare } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { getMasterPath } from '../../../app/paths';
import { updateMyMasterProfile } from '../../../features/admin/api/adminProfileApi';
import {
  computeProfileCompletion,
  type ProfileCompletionActionId,
  type ProfileCompletionMissingItem,
} from '../../../features/admin/lib/profileCompletion';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { readPublicAppOrigin, resolveMasterBookingLink } from '../../../shared/lib/masterBookingLink';
import { openTelegramShareUrlPicker } from '../../../shared/lib/telegramWebApp';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { cabinetCard, cabinetCardPad, cabinetPinkBtn } from './adminProfileCabinetTheme';
import { CabinetIcon } from './cabinetIcons';
import { useProfileCompletionSlots } from './useProfileCompletionSlots';

const PROFILE_COMPLETE_IMAGE_SRC = '/photos/SUCCE.webp';

const ACTION_BUTTON_LABEL: Record<ProfileCompletionActionId, string> = {
  main: 'Заполнить профиль',
  services: 'Добавить услугу',
  schedule: 'Добавить окна',
  address: 'Указать адрес',
  portfolio: 'Загрузить портфолио',
  rules: 'Настроить правила',
  publish: 'Опубликовать профиль',
};

function CompletionStatusIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] ring-1 ring-[#FDE8ED]"
        aria-hidden
      >
        <CabinetIcon name="check" size={12} />
      </span>
    );
  }
  return <span className="h-5 w-5 shrink-0 rounded-full border-2 border-[#E5E7EB] bg-white" aria-hidden />;
}

function uniqueActionButtons(missing: ProfileCompletionMissingItem[]): ProfileCompletionActionId[] {
  const seen = new Set<ProfileCompletionActionId>();
  const out: ProfileCompletionActionId[] = [];
  for (const m of missing) {
    if (seen.has(m.actionId)) continue;
    seen.add(m.actionId);
    out.push(m.actionId);
  }
  return out;
}

function categoryLabel(id: string): string {
  switch (id) {
    case 'main':
      return 'Основная информация';
    case 'services':
      return 'Услуги и цены';
    case 'slots':
      return 'Окна для записи';
    case 'address':
      return 'Адрес и формат работы';
    case 'portfolio':
      return 'Портфолио';
    case 'rules':
      return 'Правила записи';
    case 'published':
      return 'Профиль опубликован';
    default:
      return id;
  }
}

function CompletionHeaderInner({ percent, loading }: { percent: number; loading: boolean }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
      <span className="text-[15px] font-semibold tabular-nums text-[#F47C8C]">
        {loading ? '…' : `${percent}%`}
      </span>
    </div>
  );
}

function CompletionProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F7F7F8]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function CelebrationImageContent() {
  return (
    <div className="mt-4 overflow-hidden rounded-[20px] bg-[#FFF1F4] ring-1 ring-[#FDE8ED]">
      <img
        src={PROFILE_COMPLETE_IMAGE_SRC}
        alt=""
        width={800}
        height={600}
        decoding="async"
        className="block w-full object-cover"
      />
    </div>
  );
}

function ActionStack({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex flex-col gap-2.5">{children}</div>;
}

type ProfileReadyBtnVariant = 'primary' | 'soft' | 'muted';

function ProfileReadyActionButton({
  variant,
  icon: Icon,
  children,
  disabled,
  onClick,
}: {
  variant: ProfileReadyBtnVariant;
  icon: IconType;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  const iconWrap =
    variant === 'primary'
      ? 'flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-white'
      : variant === 'soft'
        ? 'flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#F47C8C] shadow-[0_2px_8px_rgba(244,124,140,0.1)] ring-1 ring-[#FDE8ED]'
        : 'flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6B7280] ring-1 ring-[#EAECEF]';

  const shell =
    'relative flex w-full min-h-[52px] items-center justify-center rounded-[16px] px-5 py-3.5 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

  const variantClass =
    variant === 'primary'
      ? `${shell} bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)] hover:bg-[#F26D83]`
      : variant === 'soft'
        ? `${shell} bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#FDE8ED] hover:bg-[#FFE4EA]`
        : `${shell} bg-[#F7F7F8] text-[#111827] ring-1 ring-[#EAECEF] hover:bg-[#F3F4F6]`;

  const textClass =
    variant === 'primary'
      ? 'w-full text-center text-[15px] font-semibold leading-snug text-white'
      : variant === 'soft'
        ? 'w-full text-center text-[15px] font-semibold leading-snug text-[#F47C8C]'
        : 'w-full text-center text-[15px] font-semibold leading-snug text-[#111827]';

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={variantClass}>
      <span
        className={`absolute left-5 top-1/2 -translate-y-1/2 ${iconWrap}`}
        aria-hidden
      >
        <Icon className="h-5 w-5 shrink-0" />
      </span>
      <span className={`${textClass} px-14`}>{children}</span>
    </button>
  );
}

function UnpublishedWarning({
  publishBusy,
  useCabinetApi,
  publishError,
  onPublish,
}: {
  publishBusy: boolean;
  useCabinetApi: boolean;
  publishError: string | null;
  onPublish: () => void;
}) {
  return (
    <div className="mt-4 rounded-[16px] bg-amber-50 px-3.5 py-3 ring-1 ring-amber-100">
      <p className="text-[14px] font-semibold text-amber-900">Профиль заполнен, но пока не опубликован</p>
      <p className="mt-1 text-[13px] leading-snug text-amber-800/90">
        Опубликуйте профиль, чтобы клиенты могли записываться
      </p>
      <button
        type="button"
        disabled={publishBusy || !useCabinetApi}
        onClick={onPublish}
        className={`${cabinetPinkBtn} mt-3 w-full justify-center py-2.5 text-[14px] disabled:opacity-50`}
      >
        {publishBusy ? 'Публикуем…' : 'Опубликовать профиль'}
      </button>
      {publishError ? <p className="mt-2 text-[12px] font-medium text-red-600">{publishError}</p> : null}
    </div>
  );
}

export type ProfileCompletionHandlers = {
  onEditMain: () => void;
  onGoServices: () => void;
  onGoSchedule: () => void;
  onGoAddress: () => void;
  onGoPortfolio: () => void;
  onGoRules: () => void;
};

type Props = {
  draft: MasterDraft;
  handlers: ProfileCompletionHandlers;
  /** Классы оболочки карточки (desktop dashboard и т.п.). */
  surfaceClassName?: string;
};

const defaultSurfaceClass = `${cabinetCard} ${cabinetCardPad}`;

export function ProfileCompletionBlock({ draft, handlers, surfaceClassName }: Props) {
  const surface = surfaceClassName ?? defaultSurfaceClass;
  const navigate = useNavigate();
  const {
    useCabinetApi,
    cabinetLoading,
    cabinetError,
    publicationStatus,
    setPublicationStatus,
    refreshDraft,
  } = useAdminMasterCabinet();

  const { activeBookableSlots, slotsLoading, reloadSlots } = useProfileCompletionSlots(
    useCabinetApi,
    cabinetLoading,
  );

  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const completion = useMemo(
    () =>
      computeProfileCompletion({
        draft,
        publicationStatus,
        activeBookableSlots,
        useCabinetApi,
        cabinetLoading,
        slotsLoading,
      }),
    [draft, publicationStatus, activeBookableSlots, useCabinetApi, cabinetLoading, slotsLoading],
  );

  const clamped = Math.min(100, Math.max(0, completion.percent));
  const showLoading = useCabinetApi && (cabinetLoading || slotsLoading) && !completion.readinessKnown;

  const runAction = useCallback(
    (actionId: ProfileCompletionActionId) => {
      switch (actionId) {
        case 'main':
          handlers.onEditMain();
          break;
        case 'services':
          handlers.onGoServices();
          break;
        case 'schedule':
          handlers.onGoSchedule();
          break;
        case 'address':
          handlers.onGoAddress();
          break;
        case 'portfolio':
          handlers.onGoPortfolio();
          break;
        case 'rules':
          handlers.onGoRules();
          break;
        default:
          break;
      }
    },
    [handlers],
  );

  const onPublish = useCallback(async () => {
    if (!useCabinetApi) {
      setPublishError('Для публикации нужен сервер и вход через Telegram');
      return;
    }
    setPublishBusy(true);
    setPublishError(null);
    try {
      await updateMyMasterProfile({ publicationStatus: 'published' });
      setPublicationStatus('published');
      await refreshDraft();
      await reloadSlots();
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Не удалось опубликовать профиль');
    } finally {
      setPublishBusy(false);
    }
  }, [reloadSlots, refreshDraft, setPublicationStatus, useCabinetApi]);

  const bookingLink = useMemo(
    () => resolveMasterBookingLink(draft.profileSlug, draft.masterId, readPublicAppOrigin()),
    [draft.profileSlug, draft.masterId],
  );

  const copyHref = useCallback(async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = href;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    } catch {
      setShareHint('Не удалось скопировать');
    }
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!shareHint) return undefined;
    const t = window.setTimeout(() => setShareHint(null), 2200);
    return () => window.clearTimeout(t);
  }, [shareHint]);

  const onShare = useCallback(async () => {
    if (!bookingLink) return;
    const { href } = bookingLink;
    const title = 'SLOTTY — запись к мастеру';
    if (openTelegramShareUrlPicker(href, title)) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url: href });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyHref(href);
    setShareHint('Ссылка скопирована');
  }, [bookingLink, copyHref]);

  const actionButtons = useMemo(
    () => uniqueActionButtons(completion.missing).slice(0, 4),
    [completion.missing],
  );

  if (cabinetError && useCabinetApi) {
    return (
      <section className={surface}>
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
        <p className="mt-2 text-[14px] leading-snug text-[#6B7280]">
          Не удалось загрузить данные кабинета. Обновите страницу или проверьте подключение к серверу.
        </p>
      </section>
    );
  }

  if (completion.isFullyReady) {
    return (
      <section className={surface}>
        <CompletionHeaderInner percent={100} loading={false} />
        <CelebrationImageContent />
        <p className="mt-3 text-center text-[15px] font-semibold text-[#111827]">Профиль готов</p>
        <p className="mt-1 text-center text-[13px] leading-snug text-[#6B7280]">
          Клиенты могут записываться к вам
        </p>
        <ActionStack>
          <ProfileReadyActionButton
            variant="primary"
            icon={copied ? HiCheck : HiClipboardDocument}
            disabled={!bookingLink}
            onClick={() => bookingLink && void copyHref(bookingLink.href)}
          >
            {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
          </ProfileReadyActionButton>
          <ProfileReadyActionButton
            variant="soft"
            icon={HiShare}
            disabled={!bookingLink}
            onClick={() => void onShare()}
          >
            Поделиться
          </ProfileReadyActionButton>
          {draft.masterId ? (
            <ProfileReadyActionButton
              variant="muted"
              icon={HiEye}
              onClick={() => navigate(getMasterPath(draft.masterId!))}
            >
              Посмотреть как клиент
            </ProfileReadyActionButton>
          ) : null}
        </ActionStack>
        {shareHint ? (
          <p className="mt-2 text-center text-[12px] font-medium text-[#6B7280]" role="status">
            {shareHint}
          </p>
        ) : null}
      </section>
    );
  }

  const progressPercent = showLoading ? Math.min(clamped, 99) : clamped;

  return (
    <section className={surface}>
      <CompletionHeaderInner percent={progressPercent} loading={showLoading} />
      <CompletionProgressBar percent={progressPercent} />

      {completion.isContentComplete && !completion.isPublished ? (
        <UnpublishedWarning
          publishBusy={publishBusy}
          useCabinetApi={useCabinetApi}
          publishError={publishError}
          onPublish={() => void onPublish()}
        />
      ) : null}

      {completion.missing.length > 0 ? <IncompleteList items={completion.missing} /> : null}

      {showLoading ? (
        <p className="mt-3 text-[13px] text-[#6B7280]">Проверяем окна для записи…</p>
      ) : null}

      {actionButtons.length > 0 ? (
        <ActionStack>
          {actionButtons.map((actionId, index) => (
            <button
              key={actionId}
              type="button"
              onClick={() => {
                if (actionId === 'publish') void onPublish();
                else runAction(actionId);
              }}
              disabled={actionId === 'publish' && (publishBusy || !useCabinetApi)}
              className={
                index === 0
                  ? `${cabinetPinkBtn} w-full justify-center py-2.5 text-[14px] disabled:opacity-50`
                  : 'w-full rounded-[14px] bg-[#FFF1F4] py-2.5 text-[14px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED] transition active:opacity-90 disabled:opacity-50'
              }
            >
              {actionId === 'publish' && publishBusy
                ? 'Публикуем…'
                : ACTION_BUTTON_LABEL[actionId]}
            </button>
          ))}
        </ActionStack>
      ) : null}

      {publishError && !completion.isContentComplete ? (
        <p className="mt-2 text-[12px] font-medium text-red-600">{publishError}</p>
      ) : null}

      <details className="mt-4 group">
        <summary className="cursor-pointer list-none text-[13px] font-medium text-[#6B7280] marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1">
            Чеклист профиля
            <CabinetIcon
              name="chevron-right"
              size={14}
              className="text-[#9CA3AF] transition group-open:rotate-90"
            />
          </span>
        </summary>
        <ul className="mt-2 divide-y divide-[#EAECEF]">
          {completion.categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => {
                  const first = cat.missing[0];
                  if (first?.actionId === 'publish') void onPublish();
                  else if (first) runAction(first.actionId);
                  else if (cat.id === 'slots') handlers.onGoSchedule();
                }}
                className="flex min-h-[44px] w-full items-center gap-3 py-2 text-left transition hover:bg-[#FAFAFB] active:scale-[0.995]"
              >
                <CompletionStatusIcon done={cat.done} />
                <span
                  className={`min-w-0 flex-1 text-[14px] font-medium ${
                    cat.done ? 'text-[#9CA3AF] line-through decoration-[#E5E7EB]' : 'text-[#111827]'
                  }`}
                >
                  {categoryLabel(cat.id)}
                </span>
                {!cat.done ? (
                  <CabinetIcon name="chevron-right" size={16} className="shrink-0 text-[#9CA3AF]" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function IncompleteList({ items }: { items: ProfileCompletionMissingItem[] }) {
  return (
    <div className="mt-4">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Осталось</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#374151]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47C8C]" aria-hidden />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
