import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertAdminCanModifyUser } from '../platform-admin/platformAdminGuards.service.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { getProfileAccountStatus } from '../profiles/profileAccount.service.js';
import {
  notifyAdminsAccountDeletionRequested,
  notifyUserDeletionProcessed,
} from './accountDeletion.notifications.js';
import type {
  AccountDeletionRequestAdminDto,
  AccountDeletionRequestDto,
  DeletionRequestStatus,
} from './accountDeletion.types.js';

type RequestRow = {
  id: string;
  user_id: string;
  status: string;
  message: string;
  requested_at: Date;
  processed_at: Date | null;
  processed_by: string | null;
  admin_note: string | null;
};

type AdminListRow = RequestRow & {
  full_name: string;
  email: string | null;
  role: string;
  account_status: string;
  master_display_name: string | null;
};

function mapDto(row: RequestRow): AccountDeletionRequestDto {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as DeletionRequestStatus,
    message: row.message,
    requestedAt: row.requested_at.toISOString(),
    processedAt: row.processed_at?.toISOString() ?? null,
    processedBy: row.processed_by,
    adminNote: row.admin_note,
  };
}

function mapAdminDto(row: AdminListRow): AccountDeletionRequestAdminDto {
  return {
    ...mapDto(row),
    userFullName: row.full_name,
    userEmail: row.email,
    userRole: row.role,
    accountStatus: row.account_status,
    masterDisplayName: row.master_display_name,
  };
}

async function loadUserLabel(userId: string): Promise<string> {
  const r = await query<{ full_name: string }>(
    `select full_name from public.profiles where id = $1`,
    [userId],
  );
  return r.rows[0]?.full_name?.trim() || 'Пользователь';
}

export async function getMyAccountDeletionRequest(
  userId: string,
): Promise<AccountDeletionRequestDto | null> {
  const r = await query<RequestRow>(
    `select id, user_id, status, message, requested_at, processed_at, processed_by, admin_note
       from public.account_deletion_requests
      where user_id = $1
      order by requested_at desc
      limit 1`,
    [userId],
  );
  const row = r.rows[0];
  return row ? mapDto(row) : null;
}

export async function createAccountDeletionRequest(
  userId: string,
  message: string,
): Promise<AccountDeletionRequestDto> {
  const status = await getProfileAccountStatus(userId);
  if (status === 'deleted') {
    throw ApiError.badRequest('Аккаунт уже удалён', 'ACCOUNT_ALREADY_DELETED');
  }

  const pending = await query<{ id: string }>(
    `select id from public.account_deletion_requests
      where user_id = $1 and status = 'pending'
      limit 1`,
    [userId],
  );
  if (pending.rows[0]) {
    throw ApiError.conflict(
      'Запрос на удаление уже отправлен и ожидает решения администратора',
      'DELETION_REQUEST_PENDING',
    );
  }

  const ins = await query<RequestRow>(
    `insert into public.account_deletion_requests (user_id, message, status)
     values ($1, $2, 'pending')
     returning id, user_id, status, message, requested_at, processed_at, processed_by, admin_note`,
    [userId, message.trim()],
  );
  const row = ins.rows[0]!;
  const fullName = await loadUserLabel(userId);
  void notifyAdminsAccountDeletionRequested({
    requestId: row.id,
    userId,
    userFullName: fullName,
  });

  return mapDto(row);
}

