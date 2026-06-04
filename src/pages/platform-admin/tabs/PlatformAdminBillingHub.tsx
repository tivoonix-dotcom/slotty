import { useSearchParams } from 'react-router-dom';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paFilterChip } from '../platformAdminTheme';
import { PlatformAdminPromoCodesTab } from './PlatformAdminPromoCodesTab';
import { PlatformAdminPurchasesTab } from './PlatformAdminPurchasesTab';
import { PlatformAdminProPaymentsTab } from './PlatformAdminProPaymentsTab';
import { PlatformAdminSubscriptionsTab } from './PlatformAdminSubscriptionsTab';

type BillingKind = 'purchases' | 'promo' | 'pro-payments' | 'subscriptions';

const SEGMENTS: { id: BillingKind; label: string }[] = [
  { id: 'purchases', label: 'Покупки и сводка' },
  { id: 'subscriptions', label: 'Подписки' },
  { id: 'pro-payments', label: 'Заявки Pro' },
  { id: 'promo', label: 'Промокоды' },
];

export function PlatformAdminBillingHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab');
  const kind: BillingKind =
    tab === 'promo'
      ? 'promo'
      : tab === 'pro-payments'
        ? 'pro-payments'
        : tab === 'subscriptions'
          ? 'subscriptions'
          : 'purchases';

  return (
    <div>
      <PlatformAdminPageIntro />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Биллинг">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={kind === seg.id}
            className={paFilterChip(kind === seg.id)}
            onClick={() => {
              if (seg.id === 'purchases') setParams({});
              else setParams({ tab: seg.id });
            }}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {kind === 'purchases' ? (
        <PlatformAdminPurchasesTab />
      ) : kind === 'subscriptions' ? (
        <PlatformAdminSubscriptionsTab />
      ) : kind === 'pro-payments' ? (
        <PlatformAdminProPaymentsTab />
      ) : (
        <PlatformAdminPromoCodesTab />
      )}
    </div>
  );
}
