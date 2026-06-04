import { randomBytes } from 'node:crypto';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { isAutomatedComponentKey } from './systemStatus.checks.js';
import {
  componentStatusLabel,
  formatRelativeRu,
  incidentStatusLabel,
  maintenanceStatusLabel,
  overallStatusCopy,
  severityLabel,
} from './systemStatus.labels.js';
import { computeOverallStatus, sanitizePublicMetadata } from './systemStatus.overall.js';
import type {
  MonitoringMode,
  PublicComponentDto,
  PublicIncidentDto,
  PublicIncidentHistoryGroup,
  PublicMaintenanceDto,
  PublicStatusPageDto,
  SystemComponentStatus,
  SystemIncidentSeverity,
  SystemIncidentStatus,
  SystemMaintenanceStatus,
} from './systemStatus.types.js';

type ComponentRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  status: SystemComponentStatus;
  last_checked_at: Date | null;
  last_success_at: Date | null;
  response_time_ms: number | null;
  metadata: Record<string, unknown>;
};

function buildDisplayExtras(
  key: string,
  status: SystemComponentStatus,
  meta: Record<string, string | number | boolean | null>,
  errorFromMeta: string | null,
): PublicComponentDto['display'] {
  const extras: Array<{ label: string; value: string }> = [];
  if (meta.pendingJobs != null) extras.push({ label: 'В очереди', value: String(meta.pendingJobs) });
  if (meta.failedJobs != null) extras.push({ label: 'Ошибки', value: String(meta.failedJobs) });
  if (meta.nextChargeJobs != null) extras.push({ label: 'Задач продления', value: String(meta.nextChargeJobs) });
  if (meta.configured === false) extras.push({ label: 'Настройка', value: 'Не подключено' });
  if (meta.configured === true && key === 'payments_bepaid') {
    extras.push({ label: 'BePaid', value: 'Настроен' });
  }

  let issueHint: string | null = errorFromMeta;
  if (!issueHint && status === 'degraded' && key === 'telegram_bot') {
    issueHint = 'Задержка уведомлений';
  }

  return {
    statusLabel: componentStatusLabel(status),
    lastCheckLabel: formatRelativeRu(meta.lastTickAt as string | null) ?? null,
    issueHint,
    extras,
  };
}

async function loadUptimeBars(componentId: string, days: number): Promise<PublicComponentDto['uptime']> {
  const r = await query<{ day: string; status: SystemComponentStatus }>(
    `select date_trunc('day', checked_at)::date::text as day,
            (array_agg(status order by
              case status
                when 'major_outage' then 5
                when 'partial_outage' then 4
                when 'maintenance' then 3
                when 'degraded' then 2
                when 'operational' then 1
                else 0
              end desc
            ))[1]::text::public.system_component_status as status
       from public.system_status_checks
      where component_id = $1
        and checked_at >= now() - ($2::int || ' days')::interval
      group by 1
      order by 1`,
    [componentId, days],
  );

  if (r.rows.length === 0) {
    return {
      hasHistory: false,
      days,
      bars: [],
      message: 'История мониторинга начнёт собираться после подключения checks',
    };
  }

  const bars = r.rows.map((row) => ({
    date: row.day,
    status: row.status as SystemComponentStatus | 'no_data',
  }));

  return { hasHistory: true, days, bars, message: null };
}

function resolveMonitoringMode(components: ComponentRow[]): {
  mode: MonitoringMode;
  label: string;
} {
  if (!env.SYSTEM_STATUS_CHECKS_ENABLED) {
    return { mode: 'manual', label: 'Статус обновляется вручную администратором' };
  }
  const automated = components.filter((c) => isAutomatedComponentKey(c.key));
  const checked = automated.filter((c) => c.last_checked_at != null);
  if (checked.length === 0) {
    return { mode: 'manual', label: 'Автоматические проверки ещё не запускались' };
  }
  if (checked.length < automated.length || automated.some((c) => c.status === 'unknown')) {
    return { mode: 'partial', label: 'Мониторинг подключён частично' };
  }
  return { mode: 'automatic', label: 'Автоматический мониторинг активен' };
}

