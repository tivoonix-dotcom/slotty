import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { getBillingSubscription, listBillingPayments } from '../billing/subscriptionBilling.service.js';
import { getMyMasterCabinet } from '../masters/masters.service.js';
import { notifyUser } from '../notifications/notifyUser.js';
import { getMasterNotificationPreferences } from '../notifications/masterNotificationPreferences.service.js';
import { writeDataExportAudit } from './dataExport.audit.js';
import { buildMasterExportArchive } from './dataExport.generator.js';
import { uploadDataExportArchive } from './dataExport.storage.js';
import type {
  DataExportJobDto,
  DataExportJobStatus,
  MasterExportPayload,
  MasterExportReportSummary,
} from './dataExport.types.js';

type JobRow = {
  id: string;
  user_id: string;
  master_profile_id: string;
  status: DataExportJobStatus;
  format: 'zip';
  storage_path: string | null;
  file_url: string | null;
  expires_at: Date | string | null;
  error_message: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapJob(row: JobRow): DataExportJobDto {
  return {
    id: row.id,
    userId: row.user_id,
    masterProfileId: row.master_profile_id,
    status: row.status,
    format: row.format,
    expiresAt: row.expires_at
      ? row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : String(row.expires_at)
      : null,
    errorMessage: row.error_message,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function isDataExportFeatureEnabled(): boolean {
  return env.DATA_EXPORT_ENABLED;
}

export function isExportJobExpired(job: Pick<DataExportJobDto, 'status' | 'expiresAt'>): boolean {
  if (job.status === 'expired') return true;
  if (!job.expiresAt) return false;
  return new Date(job.expiresAt).getTime() <= Date.now();
}

export function canUserDownloadExportJob(
  job: Pick<DataExportJobDto, 'userId' | 'status' | 'expiresAt'>,
  userId: string,
): boolean {
  if (job.userId !== userId) return false;
  if (job.status !== 'ready') return false;
  return !isExportJobExpired(job);
}

export function canUserRetryExportJob(
  job: Pick<DataExportJobDto, 'userId' | 'status'>,
  userId: string,
): boolean {
  return job.userId === userId && job.status === 'failed';
}

function formatDate(d: Date | string): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('ru-RU');
}

function formatTime(d: Date | string): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function visitTypeLabel(v: string | null | undefined): string {
  if (v === 'salon') return 'В салоне';
  if (v === 'home') return 'На дому';
  if (v === 'online') return 'Онлайн';
  return v?.trim() || '—';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled_by_client: 'Отменена клиентом',
    cancelled_by_master: 'Отменена мастером',
    cancelled_by_admin: 'Отменена администратором',
    no_show: 'Неявка',
    expired: 'Истекла',
    in_progress: 'В процессе',
    client_arrived: 'Клиент прибыл',
    master_marked_completed: 'Завершена мастером',
    client_confirmed_completed: 'Подтверждена клиентом',
  };
  return map[status] ?? status;
}

export async function collectMasterExportPayload(masterId: string): Promise<MasterExportPayload> {
  const [cabinet, billing, payments, prefs, appointmentsR, clientsR, ticketsR, categoriesR] =
    await Promise.all([
      getMyMasterCabinet(masterId),
      getBillingSubscription(masterId),
      listBillingPayments(masterId, { limit: 500 }),
      getMasterNotificationPreferences(masterId),
      query<{
        starts_at: Date;
        created_at: Date;
        service_title_snapshot: string;
        status: string;
        price_snapshot: string;
        client_note: string | null;
        client_name_snapshot: string | null;
        profile_name: string | null;
        visit_type: string | null;
      }>(
        `select a.starts_at, a.created_at, a.service_title_snapshot, a.status::text,
                a.price_snapshot::text, a.client_note,
                a.client_name_snapshot,
                coalesce(nullif(trim(a.client_name_snapshot), ''),
                         nullif(trim(p.full_name), ''), 'Клиент') as profile_name,
                ml.visit_type::text as visit_type
           from public.appointments a
           left join public.profiles p on p.id = a.client_id
           left join public.master_locations ml on ml.master_id = a.master_id and ml.is_primary = true
          where a.master_id = $1
          order by a.starts_at desc`,
        [masterId],
      ),
      query<{
        name: string;
        phone: string | null;
        email: string | null;
        telegram: string | null;
        bookings_count: string;
        cancellations: string;
        no_shows: string;
      }>(
        `select
           coalesce(nullif(trim(max(a.client_name_snapshot)), ''),
                    nullif(trim(max(p.full_name)), ''), 'Клиент') as name,
           coalesce(max(nullif(trim(a.client_phone_snapshot), '')),
                    max(nullif(trim(p.phone), ''))) as phone,
           max(nullif(trim(a.client_email_snapshot), '')) as email,
           coalesce(max(nullif(trim(a.client_telegram_username_snapshot), '')),
                    max(nullif(trim(p.telegram_username), ''))) as telegram,
           count(*)::text as bookings_count,
           count(*) filter (where a.status::text like 'cancelled%')::text as cancellations,
           count(*) filter (where a.status::text = 'no_show')::text as no_shows
         from public.appointments a
         left join public.profiles p on p.id = a.client_id
        where a.master_id = $1
        group by a.client_id`,
        [masterId],
      ),
      query<{
        ticket_code: string;
        category: string;
        status: string;
        severity: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `select ticket_code, category, status, severity, created_at, updated_at
           from public.support_tickets
          where user_id = $1
          order by created_at desc`,
        [masterId],
      ),
      query<{ id: string; name: string }>(
        `select id, name from public.service_categories where is_active = true`,
      ),
    ]);

  const categoryById = new Map(categoriesR.rows.map((c) => [c.id, c.name]));

  const services = cabinet.services.map((s) => ({
    title: s.title,
    category: s.categoryId ? (categoryById.get(s.categoryId) ?? '—') : '—',
    price: `${s.price} BYN`,
    durationMinutes: s.durationMinutes,
    active: s.isActive ? 'Да' : 'Нет',
  }));

  const appointments = appointmentsR.rows.map((a) => ({
    date: formatDate(a.starts_at),
    time: formatTime(a.starts_at),
    client: a.profile_name ?? a.client_name_snapshot ?? 'Клиент',
    service: a.service_title_snapshot,
    status: statusLabel(a.status),
    price: a.price_snapshot,
    format: visitTypeLabel(a.visit_type),
    comment: a.client_note?.trim() ?? '',
    createdAt:
      a.created_at instanceof Date ? a.created_at.toISOString() : String(a.created_at),
  }));

  const clients = clientsR.rows.map((c) => ({
    name: c.name,
    phone: c.phone ?? '',
    email: c.email ?? '',
    telegram: c.telegram ?? '',
    bookingsCount: Number(c.bookings_count),
    cancellations: Number(c.cancellations),
    noShows: Number(c.no_shows),
  }));

  const paymentRows = payments.map((p) => ({
    date: p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt),
    amount: `${p.amount} ${p.currency}`,
    status: p.status,
    plan: billing.subscription.plan.name ?? billing.planCode,
    paymentMethod: p.cardLast4 ? `${p.cardBrand ?? 'Карта'} •••• ${p.cardLast4}` : '—',
    paymentId: p.invoiceNumber ?? p.paymentId ?? p.id,
  }));

  const settings: MasterExportPayload['settings'] = [
    { section: 'Уведомления', key: 'Telegram', value: prefs.channels.telegram ? 'Вкл' : 'Выкл' },
    { section: 'Уведомления', key: 'Email', value: prefs.channels.email ? 'Вкл' : 'Выкл' },
    { section: 'Уведомления', key: 'In-app', value: prefs.channels.in_app ? 'Вкл' : 'Выкл' },
    {
      section: 'Профиль',
      key: 'Публикация',
      value: cabinet.profile.publicationStatus ?? '—',
    },
    {
      section: 'Профиль',
      key: 'Активен в каталоге',
      value: cabinet.profile.isProfileActive ? 'Да' : 'Нет',
    },
  ];

  for (const [eventKey, channels] of Object.entries(prefs.events)) {
    settings.push({
      section: 'События уведомлений',
      key: eventKey,
      value: `TG:${channels.telegram ? '1' : '0'} Email:${channels.email ? '1' : '0'}`,
    });
  }

  const supportTickets = ticketsR.rows.map((t) => ({
    ticketCode: t.ticket_code,
    category: t.category,
    status: t.status,
    priority: t.severity,
    createdAt: t.created_at instanceof Date ? t.created_at.toISOString() : String(t.created_at),
    updatedAt: t.updated_at instanceof Date ? t.updated_at.toISOString() : String(t.updated_at),
  }));

  const uploads: MasterExportPayload['uploads'] = [];
  const pushUpload = (url: string | null | undefined, relativePath: string) => {
    const u = url?.trim();
    if (!u || !u.startsWith('http')) return;
    uploads.push({ url: u, relativePath });
  };

  pushUpload(cabinet.profile.photoUrl, 'profile-photo.jpg');
  for (const cert of cabinet.certificates) {
    pushUpload(cert.imageUrl, `certificates/${cert.id}.jpg`);
  }
  for (const item of cabinet.portfolio) {
    pushUpload(item.imageUrl, `portfolio/${item.id}.jpg`);
  }

  const exportDate = new Date().toLocaleString('ru-RU');
  const report: MasterExportReportSummary = {
    masterName: cabinet.profile.displayName,
    exportDate,
    plan: billing.subscription.plan.name ?? billing.planCode,
    profileSummary: [
      cabinet.profile.bio?.trim() || 'Биография не указана',
      cabinet.primaryCategory ? `Категория: ${cabinet.primaryCategory.name}` : null,
      cabinet.primaryLocation?.publicAddress
        ? `Адрес: ${cabinet.primaryLocation.publicAddress}`
        : null,
    ]
      .filter(Boolean)
      .join('. '),
    servicesCount: services.length,
    appointmentsCount: appointments.length,
    clientsCount: clients.length,
    paymentsCount: paymentRows.length,
    activeSettingsSummary: settings
      .filter((s) => s.section === 'Уведомления' || s.section === 'Профиль')
      .map((s) => `${s.key}: ${s.value}`)
      .join('; '),
    briefSummary: `Экспорт кабинета мастера «${cabinet.profile.displayName}» от ${exportDate}. В архиве ${services.length} услуг, ${appointments.length} записей, ${clients.length} клиентов и ${paymentRows.length} платежей.`,
  };

  const technicalJson = {
    masterId,
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: cabinet.profile.displayName,
      slug: cabinet.profile.slug,
      publicationStatus: cabinet.profile.publicationStatus,
    },
    counts: {
      services: services.length,
      appointments: appointments.length,
      clients: clients.length,
      payments: paymentRows.length,
      supportTickets: supportTickets.length,
    },
    billing: {
      planCode: billing.planCode,
      uiState: billing.uiState,
    },
  };

  return {
    masterId,
    report,
    appointments,
    services,
    clients,
    payments: paymentRows,
    supportTickets,
    settings,
    uploads,
    technicalJson,
  };
}

