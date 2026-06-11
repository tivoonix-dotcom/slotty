import { useSearchParams } from 'react-router-dom';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paFilterChip } from '../platformAdminTheme';
import { PlatformAdminEmailCampaignsTab } from './PlatformAdminEmailCampaignsTab';
import { PlatformAdminNewsletterSubscribersTab } from './PlatformAdminNewsletterSubscribersTab';
import { PlatformAdminDeliveriesTab } from './PlatformAdminDeliveriesTab';
import { PlatformAdminNotificationsDiagnosticsTab } from './PlatformAdminNotificationsDiagnosticsTab';

type NotificationsKind = 'subscribers' | 'campaigns' | 'deliveries' | 'diagnostics';

const SEGMENTS: { id: NotificationsKind; label: string }[] = [
  { id: 'subscribers', label: 'Подписчики' },
  { id: 'campaigns', label: 'Email-рассылки' },
  { id: 'deliveries', label: 'Логи доставки' },
  { id: 'diagnostics', label: 'Диагностика' },
];

export function PlatformAdminNotificationsHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab');
  const kind: NotificationsKind =
    tab === 'campaigns'
      ? 'campaigns'
      : tab === 'deliveries'
        ? 'deliveries'
        : tab === 'diagnostics'
          ? 'diagnostics'
          : 'subscribers';

  return (
    <div>
      <PlatformAdminPageIntro />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Уведомления">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={kind === seg.id}
            className={paFilterChip(kind === seg.id)}
            onClick={() => {
              if (seg.id === 'subscribers') setParams({});
              else setParams({ tab: seg.id });
            }}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {kind === 'subscribers' ? (
        <PlatformAdminNewsletterSubscribersTab />
      ) : kind === 'campaigns' ? (
        <PlatformAdminEmailCampaignsTab />
      ) : kind === 'deliveries' ? (
        <PlatformAdminDeliveriesTab />
      ) : (
        <PlatformAdminNotificationsDiagnosticsTab />
      )}
    </div>
  );
}
