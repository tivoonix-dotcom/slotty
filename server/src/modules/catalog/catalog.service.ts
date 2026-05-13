import { query } from '../../config/db.js';

export async function listActiveServiceCategories() {
  const r = await query<{ id: string; code: string; name: string; sort_order: number }>(
    `select id, code, name, sort_order
       from public.service_categories
      where is_active = true
      order by sort_order asc, name asc`,
  );
  return r.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}