export async function requestDataExport(userId: string): Promise<DataExportJobDto> {
  if (!isDataExportFeatureEnabled()) {
    throw ApiError.serviceUnavailable('Экспорт данных пока недоступен', 'DATA_EXPORT_DISABLED');
  }

  const { assertCanUseDataExport } = await import('../billing/entitlements.service.js');
  await assertCanUseDataExport(userId);

  const masterCheck = await query(`select 1 from public.master_profiles where master_id = $1 limit 1`, [
    userId,
  ]);
  if (!masterCheck.rowCount) {
    throw ApiError.forbidden('Сначала завершите анкету мастера.', 'NO_MASTER_PROFILE');
  }

  const active = await query<{ id: string }>(
    `select id from public.data_export_jobs
      where user_id = $1 and status in ('pending', 'processing')
      limit 1`,
    [userId],
  );
  if (active.rows[0]) {
    throw ApiError.badRequest(
      'Архив уже готовится. Дождитесь завершения текущего запроса.',
      'EXPORT_IN_PROGRESS',
    );
  }

  const r = await query<JobRow>(
    `insert into public.data_export_jobs (user_id, master_profile_id, status, format)
     values ($1, $1, 'pending', 'zip')
     returning id, user_id, master_profile_id, status::text, format::text,
               storage_path, file_url, expires_at, error_message, created_at, updated_at`,
    [userId],
  );
  const job = mapJob(r.rows[0]!);
  await writeDataExportAudit({
    userId,
    jobId: job.id,
    action: 'export_requested',
  });
  return job;
}