async function loadComponents(publicOnly: boolean): Promise<ComponentRow[]> {
  const r = await query<ComponentRow>(
    `select id, key, name, description, category, status::text as status,
            last_checked_at, last_success_at, response_time_ms, metadata
       from public.system_status_components
      where ($1::boolean = false or is_public = true)
      order by sort_order, name`,
    [publicOnly],
  );
  return r.rows.map((row) => ({
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}

function nameByKey(components: ComponentRow[], keys: string[]): string[] {
  const map = new Map(components.map((c) => [c.key, c.name]));
  return keys.map((k) => map.get(k) ?? k);
}

async function loadActiveIncidents(): Promise<PublicIncidentDto[]> {
  const r = await query<{
    id: string;
    incident_code: string;
    title: string;
    description: string | null;
    severity: SystemIncidentSeverity;
    status: SystemIncidentStatus;
    affected_components: string[];
    started_at: Date;
    updated_at: Date;
  }>(
    `select id, incident_code, title, description, severity::text as severity, status::text as status,
            affected_components, started_at, updated_at
       from public.system_incidents
      where status <> 'resolved'::public.system_incident_status
      order by started_at desc`,
  );
  const components = await loadComponents(true);
  const out: PublicIncidentDto[] = [];
  for (const row of r.rows) {
    const updates = await query<{
      id: string;
      status: SystemIncidentStatus;
      message: string;
      created_at: Date;
    }>(
      `select id, status::text as status, message, created_at
         from public.system_incident_updates
        where incident_id = $1
        order by created_at asc`,
      [row.id],
    );
    out.push({
      id: row.id,
      incidentCode: row.incident_code,
      title: row.title,
      description: row.description,
      severity: row.severity,
      status: row.status,
      statusLabel: incidentStatusLabel(row.status),
      affectedComponents: row.affected_components,
      affectedLabels: nameByKey(components, row.affected_components),
      startedAt: row.started_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      updates: updates.rows.map((u) => ({
        id: u.id,
        status: u.status,
        message: u.message,
        createdAt: u.created_at.toISOString(),
      })),
    });
  }
  return out;
}

async function loadMaintenance(): Promise<PublicMaintenanceDto[]> {
  const r = await query<{
    id: string;
    title: string;
    description: string | null;
    affected_components: string[];
    starts_at: Date;
    ends_at: Date;
    status: SystemMaintenanceStatus;
  }>(
    `select id, title, description, affected_components, starts_at, ends_at, status::text as status
       from public.system_maintenance_windows
      where status in ('scheduled', 'in_progress')
        and ends_at > now()
      order by starts_at`,
  );
  const components = await loadComponents(true);
  return r.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    affectedComponents: row.affected_components,
    affectedLabels: nameByKey(components, row.affected_components),
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    status: row.status,
    statusLabel: maintenanceStatusLabel(row.status),
  }));
}

