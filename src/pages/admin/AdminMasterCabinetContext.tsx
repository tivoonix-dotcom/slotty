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
import { getApiBaseUrl } from '../../shared/api/backendClient';
import {
  deleteMasterService,
  fetchMasterAppointments,
  fetchMasterCabinet,
  patchMasterAppointmentCancel,
  patchMasterAppointmentComplete,
  patchMasterAppointmentConfirm,
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
import {
  ensureDemoAppointmentsSeeded,
  saveDemoAppointments,
  type DemoMasterAppointment,
} from '../../features/master/model/demoMasterAppointments';
import { getMasterDraft, persistMasterDraft } from '../../features/master/model/masterDraftStorage';
import { getStoredMasterDraft } from '../../features/profile/lib/demoMasterStorage';
import type { MasterDraft } from '../../features/profile/lib/demoMasterStorage';

type Ctx = {
  draft: MasterDraft;
  persistDraft: (next: MasterDraft) => void;
  /** В API-режиме: сохранить черновик на сервер и дождаться ответа (без debounce). При ошибке — откат draft с сервера, проброс исключения. */
  flushDraftToBackend: (next: MasterDraft) => Promise<void>;
  refreshDraft: () => void;
  appointments: DemoMasterAppointment[];
  persistAppointments: (rows: DemoMasterAppointment[]) => void | Promise<void>;
  cabinetLoading: boolean;
  cabinetError: string | null;
  useCabinetApi: boolean;
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

export function AdminMasterCabinetProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading: authLoading } = useAuth();
  const useCabinetApi = Boolean(getApiBaseUrl() && profile?.role === 'master');

  const [draft, setDraft] = useState<MasterDraft>(() => getMasterDraft());
  const [appointments, setAppointments] = useState<DemoMasterAppointment[]>(() => ensureDemoAppointmentsSeeded());
  const [cabinetLoading, setCabinetLoading] = useState(useCabinetApi);
  const [cabinetError, setCabinetError] = useState<string | null>(null);

  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;

  const lastSyncedSnapshotRef = useRef<MasterDraft | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFromApi = useCallback(async () => {
    setCabinetLoading(true);
    setCabinetError(null);
    try {
      const [cabinet, rows] = await Promise.all([fetchMasterCabinet(), fetchMasterAppointments()]);
      const mapped = cabinetDtoToMasterDraft(cabinet);
      setDraft(mapped);
      lastSyncedSnapshotRef.current = cloneDraft(mapped);
      setAppointments(rows.map(mapMasterAppointmentRowToDemo));
    } catch (e) {
      setCabinetError(e instanceof Error ? e.message : 'Не удалось загрузить кабинет');
    } finally {
      setCabinetLoading(false);
    }
  }, []);

  const reloadCabinetFromApiSilent = useCallback(async () => {
    try {
      const [cabinet, rows] = await Promise.all([fetchMasterCabinet(), fetchMasterAppointments()]);
      const mapped = cabinetDtoToMasterDraft(cabinet);
      setDraft(mapped);
      lastSyncedSnapshotRef.current = cloneDraft(mapped);
      setAppointments(rows.map(mapMasterAppointmentRowToDemo));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!useCabinetApi) {
      setCabinetLoading(false);
      if (!getStoredMasterDraft()) {
        persistMasterDraft(getMasterDraft());
        setDraft(getMasterDraft());
      } else {
        setDraft(getMasterDraft());
      }
      setAppointments(ensureDemoAppointmentsSeeded());
      lastSyncedSnapshotRef.current = null;
      return undefined;
    }

    if (authLoading) return undefined;

    void loadFromApi();

    const onVis = () => {
      if (document.visibilityState === 'visible') void loadFromApi();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [useCabinetApi, authLoading, loadFromApi]);

  const pushDraftToBackend = useCallback(async (next: MasterDraft) => {
    await patchMasterMe({
      displayName: next.name.trim() || 'Мастер',
      bio: next.description,
      phone: next.phone?.trim() ? next.phone.trim() : null,
      contact: next.contact?.trim() ? next.contact.trim() : null,
      photoUrl: next.photoUrl?.trim() ? next.photoUrl.trim() : null,
    });
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

  const scheduleSync = useCallback(
    (syncDraft: MasterDraft) => {
      if (!useCabinetApi) return;
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

  const refreshDraft = useCallback(() => {
    if (useCabinetApi) void loadFromApi();
    else setDraft(getMasterDraft());
  }, [useCabinetApi, loadFromApi]);

  useEffect(() => {
    if (useCabinetApi) return undefined;
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshDraft();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [useCabinetApi, refreshDraft]);

  const persistAppointments = useCallback(
    async (rows: DemoMasterAppointment[]) => {
      if (!useCabinetApi) {
        saveDemoAppointments(rows);
        setAppointments(rows);
        return;
      }

      const prev = appointmentsRef.current;
      const prevById = new Map(prev.map((a) => [a.id, a]));

      const calls: Promise<void>[] = [];
      for (const row of rows) {
        const before = prevById.get(row.id);
        if (!before || before.status === row.status) continue;
        if (before.status === 'pending' && row.status === 'confirmed') {
          calls.push(patchMasterAppointmentConfirm(row.id));
        } else if (before.status === 'confirmed' && row.status === 'completed') {
          calls.push(patchMasterAppointmentComplete(row.id));
        } else if (
          (before.status === 'pending' || before.status === 'confirmed') &&
          row.status === 'cancelled'
        ) {
          calls.push(patchMasterAppointmentCancel(row.id));
        }
      }

      setAppointments(rows);
      if (!calls.length) return;

      try {
        await Promise.all(calls);
        const fresh = await fetchMasterAppointments();
        setAppointments(fresh.map(mapMasterAppointmentRowToDemo));
        setCabinetError(null);
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
      flushDraftToBackend,
      refreshDraft,
      appointments,
      persistAppointments,
      cabinetLoading,
      cabinetError,
      useCabinetApi,
    }),
    [
      draft,
      persistDraft,
      flushDraftToBackend,
      refreshDraft,
      appointments,
      persistAppointments,
      cabinetLoading,
      cabinetError,
      useCabinetApi,
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
