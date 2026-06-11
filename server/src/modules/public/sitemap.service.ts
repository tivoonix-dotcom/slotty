import { publicAppUrl } from '../../lib/publicAppUrl.js';
import { query } from '../../config/db.js';

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: string;
};

function formatLastmod(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

/** Только опубликованные профили мастеров с активным аккаунтом. */
export async function listPublishedMasterSitemapEntries(): Promise<SitemapUrlEntry[]> {
  const r = await query<{
    master_id: string;
    updated_at: Date | string | null;
  }>(
    `select mp.master_id, coalesce(mp.updated_at, mp.published_at, mp.created_at) as updated_at
     from public.master_profiles mp
     join public.profiles pr on pr.id = mp.master_id
     where mp.publication_status = 'published'
       and mp.is_profile_active = true
       and pr.account_status not in ('blocked', 'deleted')
       and (
         pr.account_status = 'active'
         or (
           pr.account_status = 'restricted'
           and pr.access_restricted_until is not null
           and pr.access_restricted_until <= now()
         )
       )
     order by mp.updated_at desc nulls last, mp.display_name asc`,
  );

  return r.rows.map((row) => ({
    loc: publicAppUrl(`/master/${encodeURIComponent(row.master_id)}`),
    lastmod: formatLastmod(row.updated_at),
  }));
}

export function buildSitemapXml(entries: SitemapUrlEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