async function loadIncidentHistory(): Promise<PublicIncidentHistoryGroup[]> {
  const r = await query<{
    id: string;
    incident_code: string;
    title: string;
    severity: SystemIncidentSeverity;
    status: SystemIncidentStatus;
    affected_components: string[];
    started_at: Date;
    resolved_at: Date | null;
    updated_at: Date;
  }>(
    `select id, incident_code, title, severity::text as severity, status::text as status,
            affected_components, started_at, resolved_at, updated_at
       from public.system_incidents
      where status = 'resolved'::public.system_incident_status
         or resolved_at is not null
      order by coalesce(resolved_at, updated_at) desc
      limit 50`,
  );
  const components = await loadComponents(true);
  const now = Date.now();
  const groups: Record<string, PublicIncidentHistoryGroup['incidents']> = {};

  for (const row of r.rows) {
    const end = row.resolved_at ?? row.updated_at;
    const durationMs = end.getTime() - row.started_at.getTime();
    const hours = Math.max(1, Math.round(durationMs / 3_600_000));
    const durationLabel = hours < 48 ? `${hours} ч.` : `${Math.round(hours / 24)} дн.`;

    const ageDays = (now - end.getTime()) / 86_400_000;
    let period = 'Последние 30 дней';
    if (ageDays < 1) period = 'Сегодня';
    else if (ageDays < 2) period = 'Вчера';
    else if (ageDays < 7) period = 'Последние 7 дней';

    if (!groups[period]) groups[period] = [];
    groups[period].push({
      id: row.id,
      incidentCode: row.incident_code,
      title: row.title,
      status: row.status,
      statusLabel: incidentStatusLabel(row.status),
      severity: row.severity,
      durationLabel,
      affectedLabels: nameByKey(components, row.affected_components),
      resolvedAt: row.resolved_at?.toISOString() ?? null,
    });
  }

  const order = ['Сегодня', 'Вчера', 'Последние 7 дней', 'Последние 30 дней'];
  return order
    .filter((p) => groups[p]?.length)
    .map((period) => ({ period, incidents: groups[period]! }));
}

export async function getPublicStatusPage(): Promise<PublicStatusPageDto> {
  const components = await loadComponents(true);
  const maintenance = await loadMaintenance();
  const activeIncidents = await loadActiveIncidents();
  const hasActiveMaintenance = maintenance.some((m) => m.status === 'in_progress' || m.status === 'scheduled');

  const overallKind = computeOverallStatus({
    componentStatuses: components.map((c) => c.status),
    hasActiveMaintenance,
    hasActiveIncident: activeIncidents.length > 0,
  });

  const overall = overallStatusCopy(overallKind);
  const monitoringMeta = resolveMonitoringMode(components);

  const lastUpdated = components.reduce<string | null>((acc, c) => {
    const t = c.last_checked_at?.toISOString() ?? null;
    if (!t) return acc;
    if (!acc || t > acc) return t;
    return acc;
  }, null);

  const publicComponents: PublicComponentDto[] = [];
  for (const c of components) {
    const safeMeta = sanitizePublicMetadata(c.metadata);
    const uptime = await loadUptimeBars(c.id, 30);
    publicComponents.push({
      key: c.key,
      name: c.name,
      description: c.description,
      category: c.category,
      status: c.status,
      lastCheckedAt: c.last_checked_at?.toISOString() ?? null,
      lastSuccessAt: c.last_success_at?.toISOString() ?? null,
      responseTimeMs: c.response_time_ms,
      display: {
        ...buildDisplayExtras(c.key, c.status, safeMeta, null),
        lastCheckLabel: formatRelativeRu(c.last_checked_at?.toISOString() ?? null),
      },
      uptime,
    });
  }

  return {
    overall: { status: overallKind, ...overall },
    monitoring: {
      mode: monitoringMeta.mode,
      label: monitoringMeta.label,
      checksEnabled: env.SYSTEM_STATUS_CHECKS_ENABLED,
      lastUpdatedAt: lastUpdated ?? new Date().toISOString(),
    },
    components: publicComponents,
    activeIncidents,
    maintenance,
    incidentHistory: await loadIncidentHistory(),
  };
}

/** Краткий статус для support hub. */
export async function getSupportStatusSummary(): Promise<{
  status: 'operational' | 'degraded' | 'partial_outage' | 'maintenance';
  label: string;
  static: boolean;
  checkedAt: string;
  affectedCount: number;
  reportUrl: string;
}> {
  const page = await getPublicStatusPage();
  const status =
    page.overall.status === 'major_outage' ? 'partial_outage' : page.overall.status;

  return {
    status,
    label: page.overall.title,
    static: page.monitoring.mode === 'manual',
    checkedAt: page.monitoring.lastUpdatedAt,
    affectedCount: page.components.filter(
      (c) => c.status !== 'operational' && c.status !== 'unknown',
    ).length,
    reportUrl: '/master/settings/support/contact',
  };
}

export function generateIncidentCode(): string {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INC-${day}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

export { severityLabel };
