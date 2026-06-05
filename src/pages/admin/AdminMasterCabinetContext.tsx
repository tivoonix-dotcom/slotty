import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { afterBookingMutation } from '../../features/appointments/bookingDataSync';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { isDevDemoAllowed, isProductionApiMisconfigured } from '../../shared/lib/appMode';
import { getMySubscription, type MasterSubscriptionDto } from '../../features/admin/api/adminBillingApi';
import {
  deleteMasterService,
  fetchMasterAppointments,
  fetchMasterCabinet,
  patchMasterAppointmentCancel,
  patchMasterAppointmentClose,
  patchMasterAppointmentComplete,
  patchMasterAppointmentConfirm,
  patchMasterAppointmentStart,
  patchMasterMe,
  patchMasterService,
  postMasterService,
  putMasterPrimaryLocation,
  putMasterScheduleRules,
} from '../../features/admin/api/masterCabinetApi';
import {
  cabinetDtoToMasterDraft,
  draftScheduleToApiRules,
  draftToPrimaryLocationBody,
  isUuid,
  mapMasterAppointmentRowToDemo,
} from '../../features/admin/lib/masterCabinetMapper';
import { useAuth } from '../../features/auth/AuthProvider';
import { hasMasterCabinetAccess } from '../../features/auth/lib/hasMasterCabinetAccess';
import {
  ensureDemoAppointmentsSeeded,
  saveDemoAppointments,
  type DemoMasterAppointment,
} from '../../features/master/model/demoMasterAppointments';
import { getMasterDraft, persistMasterDraft } from '../../features/master/model/masterDraftStorage';
import { getStoredMasterDraft } from '../../features/profile/lib/demoMasterStorage';
import { contactsToLegacyContactLine } from '../../features/master-onboarding/model/masterContacts';
import type { MasterDraft } from '../../features/profile/lib/demoMasterStorage';
import type { MasterPublicationStatus } from '../../features/admin/lib/profileCompletion';
import type { CategoryChangePolicyDto } from '../../features/admin/lib/categoryChangePolicy';
import {
  clearAdminCabinetSessionCache,
  readAdminCabinetSessionCache,
  writeAdminCabinetSessionCache,
} from './adminCabinetSessionCache';
import { clearOverviewBundleCache } from './overview/adminOverviewSessionCache';

export type MasterProfilePatch = Partial<
  Pick<
    MasterDraft,
    | 'name'
    | 'description'
    | 'phone'
    | 'contact'
    | 'photoUrl'
    | 'contacts'
    | 'category'
    | 'primaryCategoryId'
    | 'primaryCategoryCode'
  >
>;

/** Пустой черновик до ответа API или после 404 — не кэшируем как «реальный» кабинет. */
function isPlaceholderCabinetDraft(draft: MasterDraft): boolean {
  return !draft.name?.trim() && draft.services.length === 0;
}

/** Плейсхолдер до первого ответа API — не подмешиваем local demo draft с пустыми услугами. */
function pendingCabinetDraft(masterId: string): MasterDraft {
  return {
    masterId,
    category: '',
    name: '',
    description: '',
    contact: '',
    services: [],
    schedule: {
      workDays: [0, 1, 2, 3, 4],
      startTime: '09:00',
      endTime: '18:00',
      gapMinutes: 0,
    },
    location: { visitType: 'studio', street: '', building: '' },
    createdAt: new Date().toISOString(),
  };
}

