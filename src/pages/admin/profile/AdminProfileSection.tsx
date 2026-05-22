import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_SCHEDULE_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterCareerItemType, MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { normalizeMasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminCabinetStatusBanner } from '../AdminLayout';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { AdminNotificationsBanner } from '../notifications/AdminNotificationsBanner';
import { useAdminMasterDraft } from '../useAdminMasterData';
import {
  deleteCareerItem,
  deleteCertificate,
  deletePortfolioItem,
  syncCareerItems,
  syncCertificates,
  syncPortfolioItems,
  updateMyBookingRules,
} from '../../../features/admin/api/adminProfileApi';
import {
  uploadMasterCertificateImageFile,
  uploadMasterHeroPhotoFromDataUrl,
  uploadMasterPortfolioImageFile,
} from '../../../features/admin/api/masterCabinetApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { sanitizePaymentNoteForSave } from '../../../features/admin/lib/paymentNoteCodec';
import {
  SheetAddress,
  SheetCertificate,
  SheetDeleteConfirm,
  SheetFooter,
  SheetMainInfo,
  SheetPortfolio,
  SheetSchedule,
} from './AdminProfileEditSheets';
import { RulesSection, SheetRules } from './AdminProfileRulesUi';
import { useSingleFlight } from '../shared/useSingleFlight';
import { AddressSection } from './AdminProfileAddressUi';
import { MasterBookingLinkCard } from './MasterBookingLinkCard';
import { TrustSection } from './AdminProfilePortfolioUi';
import {
  sheetChipClass,
  sheetFieldClass,
  sheetLabelClass,
} from './adminProfileCabinetTheme';
import {
  AboutCard,
  AdminProfileHero as CabinetProfileHero,
  buildProfileStats,
  CabinetPageShell,
  MainInfoCard,
  ScheduleWorkCard,
} from './AdminProfileCabinetUi';
import { ProfileCompletionBlock } from './ProfileCompletionBlock';
import { ProfileSectionTabs } from './ProfileSectionTabs';
import { useProfileTabs } from './profileTabContext';
import { AdminProfileDesktopShell } from './AdminProfileDesktopView';

type CareerItemType = MasterCareerItemType;

