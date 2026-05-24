import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const PUBLISHED_MASTER_FILTER = `mp.publication_status = 'published'`;

export async function listFavorites(clientId: string) {
  const r = await query(
    `select fm.master_id, fm.created_at,
            mp.display_name, mp.photo_url, mp.slug, mp.rating_avg::text, mp.reviews_count
       from public.favorite_masters fm
       join public.master_profiles mp on mp.master_id = fm.master_id
      where fm.client_id = $1
        and ${PUBLISHED_MASTER_FILTER}
      order by fm.created_at desc`,
    [clientId],
  );
  return r.rows.map((row) => mapFavoriteRow(row as FavoriteRow));
}

export async function listFavoriteMasterIds(clientId: string): Promise<string[]> {
  const r = await query(
    `select fm.master_id
       from public.favorite_masters fm
       join public.master_profiles mp on mp.master_id = fm.master_id
      where fm.client_id = $1
        and ${PUBLISHED_MASTER_FILTER}
      order by fm.created_at desc`,
    [clientId],
  );
  return r.rows.map((row) => String(row.master_id));
}

export async function isFavorite(clientId: string, masterId: string): Promise<boolean> {
  const r = await query(
    `select 1
       from public.favorite_masters fm
       join public.master_profiles mp on mp.master_id = fm.master_id
      where fm.client_id = $1
        and fm.master_id = $2
        and ${PUBLISHED_MASTER_FILTER}
      limit 1`,
    [clientId, masterId],
  );
  return (r.rowCount ?? 0) > 0;
}

/** Добавляет id из localStorage / клиента; уже существующие не дублируются. */
export async function syncFavorites(clientId: string, masterIds: string[]): Promise<{ added: number }> {
  const unique = [...new Set(masterIds.map((id) => id.trim()).filter(Boolean))];
  if (!unique.length) return { added: 0 };

  let added = 0;
  for (const masterId of unique) {
    if (masterId === clientId) continue;
    try {
      if (await addFavorite(clientId, masterId)) added += 1;
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'MASTER_NOT_FOUND' || e.code === 'SELF_FAVORITE')) {
        continue;
      }
      throw e;
    }
  }
  return { added };
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
    throw ApiError.notFound('Master not found', 'MASTER_NOT_FOUND');
  }
  const r = await query(
    `insert into public.favorite_masters (client_id, master_id) values ($1, $2)
     on conflict do nothing
     returning master_id`,
    [clientId, masterId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function removeFavorite(clientId: string, masterId: string) {
  await query(`delete from public.favorite_masters where client_id = $1 and master_id = $2`, [
    clientId,
    masterId,
  ]);
}

type FavoriteRow = {
  master_id: string;
  created_at: Date | string;
  display_name: string;
  photo_url: string | null;
  slug: string | null;
  rating_avg: string | null;
  reviews_count: number | string;
};

function mapFavoriteRow(row: FavoriteRow) {
  return {
    masterId: row.master_id,
    createdAt: row.created_at,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    slug: row.slug,
    rating: row.rating_avg != null && row.rating_avg !== '' ? Number(row.rating_avg) : 0,
    reviewsCount: Number(row.reviews_count) || 0,
  };
}
