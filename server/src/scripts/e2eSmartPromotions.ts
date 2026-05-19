/**
 * E2E проверка «Умные акции на свободные окна» на реальной БД.
 * Запуск из server/: npx tsx src/scripts/e2eSmartPromotions.ts
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..', '..');
const repoRoot = path.join(serverRoot, '..');

type Result = { name: string; ok: boolean; detail?: string };

const results: Result[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function loadEnvFile(fp: string) {
  if (!fs.existsSync(fp)) return;
  for (const line of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined || process.env[k] === '') process.env[k] = v;
  }
}

function resolveDbPassword(): string {
  const fromEnv = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  const fp = path.join(repoRoot, 'dbpass.txt');
  if (fs.existsSync(fp)) {
    const line = fs.readFileSync(fp, 'utf8').split(/\r?\n/)[0]?.trim();
    if (line) return line;
  }
  throw new Error('Нет пароля БД (SUPABASE_DB_PASSWORD или dbpass.txt)');
}

async function connectPg(): Promise<pg.Client> {
  const pw = resolveDbPassword();
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'gspnsnzdchuigbbdteqz';
  const regions = process.env.SUPABASE_POOLER_REGION
    ? [process.env.SUPABASE_POOLER_REGION]
    : ['eu-west-1', 'eu-west-2', 'eu-central-1', 'eu-central-2', 'eu-north-1', 'us-east-1'];
  if (process.env.SUPABASE_DB_HOST) {
    const c = new pg.Client({
      host: process.env.SUPABASE_DB_HOST,
      port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
      user: process.env.SUPABASE_DB_USER ?? 'postgres',
      password: pw,
      database: process.env.SUPABASE_DB_NAME ?? 'postgres',
      ssl: { rejectUnauthorized: false },
    });
    await c.connect();
    return c;
  }
  let lastErr: unknown = null;
  for (const region of regions) {
    try {
      const c = new pg.Client({
        host: `aws-0-${region}.pooler.supabase.com`,
        port: 5432,
        user: `postgres.${projectRef}`,
        password: pw,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
      });
      await c.connect();
      process.env.SUPABASE_POOLER_REGION = region;
      return c;
    } catch (e) {
      lastErr = e;
      if (!/tenant or user not found/i.test(String((e as Error)?.message ?? e))) throw e;
    }
  }
  throw lastErr;
}

function bearer(masterId: string, jwtSecret: string): string {
  return jwt.sign({ sub: masterId, role: 'master' }, jwtSecret, { expiresIn: '1h' });
}

function dateKeyMinsk(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Minsk',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function tomorrowMinsk(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateKeyMinsk(d);
}

async function main() {
  loadEnvFile(path.join(repoRoot, '.env'));
  loadEnvFile(path.join(serverRoot, '.env'));

  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'e2e-smart-promotions-test-secret-32chars';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'e2e-placeholder-not-used';
  }
  if (!process.env.SUPABASE_URL?.trim()) {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
  }
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const pgClient = await connectPg();

  const pw = resolveDbPassword();
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'gspnsnzdchuigbbdteqz';
  const region = process.env.SUPABASE_POOLER_REGION ?? 'eu-central-1';
  process.env.DATABASE_URL = `postgresql://postgres.${projectRef}:${encodeURIComponent(pw)}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`;

  const {
    getSmartPromotionSuggestions,
  } = await import('../modules/smart-promotions/smartPromotionSuggestions.service.js');
  const { createMyPromotion } = await import('../modules/service-extras/serviceExtras.service.js');
  const { listPublicSlots } = await import('../modules/slots/slots.service.js');
  const { createAppointmentTx } = await import('../modules/appointments/appointments.service.js');
  const { switchMasterSubscriptionMock } = await import('../modules/billing/billing.service.js');
  const { ApiError } = await import('../utils/ApiError.js');
  const { applyPromotionToPrice } = await import('../modules/service-extras/promotionSlots.service.js');

  const apiBase = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  const jwtSecret = process.env.JWT_SECRET!;

  const testTag = `e2e_sp_${Date.now()}`;
  let proMasterId: string | null = null;
  let freeMasterId: string | null = null;
  let otherMasterId: string | null = null;
  let clientId: string | null = null;
  let serviceId: string | null = null;
  let slotPromoIds: string[] = [];
  let slotControlId: string | null = null;
  let promotionId: string | null = null;
  let cleanupPromotionIds: string[] = [];
  let cleanupSlotIds: string[] = [];
  let cleanupMasterIds: string[] = [];

  try {
    // --- подготовка тестовых мастеров ---
    const mkMaster = async (label: string) => {
      const id = crypto.randomUUID();
      await pgClient.query(
        `insert into public.profiles (id, role, full_name, created_at, updated_at)
         values ($1, 'master', $2, now(), now())`,
        [id, `${testTag}_${label}`],
      );
      await pgClient.query(
        `insert into public.master_profiles (master_id, display_name, publication_status, created_at, updated_at)
         values ($1, $2, 'published', now(), now())`,
        [id, `${testTag}_${label}`],
      );
      cleanupMasterIds.push(id);
      return id;
    };

    proMasterId = await mkMaster('pro');
    freeMasterId = await mkMaster('free');
    otherMasterId = await mkMaster('other');
    clientId = crypto.randomUUID();
    await pgClient.query(
      `insert into public.profiles (id, role, full_name, created_at, updated_at)
       values ($1, 'client', $2, now(), now())`,
      [clientId, `${testTag}_client`],
    );

    const cat = await pgClient.query<{ id: string }>(
      `select id from public.service_categories where is_active = true order by sort_order asc limit 1`,
    );
    const categoryId = cat.rows[0]?.id;
    if (!categoryId) throw new Error('Нет service_categories в БД');

    await switchMasterSubscriptionMock(proMasterId, 'pro', 'month');
    await switchMasterSubscriptionMock(freeMasterId, 'free', 'month');
    await switchMasterSubscriptionMock(otherMasterId, 'pro', 'month');

    const svcIns = await pgClient.query<{ id: string }>(
      `insert into public.master_services (master_id, category_id, title, duration_minutes, price_amount, price_type, is_active, sort_order)
       values ($1, $2, $3, 60, 100, 'fixed', true, 1) returning id`,
      [proMasterId, categoryId, `${testTag} услуга`],
    );
    serviceId = svcIns.rows[0]!.id;

    const day = tomorrowMinsk();
    const mkSlot = async (masterId: string, hour: number, service: string | null) => {
      const starts = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00+03:00`);
      const ends = new Date(starts.getTime() + 60 * 60 * 1000);
      const r = await pgClient.query<{ id: string }>(
        `insert into public.master_availability_slots (master_id, service_id, starts_at, ends_at, status, source)
         values ($1, $2, $3, $4, 'available', 'manual') returning id`,
        [masterId, service, starts.toISOString(), ends.toISOString()],
      );
      cleanupSlotIds.push(r.rows[0]!.id);
      return r.rows[0]!.id;
    };

    slotPromoIds = [await mkSlot(proMasterId, 15, serviceId), await mkSlot(proMasterId, 16, serviceId), await mkSlot(proMasterId, 17, serviceId)];
    slotControlId = await mkSlot(proMasterId, 20, serviceId);

    // --- 1 Pro: suggestions ---
    const sugBefore = await getSmartPromotionSuggestions(proMasterId);
    if (sugBefore.entitlements.canUseSmartPromotions && sugBefore.suggestions.length > 0) {
      pass('Pro: smart-promotion-suggestions', `${sugBefore.suggestions.length} предложений`);
    } else {
      fail('Pro: smart-promotion-suggestions', JSON.stringify(sugBefore.entitlements));
    }

    const suggestion = sugBefore.suggestions.find((s) =>
      s.slotIds.every((id) => slotPromoIds.includes(id)),
    ) ?? sugBefore.suggestions[0];

    if (!suggestion) {
      fail('Pro: найден suggestion с тестовыми slotIds');
    } else {
      pass('Pro: suggestion содержит slotIds', suggestion.slotIds.join(', '));

      const draft = suggestion.promotionDraft;
      const created = await createMyPromotion(proMasterId, {
        template: draft.template,
        title: draft.title,
        description: draft.description,
        serviceId: draft.serviceId,
        discountType: draft.discountType,
        discountValue: draft.discountValue,
        discountLabel: draft.discountLabel,
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        publish: draft.publish,
        slotIds: draft.slotIds,
      });
      promotionId = created.id;
      cleanupPromotionIds.push(promotionId);

      const links = await pgClient.query(
        `select slot_id from public.master_service_promotion_slots where promotion_id = $1 order by slot_id`,
        [promotionId],
      );
      const linkedIds = new Set(links.rows.map((r: { slot_id: string }) => r.slot_id));
      const targetsOk = slotPromoIds.every((id) => linkedIds.has(id));
      const controlExcluded = !linkedIds.has(slotControlId!);
      if (targetsOk && controlExcluded && links.rowCount === draft.slotIds.length) {
        pass('Pro: promotion_slots связи', `${links.rowCount} строк, control без акции`);
      } else {
        fail(
          'Pro: promotion_slots связи',
          `rows=${links.rowCount}, controlExcluded=${controlExcluded}, ids=${[...linkedIds].join(',')}`,
        );
      }

      const sugAfter = await getSmartPromotionSuggestions(proMasterId);
      const stillSame = sugAfter.suggestions.some((s) =>
        s.slotIds.some((id) => draft.slotIds.includes(id)),
      );
      if (!stillSame) {
        pass('Pro: suggestion исчез после создания');
      } else {
        fail('Pro: suggestion исчез после создания', 'слоты всё ещё в предложениях');
      }
    }

    // --- 2 Client: public slots ---
    const publicSlots = await listPublicSlots({ masterId: proMasterId, serviceId: serviceId! });
    const promoSlots = publicSlots.filter((s) => s.promotion);
    const promoSlotIdSet = new Set(promoSlots.map((s) => s.id));
    const allPromoAreTarget = slotPromoIds.every((id) => promoSlotIdSet.has(id));
    const controlHasNoPromo = publicSlots.find((s) => s.id === slotControlId)?.promotion == null;

    if (promoSlots.length >= slotPromoIds.length && allPromoAreTarget && controlHasNoPromo) {
      pass('Client: GET slots promotion только на целевых окнах', `promo=${promoSlots.length}, control без скидки`);
    } else {
      fail(
        'Client: GET slots promotion только на целевых окнах',
        `promoSlots=${promoSlots.map((s) => s.id).join(',')}; control=${slotControlId}`,
      );
    }

    const sample = publicSlots.find((s) => s.id === slotPromoIds[0]);
    if (sample?.promotion) {
      const expected = applyPromotionToPrice(100, 'percent', 15);
      if (Math.abs(sample.promotion.discountedPrice - expected) < 0.02) {
        pass('Client: пересчёт цены -15%', `${sample.promotion.discountedPrice} BYN`);
      } else {
        fail('Client: пересчёт цены', `ожидали ${expected}, got ${sample.promotion.discountedPrice}`);
      }
    }

    // booking price_snapshot
    if (slotPromoIds[0] && clientId) {
      const appt = await createAppointmentTx({
        clientId,
        slotId: slotPromoIds[0],
        serviceId: serviceId!,
      });
      const snap = await pgClient.query<{ price_snapshot: string }>(
        `select price_snapshot::text from public.appointments where id = $1`,
        [appt.appointmentId],
      );
      const price = Number(snap.rows[0]?.price_snapshot);
      if (Math.abs(price - 85) < 0.02) {
        pass('Client: price_snapshot со скидкой', String(price));
      } else {
        fail('Client: price_snapshot', `ожидали 85, got ${price}`);
      }
      await pgClient.query(`delete from public.appointments where id = $1`, [appt.appointmentId]);
      await pgClient.query(
        `update public.master_availability_slots set status = 'available' where id = $1`,
        [slotPromoIds[0]],
      );
    }

    // --- 3 Free master ---
    const sugFree = await getSmartPromotionSuggestions(freeMasterId);
    if (!sugFree.entitlements.canUseSmartPromotions && sugFree.entitlements.requiredPlan === 'pro') {
      pass('Free: suggestions без Pro', `plan=${sugFree.entitlements.planCode}`);
    } else {
      fail('Free: suggestions entitlements', JSON.stringify(sugFree.entitlements));
    }

    try {
      await createMyPromotion(freeMasterId, {
        template: 'free_slots',
        title: 'test',
        serviceId: serviceId!,
        discountType: 'percent',
        discountValue: 15,
        discountLabel: '-15%',
        startsAt: day,
        endsAt: day,
        publish: true,
        slotIds: [slotPromoIds[1]!],
      });
      fail('Free: POST promotion должен быть 403');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      if (code === 'PRO_REQUIRED') pass('Free: POST free_slots → PRO_REQUIRED');
      else fail('Free: POST free_slots', String(e));
    }

    // HTTP check if server up
    try {
      const res = await fetch(`${apiBase}/api/masters/me/smart-promotion-suggestions`, {
        headers: { Authorization: `Bearer ${bearer(freeMasterId, jwtSecret)}` },
      });
      if (res.status === 200) {
        const j = (await res.json()) as { entitlements?: { canUseSmartPromotions?: boolean } };
        if (j.entitlements?.canUseSmartPromotions === false) {
          pass('Free: HTTP suggestions API');
        } else fail('Free: HTTP suggestions API', JSON.stringify(j.entitlements));
      } else {
        fail('Free: HTTP suggestions API', `status ${res.status}`);
      }
    } catch {
      console.warn('  (HTTP API недоступен — пропуск HTTP-проверок, сервисный слой проверен)');
    }

    // --- 4 Security ---
    try {
      await createMyPromotion(proMasterId, {
        template: 'free_slots',
        title: 'hack',
        serviceId: serviceId!,
        discountType: 'percent',
        discountValue: 15,
        discountLabel: '-15%',
        startsAt: day,
        endsAt: day,
        publish: true,
        slotIds: [await mkSlot(otherMasterId!, 14, null)],
      });
      fail('Security: чужие slotIds');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      if (code === 'SLOT_MASTER_MISMATCH' || code === 'SLOT_NOT_FOUND') pass('Security: чужие slotIds', code);
      else fail('Security: чужие slotIds', String(e));
    }

    const bookedSlot = slotPromoIds[2]!;
    await pgClient.query(
      `insert into public.appointments (client_id, master_id, service_id, slot_id, starts_at, ends_at, status, price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot)
       select $1, $2, $3, $4, s.starts_at, s.ends_at, 'confirmed', 100, 'fixed', 't', 60
         from public.master_availability_slots s where s.id = $4`,
      [clientId, proMasterId, serviceId, bookedSlot],
    );
    await pgClient.query(`update public.master_availability_slots set status = 'booked' where id = $1`, [bookedSlot]);
    try {
      await createMyPromotion(proMasterId, {
        template: 'free_slots',
        title: 'booked',
        serviceId: serviceId!,
        discountType: 'percent',
        discountValue: 15,
        discountLabel: '-15%',
        startsAt: day,
        endsAt: day,
        publish: true,
        slotIds: [bookedSlot],
      });
      fail('Security: занятый слот');
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'SLOT_NOT_AVAILABLE' || e.code === 'SLOT_BOOKED')) {
        pass('Security: занятый слот', e.code);
      } else fail('Security: занятый слот', String(e));
    }
    await pgClient.query(`delete from public.appointments where slot_id = $1`, [bookedSlot]);
    await pgClient.query(`update public.master_availability_slots set status = 'available' where id = $1`, [bookedSlot]);

    const pastSlot = await pgClient.query<{ id: string }>(
      `insert into public.master_availability_slots (master_id, service_id, starts_at, ends_at, status, source)
       values ($1, $2, now() - interval '2 hours', now() - interval '1 hour', 'available', 'manual') returning id`,
      [proMasterId, serviceId],
    );
    cleanupSlotIds.push(pastSlot.rows[0]!.id);
    try {
      await createMyPromotion(proMasterId, {
        template: 'free_slots',
        title: 'past',
        serviceId: serviceId!,
        discountType: 'percent',
        discountValue: 15,
        discountLabel: '-15%',
        startsAt: day,
        endsAt: day,
        publish: true,
        slotIds: [pastSlot.rows[0]!.id],
      });
      fail('Security: слот в прошлом');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SLOT_IN_PAST') pass('Security: слот в прошлом');
      else fail('Security: слот в прошлом', String(e));
    }

    try {
      await createMyPromotion(proMasterId, {
        template: 'free_slots',
        title: 'dup',
        serviceId: serviceId!,
        discountType: 'percent',
        discountValue: 15,
        discountLabel: '-15%',
        startsAt: day,
        endsAt: day,
        publish: true,
        slotIds: [slotPromoIds[1]!],
      });
      fail('Security: дубль на slot_id');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SLOT_ALREADY_PROMOTED') pass('Security: дубль slot_id');
      else fail('Security: дубль slot_id', String(e));
    }

    // Rollback: promotion without valid slots should not persist
    const beforeCount = await pgClient.query<{ c: string }>(
      `select count(*)::text as c from public.master_service_promotions where master_id = $1`,
      [proMasterId],
    );
    try {
      await createMyPromotion(proMasterId, {
        template: 'free_slots',
        title: 'rollback-test',
        serviceId: serviceId!,
        discountType: 'percent',
        discountValue: 15,
        discountLabel: '-15%',
        startsAt: day,
        endsAt: day,
        publish: true,
        slotIds: ['00000000-0000-4000-8000-000000000099'],
      });
      fail('Security: rollback при невалидных slotIds');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SLOT_NOT_FOUND') {
        const afterCount = await pgClient.query<{ c: string }>(
          `select count(*)::text as c from public.master_service_promotions where master_id = $1`,
          [proMasterId],
        );
        if (beforeCount.rows[0]!.c === afterCount.rows[0]!.c) {
          pass('Security: транзакция откатила promotion при ошибке slots');
        } else {
          fail('Security: транзакция', 'promotion остался в БД');
        }
      } else fail('Security: rollback', String(e));
    }

    // --- 5 Ordinary promotion ---
    const ordinary = await createMyPromotion(proMasterId, {
      template: 'custom',
      title: `${testTag} обычная`,
      serviceId: serviceId!,
      discountType: 'percent',
      discountValue: 10,
      discountLabel: '-10%',
      startsAt: day,
      endsAt: day,
      publish: true,
    });
    cleanupPromotionIds.push(ordinary.id);
    const ordLinks = await pgClient.query(
      `select 1 from public.master_service_promotion_slots where promotion_id = $1`,
      [ordinary.id],
    );
    if (ordLinks.rowCount === 0) {
      pass('Обычная акция без slot bindings');
    } else {
      fail('Обычная акция', 'неожиданные promotion_slots');
    }

    const slotsAfterOrdinary = await listPublicSlots({ masterId: proMasterId, serviceId: serviceId! });
    const controlOrdinary = slotsAfterOrdinary.find((s) => s.id === slotControlId);
    if (controlOrdinary?.promotion?.discountLabel === '-10%') {
      pass('Обычная акция: service-wide на других окнах дня', '-10%');
    } else {
      fail('Обычная акция service-wide', JSON.stringify(controlOrdinary?.promotion ?? null));
    }

    const slotBoundStill = slotsAfterOrdinary.find((s) => s.id === slotPromoIds[1]);
    if (slotBoundStill?.promotion?.discountLabel === '-15%') {
      pass('Smart promotion приоритет на привязанном окне', '-15% vs -10%');
    } else {
      fail('Smart приоритет', JSON.stringify(slotBoundStill?.promotion ?? null));
    }
  } finally {
    for (const pid of cleanupPromotionIds) {
      await pgClient.query(`delete from public.master_service_promotions where id = $1`, [pid]).catch(() => {});
    }
    for (const sid of cleanupSlotIds) {
      await pgClient.query(`delete from public.appointments where slot_id = $1`, [sid]).catch(() => {});
      await pgClient.query(`delete from public.master_availability_slots where id = $1`, [sid]).catch(() => {});
    }
    for (const mid of cleanupMasterIds) {
      await pgClient.query(`delete from public.master_subscriptions where master_id = $1`, [mid]).catch(() => {});
      await pgClient.query(`delete from public.master_services where master_id = $1`, [mid]).catch(() => {});
      await pgClient.query(`delete from public.master_profiles where master_id = $1`, [mid]).catch(() => {});
      await pgClient.query(`delete from public.profiles where id = $1`, [mid]).catch(() => {});
    }
    if (clientId) {
      await pgClient.query(`delete from public.profiles where id = $1`, [clientId]).catch(() => {});
    }
    await pgClient.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n--- Итог ---');
  console.log(`Пройдено: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.error('Провалы:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