type MasterCareerItem = {
  id: string;
  type: CareerItemType;
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

type ProfileSheet =
  | null
  | 'main'
  | 'address'
  | 'schedule'
  | 'rules'
  | { k: 'career'; id?: string }
  | { k: 'del-career'; id: string }
  | { k: 'cert'; id?: string }
  | { k: 'portfolio'; id?: string }
  | { k: 'del-cert'; id: string }
  | { k: 'del-portfolio'; id: string };

const CAREER_TYPES: Array<{ value: CareerItemType; label: string }> = [
  { value: 'education', label: 'Образование' },
  { value: 'course', label: 'Курс' },
  { value: 'practice', label: 'Практика' },
  { value: 'work', label: 'Работа' },
];

function newEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeCareerType(raw: string | CareerItemType | undefined): CareerItemType {
  return normalizeMasterCareerItemType(raw);
}

function normalizeCareerItems(draft: MasterDraft): MasterCareerItem[] {
  if (draft.careerItems?.length) {
    return draft.careerItems.map((item) => ({
      ...item,
      type: normalizeCareerType(item.type),
    }));
  }

  if (draft.experience?.trim()) {
    return [
      {
        id: 'legacy-experience',
        type: 'work',
        title: 'Опыт работы',
        place: '',
        description: draft.experience.trim(),
      },
    ];
  }

  return [];
}

function certificatesNonHttpsError(certificates: { imageUrl?: string }[]): string | null {
  for (const c of certificates) {
    const u = c.imageUrl?.trim();
    if (u && !u.startsWith('https://')) {
      return 'Для опубликованного профиля укажите ссылку на изображение (https://…). Загрузка файла в облако — позже.';
    }
  }
  return null;
}

function portfolioHttpsError(portfolio: { imageUrl?: string }[]): string | null {
  for (const p of portfolio) {
    const u = p.imageUrl?.trim() ?? '';
    if (!u) return 'Укажите ссылку на изображение (https://…).';
    if (!u.startsWith('https://')) {
      return 'Для опубликованного профиля укажите ссылку на изображение (https://…). Загрузка файла в облако — позже.';
    }
  }
  return null;
}

function MainSection({
  draft,
  onEditMain,
  onEditSchedule,
  onGoServices,
  cabinetLoading,
  useCabinetApi,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
  onEditSchedule: () => void;
  onGoServices: () => void;
  cabinetLoading?: boolean;
  useCabinetApi?: boolean;
}) {
  const navigate = useNavigate();
  const { setActiveSection } = useProfileTabs();

  return (
    <div className="space-y-4">
      <MasterBookingLinkCard draft={draft} cabinetLoading={cabinetLoading} useCabinetApi={useCabinetApi} />
      <MainInfoCard draft={draft} onEdit={onEditMain} />
      <AboutCard description={draft.description} />
      <ScheduleWorkCard draft={draft} onEditSchedule={onEditSchedule} />
      <ProfileCompletionBlock
        draft={draft}
        handlers={{
          onEditMain,
          onGoServices,
          onGoSchedule: () => navigate(ADMIN_SCHEDULE_PATH),
          onGoAddress: () => setActiveSection('address'),
          onGoPortfolio: () => setActiveSection('portfolio'),
          onGoRules: () => setActiveSection('rules'),
        }}
      />
    </div>
  );
}

function CareerSheet({
  draft,
  itemId,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  itemId: string | null;
  onSave: (items: MasterCareerItem[]) => void | Promise<void>;
  onCancel: () => void;
}) {
  const careerItems = normalizeCareerItems(draft).filter((item) => item.id !== 'legacy-experience');
  const editing = careerItems.find((item) => item.id === itemId);

  const [type, setType] = useState<CareerItemType>(() => normalizeCareerType(editing?.type));
  const [title, setTitle] = useState(editing?.title ?? '');
  const [place, setPlace] = useState(editing?.place ?? '');
  const [startYear, setStartYear] = useState(editing?.startYear ?? '');
  const [endYear, setEndYear] = useState(editing?.endYear ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(() => {
    const cleanTitle = title.trim();
    const cleanPlace = place.trim();

    if (!cleanTitle) {
      setError('Укажите название.');
      return;
    }

    if (!cleanPlace) {
      setError('Укажите место, организацию или салон.');
      return;
    }

    const row: MasterCareerItem = {
      id: editing?.id ?? newEntityId('career'),
      type,
      title: cleanTitle,
      place: cleanPlace,
      startYear: startYear.trim() || undefined,
      endYear: endYear.trim() || undefined,
      description: description.trim() || undefined,
    };

    const next = editing
      ? careerItems.map((item) => (item.id === editing.id ? row : item))
      : [...careerItems, row];

    return onSave(next);
  }, [careerItems, description, editing, endYear, onSave, place, startYear, title, type]);

  return (
    <div className="space-y-4 pb-2">
      <div>
        <p className={sheetLabelClass}>Тип</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {CAREER_TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={sheetChipClass(type === item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className={sheetLabelClass}>Название *</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например: Минский колледж сферы обслуживания"
          className={sheetFieldClass}
        />
      </label>

      <label className="block">
        <span className={sheetLabelClass}>Место / организация *</span>
        <input
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Колледж, школа, салон или студия"
          className={sheetFieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={sheetLabelClass}>С</span>
          <input
            value={startYear}
            onChange={(event) => setStartYear(event.target.value)}
            placeholder="2022"
            inputMode="numeric"
            className={sheetFieldClass}
          />
        </label>

        <label className="block">
          <span className={sheetLabelClass}>По</span>
          <input
            value={endYear}
            onChange={(event) => setEndYear(event.target.value)}
            placeholder="2025 / сейчас"
            className={sheetFieldClass}
          />
        </label>
      </div>

      <label className="block">
        <span className={sheetLabelClass}>Описание</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Коротко: специальность, практика, обязанности или чему научились"
          rows={3}
          className={`${sheetFieldClass} resize-none leading-relaxed`}
        />
      </label>

      {error ? (
        <p className="rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
          {error}
        </p>
      ) : null}

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

function AdminProfileReadView({
  draft,
  onEditMain,
  onEditSchedule,
  onEditAddress,
  onEditRules,
  onAddCareer,
  onEditCareer,
  onDeleteCareer,
  onAddCert,
  onEditCert,
  onDeleteCert,
  onAddPortfolio,
  onEditPortfolio,
  onDeletePortfolio,
  onSetPortfolioCover,
  actionsDisabled = false,
  cabinetLoading,
  useCabinetApi,
  appointments,
  onGoServices,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
  onEditSchedule: () => void;
  appointments: DemoMasterAppointment[];
  onGoServices: () => void;
  cabinetLoading?: boolean;
  useCabinetApi?: boolean;
  onEditAddress: () => void;
  onEditRules: () => void;
  onAddCareer: () => void;
  onEditCareer: (id: string) => void;
  onDeleteCareer: (id: string) => void;
  onAddCert: () => void;
  onEditCert: (id: string) => void;
  onDeleteCert: (id: string) => void;
  onAddPortfolio: () => void;
  onEditPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
  onSetPortfolioCover: (portfolioItemId: string) => void;
  actionsDisabled?: boolean;
}) {
  const navigate = useNavigate();
  const { activeSection, setActiveSection } = useProfileTabs();
  const { cabinetProfileMeta } = useAdminMasterCabinet();
  const stats = useMemo(
    () =>
      buildProfileStats(appointments, cabinetProfileMeta ?? undefined),
    [appointments, cabinetProfileMeta],
  );
  const ratingMeta = cabinetProfileMeta ?? undefined;

  const section = useMemo(() => {
    if (activeSection === 'address') {
      return <AddressSection draft={draft} onEditAddress={onEditAddress} />;
    }
    if (activeSection === 'portfolio') {
      return (
        <TrustSection
          draft={draft}
          onAddCareer={onAddCareer}
          onEditCareer={onEditCareer}
          onDeleteCareer={onDeleteCareer}
          onAddCert={onAddCert}
          onEditCert={onEditCert}
          onDeleteCert={onDeleteCert}
          onAddPortfolio={onAddPortfolio}
          onEditPortfolio={onEditPortfolio}
          onDeletePortfolio={onDeletePortfolio}
          onSetPortfolioCover={onSetPortfolioCover}
          actionsDisabled={actionsDisabled}
        />
      );
    }
    if (activeSection === 'rules') {
      return <RulesSection draft={draft} onEditRules={onEditRules} />;
    }
    return (
      <MainSection
        draft={draft}
        onEditMain={onEditMain}
        onEditSchedule={onEditSchedule}
        onGoServices={onGoServices}
        cabinetLoading={cabinetLoading}
        useCabinetApi={useCabinetApi}
      />
    );
  }, [
    activeSection,
    cabinetLoading,
    draft,
    onGoServices,
    onAddCareer,
    onAddCert,
    onAddPortfolio,
    onDeleteCareer,
    onDeleteCert,
    onDeletePortfolio,
    onEditAddress,
    onEditCareer,
    onEditCert,
    onEditMain,
    onEditSchedule,
    useCabinetApi,
    onEditPortfolio,
    onEditRules,
    onSetPortfolioCover,
    actionsDisabled,
  ]);

  return (
    <>
      <div className="lg:hidden">
        <CabinetProfileHero
          draft={draft}
          stats={stats}
          bottomSlot={
            <ProfileSectionTabs active={activeSection} onChange={setActiveSection} />
          }
        />
        <AdminCabinetStatusBanner />
        <div className="space-y-4 px-4 pt-4">{section}</div>
      </div>

      <AdminProfileDesktopShell
        draft={draft}
        appointments={appointments}
        ratingMeta={ratingMeta}
        onEditMain={onEditMain}
        section={activeSection === 'main' ? null : section}
        completionHandlers={{
          onEditMain,
          onGoServices,
          onGoSchedule: () => navigate(ADMIN_SCHEDULE_PATH),
          onGoAddress: () => setActiveSection('address'),
          onGoPortfolio: () => setActiveSection('portfolio'),
          onGoRules: () => setActiveSection('rules'),
        }}
      />
      <div className="hidden lg:block">
        <AdminCabinetStatusBanner />
      </div>
    </>
  );
}

function sheetTitle(sheet: ProfileSheet): string | undefined {
  if (sheet == null) return undefined;
  if (sheet === 'main') return 'Основная информация';
  if (sheet === 'address') return 'Адрес';
  if (sheet === 'schedule') return 'График работы';
  if (sheet === 'rules') return 'Правила записи';
  if (typeof sheet === 'object' && sheet.k === 'career') return sheet.id ? 'Опыт и образование' : 'Новая запись';
  if (typeof sheet === 'object' && sheet.k === 'portfolio') return sheet.id ? 'Работа' : 'Новая работа';
  if (typeof sheet === 'object' && sheet.k === 'del-career') return 'Удалить запись?';
  if (typeof sheet === 'object' && sheet.k === 'cert') return sheet.id ? 'Сертификат' : 'Новый сертификат';
  if (typeof sheet === 'object' && sheet.k === 'del-cert') return 'Удалить сертификат?';
  if (typeof sheet === 'object' && sheet.k === 'del-portfolio') return 'Удалить работу?';
  return undefined;
}

export function AdminProfileSection() {
  const {
    draft,
    persistDraft,
    commitDraftBaseline,
    flushDraftToBackend,
    flushScheduleToBackend,
    patchProfileToBackend,
    refreshDraft,
  } = useAdminMasterDraft();
  const navigate = useNavigate();
  const { useCabinetApi, cabinetLoading, appointments } = useAdminMasterCabinet();
  const [sheet, setSheet] = useState<ProfileSheet>(null);
  const [sheetApiError, setSheetApiError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const showSaved = useCallback(() => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetApiError(null);
    setSheet(null);
  }, []);

  const { busy: sheetPersisting, run: runSheetPersist } = useSingleFlight();

  const openSheet = useCallback(
    (next: ProfileSheet, mode: 'add' | 'replace' = 'replace') => {
      if (cabinetLoading || sheetPersisting) return;
      if (mode === 'add') {
        setSheet((current) => current ?? next);
      } else {
        setSheet(next);
      }
    },
    [cabinetLoading, sheetPersisting],
  );

  const saveMain = useCallback(
    async (patch: Partial<MasterDraft>) => {
      await runSheetPersist(async () => {
      if (useCabinetApi) {
        const p = patch.photoUrl?.trim();
        if (p && !p.startsWith('https://') && !p.startsWith('data:image/')) {
          setSheetApiError('Загрузите фото с устройства или укажите ссылку https://…');
          return;
        }
      }
      setSheetApiError(null);
      const next: MasterDraft = { ...draft, ...patch };
      try {
        await patchProfileToBackend({
          name: next.name,
          description: next.description,
          phone: next.phone,
          contact: next.contact,
          contacts: next.contacts,
          photoUrl: next.photoUrl,
          category: next.category,
          primaryCategoryId: next.primaryCategoryId,
          primaryCategoryCode: next.primaryCategoryCode,
        });
        if (useCabinetApi) await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
      });
    },
    [closeSheet, draft, patchProfileToBackend, refreshDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const setPortfolioCover = useCallback(
    async (portfolioItemId: string) => {
      const id = portfolioItemId.trim();
      if (!id || !(draft.portfolio ?? []).some((p) => p.id === id)) return;
      await runSheetPersist(async () => {
        setSheetApiError(null);
        const next: MasterDraft = { ...draft, portfolioCoverId: id };
        try {
          if (useCabinetApi) {
            commitDraftBaseline(next);
          } else {
            persistDraft(next);
          }
          showSaved();
        } catch (e) {
          setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
        }
      });
    },
    [commitDraftBaseline, draft, persistDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const saveLocation = useCallback(
    async (location: MasterDraft['location']) => {
      await runSheetPersist(async () => {
        setSheetApiError(null);
        if (!useCabinetApi) {
          persistDraft({ ...draft, location });
          closeSheet();
          showSaved();
          return;
        }
        try {
          await flushDraftToBackend({ ...draft, location });
          closeSheet();
          showSaved();
        } catch (e) {
          setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
        }
      });
    },
    [closeSheet, draft, flushDraftToBackend, persistDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const saveSchedule = useCallback(
    async (schedule: MasterDraft['schedule']) => {
      await runSheetPersist(async () => {
        setSheetApiError(null);
        const next = { ...draft, schedule };
        if (!useCabinetApi) {
          persistDraft(next);
          closeSheet();
          showSaved();
          return;
        }
        try {
          await flushScheduleToBackend(next);
          closeSheet();
          showSaved();
        } catch (e) {
          setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
        }
      });
    },
    [closeSheet, draft, flushScheduleToBackend, persistDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const saveRules = useCallback(
    async (patch: Pick<MasterDraft, 'bookingRules' | 'cancellationPolicy' | 'paymentMethods' | 'paymentNote'>) => {
      await runSheetPersist(async () => {
        if (!useCabinetApi) {
          setSheetApiError(null);
          persistDraft({ ...draft, ...patch });
          closeSheet();
          showSaved();
          return;
        }
        setSheetApiError(null);
        try {
          await updateMyBookingRules({
            bookingRules: patch.bookingRules ?? null,
            cancellationPolicy: patch.cancellationPolicy ?? null,
            paymentNote: sanitizePaymentNoteForSave(patch.paymentNote),
            paymentMethods: patch.paymentMethods ?? [],
          });
          await refreshDraft();
          closeSheet();
          showSaved();
        } catch (e) {
          setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
        }
      });
    },
    [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const saveCareer = useCallback(
    async (careerItems: MasterCareerItem[]) => {
      await runSheetPersist(async () => {
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({
          ...draft,
          careerItems,
          experience: undefined,
        });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        const prev = normalizeCareerItems(draft).filter((item) => item.id !== 'legacy-experience');
        await syncCareerItems(prev, careerItems);
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
      });
    },
    [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const saveCertificates = useCallback(
    async (certificates: NonNullable<MasterDraft['certificates']>) => {
      await runSheetPersist(async () => {
      if (useCabinetApi) {
        const imgErr = certificatesNonHttpsError(certificates);
        if (imgErr) {
          setSheetApiError(imgErr);
          return;
        }
      }
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({ ...draft, certificates });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        const prev = draft.certificates ?? [];
        await syncCertificates(prev, certificates);
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
      });
    },
    [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const savePortfolio = useCallback(
    async (portfolio: NonNullable<MasterDraft['portfolio']>) => {
      await runSheetPersist(async () => {
      if (useCabinetApi) {
        const imgErr = portfolioHttpsError(portfolio);
        if (imgErr) {
          setSheetApiError(imgErr);
          return;
        }
      }
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({ ...draft, portfolio });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        const prev = (draft.portfolio ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: (p.imageUrl ?? '').trim(),
        }));
        const forSync = portfolio.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: (p.imageUrl ?? '').trim(),
        }));
        await syncPortfolioItems(prev, forSync);
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
      });
    },
    [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, showSaved, useCabinetApi],
  );

  const confirmDeleteCareer = useCallback(async () => {
    if (!sheet || typeof sheet !== 'object' || sheet.k !== 'del-career') return;

    await runSheetPersist(async () => {
    const id = sheet.id;
    const next = (draft.careerItems ?? []).filter((item) => item.id !== id);

    if (!useCabinetApi) {
      setSheetApiError(null);
      persistDraft({ ...draft, careerItems: next });
      closeSheet();
      showSaved();
      return;
    }

    setSheetApiError(null);
    if (!isUuid(id)) {
      persistDraft({ ...draft, careerItems: next, experience: undefined });
      closeSheet();
      showSaved();
      return;
    }
    try {
      await deleteCareerItem(id);
      await refreshDraft();
      closeSheet();
      showSaved();
    } catch (e) {
      setSheetApiError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
    });
  }, [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, sheet, showSaved, useCabinetApi]);

  const confirmDeleteCert = useCallback(async () => {
    if (!sheet || typeof sheet !== 'object' || sheet.k !== 'del-cert') return;
    await runSheetPersist(async () => {
    const id = sheet.id;
    const next = (draft.certificates ?? []).filter((certificate) => certificate.id !== id);

    if (!useCabinetApi) {
      setSheetApiError(null);
      persistDraft({ ...draft, certificates: next });
      closeSheet();
      showSaved();
      return;
    }

    setSheetApiError(null);
    if (!isUuid(id)) {
      persistDraft({ ...draft, certificates: next });
      closeSheet();
      showSaved();
      return;
    }
    try {
      await deleteCertificate(id);
      await refreshDraft();
      closeSheet();
      showSaved();
    } catch (e) {
      setSheetApiError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
    });
  }, [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, sheet, showSaved, useCabinetApi]);

  const confirmDeletePortfolio = useCallback(async () => {
    if (!sheet || typeof sheet !== 'object' || sheet.k !== 'del-portfolio') return;
    await runSheetPersist(async () => {
    const id = sheet.id;
    const next = (draft.portfolio ?? []).filter((item) => item.id !== id);
    const portfolioCoverId =
      draft.portfolioCoverId === id ? undefined : draft.portfolioCoverId;

    if (!useCabinetApi) {
      setSheetApiError(null);
      persistDraft({ ...draft, portfolio: next, portfolioCoverId });
      closeSheet();
      showSaved();
      return;
    }

    setSheetApiError(null);
    if (!isUuid(id)) {
      persistDraft({ ...draft, portfolio: next, portfolioCoverId });
      closeSheet();
      showSaved();
      return;
    }
    try {
      await deletePortfolioItem(id);
      await refreshDraft();
      closeSheet();
      showSaved();
    } catch (e) {
      setSheetApiError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
    });
  }, [closeSheet, draft, persistDraft, refreshDraft, runSheetPersist, sheet, showSaved, useCabinetApi]);

  const sheetBody = useMemo(() => {
    if (sheet === 'main') {
      return (
        <SheetMainInfo
          draft={draft}
          onSave={saveMain}
          onCancel={closeSheet}
          uploadHeroPhoto={useCabinetApi ? uploadMasterHeroPhotoFromDataUrl : undefined}
        />
      );
    }

    if (sheet === 'address') {
      return <SheetAddress draft={draft} onSave={saveLocation} onCancel={closeSheet} />;
    }

    if (sheet === 'schedule') {
      return <SheetSchedule draft={draft} onSave={saveSchedule} onCancel={closeSheet} />;
    }

    if (sheet === 'rules') {
      return <SheetRules draft={draft} onSave={saveRules} onCancel={closeSheet} />;
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'career') {
      return (
        <CareerSheet
          key={`career-${sheet.id ?? 'new'}`}
          draft={draft}
          itemId={sheet.id ?? null}
          onSave={saveCareer}
          onCancel={closeSheet}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'cert') {
      return (
        <SheetCertificate
          draft={draft}
          certificateId={sheet.id ?? null}
          onSave={saveCertificates}
          onCancel={closeSheet}
          uploadImage={useCabinetApi ? uploadMasterCertificateImageFile : undefined}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'portfolio') {
      return (
        <SheetPortfolio
          draft={draft}
          itemId={sheet.id ?? null}
          onSave={savePortfolio}
          onCancel={closeSheet}
          uploadImage={useCabinetApi ? uploadMasterPortfolioImageFile : undefined}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'del-career') {
      return (
        <SheetDeleteConfirm
          text="Запись больше не будет отображаться в блоке образования и опыта."
          onBack={closeSheet} 
          onDelete={confirmDeleteCareer}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'del-cert') {
      return (
        <SheetDeleteConfirm
          text="Он больше не будет отображаться в профиле мастера."
          onBack={closeSheet}
          onDelete={confirmDeleteCert}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'del-portfolio') {
      return (
        <SheetDeleteConfirm
          text="Фото больше не будет отображаться в профиле мастера."
          onBack={closeSheet}
          onDelete={confirmDeletePortfolio}
        />
      );
    }

    return null;
  }, [
    closeSheet,
    confirmDeleteCareer,
    confirmDeleteCert,
    confirmDeletePortfolio,
    draft,
    saveCareer,
    saveCertificates,
    saveLocation,
    saveMain,
    savePortfolio,
    saveRules,
    saveSchedule,
    sheet,
    useCabinetApi,
  ]);

  return (
    <CabinetPageShell>
      <section className="relative pb-10 pt-0">
        {useCabinetApi ? <AdminNotificationsBanner /> : null}
        <AdminProfileReadView
          draft={draft}
          appointments={appointments}
          cabinetLoading={cabinetLoading}
          useCabinetApi={useCabinetApi}
          onGoServices={() => navigate(ADMIN_SERVICES_PATH)}
          onEditMain={() => openSheet('main')}
          onEditSchedule={() => openSheet('schedule')}
          onEditAddress={() => openSheet('address')}
          onEditRules={() => openSheet('rules')}
          onAddCareer={() => openSheet({ k: 'career' }, 'add')}
          onEditCareer={(id) => openSheet({ k: 'career', id })}
          onDeleteCareer={(id) => openSheet({ k: 'del-career', id })}
          onAddCert={() => openSheet({ k: 'cert' }, 'add')}
          onEditCert={(id) => openSheet({ k: 'cert', id })}
          onDeleteCert={(id) => openSheet({ k: 'del-cert', id })}
          onAddPortfolio={() => openSheet({ k: 'portfolio' }, 'add')}
          onEditPortfolio={(id) => openSheet({ k: 'portfolio', id })}
          onDeletePortfolio={(id) => openSheet({ k: 'del-portfolio', id })}
          actionsDisabled={cabinetLoading || sheetPersisting}
          onSetPortfolioCover={setPortfolioCover}
        />

        {toast ? (
          <div
            className="pointer-events-none fixed bottom-24 left-1/2 z-[210] -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg"
            role="status"
          >
            Сохранено
          </div>
        ) : null}

        <AdminBottomSheet open={sheet != null} onClose={closeSheet} title={sheetTitle(sheet)}>
          {sheetApiError ? (
            <p className="mb-3 rounded-[16px] bg-red-50 px-3 py-2 text-[14px] font-medium text-red-600 ring-1 ring-red-100">
              {sheetApiError}
            </p>
          ) : null}
          {sheetBody}
        </AdminBottomSheet>
      </section>
    </CabinetPageShell>
  );
}