type Ctx = {
  draft: MasterDraft;
  persistDraft: (next: MasterDraft) => void;
  /**
   * После успешного DELETE услуги на сервере: обновить draft и baseline синхронизации,
   * чтобы список не «откатывался» при сбое тихого refresh и не шёл повторный DELETE из debounce.
   */
  commitDraftBaseline: (next: MasterDraft) => void;
  /** В API-режиме: сохранить черновик на сервер и дождаться ответа (без debounce). При ошибке — откат draft с сервера, проброс исключения. */
  flushDraftToBackend: (next: MasterDraft) => Promise<void>;
  /** Только недельные правила (`PUT .../schedule-rules`), без профиля и адреса — чтобы сохранение расписания не зависело от первичной локации. */
  flushScheduleToBackend: (next: MasterDraft) => Promise<void>;
  /** Только первичный адрес (`PUT .../primary-location`), без профиля и расписания. */
  flushLocationToBackend: (next: MasterDraft) => Promise<void>;
  /** Только поля профиля (без адреса, расписания и услуг) — быстрее, чем полный flush. */
  patchProfileToBackend: (patch: MasterProfilePatch) => Promise<void>;
  /** Перечитать черновик с сервера без «полной загрузки» (без блокирующего cabinetLoading). */
  refreshDraft: () => Promise<void>;
  appointments: DemoMasterAppointment[];
  persistAppointments: (rows: DemoMasterAppointment[]) => void | Promise<void>;
  cabinetLoading: boolean;
  cabinetError: string | null;
  /** Повторная загрузка кабинета с сервера (профиль, услуги, портфолио). */
  reloadCabinet: () => Promise<void>;
  useCabinetApi: boolean;
  subscription: MasterSubscriptionDto | null;
  refreshSubscription: () => Promise<void>;
  /** Обновить подписку из ответа API без повторного GET. */
  applySubscription: (sub: MasterSubscriptionDto) => void;
  publicationStatus: MasterPublicationStatus | null;
  setPublicationStatus: (status: MasterPublicationStatus) => void;
  /** Рейтинг и отзывы из API кабинета (без отдельного запроса). */
  cabinetProfileMeta: { rating: number; reviewsCount: number } | null;
  categoryChangePolicy: CategoryChangePolicyDto | null;
};

const AdminCabinetCtx = createContext<Ctx | null>(null);

const SYNC_MS = 700;

function servicesSignature(services: MasterDraft['services']): string {
  return JSON.stringify(
    services.map((s) => ({
      id: s.id,
      title: s.title,
      durationMin: s.durationMin,
      priceByn: s.priceByn,
      description: s.description,
      priceType: s.priceType,
      isActive: s.isActive,
      sortOrder: s.sortOrder,
    })),
  );
}

function cloneDraft(d: MasterDraft): MasterDraft {
  return JSON.parse(JSON.stringify(d)) as MasterDraft;
}

const MASTER_CABINET_UNAVAILABLE_MSG =
  'Кабинет мастера недоступен. У этого аккаунта ещё нет мастерского профиля.';

