import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiClock, HiSparkles } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import { postMasterPromotion } from '../../../features/admin/api/masterServiceExtrasApi';
import type { SmartPromotionSuggestionDto } from '../../../features/admin/api/smartPromotionSuggestionsApi';
import { adminSheetPinkBtn, adminSheetGhostBtn } from '../shared/adminCabinetSheetTheme';
import type { SmartPromotionSuggestionsState } from './useSmartPromotionSuggestions';
import { formatHmFromDate, startOfLocalDay } from './scheduleUtils';

type Props = {
  state: SmartPromotionSuggestionsState;
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onReload: () => Promise<void>;
  onViewWindows: (suggestion: SmartPromotionSuggestionDto) => void;
  onPromotionCreated: () => void;
  showToast: (message: string) => void;
  layout?: 'stack' | 'sidebar';
};

function formatSuggestionWhen(suggestion: SmartPromotionSuggestionDto): {
  dayLabel: string;
  timeRange: string;
} {
  const start = new Date(suggestion.startsAt);
  const end = new Date(suggestion.endsAt);
  const today = startOfLocalDay(new Date());
  const dayStart = startOfLocalDay(start);
  const diffDays = Math.round((dayStart.getTime() - today.getTime()) / 86_400_000);

  let dayLabel: string;
  if (diffDays === 0) dayLabel = 'Сегодня';
  else if (diffDays === 1) dayLabel = 'Завтра';
  else {
    dayLabel = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
      .format(start)
      .replace(/\.$/, '');
  }

  return {
    dayLabel,
    timeRange: `${formatHmFromDate(start)}–${formatHmFromDate(end)}`,
  };
}

function hintsMoreLabel(count: number): string {
  if (count === 1) return 'Ещё 1 подсказка внизу списка';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `Ещё ${count} подсказка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `Ещё ${count} подсказки`;
  return `Ещё ${count} подсказок`;
}

function SuggestionItem({
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
  const { dayLabel, timeRange } = formatSuggestionWhen(suggestion);
  const discount = suggestion.discountPercent;

  return (
    <div className="px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-[13px] font-black text-white shadow-[0_6px_16px_rgba(255,95,122,0.25)]">
          −{discount}%
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff5f7a]">
            Свободное окно
          </p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-black text-[#111827]">{dayLabel}</span>
            <span className="inline-flex items-center gap-1 text-[14px] font-bold tabular-nums text-[#374151]">
              <HiClock className="h-4 w-4 shrink-0 text-[#ff5f7a]" aria-hidden />
              {timeRange}
            </span>
          </div>
          {suggestion.serviceTitle ? (
            <p className="mt-1 line-clamp-2 text-[12px] font-semibold text-[#6B7280]">
              {suggestion.serviceTitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          disabled={creating}
          onClick={onCreate}
          className={`${adminSheetPinkBtn} w-full !min-h-11 text-[14px]`}
        >
          {creating ? 'Создаём…' : `Создать акцию −${discount}%`}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={creating}
            onClick={onViewWindows}
            className={`${adminSheetGhostBtn} w-full !min-h-10 text-[13px]`}
          >
            Окна
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={onDismiss}
            className={`${adminSheetGhostBtn} w-full !min-h-10 text-[13px] text-[#6B7280]`}
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}

function ProUpsellCard({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  return (
    <article
      className={`overflow-hidden rounded-[20px] border border-[#FDE8ED] bg-gradient-to-br from-[#FFF9FB] to-white ${
        compact ? 'p-4' : 'p-5 lg:p-6'
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff5f7a]">Pro</p>
      <h2 className="mt-1 text-[16px] font-black tracking-[-0.03em] text-[#111827] lg:text-[17px]">
        Умные акции на пустые окна
      </h2>
      <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#6B7280]">
        Slotty подскажет скидку, когда есть свободное время.
      </p>
      <button type="button" onClick={() => navigate(ADMIN_BILLING_PATH)} className={`${adminSheetPinkBtn} mt-4`}>
        Тарифы Pro
      </button>
    </article>
  );
}

function LoadingSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse overflow-hidden rounded-[20px] border border-[#EAECEF] bg-[#f6f7fb] ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="h-3 w-32 rounded bg-[#EAECEF]" />
      <div className="mt-4 space-y-3 border-t border-[#EAECEF] pt-4">
        <div className="h-3 w-full rounded bg-[#EAECEF]/80" />
        <div className="h-10 w-full rounded-[14px] bg-[#EAECEF]" />
      </div>
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
  layout = 'stack',
}: Props) {
  const compact = layout === 'sidebar';
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
    return <LoadingSkeleton compact={compact} />;
  }

  if (state.status === 'error') {
    return (
      <p className="rounded-[20px] border border-[#EAECEF] bg-[#f6f7fb] px-4 py-3 text-center text-[13px] font-semibold text-[#6B7280]">
        Не удалось загрузить идеи
      </p>
    );
  }

  if (needsPro) {
    return <ProUpsellCard compact={compact} />;
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  const maxShown = compact ? 2 : visibleSuggestions.length;
  const shown = visibleSuggestions.slice(0, maxShown);
  const hiddenCount = visibleSuggestions.length - shown.length;

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-[20px] border border-[#EAECEF] bg-white shadow-[0_4px_20px_rgba(17,24,39,0.05)]">
        <header className="flex items-start gap-3 border-b border-[#FDE8ED] bg-gradient-to-r from-[#FFF9FB] to-white px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#ff5f7a]">
            <HiSparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-black tracking-[-0.02em] text-[#111827]">Подсказки Slotty</h3>
            <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#6B7280]">
              Заполните пустые окна скидкой
            </p>
          </div>
        </header>

        <ul className="divide-y divide-[#EAECEF]">
          {shown.map((suggestion) => (
            <li key={suggestion.id}>
              <SuggestionItem
                suggestion={suggestion}
                creating={creatingId === suggestion.id}
                onCreate={() => void onCreatePromotion(suggestion)}
                onViewWindows={() => onViewWindows(suggestion)}
                onDismiss={() => onDismiss(suggestion.id)}
              />
            </li>
          ))}
        </ul>

        {hiddenCount > 0 ? (
          <p className="border-t border-[#EAECEF] bg-[#f6f7fb] px-4 py-2.5 text-center text-[12px] font-semibold text-[#6B7280]">
            {hintsMoreLabel(hiddenCount)}
          </p>
        ) : null}
      </section>

      {goToPromotionsHint ? (
        <div className="flex flex-col gap-2 rounded-[16px] border border-[#FDE8ED] bg-[#FFF9FB] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-semibold text-[#374151]">Акция появилась в «Услугах»</p>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[#ff5f7a] ring-1 ring-[#FDE8ED]"
          >
            Открыть акции
          </Link>
        </div>
      ) : null}
    </div>
  );
}