export async function retryDataExport(userId: string, jobId: string): Promise<DataExportJobDto> {
  const existing = await getDataExportJobForUser(userId, jobId);
  if (!canUserRetryExportJob(existing, userId)) {
    throw ApiError.badRequest('Повтор доступен только для неудачных экспортов', 'EXPORT_RETRY_DENIED');
  }
  await writeDataExportAudit({ userId, jobId, action: 'export_retried' });
  return requestDataExport(userId);
}

export async function listDataExportJobs(userId: string): Promise<DataExportJobDto[]> {
  const r = await query<JobRow>(
    `select id, user_id, master_profile_id, status::text, format::text,
            storage_path, file_url, expires_at, error_message, created_at, updated_at
       from public.data_export_jobs
      where user_id = $1
      order by created_at desc
      limit 20`,
    [userId],
  );
  return r.rows.map(mapJob);
}

export async function getDataExportJobForUser(userId: string, jobId: string): Promise<DataExportJobDto> {
  const r = await query<JobRow>(
    `select id, user_id, master_profile_id, status::text, format::text,
            storage_path, file_url, expires_at, error_message, created_at, updated_at
       from public.data_export_jobs
      where id = $1 and user_id = $2`,
    [jobId, userId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Экспорт не найден', 'EXPORT_NOT_FOUND');
  }
  return mapJob(row);
}

export async function getDataExportJobById(jobId: string): Promise<DataExportJobDto | null> {
  const r = await query<JobRow>(
    `select id, user_id, master_profile_id, status::text, format::text,
            storage_path, file_url, expires_at, error_message, created_at, updated_at
       from public.data_export_jobs
      where id = $1`,
    [jobId],
  );
  return r.rows[0] ? mapJob(r.rows[0]) : null;
}

export async function getDataExportJobStoragePath(
  userId: string,
  jobId: string,
): Promise<{ storagePath: string; filename: string }> {
  const job = await getDataExportJobForUser(userId, jobId);
  if (!canUserDownloadExportJob(job, userId)) {
    if (isExportJobExpired(job)) {
      throw ApiError.notFound('Срок действия архива истёк', 'EXPORT_EXPIRED');
    }
    throw ApiError.forbidden('Архив недоступен для скачивания', 'EXPORT_NOT_READY');
  }

  const r = await query<{ storage_path: string | null }>(
    `select storage_path from public.data_export_jobs where id = $1`,
    [jobId],
  );
  const storagePath = r.rows[0]?.storage_path?.trim();
  if (!storagePath) {
    throw ApiError.notFound('Файл архива не найден', 'EXPORT_FILE_MISSING');
  }

  await writeDataExportAudit({ userId, jobId, action: 'export_downloaded' });
  return { storagePath, filename: `slotty-export-${jobId.slice(0, 8)}.zip` };
}

export async function claimPendingExportJobs(limit = 3): Promise<string[]> {
  const r = await query<{ id: string }>(
    `update public.data_export_jobs
        set status = 'processing', updated_at = now()
      where id in (
        select id from public.data_export_jobs
         where status = 'pending'
         order by created_at asc
         limit $1
         for update skip locked
      )
      returning id`,
    [limit],
  );
  return r.rows.map((row) => row.id);
}

export async function processDataExportJob(jobId: string): Promise<void> {
  const r = await query<JobRow>(
    `select id, user_id, master_profile_id, status::text, format::text,
            storage_path, file_url, expires_at, error_message, created_at, updated_at
       from public.data_export_jobs
      where id = $1`,
    [jobId],
  );
  const row = r.rows[0];
  if (!row || row.status !== 'processing') return;

  const userId = row.user_id;
  const masterId = row.master_profile_id;

  try {
    await writeDataExportAudit({ userId, jobId, action: 'export_processing_started' });
    const payload = await collectMasterExportPayload(masterId);
    const zipBuffer = await buildMasterExportArchive(payload);
    const { storagePath } = await uploadDataExportArchive(masterId, jobId, zipBuffer);
    const expiresAt = new Date(Date.now() + env.DATA_EXPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await query(
      `update public.data_export_jobs
          set status = 'ready',
              storage_path = $2,
              expires_at = $3,
              error_message = null,
              updated_at = now()
        where id = $1`,
      [jobId, storagePath, expiresAt.toISOString()],
    );

    await writeDataExportAudit({
      userId,
      jobId,
      action: 'export_ready',
      metadata: { storagePath, expiresAt: expiresAt.toISOString() },
    });

    await notifyUser({
      userId,
      type: 'system',
      audience: 'master',
      title: 'Архив данных готов',
      body: 'ZIP-архив с Excel-таблицами и отчётом по кабинету мастера доступен для скачивания в разделе «Данные и приватность».',
      relatedEntityType: 'data_export_job',
      relatedEntityId: jobId,
    }).catch(() => {});
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await query(
      `update public.data_export_jobs
          set status = 'failed', error_message = $2, updated_at = now()
        where id = $1`,
      [jobId, message.slice(0, 2000)],
    );
    await writeDataExportAudit({
      userId,
      jobId,
      action: 'export_failed',
      metadata: { error: message },
    });
  }
}

export async function expireOldExportJobs(): Promise<number> {
  const r = await query<{ id: string; user_id: string }>(
    `update public.data_export_jobs
        set status = 'expired', updated_at = now()
      where status = 'ready'
        and expires_at is not null
        and expires_at <= now()
      returning id, user_id`,
  );
  for (const row of r.rows) {
    await writeDataExportAudit({
      userId: row.user_id,
      jobId: row.id,
      action: 'export_expired',
    }).catch(() => {});
  }
  return r.rowCount ?? 0;
}
