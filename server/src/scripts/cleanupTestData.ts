/**
 * Удаляет профили и связанные данные, созданные e2e-скриптами и ручными тестами.
 * cd server && npm run cleanup:test-data
 */
import { connectE2ePg } from './e2eDb.js';

const FIND_TEST_PROFILES_SQL = `
  select distinct p.id, p.full_name, p.role, p.created_at::text as created_at
  from public.profiles p
  left join public.auth_identities ai on ai.profile_id = p.id
  where p.full_name ~* '^e2e[_ ]'
     or p.full_name ~* 'e2e_(hv|g|bc|pa|sp)_'
     or p.full_name ilike '%\_priv' escape '\\'
     or p.full_name ilike '%\_home' escape '\\'
     or p.full_name ~* '(^| )e2e_g_'
     or ai.email ilike '%@e2e.test'
     or ai.provider_user_id ilike 'e2e%'
     or ai.provider_user_id ilike 'google-sub-e2e%'
  order by created_at desc
`;

async function main() {
  const pg = await connectE2ePg();

  try {
    const before = await pg.query<{ n: number }>(
      `select count(*)::int as n from public.profiles`,
    );
    const beforeMasters = await pg.query<{ n: number }>(
      `select count(*)::int as n from public.master_profiles`,
    );
    const beforeServices = await pg.query<{ n: number }>(
      `select count(*)::int as n from public.master_services`,
    );

    const found = await pg.query<{
      id: string;
      full_name: string;
      role: string;
      created_at: string;
    }>(FIND_TEST_PROFILES_SQL);

    if (found.rowCount === 0) {
      console.log('Тестовые профили не найдены.');
    } else {
      console.log(`Найдено тестовых профилей: ${found.rowCount}`);
      for (const row of found.rows) {
        console.log(`  - ${row.role} ${row.full_name} (${row.id})`);
      }

      const ids = found.rows.map((r) => r.id);

      const audit = await pg.query(
        `delete from public.admin_audit_logs where admin_user_id = any($1::uuid[])`,
        [ids],
      );
      if ((audit.rowCount ?? 0) > 0) {
        console.log(`Удалено admin_audit_logs: ${audit.rowCount}`);
      }

      const appts = await pg.query(
        `delete from public.appointments
          where client_id = any($1::uuid[])
             or master_id = any($1::uuid[])`,
        [ids],
      );
      if ((appts.rowCount ?? 0) > 0) {
        console.log(`Удалено appointments: ${appts.rowCount}`);
      }

      const deleted = await pg.query(
        `delete from public.profiles where id = any($1::uuid[])`,
        [ids],
      );
      console.log(`Удалено профилей: ${deleted.rowCount ?? 0} (каскадом — услуги, слоты, записи и т.д.)`);
    }

    const after = await pg.query<{ n: number }>(
      `select count(*)::int as n from public.profiles`,
    );
    const afterMasters = await pg.query<{ n: number }>(
      `select count(*)::int as n from public.master_profiles`,
    );
    const afterServices = await pg.query<{ n: number }>(
      `select count(*)::int as n from public.master_services`,
    );

    console.log(
      `Итого: profiles ${before.rows[0]!.n} → ${after.rows[0]!.n}, masters ${beforeMasters.rows[0]!.n} → ${afterMasters.rows[0]!.n}, services ${beforeServices.rows[0]!.n} → ${afterServices.rows[0]!.n}`,
    );
  } finally {
    await pg.end().catch(() => undefined);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
