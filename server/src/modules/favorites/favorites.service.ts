import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listFavorites(clientId: string) {
  const r = await query(
    `select fm.master_id, fm.created_at,
            mp.display_name, mp.photo_url, mp.slug, mp.rating_avg::text, mp.reviews_count
       from public.favorite_masters fm
       join public.master_profiles mp on mp.master_id = fm.master_id
      where fm.client_id = $1
      order by fm.created_at desc`,
    [clientId],
  );
  return r.rows.map((row) => ({
    masterId: row.master_id,
    createdAt: row.created_at,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    slug: row.slug,
    rating: Number(row.rating_avg),
    reviewsCount: row.reviews_count,
  }));
}

export async function addFavorite(clientId: string, masterId: string) {
  if (clientId === masterId) {
    throw ApiError.badRequest('Cannot favorite yourself', 'SELF_FAVORITE');
  }
  const m = await query(
    `select 1 from public.master_profiles where master_id = $1 and publication_status = 'published'`,
    [masterId],
  );
  if (!m.rowCount) {
    throw ApiError.notFound('Master not found');
  }
  await query(
    `insert into public.favorite_masters (client_id, master_id) values ($1, $2)
     on conflict do nothing`,
    [clientId, masterId],
  );
}

export async function removeFavorite(clientId: string, masterId: string) {
  await query(`delete from public.favorite_masters where client_id = $1 and master_id = $2`, [
    clientId,
    masterId,
  ]);
}
