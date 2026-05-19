import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ADMIN_BILLING_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import { postMasterPromotion } from '../../../features/admin/api/masterServiceExtrasApi';
import type { SmartPromotionSuggestionDto } from '../../../features/admin/api/smartPromotionSuggestionsApi';
import { cabinetMutedBtn, cabinetPinkBtn } from '../profile/adminProfileCabinetTheme';
import type { SmartPromotionSuggestionsState } from './useSmartPromotionSuggestions';

type Props = {
  state: SmartPromotionSuggestionsState;
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onReload: () => Promise<void>;
  onViewWindows: (suggestion: SmartPromotionSuggestionDto) => void;
  onPromotionCreated: () => void;
  showToast: (message: string) => void;
};

function SuggestionCard({
  suggestion,
  creating,
  onCreate,
  onViewWindows,
  onDismiss,
}: {
  suggestion: SmartPromotionSuggestionDto;
  creating: boolean;
  onCreate: () => void;
  onViewWindows: () => void;
  onDismiss: () => void;
}) {
  return (
    <article className="rounded-2xl bg-gradient-to-br from-[#FFF8FA] to-[#FFF1F4] p-4 ring-1 ring-[#FDE8ED]">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#F47C8C] shadow-[0_2px_8px_rgba(244,124,140,0.12)]"
          aria-hidden
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2m14 0h2M5.6 18.4l1.4-1.4M18.4 18.4l-1.4-1.4"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">Идея для записи</h2>
          <p className="mt-1.5 text-[14px] leading-snug text-[#374151]">{suggestion.description}</p>
          <p className="mt-2 text-[12px] leading-snug text-[#9CA3AF]">
            Slotty нашёл свободное время и предлагает закрыть его скидкой.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={creating}
          onClick={onCreate}
          className={`${cabinetPinkBtn} flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-[15px] font-semibold disabled:opacity-60`}
        >
          {creating ? 'Создаём акцию…' : 'Создать акцию'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={creating}
            onClick={onViewWindows}
            className={`${cabinetMutedBtn} flex min-h-10 items-center justify-center rounded-xl px-3 text-[14px] font-semibold disabled:opacity-50`}
          >
            Посмотреть окна
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={onDismiss}
            className="flex min-h-10 items-center justify-center rounded-xl bg-transparent px-3 text-[14px] font-medium text-[#6B7280] transition hover:bg-white/60 active:opacity-80 disabled:opacity-50"
          >
            Не сейчас
          </button>
        </div>
      </div>
    </article>
  );
}

function ProUpsellCard() {
  const navigate = useNavigate();
  return (
    <article className="rounded-2xl bg-gradient-to-br from-[#FFF8FA] to-[#FFF1F4] p-4 ring-1 ring-[#FDE8ED]">
      <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">Умные акции на свободные окна</h2>
      <p className="mt-1.5 text-[14px] leading-snug text-[#6B7280]">
        Slotty подскажет, когда у вас есть пустые окна, и предложит скидку, чтобы заполнить их быстрее.
      </p>
      <p className="mt-2 text-[13px] font-medium text-[#F47C8C]">Доступно в Pro</p>
      <button
        type="button"
        onClick={() => navigate(ADMIN_BILLING_PATH)}
        className={`${cabinetPinkBtn} mt-4 flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-[15px] font-semibold`}
      >
        Посмотреть тарифы
      </button>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-[#FFF1F4] p-4 ring-1 ring-[#FDE8ED]">
      <div className="h-4 w-36 rounded-lg bg-[#FDE8ED]" />
      <div className="mt-3 h-3 w-full rounded bg-[#FDE8ED]/80" />
      <div className="mt-2 h-3 w-[80%] rounded bg-[#FDE8ED]/60" />
      <div className="mt-4 h-11 w-full rounded-xl bg-[#FDE8ED]" />
    </div>
  );
}

export function SmartPromotionSuggestionsPanel({
  state,
  dismissedIds,
  onDismiss,
  onReload,
  onViewWindows,
  onPromotionCreated,
  showToast,
}: Props) {
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [goToPromotionsHint, setGoToPromotionsHint] = useState(false);

  const visibleSuggestions = useMemo(() => {
    if (state.status !== 'ok') return [];
    return state.data.suggestions.filter((s) => !dismissedIds.has(s.id));
  }, [dismissedIds, state]);

  const needsPro =
    state.status === 'ok' &&
    !state.data.entitlements.canUseSmartPromotions &&
    state.data.entitlements.requiredPlan === 'pro';

  const onCreatePromotion = useCallback(
    async (suggestion: SmartPromotionSuggestionDto) => {
      const draft = suggestion.promotionDraft;
      setCreatingId(suggestion.id);
      try {
        await postMasterPromotion({
          template: draft.template,
          title: draft.title,
          description: draft.description,
          serviceId: draft.serviceId,
          discountType: draft.discountType,
          discountValue: draft.discountValue,
          discountLabel: draft.discountLabel,
          startsAt: draft.startsAt,
          endsAt: draft.endsAt,
          publish: draft.publish,
          slotIds: draft.slotIds?.length ? draft.slotIds : suggestion.slotIds,
        });
        showToast('Акция создана');
        setGoToPromotionsHint(true);
        window.setTimeout(() => setGoToPromotionsHint(false), 8000);
        onDismiss(suggestion.id);
        onPromotionCreated();
        await onReload();
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Не удалось создать акцию');
      } finally {
        setCreatingId(null);
      }
    },
    [onDismiss, onPromotionCreated, onReload, showToast],
  );

  if (state.status === 'skipped') return null;

  if (state.status === 'loading') {
    return <LoadingSkeleton />;
  }

  if (state.status === 'error') {
    return (
      <p className="rounded-2xl bg-[#F7F7F8] px-4 py-3 text-center text-[13px] font-medium text-[#6B7280] ring-1 ring-[#EAECEF]">
        Не удалось загрузить идеи для акций
      </p>
    );
  }

  if (needsPro) {
    return <ProUpsellCard />;
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleSuggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          creating={creatingId === suggestion.id}
          onCreate={() => void onCreatePromotion(suggestion)}
          onViewWindows={() => onViewWindows(suggestion)}
          onDismiss={() => onDismiss(suggestion.id)}
        />
      ))}

      {goToPromotionsHint ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_4px_16px_rgba(17,24,39,0.06)] ring-1 ring-[#EAECEF]">
          <p className="text-[13px] font-medium text-[#374151]">Акция в разделе «Услуги»</p>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="shrink-0 rounded-full bg-[#FFF1F4] px-3.5 py-2 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]"
          >
            Перейти к акциям
          </Link>
        </div>
      ) : null}
    </div>
  );
}
