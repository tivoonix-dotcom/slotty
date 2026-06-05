import { HiCheckCircle, HiLightBulb, HiStar } from 'react-icons/hi2';
import type { SystemNotificationDetailModel, SystemNotificationStat } from './systemNotificationDetailModel';
import {
  notifDetailHighlight,
  notifDetailInsetPanel,
  notifDetailInsetRow,
  notifDetailSectionTitle,
} from './adminNotificationsTheme';

function statAccentClass(accent?: SystemNotificationStat['accent']): string {
  switch (accent) {
    case 'green':
      return 'bg-[#ECFDF5] text-[#15803D]';
    case 'pink':
      return 'bg-[#FFF1F4] text-[#F47C8C]';
    case 'blue':
      return 'bg-[#EFF6FF] text-[#2563EB]';
    default:
      return 'bg-[#F5F5F5] text-[#111827]';
  }
}

function StatTile({ stat }: { stat: SystemNotificationStat }) {
  return (
    <div className={`rounded-[14px] px-3.5 py-3 ${statAccentClass(stat.accent)}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] opacity-80">{stat.label}</p>
      <p className="mt-1 text-[17px] font-bold tracking-[-0.03em]">{stat.value}</p>
    </div>
  );
}

type Props = {
  model: SystemNotificationDetailModel;
};

export function SystemNotificationDetailView({ model }: Props) {
  const isTopMaster = model.scenarioId === 'catalog_top_master';

  return (
    <div className="space-y-3">
      <div className={notifDetailInsetPanel}>
        <p className="text-[15px] font-medium leading-relaxed text-[#374151]">{model.narrative}</p>
      </div>

      {model.stats.length > 0 ? (
        <div
          className={`grid gap-2 ${model.stats.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}
        >
          {model.stats.map((stat) => (
            <StatTile key={`${stat.label}-${stat.value}`} stat={stat} />
          ))}
        </div>
      ) : null}

      {isTopMaster ? (
        <div className="rounded-[16px] bg-[#FFF1F4] px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#F47C8C]">
              <HiStar className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-[15px] font-bold text-[#111827]">Вы в блоке «Топ мастера»</p>
          </div>
          <p className="mt-2 text-[13px] font-medium leading-snug text-[#6B7280]">
            Клиенты видят вас рядом с лучшими мастерами каталога — это повышает доверие и число
            заявок.
          </p>
        </div>
      ) : null}

      {model.perks.length > 0 ? (
        <div className={notifDetailInsetPanel}>
          <p className={notifDetailSectionTitle}>Что это значит</p>
          <ul className="mt-2.5 space-y-2">
            {model.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-[14px] leading-snug text-[#374151]">
                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.tips.length > 0 ? (
        <div className={notifDetailHighlight}>
          <div className="flex items-center gap-2">
            <HiLightBulb className="h-4 w-4 text-[#F47C8C]" aria-hidden />
            <p className={notifDetailSectionTitle}>Что делать дальше</p>
          </div>
          <ul className="mt-2.5 space-y-2">
            {model.tips.map((tip) => (
              <li key={tip} className="text-[14px] font-medium leading-snug text-[#374151]">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.bodyNote && model.scenarioId === 'generic' ? (
        <div className={notifDetailInsetPanel}>
          <p className={notifDetailSectionTitle}>Подробности</p>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#374151]">
            {model.bodyNote}
          </p>
        </div>
      ) : null}

      {model.stats.length > 0 && model.scenarioId !== 'catalog_top_master' ? (
        <div className={notifDetailInsetPanel}>
          <p className={notifDetailSectionTitle}>Детали</p>
          <div className="mt-2 space-y-2">
            {model.stats.map((row) => (
              <div key={row.label} className={notifDetailInsetRow}>
                <span className="text-[13px] font-medium text-[#6B7280]">{row.label}</span>
                <span className="text-[14px] font-semibold text-[#111827]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
