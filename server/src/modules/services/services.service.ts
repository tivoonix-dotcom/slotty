import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertCanCreateMasterService } from '../billing/billing.service.js';

function num(v: string): number {
  return Number(v);
}

export async function listMyServices(masterId: string) {
  const r = await query(
    `select id, title, description, duration_minutes, price_amount::text, price_type::text, is_active, sort_order, category_id
       from public.master_services
      where master_id = $1
      order by sort_order asc, title asc`,
    [masterId],
  );
  return (r.rows as ServiceRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: num(row.price_amount),
    priceType: row.price_type,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    categoryId: row.category_id,
  }));
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
};

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
  },
) {
  const cat = await query(`select 1 from public.service_categories where id = $1 and is_active = true`, [
    body.categoryId,
  ]);
  if (!cat.rowCount) {
    throw ApiError.badRequest('Invalid category', 'BAD_CATEGORY');
  }

  await assertCanCreateMasterService(masterId);

  const ins = await query<{ id: string }>(
    `insert into public.master_services (
       master_id, category_id, title, description, duration_minutes, price_amount, price_type, is_active, sort_order
     ) values ($1, $2, $3, $4, $5, $6, $7, true, $8)
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
    ],
  );
  return getMyService(masterId, ins.rows[0]!.id);
}

export async function getMyService(masterId: string, serviceId: string) {
  const r = await query(
    `select id, title, description, duration_minutes, price_amount::text, price_type::text, is_active, sort_order, category_id
       from public.master_services
      where id = $1 and master_id = $2`,
    [serviceId, masterId],
  );
  const row = r.rows[0] as ServiceRow | undefined;
  if (!row) {
    throw ApiError.notFound('Service not found');
  }
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
  };
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
  },
) {
  await getMyService(masterId, serviceId);
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

export async function softDeleteMyService(masterId: string, serviceId: string) {
  await patchMyService(masterId, serviceId, { isActive: false });
}