export function AdminMasterCabinetProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading: authLoading } = useAuth();
  const hasApi = Boolean(getApiBaseUrl());
  const useCabinetApi = Boolean(hasApi && hasMasterCabinetAccess(profile));
  const masterId = profile?.id ?? null;

  const sessionCache = masterId ? readAdminCabinetSessionCache(masterId) : null;

  const [draft, setDraft] = useState<MasterDraft>(() => {
    if (sessionCache?.draft) return cloneDraft(sessionCache.draft);
    const mid = profile?.id;
    const apiMode = Boolean(hasApi && hasMasterCabinetAccess(profile));
    if (apiMode && mid) return pendingCabinetDraft(mid);
    return getMasterDraft();
  });
  const [appointments, setAppointments] = useState<DemoMasterAppointment[]>(
    () => sessionCache?.appointments ?? ensureDemoAppointmentsSeeded(),
  );
  const [cabinetLoading, setCabinetLoading] = useState(
    () => useCabinetApi && !sessionCache,
  );
  const [cabinetError, setCabinetError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<MasterSubscriptionDto | null>(
    () => sessionCache?.subscription ?? null,
  );
  const [publicationStatus, setPublicationStatus] = useState<MasterPublicationStatus | null>(
    () => sessionCache?.publicationStatus ?? null,
  );
  const [cabinetProfileMeta, setCabinetProfileMeta] = useState<{
    rating: number;
    reviewsCount: number;
  } | null>(() => sessionCache?.cabinetProfileMeta ?? null);
  const [categoryChangePolicy, setCategoryChangePolicy] = useState<CategoryChangePolicyDto | null>(null);

  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;

  const lastSyncedSnapshotRef = useRef<MasterDraft | null>(
    sessionCache ? cloneDraft(sessionCache.draft) : null,
  );
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cabinetReadyRef = useRef(Boolean(sessionCache));
  const prevMasterIdRef = useRef<string | null>(masterId);
  const subscriptionRef = useRef(subscription);
  subscriptionRef.current = subscription;

  const persistCabinetSession = useCallback(
    (
      mid: string,
      mapped: MasterDraft,
      rows: DemoMasterAppointment[],
      pub: MasterPublicationStatus | null,
      meta: { rating: number; reviewsCount: number } | null,
      sub: MasterSubscriptionDto | null,
    ) => {
      writeAdminCabinetSessionCache({
        masterId: mid,
        draft: mapped,
        appointments: rows,
        publicationStatus: pub,
        cabinetProfileMeta: meta,
        subscription: sub,
      });
      cabinetReadyRef.current = true;
    },
    [],
  );

  const loadFromApi = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!masterId) return;
      const silent = opts?.silent ?? cabinetReadyRef.current;
      if (!silent) setCabinetLoading(true);
      setCabinetError(null);
      try {
        const [cabinet, apptPage] = await Promise.all([
          fetchMasterCabinet(),
          fetchMasterAppointments({ tab: 'active', limit: 200, offset: 0 }),
        ]);
        const mapped = cabinetDtoToMasterDraft(cabinet);
        const pub = (cabinet.profile.publicationStatus as MasterPublicationStatus) || 'draft';
        const meta = {
          rating: cabinet.profile.rating,
          reviewsCount: cabinet.profile.reviewsCount,
        };
        const appts = apptPage.appointments.map(mapMasterAppointmentRowToDemo);
        let sub: MasterSubscriptionDto | null = null;
        try {
          sub = await getMySubscription();
        } catch {
          sub = null;
        }
        setDraft(mapped);
        setPublicationStatus(pub);
        setCabinetProfileMeta(meta);
        setCategoryChangePolicy(cabinet.categoryChangePolicy ?? null);
        lastSyncedSnapshotRef.current = cloneDraft(mapped);
        setAppointments(appts);
        setSubscription(sub);
        persistCabinetSession(masterId, mapped, appts, pub, meta, sub);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось загрузить кабинет';
        const notFound =
          /not found|не найден|404/i.test(msg) ||
          (e instanceof Error && /404/.test(e.message));
        if (notFound) {
          clearAdminCabinetSessionCache();
          clearOverviewBundleCache();
          cabinetReadyRef.current = false;
          lastSyncedSnapshotRef.current = null;
          setDraft(pendingCabinetDraft(masterId));
        }
        if (!silent || notFound) {
          setCabinetError(
            notFound
              ? 'Профиль мастера не найден для этого входа. Выйдите и войдите через Telegram или email, с которым регистрировались.'
              : msg,
          );
        }
      } finally {
        setCabinetLoading(false);
      }
    },
    [masterId, persistCabinetSession],
  );

  const reloadCabinetFromApiSilent = useCallback(async () => {
    if (!masterId) return;
    try {
      const [cabinet, apptPage] = await Promise.all([
        fetchMasterCabinet(),
        fetchMasterAppointments({ tab: 'active', limit: 200, offset: 0 }),
      ]);
      const mapped = cabinetDtoToMasterDraft(cabinet);
      try {
        setSubscription(await getMySubscription());
      } catch {
        /* keep previous subscription */
      }
      const pub = (cabinet.profile.publicationStatus as MasterPublicationStatus) || 'draft';
      const meta = {
        rating: cabinet.profile.rating,
        reviewsCount: cabinet.profile.reviewsCount,
      };
      const appts = apptPage.appointments.map(mapMasterAppointmentRowToDemo);
      setPublicationStatus(pub);
      setCabinetProfileMeta(meta);
      setDraft((prev) => {
        const coverId = prev.portfolioCoverId?.trim();
        const keepCover =
          coverId && mapped.portfolio?.some((p) => p.id === coverId) ? coverId : undefined;
        const next = keepCover ? { ...mapped, portfolioCoverId: keepCover } : mapped;
        lastSyncedSnapshotRef.current = cloneDraft(next);
        persistCabinetSession(masterId, next, appts, pub, meta, subscriptionRef.current);
        return next;
      });
      setAppointments(appts);
    } catch {
      /* ignore */
    }
  }, [masterId, persistCabinetSession]);

  useEffect(() => {
    if (!useCabinetApi) {
      clearAdminCabinetSessionCache();
      clearOverviewBundleCache();
      cabinetReadyRef.current = false;
      setCabinetLoading(false);
      setSubscription(null);
      setPublicationStatus('draft');
      setCabinetProfileMeta(null);
      lastSyncedSnapshotRef.current = null;

      if (hasApi && profile) {
        setCabinetError(MASTER_CABINET_UNAVAILABLE_MSG);
        setDraft(pendingCabinetDraft(profile.id));
        setAppointments([]);
        return undefined;
      }

      if (!isDevDemoAllowed() || isProductionApiMisconfigured()) {
        setCabinetError(
          'Кабинет мастера недоступен: не задан VITE_API_URL. Настройте API для production.',
        );
        setDraft(pendingCabinetDraft(profile?.id ?? 'unknown'));
        setAppointments([]);
        return undefined;
      }

      if (!getStoredMasterDraft()) {
        persistMasterDraft(getMasterDraft());
        setDraft(getMasterDraft());
      } else {
        setDraft(getMasterDraft());
      }
      setAppointments(ensureDemoAppointmentsSeeded());
      setCabinetError(null);
      return undefined;
    }

    if (authLoading || !masterId) return undefined;

    if (prevMasterIdRef.current && prevMasterIdRef.current !== masterId) {
      clearAdminCabinetSessionCache();
      clearOverviewBundleCache();
      cabinetReadyRef.current = false;
    }
    prevMasterIdRef.current = masterId;

    const cached = readAdminCabinetSessionCache(masterId);
    if (cached && isPlaceholderCabinetDraft(cached.draft)) {
      clearAdminCabinetSessionCache();
    }
    const cachedUsable =
      cached && !isPlaceholderCabinetDraft(cached.draft) ? cached : null;
    if (cachedUsable) {
      cabinetReadyRef.current = true;
      setDraft(cachedUsable.draft);
      setAppointments(cachedUsable.appointments);
      setPublicationStatus(cachedUsable.publicationStatus);
      setCabinetProfileMeta(cachedUsable.cabinetProfileMeta);
      setSubscription(cachedUsable.subscription);
      lastSyncedSnapshotRef.current = cloneDraft(cachedUsable.draft);
      setCabinetLoading(false);
      void loadFromApi({ silent: true });
    } else {
      void loadFromApi({ silent: false });
    }

    const onVis = () => {
      if (document.visibilityState === 'visible') void reloadCabinetFromApiSilent();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [useCabinetApi, authLoading, hasApi, profile, loadFromApi, masterId, reloadCabinetFromApiSilent]);

  const pushDraftToBackend = useCallback(async (next: MasterDraft) => {
    if (isPlaceholderCabinetDraft(next)) {
      return;
    }

    const contacts = next.contacts?.filter((row) => row.value.trim()) ?? [];
    const contactLine =
      contacts.length > 0
        ? contactsToLegacyContactLine(contacts) ?? ''
        : (next.contact ?? '').trim();

    const patchBody: Parameters<typeof patchMasterMe>[0] = {
      displayName: next.name.trim() || 'Мастер',
      bio: next.description,
    };
    if (next.phone?.trim()) patchBody.phone = next.phone.trim();
    if (next.photoUrl?.trim()) patchBody.photoUrl = next.photoUrl.trim();
    if (contacts.length) {
      patchBody.contacts = contacts.map((row) => ({ type: row.type, value: row.value.trim() }));
    }
    if (contactLine) patchBody.contact = contactLine;

    await patchMasterMe(patchBody);
    await putMasterPrimaryLocation(draftToPrimaryLocationBody(next.location));
    const rules = draftScheduleToApiRules(next.schedule);
    if (rules.length) {
      await putMasterScheduleRules(rules);
    }

    const prev = lastSyncedSnapshotRef.current;
    if (!prev) {
      lastSyncedSnapshotRef.current = cloneDraft(next);
      return;
    }

    const catId = next.primaryCategoryId;
    const prevSig = servicesSignature(prev.services);
    const nextSig = servicesSignature(next.services);
    if (prevSig === nextSig) {
      lastSyncedSnapshotRef.current = cloneDraft(next);
      return;
    }

    const prevById = new Map(prev.services.map((s) => [s.id, s]));
    const nextIds = new Set(next.services.map((s) => s.id));

    for (const sid of prevById.keys()) {
      if (!isUuid(sid)) continue;
      if (!nextIds.has(sid)) {
        await deleteMasterService(sid);
      }
    }

    let working = next;

    for (const s of working.services) {
      if (isUuid(s.id)) {
        const prevSvc = prevById.get(s.id);
        if (!prevSvc) continue;
        const patchBody: Parameters<typeof patchMasterService>[1] = {};
        if (prevSvc.title !== s.title) patchBody.title = s.title;
        if ((prevSvc.description || '') !== (s.description || '')) patchBody.description = s.description ?? '';
        if (prevSvc.durationMin !== s.durationMin) patchBody.durationMinutes = s.durationMin;
        if (prevSvc.priceByn !== s.priceByn) patchBody.priceAmount = s.priceByn;
        if ((prevSvc.priceType || 'fixed') !== (s.priceType || 'fixed')) patchBody.priceType = s.priceType === 'from' ? 'from' : 'fixed';
        if ((prevSvc.sortOrder ?? 0) !== (s.sortOrder ?? 0)) patchBody.sortOrder = s.sortOrder ?? 0;
        if ((prevSvc.isActive ?? true) !== (s.isActive ?? true)) patchBody.isActive = s.isActive ?? true;
        if (Object.keys(patchBody).length) {
          await patchMasterService(s.id, patchBody);
        }
      }
    }

    const replacements: { oldId: string; newId: string }[] = [];
    for (const s of working.services) {
      if (isUuid(s.id)) continue;
      if (!catId) continue;
      const created = await postMasterService({
        categoryId: catId,
        title: s.title,
        description: s.description ?? '',
        durationMinutes: s.durationMin,
        priceAmount: s.priceByn,
        priceType: s.priceType === 'from' ? 'from' : 'fixed',
        sortOrder: s.sortOrder ?? 0,
      });
      replacements.push({ oldId: s.id, newId: created.id });
    }

    if (replacements.length) {
      working = {
        ...working,
        services: working.services.map((s) => {
          const r = replacements.find((x) => x.oldId === s.id);
          if (!r) return s;
          return {
            ...s,
            id: r.newId,
            durationMin: s.durationMin,
            priceByn: s.priceByn,
          };
        }),
      };
      setDraft(working);
    }

    lastSyncedSnapshotRef.current = cloneDraft(working);
    try {
      setSubscription(await getMySubscription());
    } catch {
      /* keep previous */
    }
  }, []);

  const flushDraftToBackend = useCallback(
    async (next: MasterDraft) => {
      if (!useCabinetApi) {
        persistMasterDraft(next);
        setDraft(getMasterDraft());
        return;
      }
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      setDraft(next);
      try {
        await pushDraftToBackend(next);
        setCabinetError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
        setCabinetError(msg);
        await reloadCabinetFromApiSilent();
        throw e;
      }
    },
    [useCabinetApi, pushDraftToBackend, reloadCabinetFromApiSilent],
  );

  const flushScheduleToBackend = useCallback(
    async (next: MasterDraft) => {
      if (!useCabinetApi) {
        persistMasterDraft(next);
        setDraft(getMasterDraft());
        return;
      }
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      setDraft(next);
      try {
        const rules = draftScheduleToApiRules(next.schedule);
        if (!rules.length) {
          throw new Error('Добавьте хотя бы одно окно расписания');
        }
        await putMasterScheduleRules(rules);
        const prevSnap = lastSyncedSnapshotRef.current;
        lastSyncedSnapshotRef.current = cloneDraft(
          prevSnap ? { ...prevSnap, schedule: next.schedule } : next,
        );
        setCabinetError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
        setCabinetError(msg);
        await reloadCabinetFromApiSilent();
        throw e;
      }
    },
    [useCabinetApi, reloadCabinetFromApiSilent],
  );

  const flushLocationToBackend = useCallback(
    async (next: MasterDraft) => {
      if (!useCabinetApi) {
        persistMasterDraft(next);
        setDraft(getMasterDraft());
        return;
      }
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      setDraft(next);
      try {
        await putMasterPrimaryLocation(draftToPrimaryLocationBody(next.location));
        if (lastSyncedSnapshotRef.current) {
          lastSyncedSnapshotRef.current = cloneDraft({
            ...lastSyncedSnapshotRef.current,
            location: next.location,
          });
        }
        setCabinetError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
        setCabinetError(msg);
        await reloadCabinetFromApiSilent();
        throw e;
      }
    },
    [useCabinetApi, reloadCabinetFromApiSilent],
  );

  const patchProfileToBackend = useCallback(
    async (patch: MasterProfilePatch) => {
      const contacts = patch.contacts;
      const contactLine =
        contacts && contacts.length > 0
          ? contactsToLegacyContactLine(contacts) ?? ''
          : (patch.contact ?? draft.contact).trim();

      const next: MasterDraft = {
        ...draft,
        ...patch,
        contact: contactLine,
        contacts: contacts ?? patch.contacts,
      };

      if (!useCabinetApi) {
        persistMasterDraft(next);
        setDraft(getMasterDraft());
        return;
      }

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }

      setDraft(next);
      try {
        const apiBody: Parameters<typeof patchMasterMe>[0] = {
          displayName: next.name.trim() || 'Мастер',
          bio: next.description,
        };
        if (patch.phone !== undefined) {
          apiBody.phone = next.phone?.trim() ? next.phone.trim() : null;
        }
        if (patch.photoUrl !== undefined) {
          apiBody.photoUrl = next.photoUrl?.trim() ? next.photoUrl.trim() : null;
        }
        if (patch.contacts !== undefined) {
          apiBody.contacts = contacts?.length ? contacts : null;
          apiBody.contact = contactLine.trim() ? contactLine.trim() : null;
        } else if (patch.contact !== undefined) {
          apiBody.contact = contactLine.trim() ? contactLine.trim() : null;
        }
        if (patch.primaryCategoryCode !== undefined) {
          apiBody.primaryCategoryCode = patch.primaryCategoryCode;
        }
        await patchMasterMe(apiBody);
        if (lastSyncedSnapshotRef.current) {
          lastSyncedSnapshotRef.current = cloneDraft({
            ...lastSyncedSnapshotRef.current,
            name: next.name,
            description: next.description,
            phone: next.phone,
            contact: next.contact,
            photoUrl: next.photoUrl,
            contacts: next.contacts,
            category: next.category,
            primaryCategoryId: next.primaryCategoryId,
            primaryCategoryCode: next.primaryCategoryCode,
          });
        }
        setCabinetError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
        setCabinetError(msg);
        await reloadCabinetFromApiSilent();
        throw e;
      }
    },
    [draft, reloadCabinetFromApiSilent, useCabinetApi],
  );

  const reloadCabinet = useCallback(async () => {
    await loadFromApi({ silent: false });
  }, [loadFromApi]);

  const scheduleSync = useCallback(
    (syncDraft: MasterDraft) => {
      if (!useCabinetApi || !cabinetReadyRef.current) return;
      if (isPlaceholderCabinetDraft(syncDraft)) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        syncTimer.current = null;
        void pushDraftToBackend(syncDraft).catch((e) => {
          console.warn('[SLOTTY] cabinet sync failed', e);
          setCabinetError(e instanceof Error ? e.message : 'Ошибка сохранения');
        });
      }, SYNC_MS);
    },
    [useCabinetApi, pushDraftToBackend],
  );

  const commitDraftBaseline = useCallback((next: MasterDraft) => {
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
    setDraft(next);
    lastSyncedSnapshotRef.current = cloneDraft(next);
  }, []);

  const persistDraft = useCallback(
    (next: MasterDraft) => {
      if (useCabinetApi) {
        setDraft(next);
        scheduleSync(next);
        return;
      }
      persistMasterDraft(next);
      const stored = getMasterDraft();
      setDraft(stored);
      scheduleSync(stored);
    },
    [scheduleSync, useCabinetApi],
  );

  const refreshSubscription = useCallback(async () => {
    if (!useCabinetApi) return;
    try {
      setSubscription(await getMySubscription());
    } catch {
      /* keep previous */
    }
  }, [useCabinetApi]);

  const applySubscription = useCallback(
    (sub: MasterSubscriptionDto) => {
      setSubscription(sub);
      if (!masterId) return;
      const cached = readAdminCabinetSessionCache(masterId);
      if (!cached) return;
      writeAdminCabinetSessionCache({ ...cached, subscription: sub });
    },
    [masterId],
  );

  const refreshDraft = useCallback(async () => {
    if (useCabinetApi) {
      await reloadCabinetFromApiSilent();
      return;
    }
    setDraft(getMasterDraft());
  }, [useCabinetApi, reloadCabinetFromApiSilent]);

  useEffect(() => {
    if (useCabinetApi) return undefined;
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshDraft();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [useCabinetApi, refreshDraft]);

  const persistAppointments = useCallback(
    async (rows: DemoMasterAppointment[], options?: { cancelReason?: string }) => {
      if (!useCabinetApi) {
        saveDemoAppointments(rows);
        setAppointments(rows);
        return;
      }

      const prev = appointmentsRef.current;
      const prevById = new Map(prev.map((a) => [a.id, a]));

      const calls: Promise<void>[] = [];
      for (const row of rows) {
        if (!isUuid(row.id)) continue;
        const before = prevById.get(row.id);
        if (!before || before.status === row.status) continue;
        if (before.status === 'pending' && row.status === 'confirmed') {
          calls.push(patchMasterAppointmentConfirm(row.id));
        } else if (
          (before.status === 'confirmed' || before.status === 'client_arrived') &&
          row.status === 'in_progress'
        ) {
          calls.push(patchMasterAppointmentStart(row.id));
        } else if (
          before.status === 'in_progress' &&
          row.status === 'completed'
        ) {
          calls.push(patchMasterAppointmentComplete(row.id));
        } else if (
          (before.status === 'confirmed' ||
            before.status === 'client_arrived' ||
            before.status === 'in_progress' ||
            before.status === 'master_marked_completed') &&
          row.status === 'completed' &&
          before.status !== 'in_progress'
        ) {
          calls.push(patchMasterAppointmentClose(row.id));
        } else if (
          (before.status === 'pending' ||
            before.status === 'confirmed' ||
            before.status === 'client_arrived' ||
            before.status === 'in_progress') &&
          row.status === 'cancelled'
        ) {
          calls.push(
            patchMasterAppointmentCancel(
              row.id,
              options?.cancelReason?.trim() || 'Отменено мастером',
            ),
          );
        }
      }

      if (calls.length) {
        setAppointments((prev) =>
          prev.map((a) => {
            const row = rows.find((r) => r.id === a.id);
            return row && row.status !== a.status ? row : a;
          }),
        );
      }

      if (!calls.length) return;

      try {
        await Promise.all(calls);
        setCabinetError(null);
        afterBookingMutation();
        void getMySubscription()
          .then(setSubscription)
          .catch(() => {
            /* keep previous */
          });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось обновить запись';
        setCabinetError(msg);
        setAppointments(prev);
        throw e;
      }
    },
    [useCabinetApi],
  );

  const value = useMemo<Ctx>(
    () => ({
      draft,
      persistDraft,
      commitDraftBaseline,
      flushDraftToBackend,
      flushScheduleToBackend,
      flushLocationToBackend,
      patchProfileToBackend,
      refreshDraft,
      appointments,
      persistAppointments,
      cabinetLoading,
      cabinetError,
      reloadCabinet,
      useCabinetApi,
      subscription,
      refreshSubscription,
      applySubscription,
      publicationStatus,
      setPublicationStatus,
      cabinetProfileMeta,
      categoryChangePolicy,
    }),
    [
      draft,
      persistDraft,
      commitDraftBaseline,
      flushDraftToBackend,
      flushScheduleToBackend,
      flushLocationToBackend,
      patchProfileToBackend,
      refreshDraft,
      appointments,
      persistAppointments,
      cabinetLoading,
      cabinetError,
      reloadCabinet,
      useCabinetApi,
      subscription,
      refreshSubscription,
      applySubscription,
      publicationStatus,
      cabinetProfileMeta,
      categoryChangePolicy,
    ],
  );

  return <AdminCabinetCtx.Provider value={value}>{children}</AdminCabinetCtx.Provider>;
}

export function useAdminMasterCabinet(): Ctx {
  const ctx = useContext(AdminCabinetCtx);
  if (!ctx) {
    throw new Error('useAdminMasterCabinet must be used within AdminMasterCabinetProvider');
  }
  return ctx;
}