export async function cancelMyAccountDeletionRequest(userId: string): Promise<AccountDeletionRequestDto> {
  const r = await query<RequestRow>(
    `update public.account_deletion_requests
        set status = 'cancelled',
            processed_at = now(),
            updated_at = now()
      where user_id = $1 and status = 'pending'
      returning id, user_id, status, message, requested_at, processed_at, processed_by, admin_note`,
    [userId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Активный запрос на удаление не найден', 'DELETION_REQUEST_NOT_FOUND');
  }
  return mapDto(row);
}

const adminListSql = `
  select r.id, r.user_id, r.status, r.message, r.requested_at, r.processed_at, r.processed_by, r.admin_note,
         p.full_name, p.role::text as role, p.account_status::text as account_status,
         (select email from public.auth_identities ai
           where ai.profile_id = p.id and ai.provider = 'email' limit 1) as email,
         mp.display_name as master_display_name
    from public.account_deletion_requests r
    join public.profiles p on p.id = r.user_id
    left join public.master_profiles mp on mp.master_id = r.user_id
`;

export async function listAccountDeletionRequestsForAdmin(params: {
  status?: DeletionRequestStatus | 'all';
  limit?: number;
  offset?: number;
}): Promise<{ requests: AccountDeletionRequestAdminDto[]; total: number; limit: number; offset: number }> {
  const status = params.status ?? 'pending';
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (status !== 'all') {
    conditions.push(`r.status = $${i++}`);
    vals.push(status);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.account_deletion_requests r ${where}`,
    vals,
  );

  const listR = await query<AdminListRow>(
    `${adminListSql}
      ${where}
      order by r.requested_at desc
      limit $${i++} offset $${i++}`,
    [...vals, limit, offset],
  );

  return {
    requests: listR.rows.map(mapAdminDto),
    total: Number(countR.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

async function revokeAllAuthSessions(userId: string): Promise<void> {
  try {
    await query(
      `update public.profile_auth_sessions
          set revoked_at = now()
        where profile_id = $1 and revoked_at is null`,
      [userId],
    );
  } catch {
    /* sessions table optional on old DB */
  }
}

async function executeAccountDeletion(userId: string, adminId: string): Promise<void> {
  await assertAdminCanModifyUser(userId, adminId);

  const before = await query<{ full_name: string; account_status: string; role: string }>(
    `select full_name, account_status::text as account_status, role::text as role
       from public.profiles where id = $1`,
    [userId],
  );
  const row = before.rows[0];
  if (!row) throw ApiError.notFound('User not found');
  if (row.account_status === 'deleted') return;

  await query(
    `update public.profiles
        set account_status = 'deleted',
            blocked_at = null,
            blocked_reason = null,
            blocked_by = null,
            access_restricted_until = null,
            access_restriction_reason = null,
            updated_at = now()
      where id = $1`,
    [userId],
  );

  await query(
    `update public.master_profiles
        set publication_status = 'hidden',
            updated_at = now()
      where master_id = $1`,
    [userId],
  );

  await revokeAllAuthSessions(userId);

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'user_deleted',
    entityType: 'profile',
    entityId: userId,
    targetUserId: userId,
    metadata: {
      displayName: row.full_name,
      oldStatus: row.account_status,
      newStatus: 'deleted',
    },
  });
}

export async function approveAccountDeletionRequest(
  requestId: string,
  adminId: string,
  adminNote?: string | null,
): Promise<AccountDeletionRequestAdminDto> {
  const reqR = await query<RequestRow>(
    `select id, user_id, status, message, requested_at, processed_at, processed_by, admin_note
       from public.account_deletion_requests where id = $1`,
    [requestId],
  );
  const req = reqR.rows[0];
  if (!req) throw ApiError.notFound('Запрос не найден');
  if (req.status !== 'pending') {
    throw ApiError.badRequest('Запрос уже обработан', 'DELETION_REQUEST_NOT_PENDING');
  }

  await executeAccountDeletion(req.user_id, adminId);
  await query(
    `update public.account_deletion_requests
        set status = 'approved',
            processed_at = now(),
            processed_by = $2,
            admin_note = $3,
            updated_at = now()
      where id = $1`,
    [requestId, adminId, adminNote?.trim() || null],
  );

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'account_deletion_approved',
    entityType: 'account_deletion_request',
    entityId: requestId,
    targetUserId: req.user_id,
    metadata: { adminNote: adminNote?.trim() || null },
  });

  void notifyUserDeletionProcessed({
    userId: req.user_id,
    approved: true,
    adminNote: adminNote ?? null,
  });

  const list = await query<AdminListRow>(
    `${adminListSql} where r.id = $1`,
    [requestId],
  );
  return mapAdminDto(list.rows[0]!);
}

export async function rejectAccountDeletionRequest(
  requestId: string,
  adminId: string,
  adminNote?: string | null,
): Promise<AccountDeletionRequestAdminDto> {
  const r = await query<RequestRow>(
    `update public.account_deletion_requests
        set status = 'rejected',
            processed_at = now(),
            processed_by = $2,
            admin_note = $3,
            updated_at = now()
      where id = $1 and status = 'pending'
      returning id, user_id, status, message, requested_at, processed_at, processed_by, admin_note`,
    [requestId, adminId, adminNote?.trim() || null],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Запрос не найден или уже обработан', 'DELETION_REQUEST_NOT_FOUND');
  }

  await writeAdminAuditLog({
    adminUserId: adminId,
    action: 'account_deletion_rejected',
    entityType: 'account_deletion_request',
    entityId: requestId,
    targetUserId: row.user_id,
    metadata: { adminNote: adminNote?.trim() || null },
  });

  void notifyUserDeletionProcessed({
    userId: row.user_id,
    approved: false,
    adminNote: adminNote ?? null,
  });

  const list = await query<AdminListRow>(
    `${adminListSql} where r.id = $1`,
    [requestId],
  );
  return mapAdminDto(list.rows[0]!);
}
