import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertCanCreateMasterService } from '../billing/billing.service.js';
import { assertProfileCanManageMasterContent } from '../profiles/profileAccount.service.js';

function num(v: string): number {
  return Number(v);
}

function clampFocal(v: number | undefined, fallback = 50): number {
  if (v == null || !Number.isFinite(v)) return fallback;
  return Math.min(100, Math.max(0, Math.trunc(v)));
}

function assertServiceCoverUrl(url: string | null | undefined): string {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw ApiError.badRequest('Загрузите фото услуги — оно обязательно для каталога', 'SERVICE_COVER_REQUIRED');
  }
  return trimmed;
}

export async function listMyServices(masterId: string) {
  const r = await query(
    `select id, title, description, duration_minutes, price_amount::text, price_type::text, is_active, sort_order, category_id,
            cover_image_url, cover_image_focal_x, cover_image_focal_y
       from public.master_services
      where master_id = $1
      order by sort_order asc, title asc`,
    [masterId],
  );
  return (r.rows as ServiceRow[]).map(mapServiceRow);
}

type ServiceRow = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_amount: string;
  price_type: string;
  is_active: boolean;
  sort_order: number;
  category_id: string;
  cover_image_url: string | null;
  cover_image_focal_x: number;
  cover_image_focal_y: number;
};

function mapServiceRow(row: ServiceRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: num(row.price_amount),
    priceType: row.price_type,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    categoryId: row.category_id,
    coverImageUrl: row.cover_image_url,
    coverFocalX: row.cover_image_focal_x,
    coverFocalY: row.cover_image_focal_y,
  };
}

export async function createMyService(
  masterId: string,
  body: {
    categoryId: string;
    title: string;
    description?: string;
    durationMinutes: number;
    priceAmount: number;
    priceType?: 'fixed' | 'from';
    sortOrder?: number;
    coverImageUrl: string;
    coverFocalX?: number;
    coverFocalY?: number;
  },
) {
  await assertProfileCanManageMasterContent(masterId);

  const cat = await query(`select 1 from public.service_categories where id = $1 and is_active = true`, [
    body.categoryId,
  ]);
  if (!cat.rowCount) {
    throw ApiError.badRequest('Invalid category', 'BAD_CATEGORY');
  }

  await assertCanCreateMasterService(masterId);

  const coverUrl = assertServiceCoverUrl(body.coverImageUrl);
  const focalX = clampFocal(body.coverFocalX);
  const focalY = clampFocal(body.coverFocalY);

  const ins = await query<{ id: string }>(
    `insert into public.master_services (
       master_id, category_id, title, description, duration_minutes, price_amount, price_type, is_active, sort_order,
       cover_image_url, cover_image_focal_x, cover_image_focal_y
     ) values ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11)
     returning id`,
    [
      masterId,
      body.categoryId,
      body.title,
      body.description ?? '',
      body.durationMinutes,
      body.priceAmount,
      body.priceType ?? 'fixed',
      body.sortOrder ?? 0,
      coverUrl,
      focalX,
      focalY,
    ],
  );
  return getMyService(masterId, ins.rows[0]!.id);
}

export async function getMyService(masterId: string, serviceId: string) {
  const r = await query(
    `select id, title, description, duration_minutes, price_amount::text, price_type::text, is_active, sort_order, category_id,
            cover_image_url, cover_image_focal_x, cover_image_focal_y
       from public.master_services
      where id = $1 and master_id = $2`,
    [serviceId, masterId],
  );
  const row = r.rows[0] as ServiceRow | undefined;
  if (!row) {
    throw ApiError.notFound('Service not found');
  }
  return mapServiceRow(row);
}

export async function patchMyService(
  masterId: string,
  serviceId: string,
  patch: {
    categoryId?: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
    priceAmount?: number;
    priceType?: 'fixed' | 'from';
    sortOrder?: number;
    isActive?: boolean;
    coverImageUrl?: string | null;
    coverFocalX?: number;
    coverFocalY?: number;
  },
) {
  const current = await getMyService(masterId, serviceId);
  if (patch.categoryId) {
    const cat = await query(`select 1 from public.service_categories where id = $1 and is_active = true`, [
      patch.categoryId,
    ]);
    if (!cat.rowCount) {
      throw ApiError.badRequest('Invalid category', 'BAD_CATEGORY');
    }
  }

  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const push = (col: string, v: unknown) => {
    fields.push(`${col} = $${i++}`);
    vals.push(v);
  };
  if (patch.categoryId !== undefined) push('category_id', patch.categoryId);
  if (patch.title !== undefined) push('title', patch.title);
  if (patch.description !== undefined) push('description', patch.description);
  if (patch.durationMinutes !== undefined) push('duration_minutes', patch.durationMinutes);
  if (patch.priceAmount !== undefined) push('price_amount', patch.priceAmount);
  if (patch.priceType !== undefined) push('price_type', patch.priceType);
  if (patch.sortOrder !== undefined) push('sort_order', patch.sortOrder);
  if (patch.isActive !== undefined) push('is_active', patch.isActive);
  if (patch.coverImageUrl !== undefined) push('cover_image_url', patch.coverImageUrl?.trim() || null);
  if (patch.coverFocalX !== undefined) push('cover_image_focal_x', clampFocal(patch.coverFocalX));
  if (patch.coverFocalY !== undefined) push('cover_image_focal_y', clampFocal(patch.coverFocalY));

  const nextActive = patch.isActive ?? current.isActive;
  const nextCover =
    patch.coverImageUrl !== undefined ? patch.coverImageUrl?.trim() || null : current.coverImageUrl;
  if (nextActive && !nextCover) {
    throw ApiError.badRequest(
      'Загрузите фото услуги — без него услугу нельзя показывать в каталоге',
      'SERVICE_COVER_REQUIRED',
    );
  }

  if (patch.isActive === true && !current.isActive) {
    await assertCanCreateMasterService(masterId);
  }

  if (fields.length) {
    vals.push(serviceId, masterId);
    await query(
      `update public.master_services set ${fields.join(', ')}, updated_at = now()
        where id = $${i++} and master_id = $${i}`,
      vals,
    );
  }
  return getMyService(masterId, serviceId);
}

export async function countUpcomingAppointmentsForService(
  masterId: string,
  serviceId: string,
): Promise<number> {
  const r = await query<{ n: string }>(
    `select count(*)::text as n
       from public.appointments a
      where a.master_id = $1
        and a.service_id = $2
        and a.status in ('pending', 'confirmed')
        and a.ends_at > now()`,
    [masterId, serviceId],
  );
  return Number(r.rows[0]?.n ?? 0);
}

export async function softDeleteMyService(masterId: string, serviceId: string) {
  const upcoming = await countUpcomingAppointmentsForService(masterId, serviceId);
  if (upcoming > 0) {
    throw ApiError.conflict(
      'Нельзя удалить услугу: на неё есть будущие записи. Отмените записи в разделе «Записи» или скройте услугу в каталоге.',
      'SERVICE_HAS_UPCOMING_APPOINTMENTS',
    );
  }
  await patchMyService(masterId, serviceId, { isActive: false });
}
