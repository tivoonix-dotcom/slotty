import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isEmptyDisplayValue } from '../../shared/lib/emptyDisplayText';
import { ADMIN_PATH, HUB_PATH, PAYMENT_SUCCESS_PATH } from '../../app/paths';
import { priceForPlan } from '../../features/billing/model/masterPlans';
import { createBillingCheckout } from '../../features/billing/api/masterBillingApi';
import { BILLING_COPY, formatBillingUserError } from '../../features/billing/billingCopy';
import { readPublicAppOrigin } from '../../shared/lib/masterBookingLink';
import { ProSubscriptionConsentModal } from '../admin/billing/ProSubscriptionConsentModal';
import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import type { MasterLocation, MasterVisitType } from '../../features/profile/model/masterLocation';
import { formatStoredPublicAddress } from '../../features/profile/model/masterLocation';
import { OnboardingStep1Intro } from './OnboardingStep1Intro';
import { OnboardingStep2Categories } from './OnboardingStep2Categories';
import { getCategoryPlanTheme } from './onboardingCategoryPlanTheme';
import { OnboardingStep3Profile } from './OnboardingStep3Profile';
import { OnboardingStep4Address } from './OnboardingStep4Address';
import {
  addressNeedsMoreSection,
  firstErrorMessage,
  pickFirstAddressErrorField,
  pickFirstProfileErrorField,
  scrollToOnboardingField,
  touchAllErrorKeys,
} from './onboardingNavigate';
import { useAuth } from '../../features/auth/AuthProvider';
import {
  isOnboardingAvatarPhotoUrl,
  profileDisplayAvatarUrl,
} from '../../features/profile/lib/profileDisplayAvatar';
import { useIsMasterUser } from '../../features/profile/hooks/useIsMasterUser';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { getMasterDisplayNameQualityError } from '../../shared/lib/masterDisplayNamePolicy';
import {
  DEFAULT_WEEKDAY_SCHEDULE,
  fetchServiceCategories,
  submitMasterOnboarding,
  type ServiceCategoryDto,
} from '../../features/master-onboarding/api/becomeMasterApi';
import {
  contactsToLegacyContactLine,
  validateContactValue,
  CONTACT_CHANNEL_META,
  type ContactType,
  type MasterContactRow,
} from '../../features/master-onboarding/model/masterContacts';
import {
  isOptionalBelarusPhoneValid,
  normalizeBelarusPhone,
  sanitizeBelarusPhoneInput,
} from '../../features/master-onboarding/model/belarusPhone';
import {
  getServiceTitlePlaceholder,
  templatePriceTypeToApp,
  type ServiceTemplate,
} from '../../constants/serviceTemplates';
import { normalizeCategoryCode } from '../../features/catalog/serviceCategoryLabels';
import {
  fallbackCategoryCodeById,
  ONBOARDING_FALLBACK_CATEGORIES,
} from '../../features/master-onboarding/onboardingFallbackCategories';
import { OnboardingAccountBar } from './OnboardingAccountBar';
import { OnboardingAuthGate } from './OnboardingAuthGate';
import { OnboardingStep5Services } from './OnboardingStep5Services';
import {
  canAddServiceDuringOnboarding,
  countActiveOnboardingServices,
  exceedsFreeActiveServiceLimit,
  findDuplicateOnboardingService,
  hasDuplicateOnboardingServices,
  ONBOARDING_BASIC_MAX_SERVICES,
  ONBOARDING_MAX_SERVICES,
} from './onboardingServiceUtils';
import { ONBOARDING_PLAN_COPY } from './onboardingPlanCopy';
import {
  mergeOnboardingStepFromSources,
  onboardingPaymentStatusHint,
  resolveRestoredTariff,
} from './onboardingProgressMerge';
import { useOnboardingServerProgress } from './useOnboardingServerProgress';
import type { OnboardingProgressDto } from '../../features/master-onboarding/api/onboardingProgressApi';
import { OnboardingFreeLimitSheet } from './OnboardingFreeLimitSheet';
import { OnboardingStep6Trust } from './OnboardingStep6Trust';
import { OnboardingStep7Review } from './OnboardingStep7Review';
import { navigateAfterPublish, OnboardingPublishSuccess } from './OnboardingPublishSuccess';
import {
  sortEducationItemsChronologically,
  type OnboardingEducationItem,
} from './onboardingEducation';
import { createCareerItem } from '../../features/admin/api/adminProfileApi';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import { isPersistableCertificateImageUrl } from '../../features/master-onboarding/model/masterCertificate';
import { uploadMasterCertificateImageFile } from '../../features/admin/api/masterCabinetApi';
import {
  fileToCertificateDraftImageUrl,
  resolveCertificateImageForDraft,
} from './certificateImagePersistence';
import {
  buildOnboardingCertificatePayload,
  uploadPendingOnboardingCertificatePhotos,
} from './onboardingCertificateImages';
import { MAX_CERTIFICATE_IMAGE_BYTES } from './OnboardingCertificatePhotoField';
import type { MasterPlanSelection } from '../../features/master-onboarding/model/masterOnboardingPlanTypes';
import { normalizePlanSelection } from '../../features/master-onboarding/model/masterOnboardingPlanTypes';
import {
  AT_HOME_ENTRANCE_MAX,
  AT_HOME_INTERCOM_MAX,
  sanitizeAtHomeRoomInput,
  validateMasterAddressForm,
} from '../../features/profile/lib/masterAddressValidation';
import {
  buildBecomeMasterDraftKey,
  loadMergedOnboardingDraft,
  migrateBecomeMasterDraft,
  useBecomeMasterDraft,
  writeBecomeMasterDraft,
  type BecomeMasterDraftData,
} from './useBecomeMasterDraft';
import { useOnboardingStepUrl } from './useOnboardingStepUrl';
import {
  onboardingEyebrowClass,
  onboardingPreviewTitleClass,
  onboardingStepTitleClass,
} from './onboardingFormField';

const TOTAL_STEPS = 8;
const ONBOARDING_PAGE_WRAP =
  'mx-auto w-full min-w-0 max-w-2xl px-3 sm:px-4 lg:max-w-[1320px] lg:px-6 xl:px-10';
const ONBOARDING_CITY = 'Минск';
const BY_PHONE_PREFIX = '+375';

type PriceType = 'fixed' | 'from';

type OnboardingService = MasterOnboardingService & {
  priceType?: PriceType;
  isActive?: boolean;
  sortOrder?: number;
};

function sanitizeAtHomeFloorInput(raw: string): string {
  let s = raw.replace(/[^\d-]/g, '');
  if (!s.includes('-')) return s.slice(0, 2);
  const negative = s.startsWith('-');
  const digits = s.replace(/-/g, '').slice(0, 2);
  return negative ? `-${digits}` : digits.slice(0, 2);
}

function newEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const GARBAGE_SERVICE_TITLES = new Set([
  'фыв',
  'йцу',
  'asd',
  'qwe',
  'zxc',
  'dsa',
  'ewq',
  'cxz',
  'фыва',
  'йцук',
]);

function isGarbageServiceTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  if (t.length < 2) return true;
  if (/^(.)\1+$/u.test(t)) return true;
  if (GARBAGE_SERVICE_TITLES.has(t)) return true;
  return false;
}

function isServiceValidForPublish(s: OnboardingService): boolean {
  const t = s.title.trim();
  if (t.length < 2 || t.length > 300) return false;
  if (isGarbageServiceTitle(t)) return false;
  if (!Number.isFinite(s.durationMin) || s.durationMin < 15 || s.durationMin > 1440) return false;
  if (!Number.isFinite(s.priceByn) || s.priceByn < 0) return false;
  return true;
}

type PublishBlockingIssue = {
  id: string;
  message: string;
  fixStep?: 3 | 4 | 5;
};

function hasValidBelarusPhoneForOnboarding(phone: string): boolean {
  const p = phone.trim();
  if (!p || p === BY_PHONE_PREFIX) return false;
  return isOptionalBelarusPhoneValid(p);
}

/** Хотя бы один заполненный и валидный мессенджер / соцсеть (телефон считается отдельно). */
function hasAtLeastOneValidMessengerContact(clientContacts: MasterContactRow[]): boolean {
  for (const row of clientContacts) {
    const v = row.value.trim();
    if (!v) continue;
    if (validateContactValue(row.type, v) == null) return true;
  }
  return false;
}

function collectPublishBlockingIssues(params: {
  name: string;
  publicAddressForApi: string;
  services: OnboardingService[];
  clientContacts: MasterContactRow[];
  selectedCategoryId: string | null;
  phone: string;
}): PublishBlockingIssue[] {
  const { name, publicAddressForApi, services, clientContacts, selectedCategoryId, phone } = params;
  const out: PublishBlockingIssue[] = [];

  if (!selectedCategoryId) {
    out.push({ id: 'category', message: 'Выберите категорию' });
  }

  const n = name.trim();
  if (n.length < 2 || n.length > 200) {
    out.push({ id: 'profile-name', message: 'Укажите имя в профиле', fixStep: 3 });
  } else {
    const nameQuality = getMasterDisplayNameQualityError(n);
    if (nameQuality) {
      out.push({ id: 'profile-name-quality', message: nameQuality, fixStep: 3 });
    }
  }

  if (!publicAddressForApi.trim()) {
    out.push({ id: 'address', message: 'Укажите адрес приёма', fixStep: 4 });
  }

  if (services.length === 0) {
    out.push({ id: 'services-empty', message: 'Добавьте хотя бы одну услугу', fixStep: 5 });
  } else if (services.some((s) => !isServiceValidForPublish(s))) {
    out.push({ id: 'services-invalid', message: 'Проверьте услуги', fixStep: 5 });
  } else if (hasDuplicateOnboardingServices(services)) {
    out.push({ id: 'services-duplicate', message: 'Удалите одинаковые услуги', fixStep: 5 });
  }

  const phoneTrim = phone.trim();
  const hasPhonePayload = phoneTrim.length > 0 && phoneTrim !== BY_PHONE_PREFIX;
  if (hasPhonePayload && !isOptionalBelarusPhoneValid(phoneTrim)) {
    out.push({ id: 'phone-invalid', message: 'Введите корректный номер Беларуси', fixStep: 3 });
  }

  if (!hasValidBelarusPhoneForOnboarding(phone)) {
    if (!hasPhonePayload) {
      out.push({ id: 'phone-empty', message: 'Укажите номер телефона Беларуси', fixStep: 3 });
    }
  } else if (!hasAtLeastOneValidMessengerContact(clientContacts)) {
    out.push({
      id: 'contact-reachability',
      message: 'Добавьте хотя бы один контакт в мессенджере или соцсети',
      fixStep: 3,
    });
  }

  for (const row of clientContacts) {
    const v = row.value.trim();
    if (!v) continue;
    const err = validateContactValue(row.type, v);
    if (!err) continue;
    const label = CONTACT_CHANNEL_META.find((c) => c.type === row.type)?.label ?? 'контакт';
    const message =
      row.type === 'viber'
        ? 'Проверьте контакт Viber'
        : row.type === 'telegram'
          ? 'Проверьте контакт Telegram'
          : row.type === 'instagram'
            ? 'Проверьте контакт Instagram'
            : row.type === 'whatsapp'
              ? 'Проверьте контакт WhatsApp'
              : row.type === 'vk'
                ? 'Проверьте контакт VK'
                : `Проверьте контакт (${label})`;
    out.push({ id: `contact-${row.id}`, message, fixStep: 3 });
  }

  return out;
}

function buildLocationFromForm(
  visitType: MasterVisitType,
  fields: {
    city: string;
    street: string;
    building: string;
    buildingDetail?: string;
    salonName?: string;
    showExactAddressAfterBooking?: boolean;
    lat?: number;
    lng?: number;
    entrance: string;
    floor: string;
    room: string;
    intercom: string;
    landmark: string;
    directions: string;
    clientNote: string;
  },
): MasterLocation {
  const cityTrim = fields.city.trim();
  const base: MasterLocation = {
    visitType,
    ...(cityTrim ? { city: cityTrim } : {}),
    street: fields.street.trim(),
    building: fields.building.trim(),
  };

  if (fields.buildingDetail?.trim()) base.buildingDetail = fields.buildingDetail.trim();
  if (fields.salonName?.trim()) base.salonName = fields.salonName.trim();
  if (typeof fields.showExactAddressAfterBooking === 'boolean') {
    base.showExactAddressAfterBooking = fields.showExactAddressAfterBooking;
  }

  if (
    typeof fields.lat === 'number' &&
    Number.isFinite(fields.lat) &&
    typeof fields.lng === 'number' &&
    Number.isFinite(fields.lng)
  ) {
    base.lat = fields.lat;
    base.lng = fields.lng;
  }

  const shared = {
    entrance: fields.entrance.trim() || undefined,
    floor: fields.floor.trim() || undefined,
    room: fields.room.trim() || undefined,
    intercom: fields.intercom.trim() || undefined,
    landmark: fields.landmark.trim() || undefined,
    directions: fields.directions.trim() || undefined,
    clientNote: fields.clientNote.trim() || undefined,
  };

  if (visitType === 'studio') {
    return {
      ...base,
      ...shared,
    };
  }

  return {
    ...base,
    ...shared,
  };
}

function computeOnboardingPublicAddress(params: {
  visitType: MasterVisitType;
  city: string;
  street: string;
  building: string;
  salonName?: string;
  landmark?: string;
  showExactAddressAfterBooking?: boolean;
}): string {
  return formatStoredPublicAddress({
    visitType: params.visitType,
    city: params.city.trim() || 'Минск',
    street: params.street.trim(),
    building: params.building.trim() || 'б/н',
    salonName: params.salonName,
    showExactAddressAfterBooking: params.showExactAddressAfterBooking,
  }).slice(0, 600);
}

function StepTitle({
  eyebrow,
  title,
  text,
  dense,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  /** Компактнее вертикальные отступы (например шаг категории). */
  dense?: boolean;
}) {
  return (
    <div>
      <p className={onboardingEyebrowClass}>{eyebrow}</p>

      <h1
        className={`${onboardingStepTitleClass} ${
          dense ? 'sm:text-[30px]' : 'mt-2 text-[24px] sm:text-[30px]'
        }`}
      >
        {title}
      </h1>

      {text ? (
        <p className="mt-2 break-words text-[14px] leading-relaxed text-neutral-500 sm:mt-3 sm:text-[15px]">
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function BecomeMasterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { urlStep, setUrlStep } = useOnboardingStepUrl(TOTAL_STEPS);
  /** true, когда step меняем из приложения (не из history) — чтобы не откатывать шаг. */
  const stepChangeFromAppRef = useRef(false);
  const { isAuthenticated, isLoading: authLoading, profile, backendConfigured, refreshProfile, logout } = useAuth();
  const isMasterUser = useIsMasterUser();
  const { telegramUserPreview, telegramUserPhotoUrl } = useTelegram();

  const suggestedTgUsername = useMemo(() => {
    const fromProfile = profile?.telegram_username?.trim();
    if (fromProfile) return fromProfile.replace(/^@+/, '');
    const fromTg = telegramUserPreview?.username?.trim();
    if (fromTg) return fromTg.replace(/^@+/, '');
    return '';
  }, [profile?.telegram_username, telegramUserPreview?.username]);

  const contactTgPrefilledRef = useRef(false);

  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [tariffSelection, setTariffSelection] = useState<MasterPlanSelection>('basic');
  const [proConsentOpen, setProConsentOpen] = useState(false);
  const [freeLimitSheetOpen, setFreeLimitSheetOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [serverPaymentHint, setServerPaymentHint] = useState<string | null>(null);
  const serverProgressMergedRef = useRef(false);

  const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesReady, setCategoriesReady] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null);
  const [categoryChangePendingId, setCategoryChangePendingId] = useState<string | null>(null);
  const [categoryChangeConfirmOpen, setCategoryChangeConfirmOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientContacts, setClientContacts] = useState<MasterContactRow[]>([]);
  const [phone, setPhone] = useState(`${BY_PHONE_PREFIX} `);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [step3NavigateAttempted, setStep3NavigateAttempted] = useState(false);
  const [stepNavigateHint, setStepNavigateHint] = useState<string | null>(null);
  const [stepTransitionBusy, setStepTransitionBusy] = useState(false);

  const [visitType, setVisitType] = useState<MasterVisitType>('studio');
  const [city] = useState(ONBOARDING_CITY);
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [intercom, setIntercom] = useState('');
  const [landmark] = useState('');
  const [directions, setDirections] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [salonName, setSalonName] = useState('');
  const [houseDetail, setHouseDetail] = useState('');
  const [showExactAddressAfterBooking, setShowExactAddressAfterBooking] = useState(true);
  const [addressMoreOpen, setAddressMoreOpen] = useState(false);
  const [mapScriptOk, setMapScriptOk] = useState<boolean | null>(null);
  const [pickedAddressSummary, setPickedAddressSummary] = useState<string | null>(null);
  const [addressPinnedToMap, setAddressPinnedToMap] = useState(false);
  const [addressNavigateAttempted, setAddressNavigateAttempted] = useState(false);
  const [addressTouched, setAddressTouched] = useState<Record<string, boolean>>({});
  const [addressFieldErrors, setAddressFieldErrors] = useState<Record<string, string>>({});

  const [services, setServices] = useState<OnboardingService[]>([]);
  const [svcTitle, setSvcTitle] = useState('');
  const [svcDur, setSvcDur] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcPriceType, setSvcPriceType] = useState<PriceType>('fixed');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcFieldErrors, setSvcFieldErrors] = useState<Record<string, string>>({});
  const [svcEditingId, setSvcEditingId] = useState<string | null>(null);
  const [svcTouched, setSvcTouched] = useState<Record<string, boolean>>({});
  const [svcAttemptedAdd, setSvcAttemptedAdd] = useState(false);
  const [svcHighlightId, setSvcHighlightId] = useState<string | null>(null);

  const [certificates, setCertificates] = useState<MasterCertificate[]>([]);
  const [educationItems, setEducationItems] = useState<OnboardingEducationItem[]>([]);
  const [certFormVisible, setCertFormVisible] = useState(false);
  const [certEditingId, setCertEditingId] = useState<string | null>(null);
  const [certTitle, setCertTitle] = useState('');
  const [certOrganization, setCertOrganization] = useState('');
  const [certYear, setCertYear] = useState('');
  const [certDesc, setCertDesc] = useState('');
  const [certImageUrl, setCertImageUrl] = useState('');
  const [certPhotoUploading, setCertPhotoUploading] = useState(false);
  const [certPhotoUploadErr, setCertPhotoUploadErr] = useState<string | null>(null);
  const certImageBlobRef = useRef<string | null>(null);
  const [certFieldErrors, setCertFieldErrors] = useState<Record<string, string>>({});
  const [certTouched, setCertTouched] = useState<Record<string, boolean>>({});
  const [certAttemptedSubmit, setCertAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setCategories(ONBOARDING_FALLBACK_CATEGORIES);
      setCategoriesReady(true);
      return;
    }

    let cancelled = false;
    setCategoriesError(null);

    void (async () => {
      try {
        const list = await fetchServiceCategories();
        if (!cancelled) {
          setCategories(list.length > 0 ? list : ONBOARDING_FALLBACK_CATEGORIES);
        }
      } catch (e) {
        if (!cancelled) {
          setCategories(ONBOARDING_FALLBACK_CATEGORIES);
          setCategoriesError(e instanceof Error ? e.message : 'Не удалось загрузить категории');
        }
      } finally {
        if (!cancelled) setCategoriesReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (contactTgPrefilledRef.current) return;
    if (!suggestedTgUsername) return;
    contactTgPrefilledRef.current = true;
    setClientContacts((prev) => {
      if (prev.some((c) => c.type === 'telegram')) return prev;
      return [...prev, { id: newEntityId('ct'), type: 'telegram', value: `@${suggestedTgUsername}` }];
    });
  }, [suggestedTgUsername]);

  useEffect(() => {
    if (visitType === 'at_home') {
      setShowExactAddressAfterBooking(true);
    } else {
      setShowExactAddressAfterBooking(false);
    }
  }, [visitType]);

  useEffect(() => {
    if (!isAuthenticated || !isMasterUser || success) return;
    navigate(ADMIN_PATH, { replace: true });
  }, [isAuthenticated, isMasterUser, navigate, success]);

  const draftStorageKey = useMemo(() => buildBecomeMasterDraftKey(profile?.id ?? null), [profile?.id]);

  const draftData = useMemo<BecomeMasterDraftData>(
    () => ({
      step,
      furthestStep,
      selectedCategoryId,
      selectedCategoryCode,
      name,
      description,
      phone,
      clientContacts,
      visitType,
      street,
      building,
      lat,
      lng,
      entrance,
      floor,
      room,
      intercom,
      directions,
      clientNote,
      salonName,
      houseDetail,
      showExactAddressAfterBooking,
      services,
      certificates: certificates.map((c) => ({
        ...c,
        imageUrl: isPersistableCertificateImageUrl(c.imageUrl) ? c.imageUrl : undefined,
      })),
      educationItems,
      tariffSelection,
    }),
    [
      step,
      furthestStep,
      selectedCategoryId,
      selectedCategoryCode,
      name,
      description,
      phone,
      clientContacts,
      visitType,
      street,
      building,
      lat,
      lng,
      entrance,
      floor,
      room,
      intercom,
      directions,
      clientNote,
      salonName,
      houseDetail,
      showExactAddressAfterBooking,
      services,
      certificates,
      educationItems,
      tariffSelection,
    ],
  );

  const draftDataRef = useRef(draftData);
  draftDataRef.current = draftData;

  const { flushDraft, clearDraft } = useBecomeMasterDraft({
    storageKey: draftStorageKey,
    data: draftData,
    enabled: !success && draftHydrated,
  });

  const handleServerProgressLoaded = useCallback(
    (progress: OnboardingProgressDto | null) => {
      if (!progress) return;
      setServerPaymentHint(onboardingPaymentStatusHint(progress));
      if (serverProgressMergedRef.current) return;
      serverProgressMergedRef.current = true;
      const local = draftDataRef.current;
      const merged = mergeOnboardingStepFromSources(progress, local);
      setTariffSelection(resolveRestoredTariff(progress, normalizePlanSelection(local.tariffSelection)));
      stepChangeFromAppRef.current = true;
      setStep(merged.step);
      setFurthestStep(merged.furthestStep);
      setUrlStep(merged.step, true);
    },
    [setUrlStep],
  );

  const { queueSync } = useOnboardingServerProgress({
    enabled: draftHydrated && !success,
    isAuthenticated,
    onLoaded: handleServerProgressLoaded,
  });

  useEffect(() => {
    if (!draftHydrated || !isAuthenticated || success) return;
    queueSync({
      currentStep: step,
      furthestStep: furthestStep,
      selectedTariff: tariffSelection,
    });
  }, [draftHydrated, furthestStep, isAuthenticated, queueSync, step, success, tariffSelection]);

  useEffect(() => {
    if (!draftHydrated) return;
    const intent = searchParams.get('intent');
    if (intent === 'pro_retry') {
      setTariffSelection('pro_purchase');
      setServerPaymentHint(ONBOARDING_PLAN_COPY.paymentFailedOnboarding);
      if (step < 8) {
        stepChangeFromAppRef.current = true;
        setStep(8);
        setFurthestStep((f) => Math.max(f, 8));
        setUrlStep(8, true);
      }
      return;
    }
    if (intent === 'free') {
      setTariffSelection('basic');
      setServerPaymentHint(
        'Чтобы продолжить бесплатно, оставьте до 3 активных услуг — отключите лишние на этом шаге.',
      );
      if (step !== 5) {
        stepChangeFromAppRef.current = true;
        setStep(5);
        setFurthestStep((f) => Math.max(f, 5));
        setUrlStep(5, true);
      }
    }
  }, [draftHydrated, searchParams, setUrlStep, step]);

  const hydratedStorageKeyRef = useRef<string | null>(null);

  const applyDraftToForm = useCallback((draft: BecomeMasterDraftData) => {
    setSelectedCategoryId(draft.selectedCategoryId);
    setSelectedCategoryCode(draft.selectedCategoryCode ?? null);
    setName(draft.name);
    setDescription(draft.description);
    setPhone(draft.phone || `${BY_PHONE_PREFIX} `);
    setClientContacts(draft.clientContacts ?? []);
    setVisitType(draft.visitType ?? 'studio');
    setStreet(draft.street ?? '');
    setBuilding(draft.building ?? '');
    setLat(draft.lat);
    setLng(draft.lng);
    setEntrance(draft.entrance ?? '');
    setFloor(draft.floor ?? '');
    setRoom(draft.room ?? '');
    setIntercom(draft.intercom ?? '');
    setDirections(draft.directions ?? '');
    setClientNote(draft.clientNote ?? '');
    setSalonName(draft.salonName ?? '');
    setHouseDetail(draft.houseDetail ?? '');
    setShowExactAddressAfterBooking(draft.showExactAddressAfterBooking ?? true);
    setServices(draft.services ?? []);
    setCertificates(draft.certificates ?? []);
    setEducationItems(draft.educationItems ?? []);
    setTariffSelection(normalizePlanSelection(draft.tariffSelection));
    const restored = Math.max(1, Math.min(TOTAL_STEPS, draft.step || 1));
    const restoredFurthest = Math.max(restored, Math.min(TOTAL_STEPS, draft.furthestStep ?? restored));
    setFurthestStep(restoredFurthest);
    stepChangeFromAppRef.current = true;
    setStep(restored);
    setUrlStep(restored, true);
  }, [setUrlStep]);

  useEffect(() => {
    if (authLoading) return;

    const key = draftStorageKey;
    if (hydratedStorageKeyRef.current === key) return;

    setDraftHydrated(false);

    const localKey = buildBecomeMasterDraftKey(null);
    const prevKey = hydratedStorageKeyRef.current;

    if (prevKey && prevKey !== key) {
      writeBecomeMasterDraft(prevKey, draftDataRef.current);
    }

    if (profile?.id && key !== localKey) {
      migrateBecomeMasterDraft(localKey, key);
      migrateBecomeMasterDraft(buildBecomeMasterDraftKey('anonymous'), key);
    }

    const draft = loadMergedOnboardingDraft(
      key,
      localKey,
      buildBecomeMasterDraftKey('anonymous'),
      prevKey && prevKey !== key ? prevKey : '',
    );

    if (draft) {
      applyDraftToForm(draft);
      writeBecomeMasterDraft(key, draft);
    } else {
      const initialStep =
        urlStep != null ? Math.max(1, Math.min(TOTAL_STEPS, urlStep)) : 1;
      stepChangeFromAppRef.current = true;
      setStep(initialStep);
      setFurthestStep(initialStep);
      if (urlStep == null) {
        setUrlStep(initialStep, true);
      }
    }

    hydratedStorageKeyRef.current = key;
    setDraftHydrated(true);
  }, [applyDraftToForm, authLoading, draftStorageKey, profile?.id, setUrlStep]);

  useEffect(() => {
    if (!draftHydrated) return;
    flushDraft();
  }, [
    draftHydrated,
    flushDraft,
    step,
    selectedCategoryId,
    selectedCategoryCode,
    name,
    services.length,
  ]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const effectiveCategoryCode = useMemo(() => {
    if (selectedCategory?.code?.trim()) return normalizeCategoryCode(selectedCategory.code);
    if (selectedCategoryCode?.trim()) return normalizeCategoryCode(selectedCategoryCode);
    const fromId = fallbackCategoryCodeById(selectedCategoryId);
    if (fromId) return normalizeCategoryCode(fromId);
    return '';
  }, [selectedCategory?.code, selectedCategoryCode, selectedCategoryId]);

  const effectiveCategoryLabel = useMemo(() => {
    if (selectedCategory?.name?.trim()) return selectedCategory.name.trim();
    const fromList = categories.find((c) => c.id === selectedCategoryId)?.name;
    if (fromList?.trim()) return fromList.trim();
    return '';
  }, [categories, selectedCategory?.name, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId || selectedCategoryCode) return;
    const code = selectedCategory?.code?.trim() ?? fallbackCategoryCodeById(selectedCategoryId);
    if (!code) return;
    setSelectedCategoryCode(normalizeCategoryCode(code));
  }, [selectedCategory?.code, selectedCategoryCode, selectedCategoryId]);

  const applyCategorySelection = useCallback(
    (categoryId: string) => {
      setSelectedCategoryId(categoryId);
      const cat = categories.find((c) => c.id === categoryId);
      const code = cat?.code?.trim() ?? fallbackCategoryCodeById(categoryId);
      setSelectedCategoryCode(code ? normalizeCategoryCode(code) : null);
      queueMicrotask(() => {
        if (draftDataRef.current) {
          writeBecomeMasterDraft(draftStorageKey, {
            ...draftDataRef.current,
            selectedCategoryId: categoryId,
            selectedCategoryCode: code ? normalizeCategoryCode(code) : null,
          });
        }
      });
    },
    [categories, draftStorageKey],
  );

  const step2CategoryTheme = useMemo(
    () => getCategoryPlanTheme(effectiveCategoryCode),
    [effectiveCategoryCode],
  );

  const trySelectCategory = useCallback(
    (categoryId: string) => {
      if (selectedCategoryId === categoryId) return;
      if (services.length > 0 && selectedCategoryId) {
        setCategoryChangePendingId(categoryId);
        setCategoryChangeConfirmOpen(true);
        return;
      }
      applyCategorySelection(categoryId);
    },
    [applyCategorySelection, selectedCategoryId, services.length],
  );

  const svcPricePreviewLabel = useMemo(() => {
    const raw = svcPrice.replace(',', '.').trim();
    if (!raw) return null;
    const price = Number.parseFloat(raw);
    if (!Number.isFinite(price) || price < 0) return null;
    if (price === 0) return 'Бесплатно';
    return svcPriceType === 'from' ? `от ${price} BYN` : `${price} BYN`;
  }, [svcPrice, svcPriceType]);

  const locationDraft = useMemo(
    () =>
      buildLocationFromForm(visitType, {
        city,
        street,
        building,
        buildingDetail: houseDetail,
        salonName,
        showExactAddressAfterBooking: visitType === 'at_home' ? showExactAddressAfterBooking : false,
        lat,
        lng,
        entrance,
        floor,
        room,
        intercom,
        landmark,
        directions,
        clientNote,
      }),
    [
      visitType,
      city,
      street,
      building,
      houseDetail,
      salonName,
      showExactAddressAfterBooking,
      lat,
      lng,
      entrance,
      floor,
      room,
      intercom,
      landmark,
      directions,
      clientNote,
    ],
  );

  const publicAddressForApi = useMemo(
    () =>
      computeOnboardingPublicAddress({
        visitType,
        city,
        street,
        building,
        salonName,
        landmark,
        showExactAddressAfterBooking: visitType === 'at_home' ? showExactAddressAfterBooking : false,
      }),
    [visitType, city, street, building, salonName, landmark, showExactAddressAfterBooking],
  );

  const publishBlockingIssues = useMemo(
    () =>
      collectPublishBlockingIssues({
        name,
        publicAddressForApi,
        services,
        clientContacts,
        selectedCategoryId,
        phone,
      }),
    [clientContacts, name, phone, publicAddressForApi, selectedCategoryId, services],
  );

  const activeServiceCount = useMemo(() => countActiveOnboardingServices(services), [services]);

  const freeServiceLimitBlocksPublish =
    tariffSelection === 'basic' && exceedsFreeActiveServiceLimit(activeServiceCount);

  const proOnboardingPriceLabel = useMemo(() => `от ${priceForPlan('pro', 'month')} BYN / месяц`, []);
  const proCheckoutPriceLabel = useMemo(() => `${priceForPlan('pro', 'month')} BYN`, []);

  const profileAvatarUrl = useMemo(() => profileDisplayAvatarUrl(profile), [profile]);

  useEffect(() => {
    if (!svcHighlightId) return undefined;
    const t = window.setTimeout(() => setSvcHighlightId(null), 1400);
    return () => window.clearTimeout(t);
  }, [svcHighlightId]);

  useEffect(() => {
    if (services.length === 0) return;
    setSvcFieldErrors((prev) => {
      if (!prev.form) return prev;
      const next = { ...prev };
      delete next.form;
      return next;
    });
  }, [services.length]);

  const touchSvcField = useCallback((key: string) => {
    setSvcTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const showSvcFieldError = useCallback(
    (key: string) => Boolean(svcFieldErrors[key] && (svcTouched[key] || svcAttemptedAdd)),
    [svcAttemptedAdd, svcFieldErrors, svcTouched],
  );

  const cancelSvcForm = useCallback(() => {
    setSvcEditingId(null);
    setSvcTitle('');
    setSvcDur('');
    setSvcPrice('');
    setSvcPriceType('fixed');
    setSvcDesc('');
    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return next;
    });
    setSvcTouched({});
    setSvcAttemptedAdd(false);
    setSvcHighlightId(null);
  }, []);

  useEffect(() => {
    if (!svcEditingId) return;
    if (!services.some((s) => s.id === svcEditingId)) {
      cancelSvcForm();
    }
  }, [cancelSvcForm, services, svcEditingId]);

  const applyServiceTemplate = useCallback((tm: ServiceTemplate) => {
    setSvcTitle(tm.title);
    setSvcDur(String(tm.durationMinutes));
    setSvcPrice(String(tm.price));
    setSvcPriceType(templatePriceTypeToApp(tm.priceType));
    setSvcDesc(tm.description ?? '');
    setSvcHighlightId(tm.id);
    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.title;
      delete next.duration;
      delete next.price;
      delete next.description;
      delete next.form;
      return next;
    });
    setSvcAttemptedAdd(false);
  }, []);

  const submitServiceForm = useCallback(() => {
    setSvcAttemptedAdd(true);

    const title = svcTitle.trim();
    const duration = Number.parseInt(svcDur, 10);
    const price = Number.parseFloat(svcPrice.replace(',', '.').trim());
    const desc = svcDesc.trim();

    const errs: Record<string, string> = {};

    if (title.length < 2) errs.title = 'Минимум 2 символа.';
    else if (title.length > 300) errs.title = 'Не длиннее 300 символов.';

    if (!Number.isInteger(duration)) {
      errs.duration = 'Укажите целое число минут.';
    } else if (duration < 5) {
      errs.duration = 'Минимум 5 минут.';
    } else if (duration > 1440) {
      errs.duration = 'Максимум 1440 минут.';
    }

    if (!Number.isFinite(price) || price < 0) {
      errs.price = 'Укажите цену числом от 0.';
    }

    if (desc.length > 1000) errs.description = 'Не длиннее 1000 символов.';

    if (Object.keys(errs).length === 0) {
      const nextPayload = {
        title,
        durationMin: duration,
        priceByn: price,
        priceType: svcPriceType,
        description: desc || undefined,
      };

      if (!svcEditingId && !canAddServiceDuringOnboarding(services.length)) {
        errs.form = `Можно добавить не более ${ONBOARDING_MAX_SERVICES} услуг. Удалите лишнюю, чтобы добавить новую.`;
      } else if (findDuplicateOnboardingService(services, nextPayload, svcEditingId)) {
        errs.form = 'Такая услуга уже есть в списке. Измените поля или удалите дубликат.';
      }
    }

    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return Object.keys(errs).length > 0 ? errs : {};
    });
    if (Object.keys(errs).length > 0) return;

    const servicePayload = {
      title,
      durationMin: duration,
      priceByn: price,
      priceType: svcPriceType,
      isActive: true as const,
      description: desc || undefined,
    };

    if (svcEditingId) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === svcEditingId ? { ...s, ...servicePayload, id: s.id, sortOrder: s.sortOrder } : s,
        ),
      );
    } else {
      setServices((prev) => [
        ...prev,
        {
          id: newEntityId('svc'),
          ...servicePayload,
          sortOrder: prev.length,
        },
      ]);
    }

    cancelSvcForm();
  }, [cancelSvcForm, services, svcDesc, svcDur, svcEditingId, svcPrice, svcPriceType, svcTitle]);

  const startEditService = useCallback((service: OnboardingService) => {
    setSvcEditingId(service.id);
    setSvcTitle(service.title);
    setSvcDur(String(service.durationMin));
    setSvcPrice(String(service.priceByn));
    setSvcPriceType(service.priceType ?? 'fixed');
    setSvcDesc(service.description ?? '');
    setSvcHighlightId(null);
    setSvcFieldErrors({});
    setSvcTouched({});
    setSvcAttemptedAdd(false);
  }, []);

  const removeService = useCallback(
    (id: string) => {
      setServices((prev) =>
        prev.filter((service) => service.id !== id).map((service, index) => ({ ...service, sortOrder: index })),
      );
      if (svcEditingId === id) cancelSvcForm();
    },
    [cancelSvcForm, svcEditingId],
  );

  const toggleServiceActive = useCallback((id: string) => {
    setServices((prev) => {
      const target = prev.find((service) => service.id === id);
      if (!target) return prev;
      const currentlyActive = target.isActive !== false;
      const activeCount = countActiveOnboardingServices(prev);
      if (!currentlyActive && activeCount >= ONBOARDING_BASIC_MAX_SERVICES) {
        setSvcFieldErrors({ form: ONBOARDING_PLAN_COPY.freeActiveLimitReached });
        return prev;
      }
      setSvcFieldErrors((errors) => {
        if (!errors.form) return errors;
        const next = { ...errors };
        delete next.form;
        return next;
      });
      return prev.map((service) =>
        service.id === id ? { ...service, isActive: !currentlyActive } : service,
      );
    });
  }, []);

  const serviceAddLimitReached = !canAddServiceDuringOnboarding(services.length);

  const revokeCertImageBlob = useCallback(() => {
    if (certImageBlobRef.current) {
      URL.revokeObjectURL(certImageBlobRef.current);
      certImageBlobRef.current = null;
    }
  }, []);

  const clearCertPhoto = useCallback(() => {
    revokeCertImageBlob();
    setCertImageUrl('');
    setCertPhotoUploadErr(null);
    setCertFieldErrors((prev) => {
      const next = { ...prev };
      delete next.photo;
      return next;
    });
  }, [revokeCertImageBlob]);

  const resetCertImageForm = useCallback(() => {
    revokeCertImageBlob();
    setCertImageUrl('');
    setCertPhotoUploading(false);
    setCertPhotoUploadErr(null);
  }, [revokeCertImageBlob]);

  const cancelCertForm = useCallback(() => {
    setCertTitle('');
    setCertOrganization('');
    setCertYear('');
    setCertDesc('');
    resetCertImageForm();
    setCertFieldErrors({});
    setCertTouched({});
    setCertAttemptedSubmit(false);
    setCertEditingId(null);
    setCertFormVisible(false);
  }, [resetCertImageForm]);

  const resetCertFormAfterSubmit = useCallback(() => {
    setCertTitle('');
    setCertOrganization('');
    setCertYear('');
    setCertDesc('');
    resetCertImageForm();
    setCertFieldErrors({});
    setCertTouched({});
    setCertAttemptedSubmit(false);
    setCertEditingId(null);
    setCertFormVisible(false);
  }, [resetCertImageForm]);

  const openCertFormForAdd = useCallback(() => {
    setCertTitle('');
    setCertOrganization('');
    setCertYear('');
    setCertDesc('');
    resetCertImageForm();
    setCertFieldErrors({});
    setCertTouched({});
    setCertAttemptedSubmit(false);
    setCertEditingId(null);
    setCertFormVisible(true);
  }, [resetCertImageForm]);

  const handleCertImageFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setCertPhotoUploadErr('Выберите изображение (JPEG, PNG или WebP)');
        return;
      }
      if (file.size > MAX_CERTIFICATE_IMAGE_BYTES) {
        setCertPhotoUploadErr('Фото не больше 5 МБ');
        return;
      }

      setCertPhotoUploadErr(null);
      setCertFieldErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });

      revokeCertImageBlob();
      const preview = URL.createObjectURL(file);
      certImageBlobRef.current = preview;
      setCertImageUrl(preview);

      void (async () => {
        if (isAuthenticated && getApiBaseUrl()) {
          setCertPhotoUploading(true);
          try {
            const url = await uploadMasterCertificateImageFile(file);
            revokeCertImageBlob();
            setCertImageUrl(url);
            return;
          } catch {
            /* загрузка на сервер недоступна — сохраним в черновик как data URL */
          } finally {
            setCertPhotoUploading(false);
          }
        }

        try {
          const dataUrl = await fileToCertificateDraftImageUrl(file);
          revokeCertImageBlob();
          setCertImageUrl(dataUrl);
        } catch {
          setCertPhotoUploadErr('Не удалось подготовить фото для сохранения');
        }
      })();
    },
    [isAuthenticated, revokeCertImageBlob],
  );

  useEffect(() => {
    if (!certEditingId) return;
    if (!certificates.some((c) => c.id === certEditingId)) {
      cancelCertForm();
    }
  }, [cancelCertForm, certificates, certEditingId]);

  const touchCertField = useCallback((key: string) => {
    setCertTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const showCertFieldError = useCallback(
    (key: string) => Boolean(certFieldErrors[key] && (certTouched[key] || certAttemptedSubmit)),
    [certAttemptedSubmit, certFieldErrors, certTouched],
  );

  const startEditCertificate = useCallback(
    (c: MasterCertificate) => {
      revokeCertImageBlob();
      const url = c.imageUrl?.trim() ?? '';
      if (url.startsWith('blob:')) certImageBlobRef.current = url;
      setCertImageUrl(url);
      setCertPhotoUploadErr(null);
      setCertTitle(c.title);
      setCertOrganization(c.organization);
      setCertYear(c.year ?? '');
      setCertDesc(c.description ?? '');
      setCertFieldErrors({});
      setCertTouched({});
      setCertAttemptedSubmit(false);
      setCertEditingId(c.id);
      setCertFormVisible(true);
    },
    [revokeCertImageBlob],
  );

  const submitCertificateForm = useCallback(() => {
    setCertAttemptedSubmit(true);

    const title = certTitle.trim();
    const organization = certOrganization.trim();
    const yearStr = certYear.trim();
    const desc = certDesc.trim();
    const imageRaw = certImageUrl.trim();

    const errs: Record<string, string> = {};

    if (title.length < 2) errs.title = 'Минимум 2 символа.';
    else if (title.length > 300) errs.title = 'Не длиннее 300 символов.';

    if (organization.length > 300) errs.organization = 'Не длиннее 300 символов.';

    if (yearStr) {
      const y = Number.parseInt(yearStr, 10);
      if (!Number.isInteger(y) || y < 1950 || y > 2100) {
        errs.year = 'Год от 1950 до 2100 или оставьте пустым.';
      }
    }

    if (desc.length > 1000) errs.description = 'Не длиннее 1000 символов.';

    if (certPhotoUploading) errs.photo = 'Дождитесь окончания загрузки фото';

    setCertFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    void (async () => {
      let resolvedImage: string | undefined;
      try {
        resolvedImage = await resolveCertificateImageForDraft(imageRaw || undefined);
      } catch {
        setCertFieldErrors((prev) => ({
          ...prev,
          photo: 'Не удалось сохранить фото. Попробуйте другое изображение.',
        }));
        return;
      }

      const payload = {
        title,
        organization,
        year: yearStr || undefined,
        description: desc || undefined,
        imageUrl: resolvedImage,
      };

      if (certEditingId) {
        setCertificates((prev) =>
          prev.map((x) => {
            if (x.id !== certEditingId) return x;
            if (x.imageUrl?.startsWith('blob:') && x.imageUrl !== resolvedImage) {
              URL.revokeObjectURL(x.imageUrl);
            }
            return { ...x, ...payload, id: x.id };
          }),
        );
      } else {
        setCertificates((prev) => [...prev, { ...payload, id: newEntityId('cert') }]);
      }

      if (resolvedImage?.startsWith('blob:')) {
        certImageBlobRef.current = null;
      } else {
        revokeCertImageBlob();
      }

      resetCertFormAfterSubmit();
    })();
  }, [
    certDesc,
    certEditingId,
    certImageUrl,
    certOrganization,
    certPhotoUploading,
    certTitle,
    certYear,
    resetCertFormAfterSubmit,
    revokeCertImageBlob,
  ]);

  const removeCertificate = useCallback(
    (id: string) => {
      setCertificates((prev) => {
        const target = prev.find((certificate) => certificate.id === id);

        if (target?.imageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(target.imageUrl);
        }

        return prev.filter((certificate) => certificate.id !== id);
      });
    },
    [],
  );

  const computeProfileStepErrors = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 2) errs.name = 'Минимум 2 символа.';
    else if (n.length > 200) errs.name = 'Не длиннее 200 символов.';
    else {
      const nameQuality = getMasterDisplayNameQualityError(n);
      if (nameQuality) errs.name = nameQuality;
    }

    const bio = description.trim();
    if (bio.length > 10_000) errs.description = 'Не длиннее 10 000 символов.';

    const phoneTrim = phone.trim();
    const hasPhonePayload = phoneTrim.length > 0 && phoneTrim !== BY_PHONE_PREFIX;
    if (hasPhonePayload && !isOptionalBelarusPhoneValid(phoneTrim)) {
      errs.phone = 'Введите корректный номер Беларуси';
    } else if (!hasPhonePayload) {
      errs.phone = 'Укажите номер телефона Беларуси';
    }

    if (!hasAtLeastOneValidMessengerContact(clientContacts)) {
      errs.contactReachability = 'Добавьте хотя бы один контакт в мессенджере или соцсети';
    }

    for (const row of clientContacts) {
      const v = row.value.trim();
      if (!v) {
        errs[row.id] = 'Заполните контакт';
        continue;
      }
      const fmt = validateContactValue(row.type, v);
      if (fmt) errs[row.id] = fmt;
    }

    return errs;
  }, [clientContacts, description, name, phone]);

  const validateProfileStep = useCallback((): boolean => {
    const errs = computeProfileStepErrors();
    setProfileFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [computeProfileStepErrors]);

  const isProfilePhoneEmpty = useCallback((): boolean => {
    const phoneTrim = phone.trim();
    return phoneTrim.length === 0 || phoneTrim === BY_PHONE_PREFIX;
  }, [phone]);

  const isProfileFieldValueEmpty = useCallback(
    (key: string, contactId?: string): boolean => {
      switch (key) {
        case 'name':
          return !name.trim();
        case 'phone':
          return isProfilePhoneEmpty();
        case 'description':
          return false;
        case 'contactReachability':
          return !hasAtLeastOneValidMessengerContact(clientContacts);
        default: {
          if (!contactId) return true;
          const row = clientContacts.find((r) => r.id === contactId);
          return !row?.value.trim();
        }
      }
    },
    [clientContacts, isProfilePhoneEmpty, name],
  );

  /** Сброс подтверждения адреса без сброса координат — чтобы карта не пересоздавалась на каждый символ. */
  const invalidatePrimaryAddressOnMap = useCallback(() => {
    setAddressPinnedToMap(false);
    setPickedAddressSummary(null);
  }, []);

  const touchAddressField = useCallback((key: string) => {
    setAddressTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const isAddressFieldValueEmpty = useCallback(
    (key: string): boolean => {
      switch (key) {
        case 'salonName':
          return !salonName.trim();
        case 'street':
          return isEmptyDisplayValue(street);
        case 'coords':
          return lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng);
        case 'entrance':
          return !entrance.trim();
        case 'floor':
          return !floor.trim();
        case 'room':
          return !room.trim();
        case 'intercom':
          return !intercom.trim();
        case 'houseDetail':
        case 'buildingDetail':
          return !houseDetail.trim();
        case 'directions':
          return !directions.trim();
        case 'clientNote':
          return !clientNote.trim();
        case 'landmark':
          return !landmark.trim();
        default:
          return true;
      }
    },
    [
      clientNote,
      directions,
      entrance,
      floor,
      houseDetail,
      intercom,
      landmark,
      lat,
      lng,
      room,
      salonName,
      street,
    ],
  );

  const computeAddressStepErrors = useCallback((): Record<string, string> => {
    return validateMasterAddressForm(
      {
        visitType,
        street,
        salonName,
        buildingDetail: houseDetail,
        entrance,
        floor,
        room,
        intercom,
        landmark,
        directions,
        clientNote,
        lat,
        lng,
      },
      { mapScriptOk: mapScriptOk === true, addressPinnedToMap },
    );
  }, [
    addressPinnedToMap,
    clientNote,
    directions,
    entrance,
    floor,
    houseDetail,
    intercom,
    landmark,
    lat,
    lng,
    mapScriptOk,
    room,
    salonName,
    street,
    visitType,
  ]);

  const validateAddressStep = useCallback((): boolean => {
    const errs = computeAddressStepErrors();
    setAddressFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [computeAddressStepErrors]);

  const touchAndValidateAddressField = useCallback(
    (key: 'salonName' | 'street' | 'entrance' | 'floor' | 'room' | 'intercom') => {
      touchAddressField(key);
      const errs = computeAddressStepErrors();
      const err = errs[key];
      setAddressFieldErrors((prev) => {
        const next = { ...prev };
        if (!err || (isAddressFieldValueEmpty(key) && !addressNavigateAttempted)) delete next[key];
        else next[key] = err;
        return next;
      });
    },
    [addressNavigateAttempted, computeAddressStepErrors, isAddressFieldValueEmpty, touchAddressField],
  );

  const showAddressFieldError = useCallback(
    (key: string) => {
      const err = addressFieldErrors[key];
      if (!err) return false;
      if (isAddressFieldValueEmpty(key)) return addressNavigateAttempted;
      return Boolean(addressTouched[key] || addressNavigateAttempted);
    },
    [addressFieldErrors, addressNavigateAttempted, addressTouched, isAddressFieldValueEmpty],
  );

  const resetAddressValidationUi = useCallback(() => {
    setAddressNavigateAttempted(false);
    setAddressFieldErrors({});
    setAddressTouched({});
  }, []);

  const prevOnboardingStepRef = useRef(step);
  useLayoutEffect(() => {
    const prev = prevOnboardingStepRef.current;
    prevOnboardingStepRef.current = step;
    if (step === 3 && prev !== 3 && prev !== 7) {
      setStep3NavigateAttempted(false);
      setProfileFieldErrors({});
      setProfileTouched({});
      setStepNavigateHint(null);
    }
    // Шаг 4 с проверки (7) — оставляем ошибки; с шага 3 и др. — чистая форма.
    if (step === 4 && prev !== 4 && prev !== 7) {
      resetAddressValidationUi();
      setStepNavigateHint(null);
    }
  }, [resetAddressValidationUi, step]);

  useEffect(() => {
    setStepTransitionBusy(false);
  }, [step]);

  const maxReachableStep = useMemo(() => {
    let cap = TOTAL_STEPS;
    if (!selectedCategoryId) cap = 2;
    else if (Object.keys(computeProfileStepErrors()).length > 0) cap = 3;
    else if (Object.keys(computeAddressStepErrors()).length > 0) cap = 4;
    else if (services.length === 0) cap = 5;
    return Math.max(cap, furthestStep);
  }, [
    computeAddressStepErrors,
    computeProfileStepErrors,
    furthestStep,
    selectedCategoryId,
    services.length,
  ]);

  const goToStep = useCallback(
    (target: number, options?: { replaceUrl?: boolean }) => {
      const clamped = Math.max(1, Math.min(TOTAL_STEPS, Math.min(target, maxReachableStep)));
      setFurthestStep((prev) => Math.max(prev, clamped));
      stepChangeFromAppRef.current = true;
      setStep(clamped);
      setUrlStep(clamped, options?.replaceUrl ?? false);
      return clamped;
    },
    [maxReachableStep, setUrlStep],
  );

  /** Только браузер «Назад/Вперёд» — не реагируем на собственное обновление step. */
  useEffect(() => {
    if (!draftHydrated) return;
    if (stepChangeFromAppRef.current) {
      stepChangeFromAppRef.current = false;
      return;
    }
    if (urlStep == null) return;
    const clamped = Math.min(urlStep, maxReachableStep);
    setStep((current) => (current === clamped ? current : clamped));
  }, [draftHydrated, urlStep, maxReachableStep]);

  const touchProfileField = useCallback((key: string) => {
    setProfileTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const touchContactRow = useCallback((id: string) => {
    setProfileTouched((t) => ({ ...t, [id]: true }));
  }, []);

  const touchAndValidateProfileField = useCallback(
    (key: 'name' | 'phone' | 'description') => {
      touchProfileField(key);
      const errs = computeProfileStepErrors();
      const err = errs[key];
      setProfileFieldErrors((prev) => {
        const next = { ...prev };
        if (!err || (isProfileFieldValueEmpty(key) && !step3NavigateAttempted)) delete next[key];
        else next[key] = err;
        return next;
      });
    },
    [computeProfileStepErrors, isProfileFieldValueEmpty, step3NavigateAttempted, touchProfileField],
  );

  const touchAndValidateContactRow = useCallback(
    (id: string) => {
      touchContactRow(id);
      const errs = computeProfileStepErrors();
      const err = errs[id];
      setProfileFieldErrors((prev) => {
        const next = { ...prev };
        if (!err || (isProfileFieldValueEmpty(id, id) && !step3NavigateAttempted)) delete next[id];
        else next[id] = err;
        return next;
      });
    },
    [computeProfileStepErrors, isProfileFieldValueEmpty, step3NavigateAttempted, touchContactRow],
  );

  const showProfileFieldError = useCallback(
    (key: string) => {
      const err = profileFieldErrors[key];
      if (!err) return false;
      if (isProfileFieldValueEmpty(key)) return step3NavigateAttempted;
      return Boolean(profileTouched[key] || step3NavigateAttempted);
    },
    [isProfileFieldValueEmpty, profileFieldErrors, profileTouched, step3NavigateAttempted],
  );

  const showContactRowError = useCallback(
    (id: string) => {
      const err = profileFieldErrors[id];
      if (!err) return false;
      if (isProfileFieldValueEmpty(id, id)) return step3NavigateAttempted;
      return Boolean(profileTouched[id] || step3NavigateAttempted);
    },
    [isProfileFieldValueEmpty, profileFieldErrors, profileTouched, step3NavigateAttempted],
  );

  const addClientContactRow = useCallback((type: ContactType) => {
    setClientContacts((prev) => {
      if (type === 'other') {
        if (prev.filter((r) => r.type === 'other').length >= 5) return prev;
      } else if (prev.some((r) => r.type === type)) return prev;
      return [...prev, { id: newEntityId('ct'), type, value: '' }];
    });
    setProfileFieldErrors((errs) => {
      const next = { ...errs };
      delete next.contact;
      delete next.contactReachability;
      return next;
    });
  }, []);

  const removeClientContactRow = useCallback((id: string) => {
    setClientContacts((prev) => prev.filter((r) => r.id !== id));
    setProfileFieldErrors((errs) => {
      const next = { ...errs };
      delete next[id];
      delete next.contactReachability;
      return next;
    });
    setProfileTouched((t) => {
      const next = { ...t };
      delete next[id];
      return next;
    });
  }, []);

  const updateClientContactRow = useCallback((id: string, value: string) => {
    setClientContacts((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
    setProfileFieldErrors((errs) => {
      const next = { ...errs };
      delete next[id];
      delete next.contactReachability;
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (stepTransitionBusy) return;
    setStepNavigateHint(null);

    if (step === 2) {
      if (!selectedCategoryId) {
        setCategoriesError('Выберите категорию');
        scrollToOnboardingField('category');
        setStepNavigateHint('Выберите категорию');
        return;
      }
      setCategoriesError(null);
      setStep3NavigateAttempted(false);
      setProfileFieldErrors({});
      setProfileTouched({});
      setStepTransitionBusy(true);
      goToStep(3);
      return;
    }

    if (step === 3) {
      setStep3NavigateAttempted(true);
      const errs = computeProfileStepErrors();
      setProfileFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        touchAllErrorKeys(setProfileTouched, errs);
        const field = pickFirstProfileErrorField(errs, clientContacts);
        scrollToOnboardingField(field);
        setStepNavigateHint(firstErrorMessage(errs, field === 'contacts' ? 'contactReachability' : field));
        return;
      }
      setStep3NavigateAttempted(false);
      resetAddressValidationUi();
      setStepTransitionBusy(true);
      goToStep(4);
      return;
    }

    if (step === 4) {
      setAddressNavigateAttempted(true);
      const errs = computeAddressStepErrors();
      setAddressFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        touchAllErrorKeys(setAddressTouched, errs);
        if (addressNeedsMoreSection(errs, visitType)) setAddressMoreOpen(true);
        const field = pickFirstAddressErrorField(errs, visitType);
        scrollToOnboardingField(field);
        setStepNavigateHint(firstErrorMessage(errs, field));
        return;
      }
      setAddressNavigateAttempted(false);
    }

    if (step === 5 && services.length === 0) {
      setSvcAttemptedAdd(true);
      setSvcFieldErrors({ form: 'Добавьте хотя бы одну услугу' });
      scrollToOnboardingField('services');
      setStepNavigateHint('Добавьте хотя бы одну услугу');
      return;
    }

    if (step === 5 && countActiveOnboardingServices(services) === 0) {
      setSvcFieldErrors({ form: 'Включите хотя бы одну активную услугу в списке ниже' });
      scrollToOnboardingField('services');
      setStepNavigateHint('Включите хотя бы одну активную услугу');
      return;
    }

    if (step === 5 && hasDuplicateOnboardingServices(services)) {
      setSvcFieldErrors({ form: 'Есть одинаковые услуги. Удалите дубликат или измените поля.' });
      scrollToOnboardingField('services');
      setStepNavigateHint('Удалите одинаковые услуги');
      return;
    }

    if (step === 7) {
      if (publishBlockingIssues.length > 0) {
        scrollToOnboardingField('review-issues');
        setStepNavigateHint('Исправьте пункты в списке выше');
        return;
      }
      const profileErrs = computeProfileStepErrors();
      const addressErrs = computeAddressStepErrors();
      if (Object.keys(profileErrs).length > 0 || Object.keys(addressErrs).length > 0) {
        setProfileFieldErrors(profileErrs);
        setAddressFieldErrors(addressErrs);
        setStep3NavigateAttempted(true);
        setAddressNavigateAttempted(true);
        touchAllErrorKeys(setProfileTouched, profileErrs);
        touchAllErrorKeys(setAddressTouched, addressErrs);
        if (addressNeedsMoreSection(addressErrs, visitType)) setAddressMoreOpen(true);
        if (Object.keys(profileErrs).length > 0) {
          const field = pickFirstProfileErrorField(profileErrs, clientContacts);
          scrollToOnboardingField(field);
          setStepNavigateHint(firstErrorMessage(profileErrs, field === 'contacts' ? 'contactReachability' : field));
        } else {
          const field = pickFirstAddressErrorField(addressErrs, visitType);
          scrollToOnboardingField(field);
          setStepNavigateHint(firstErrorMessage(addressErrs, field));
        }
        setPublishError('Проверьте поля профиля и адреса.');
        return;
      }
      setPublishError(null);
    }

    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return next;
    });
    setAddressFieldErrors({});
    setCertFieldErrors({});
    setStepNavigateHint(null);
    setStepTransitionBusy(true);
    goToStep(step + 1);
  }, [
    clientContacts,
    computeAddressStepErrors,
    computeProfileStepErrors,
    goToStep,
    publishBlockingIssues.length,
    resetAddressValidationUi,
    selectedCategoryId,
    services.length,
    step,
    stepTransitionBusy,
    visitType,
  ]);

  const goBack = useCallback(() => {
    goToStep(step - 1, { replaceUrl: false });
    setStepNavigateHint(null);
    setPublishError(null);
    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return next;
    });
    if (step === 3 || step === 4) {
      setStep3NavigateAttempted(false);
      setProfileFieldErrors({});
      setProfileTouched({});
    }
    setAddressFieldErrors({});
    setAddressTouched({});
    setAddressNavigateAttempted(false);
    setCertFieldErrors({});
  }, [goToStep, step]);

  const executePublishAndFinish = useCallback(
    async (redirectToCheckout: boolean) => {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (!cat) {
        setPublishError('Выберите категорию заново.');
        return;
      }

      let photoUrl: string | null = null;
      const photoRaw = profileAvatarUrl?.trim() || profile?.avatar_url?.trim();
      if (photoRaw && isOnboardingAvatarPhotoUrl(photoRaw)) {
        try {
          photoUrl = new URL(photoRaw).toString();
        } catch {
          photoUrl = null;
        }
      }

      setSaving(true);
      setPublishError(null);

      try {
        const { payload: certPayload, pendingLocalBySortOrder } =
          buildOnboardingCertificatePayload(certificates);

        const contactItems = clientContacts
          .map((r) => ({ type: r.type, value: r.value.trim() }))
          .filter((c) => c.value.length > 0);
        const phoneNorm = phone.trim() ? normalizeBelarusPhone(phone.trim()) : null;

        const onboardingResult = await submitMasterOnboarding({
          categoryCode: cat.code,
          name: name.trim(),
          description: description.trim() || undefined,
          phone: phoneNorm,
          contacts: contactItems.length ? contactItems : null,
          contact: contactsToLegacyContactLine(contactItems) || null,
          photoUrl,
          location: {
            visitType,
            city: city.trim(),
            street: street.trim(),
            building: building.trim() || (street.trim() ? 'б/н' : ''),
            buildingDetail: houseDetail.trim() || null,
            salonName: visitType === 'studio' ? salonName.trim() || null : null,
            district: null,
            showExactAddressAfterBooking: visitType === 'at_home' ? showExactAddressAfterBooking : false,
            entrance: entrance.trim() || null,
            floor: floor.trim() || null,
            room: room.trim() || null,
            intercom: intercom.trim() || null,
            landmark: landmark.trim() || null,
            directions: directions.trim() || null,
            clientNote: clientNote.trim() || null,
            publicAddress: publicAddressForApi,
            lat: typeof lat === 'number' && Number.isFinite(lat) ? lat : null,
            lng: typeof lng === 'number' && Number.isFinite(lng) ? lng : null,
          },
          scheduleRules: DEFAULT_WEEKDAY_SCHEDULE.map((r) => ({ ...r, isActive: true })),
          services: services.map((s, i) => ({
            title: s.title,
            description: (s.description ?? '').trim().slice(0, 1000),
            durationMinutes: s.durationMin,
            priceAmount: s.priceByn,
            priceType: s.priceType ?? 'fixed',
            sortOrder: i,
            isActive: s.isActive !== false,
          })),
          certificates: certPayload,
          masterPlan: 'basic',
          proInterested: redirectToCheckout,
          proCheckoutIntent: redirectToCheckout,
        });

        if (pendingLocalBySortOrder.size > 0) {
          const created = (onboardingResult.certificates ?? []) as Array<{
            id: string;
            sortOrder?: number;
          }>;
          await uploadPendingOnboardingCertificatePhotos(created, pendingLocalBySortOrder);
        }

        const educationPayload = sortEducationItemsChronologically(educationItems)
          .filter((item) => item.title.trim().length >= 2)
          .map((item, sortOrder) => ({ item, sortOrder }));

        if (educationPayload.length > 0) {
          for (const { item, sortOrder } of educationPayload) {
            await createCareerItem({
              type: 'education',
              title: item.title.trim(),
              place: item.place.trim(),
              startYear: item.startYear?.trim() ? Number.parseInt(item.startYear.trim(), 10) : null,
              endYear: item.endYear?.trim() ? Number.parseInt(item.endYear.trim(), 10) : null,
              description: item.description?.trim().slice(0, 500) || null,
              sortOrder,
            });
          }
        }

        await refreshProfile();
        clearDraft();

        if (redirectToCheckout) {
          setCheckoutLoading(true);
          const origin = readPublicAppOrigin();
          const result = await createBillingCheckout({
            billingPackageMonths: 1,
            returnUrl: `${origin}${PAYMENT_SUCCESS_PATH}?from=onboarding`,
            consentAccepted: true,
          });
          setProConsentOpen(false);
          window.location.assign(result.paymentUrl);
          return;
        }

        setSuccess(true);
      } catch (e) {
        setPublishError(
          redirectToCheckout
            ? formatBillingUserError(e, BILLING_COPY.checkoutFailed)
            : 'Не удалось опубликовать профиль',
        );
      } finally {
        setSaving(false);
        setCheckoutLoading(false);
      }
    },
    [
      categories,
      certificates,
      educationItems,
      city,
      clientContacts,
      clientNote,
      description,
      directions,
      entrance,
      floor,
      houseDetail,
      intercom,
      landmark,
      lat,
      lng,
      name,
      phone,
      profile?.avatar_url,
      profileAvatarUrl,
      publicAddressForApi,
      refreshProfile,
      clearDraft,
      room,
      salonName,
      selectedCategoryId,
      services,
      showExactAddressAfterBooking,
      street,
      visitType,
      building,
    ],
  );

  const publish = useCallback(async () => {
    if (step !== 8) return;

    if (!isAuthenticated) {
      setPublishError('Войдите через Google, Telegram или email, чтобы опубликовать профиль.');
      return;
    }
    if (!getApiBaseUrl()) {
      setPublishError('Сейчас нельзя опубликовать профиль. Попробуйте позже.');
      return;
    }

    if (!categories.find((c) => c.id === selectedCategoryId)) {
      setPublishError('Выберите категорию заново.');
      return;
    }

    if (!validateProfileStep() || !validateAddressStep()) {
      setPublishError('Проверьте поля профиля и адреса.');
      return;
    }

    if (
      collectPublishBlockingIssues({
        name,
        publicAddressForApi,
        services,
        clientContacts,
        selectedCategoryId,
        phone,
      }).length > 0
    ) {
      return;
    }

    if (tariffSelection === 'pro_purchase') {
      setProConsentOpen(true);
      return;
    }

    if (exceedsFreeActiveServiceLimit(activeServiceCount)) {
      setFreeLimitSheetOpen(true);
      return;
    }

    await executePublishAndFinish(false);
  }, [
    activeServiceCount,
    categories,
    clientContacts,
    executePublishAndFinish,
    isAuthenticated,
    name,
    phone,
    publicAddressForApi,
    selectedCategoryId,
    services,
    step,
    tariffSelection,
    validateAddressStep,
    validateProfileStep,
  ]);

  if (success) {
    return (
      <OnboardingPublishSuccess
        masterName={name}
        onOpenProfile={() => navigateAfterPublish(navigate, profile?.id)}
      />
    );
  }

  return (
    <div
      className={`min-h-dvh overflow-x-hidden text-neutral-900 lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden ${
        step === 1
          ? 'bg-white pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:bg-[#F5F5F5] lg:pb-0'
          : 'bg-white pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0'
      }`}
    >
      <header className="sticky top-0 z-40 shrink-0 bg-[#F1EFEF] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] lg:fixed lg:inset-x-0 lg:top-0 lg:border-b lg:border-[#EBEBEB] lg:bg-[#FFFCFC]/95 lg:backdrop-blur-md">
        <div className={`${ONBOARDING_PAGE_WRAP} pb-3`}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {step === 1 ? (
              <Link
                to={HUB_PATH}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-semibold leading-tight text-neutral-900 shadow-none transition hover:opacity-90 active:opacity-80 sm:px-3.5 sm:text-[14px]"
              >
                На главную
              </Link>
            ) : (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/90 px-3.5 py-2 text-[14px] font-semibold text-neutral-900 shadow-none transition active:opacity-80"
              >
                Назад
              </button>
            )}

            <div className="flex shrink-0 items-center gap-2">
              {!authLoading && isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-semibold leading-tight text-[#B91C1C] shadow-none transition hover:bg-[#FEE2E2] active:opacity-80 sm:px-3.5 sm:text-[14px]"
                >
                  Выйти
                </button>
              ) : null}
              <span className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-white/90 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums leading-none text-neutral-600 shadow-none sm:px-3">
                {step} / {TOTAL_STEPS}
              </span>
            </div>
          </div>

          <div
            className="mt-3 flex gap-1 sm:mt-3.5 sm:gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={success ? TOTAL_STEPS : step}
            aria-label={`Шаг ${success ? TOTAL_STEPS : step} из ${TOTAL_STEPS}`}
          >
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const filled = success || step > i;
              return (
                <div
                  key={i}
                  className={`h-2 min-w-0 flex-1 rounded-full transition-colors duration-300 ease-out ${
                    filled ? 'bg-[#E29595]' : 'bg-neutral-300'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </header>

      <main
        className={`min-h-0 flex-1 lg:overflow-y-auto lg:pt-[calc(5.25rem+env(safe-area-inset-top,0px))] ${
          step > 1 ? (step === 7 ? 'lg:pb-[7.5rem]' : 'lg:pb-[6.5rem]') : ''
        }`}
      >
      {step >= 2 && backendConfigured && !authLoading ? (
        <div className={`${ONBOARDING_PAGE_WRAP} space-y-2 pt-3`}>
          {isAuthenticated ? (
            <OnboardingAccountBar profile={profile} onLogout={logout} />
          ) : (
            <OnboardingAuthGate onAuthenticated={() => void refreshProfile()} />
          )}
        </div>
      ) : step >= 2 && !backendConfigured ? (
        <div className={`${ONBOARDING_PAGE_WRAP} space-y-2 pt-3`}>
          <p className="rounded-[18px] bg-[#FFF4E8] px-4 py-3 text-[13px] font-semibold leading-snug text-[#B66A24]">
            Не задан <span className="font-mono text-[12px]">VITE_API_URL</span> — категории и публикация профиля не заработают, пока не подключите бэкенд.
          </p>
        </div>
      ) : null}

      <div className={`${ONBOARDING_PAGE_WRAP} ${step === 1 ? 'pt-2 sm:pt-3 lg:pt-4' : 'pt-4'}`}>
        <div
          className={`min-w-0 transition-colors duration-500 ${
            step === 1 || step === 2 || step === 4 || step === 5 || step === 6 || step === 7
              ? 'rounded-[42px] bg-[#F1EFEF] p-2 shadow-[0_24px_70px_rgba(17,17,17,0.06)] sm:p-2.5 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none'
              : 'rounded-[42px] bg-[#F1EFEF] p-2.5 shadow-[0_24px_70px_rgba(17,17,17,0.06)] sm:p-3'
          }`}
        >
          <div
            className={`relative z-10 min-w-0 transition-[background,box-shadow] duration-500 ${
              step === 2 || step === 4 || step === 5 || step === 6 || step === 7
                ? 'overflow-visible'
                : 'overflow-hidden'
            } ${
              step === 1 || step === 2 || step === 4 || step === 5 || step === 6 || step === 7
                ? `rounded-[34px] bg-white ${step === 2 ? '' : 'shadow-[0_10px_30px_rgba(17,17,17,0.035)]'} lg:rounded-[16px] ${step === 2 ? 'lg:shadow-none' : 'lg:shadow-[0_8px_40px_rgba(17,17,17,0.06)]'} ` +
                  (step === 1
                    ? 'px-3 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-8 lg:pt-8'
                    : step === 7
                      ? 'px-0 py-0 sm:px-0 sm:py-0 lg:px-0 lg:py-0'
                      : 'px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8')
                : 'rounded-[34px] bg-white px-3 py-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:px-6 sm:py-6'
            }`}
            style={step === 2 && step2CategoryTheme ? { background: 'transparent' } : undefined}
          >
            {step === 1 ? (
              <div className="w-full">
                <OnboardingStep1Intro onStart={() => goToStep(2)} />
              </div>
            ) : null}

            {step === 2 ? (
              <OnboardingStep2Categories
                categories={categories}
                categoriesReady={categoriesReady}
                categoriesError={categoriesError}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={trySelectCategory}
              />
            ) : null}

            {step === 3 ? (
              <OnboardingStep3Profile
                name={name}
                onNameChange={(v) => {
                  setName(v);
                  setProfileFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }}
                onNameBlur={() => touchAndValidateProfileField('name')}
                nameError={showProfileFieldError('name') ? profileFieldErrors.name : undefined}
                description={description}
                onDescriptionChange={(v) => {
                  setDescription(v);
                  setProfileFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  });
                }}
                onDescriptionBlur={() => touchAndValidateProfileField('description')}
                descriptionError={
                  showProfileFieldError('description') ? profileFieldErrors.description : undefined
                }
                phone={phone}
                onPhoneChange={(v) => {
                  setPhone(sanitizeBelarusPhoneInput(v));
                  setProfileFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    delete next.contactReachability;
                    return next;
                  });
                }}
                onPhoneBlur={() => touchAndValidateProfileField('phone')}
                phoneError={showProfileFieldError('phone') ? profileFieldErrors.phone : undefined}
                clientContacts={clientContacts}
                onAddContact={addClientContactRow}
                onChangeContact={updateClientContactRow}
                onRemoveContact={removeClientContactRow}
                onBlurContact={touchAndValidateContactRow}
                contactRowErrors={profileFieldErrors}
                showContactRowError={showContactRowError}
                contactReachabilityError={profileFieldErrors.contactReachability}
                showContactReachabilityError={step3NavigateAttempted}
                isAuthenticated={isAuthenticated}
                profileAvatarUrl={profileAvatarUrl}
                telegramPhotoUrl={telegramUserPhotoUrl ?? telegramUserPreview?.photoUrl ?? null}
                onAvatarUpdated={refreshProfile}
              />
            ) : null}

            {step === 4 ? (
              <OnboardingStep4Address
                city={ONBOARDING_CITY}
                visitType={visitType}
                onVisitTypeChange={(type) => {
                  setVisitType(type);
                  setAddressFieldErrors({});
                  setAddressNavigateAttempted(false);
                }}
                salonName={salonName}
                onSalonNameChange={(v) => {
                  setSalonName(v);
                  setAddressFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.salonName;
                    return next;
                  });
                }}
                onSalonNameBlur={() => touchAndValidateAddressField('salonName')}
                salonNameError={showAddressFieldError('salonName') ? addressFieldErrors.salonName : undefined}
                street={street}
                onStreetChange={(v) => {
                  invalidatePrimaryAddressOnMap();
                  setStreet(v);
                  setAddressFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.street;
                    return next;
                  });
                }}
                onStreetBlur={() => touchAndValidateAddressField('street')}
                streetError={showAddressFieldError('street') ? addressFieldErrors.street : undefined}
                coordsError={showAddressFieldError('coords') ? addressFieldErrors.coords : undefined}
                lat={lat}
                lng={lng}
                pickedAddressSummary={pickedAddressSummary}
                addressPinnedToMap={addressPinnedToMap}
                mapScriptOk={mapScriptOk}
                onMapAvailabilityChange={(ok) => setMapScriptOk(ok)}
                onInvalidateAddressOnMap={invalidatePrimaryAddressOnMap}
                onMapPick={(result) => {
                  setPickedAddressSummary(result.addressLine);
                  setAddressPinnedToMap(true);
                  setStreet(result.addressLine.trim());
                  setBuilding('б/н');
                  setLat(result.lat);
                  setLng(result.lng);
                  setAddressFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.street;
                    delete next.coords;
                    return next;
                  });
                }}
                floor={floor}
                onFloorChange={(v) => {
                  if (visitType === 'at_home') setFloor(sanitizeAtHomeFloorInput(v));
                  else setFloor(v);
                }}
                onFloorBlur={() =>
                  visitType === 'at_home' ? touchAndValidateAddressField('floor') : touchAddressField('floor')
                }
                floorError={showAddressFieldError('floor') ? addressFieldErrors.floor : undefined}
                room={room}
                onRoomChange={(v) => {
                  setRoom(visitType === 'at_home' ? sanitizeAtHomeRoomInput(v) : v.slice(0, 80));
                }}
                onRoomBlur={() =>
                  visitType === 'at_home' ? touchAndValidateAddressField('room') : touchAddressField('room')
                }
                roomError={showAddressFieldError('room') ? addressFieldErrors.room : undefined}
                showExactAddressAfterBooking={showExactAddressAfterBooking}
                onShowExactAddressAfterBookingChange={setShowExactAddressAfterBooking}
                addressMoreOpen={addressMoreOpen}
                onToggleAddressMore={() => setAddressMoreOpen((v) => !v)}
                houseDetail={houseDetail}
                onHouseDetailChange={(v) => {
                  setHouseDetail(v);
                  setAddressFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.houseDetail;
                    return next;
                  });
                }}
                onHouseDetailBlur={() => touchAddressField('houseDetail')}
                houseDetailError={showAddressFieldError('houseDetail') ? addressFieldErrors.houseDetail : undefined}
                entrance={entrance}
                onEntranceChange={(v) => {
                  setEntrance(v.slice(0, AT_HOME_ENTRANCE_MAX));
                  setAddressFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.entrance;
                    return next;
                  });
                }}
                onEntranceBlur={() => touchAndValidateAddressField('entrance')}
                entranceError={showAddressFieldError('entrance') ? addressFieldErrors.entrance : undefined}
                intercom={intercom}
                onIntercomChange={(v) => {
                  setIntercom(v.slice(0, visitType === 'at_home' ? AT_HOME_INTERCOM_MAX : 80));
                  setAddressFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.intercom;
                    return next;
                  });
                }}
                onIntercomBlur={() =>
                  visitType === 'at_home'
                    ? touchAndValidateAddressField('intercom')
                    : touchAddressField('intercom')
                }
                intercomError={showAddressFieldError('intercom') ? addressFieldErrors.intercom : undefined}
                directions={directions}
                onDirectionsChange={setDirections}
                onDirectionsBlur={() => touchAddressField('directions')}
                directionsError={showAddressFieldError('directions') ? addressFieldErrors.directions : undefined}
                clientNote={clientNote}
                onClientNoteChange={setClientNote}
                onClientNoteBlur={() => touchAddressField('clientNote')}
                clientNoteError={showAddressFieldError('clientNote') ? addressFieldErrors.clientNote : undefined}
                locationDraft={locationDraft}
              />
            ) : null}
            {step === 5 ? (
                <OnboardingStep5Services
                  categoryCode={effectiveCategoryCode || undefined}
                  categoryLabel={effectiveCategoryLabel || undefined}
                  serviceTitlePlaceholder={getServiceTitlePlaceholder(effectiveCategoryCode)}
                  templateHighlightId={svcHighlightId}
                  onTemplateSelect={applyServiceTemplate}
                  title={svcTitle}
                  onTitleChange={(value) => {
                    setSvcHighlightId(null);
                    setSvcTitle(value);
                  }}
                  onTitleBlur={() => touchSvcField('title')}
                  titleError={showSvcFieldError('title') ? svcFieldErrors.title : undefined}
                  duration={svcDur}
                  onDurationChange={setSvcDur}
                  onDurationBlur={() => touchSvcField('duration')}
                  durationError={showSvcFieldError('duration') ? svcFieldErrors.duration : undefined}
                  price={svcPrice}
                  onPriceChange={setSvcPrice}
                  onPriceBlur={() => touchSvcField('price')}
                  priceError={showSvcFieldError('price') ? svcFieldErrors.price : undefined}
                  priceType={svcPriceType}
                  onPriceTypeChange={setSvcPriceType}
                  pricePreviewLabel={svcPricePreviewLabel}
                  description={svcDesc}
                  onDescriptionChange={setSvcDesc}
                  onDescriptionBlur={() => touchSvcField('description')}
                  descriptionError={showSvcFieldError('description') ? svcFieldErrors.description : undefined}
                  formError={svcFieldErrors.form}
                  editingId={svcEditingId}
                  onSubmit={submitServiceForm}
                  onCancelEdit={cancelSvcForm}
                  services={services}
                  onStartEditService={startEditService}
                  onRemoveService={removeService}
                  onToggleServiceActive={toggleServiceActive}
                  addDisabled={serviceAddLimitReached}
                  addDisabledHint={
                    serviceAddLimitReached
                      ? `Достигнут лимит ${ONBOARDING_MAX_SERVICES} услуг. Удалите услугу, чтобы добавить другую.`
                      : undefined
                  }
                />
            ) : null}

            {step === 6 ? (
              <OnboardingStep6Trust
                certificates={certificates}
                educationItems={educationItems}
                onEducationChange={setEducationItems}
                certFormVisible={certFormVisible}
                certEditingId={certEditingId}
                onOpenCertFormForAdd={openCertFormForAdd}
                onCancelCertForm={cancelCertForm}
                onSubmitCertificateForm={submitCertificateForm}
                certTitle={certTitle}
                onCertTitleChange={setCertTitle}
                onCertTitleBlur={() => touchCertField('title')}
                certTitleError={showCertFieldError('title') ? certFieldErrors.title : undefined}
                certOrganization={certOrganization}
                onCertOrganizationChange={setCertOrganization}
                onCertOrganizationBlur={() => touchCertField('organization')}
                certOrganizationError={
                  showCertFieldError('organization') ? certFieldErrors.organization : undefined
                }
                certYear={certYear}
                onCertYearChange={setCertYear}
                onCertYearBlur={() => touchCertField('year')}
                certYearError={showCertFieldError('year') ? certFieldErrors.year : undefined}
                certDesc={certDesc}
                onCertDescChange={setCertDesc}
                onCertDescBlur={() => touchCertField('description')}
                certDescError={showCertFieldError('description') ? certFieldErrors.description : undefined}
                certImageUrl={certImageUrl}
                onCertImageFileChange={handleCertImageFileChange}
                onClearCertPhoto={clearCertPhoto}
                certPhotoUploading={certPhotoUploading}
                certPhotoUploadErr={certPhotoUploadErr}
                certPhotoError={showCertFieldError('photo') ? certFieldErrors.photo : undefined}
                onStartEditCertificate={startEditCertificate}
                onRemoveCertificate={removeCertificate}
              />
            ) : null}

            {step === 7 ? (
              <>
                <div className="px-3 pt-4 sm:px-6 lg:px-8 lg:pt-6">
                  <StepTitle
                    eyebrow="Проверка"
                    title="Проверьте профиль"
                    text="Так клиенты увидят вашу карточку после публикации"
                  />
                </div>
                <OnboardingStep7Review
                  name={name}
                  description={description}
                  phone={phone}
                  clientContacts={clientContacts}
                  location={locationDraft}
                  services={services}
                  categoryName={selectedCategory?.name ?? ''}
                  categoryCode={selectedCategory?.code ?? ''}
                  photoUrl={profileAvatarUrl}
                  certificates={certificates}
                  educationItems={educationItems}
                />
              </>
            ) : step === 8 ? (
              <>
                <StepTitle
                  eyebrow="Тариф"
                  title="Выберите тариф"
                  text={ONBOARDING_PLAN_COPY.tariffStepLead}
                />

                {publishError ? (
                  <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                    {publishError}
                  </p>
                ) : null}

                {exceedsFreeActiveServiceLimit(activeServiceCount) && tariffSelection === 'basic' ? (
                  <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[13px] font-medium leading-snug text-[#B66A24]">
                    {ONBOARDING_PLAN_COPY.tariffFreeOverLimit}
                  </p>
                ) : null}

                {services.length > ONBOARDING_BASIC_MAX_SERVICES && tariffSelection === 'pro_purchase' ? (
                  <p className="mt-4 rounded-[22px] bg-[#F0FAF4] px-4 py-3 text-[13px] font-medium leading-snug text-[#2D6A4F]">
                    {ONBOARDING_PLAN_COPY.tariffProSelected(services.length)}
                  </p>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
                  <div
                    className={`flex flex-col rounded-[26px] border bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] transition ${
                      tariffSelection === 'basic' ? 'border-[#E29595]/55 ring-1 ring-[#E29595]/25' : 'border-neutral-100'
                    }`}
                  >
                    <p className={onboardingEyebrowClass}>Тариф</p>
                    <p className={`mt-1 text-[18px] ${onboardingPreviewTitleClass}`}>{ONBOARDING_PLAN_COPY.tariffFreeName}</p>
                    <p className="mt-1 text-[20px] font-semibold text-[#E29595]">{ONBOARDING_PLAN_COPY.tariffFreePrice}</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">{ONBOARDING_PLAN_COPY.tariffFreeTagline}</p>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-[12px] font-medium leading-snug text-neutral-700">
                      <li>до {ONBOARDING_BASIC_MAX_SERVICES} активных услуг</li>
                      <li>базовая онлайн-запись</li>
                      <li>профиль мастера</li>
                      <li>базовое расписание</li>
                      <li>базовая поддержка</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        if (exceedsFreeActiveServiceLimit(activeServiceCount)) {
                          setFreeLimitSheetOpen(true);
                          return;
                        }
                        setTariffSelection('basic');
                      }}
                      disabled={exceedsFreeActiveServiceLimit(activeServiceCount)}
                      className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-3 text-[14px] font-semibold text-neutral-900 transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ONBOARDING_PLAN_COPY.tariffFreeCta}
                    </button>
                    {exceedsFreeActiveServiceLimit(activeServiceCount) ? (
                      <p className="mt-2 text-center text-[11px] font-medium leading-snug text-[#B66A24]">
                        {ONBOARDING_PLAN_COPY.tariffFreeBlocked}
                      </p>
                    ) : null}
                  </div>

                  <div
                    className={`relative flex flex-col rounded-[26px] border bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] transition ${
                      tariffSelection === 'pro_purchase'
                        ? 'border-[#E29595]/55 ring-1 ring-[#E29595]/25'
                        : 'border-neutral-100'
                    }`}
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-[#FFF4F4] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-[#C96B6B]">
                      Для роста
                    </span>
                    <p className={onboardingEyebrowClass}>Тариф</p>
                    <p className={`mt-1 text-[18px] ${onboardingPreviewTitleClass}`}>Pro</p>
                    <p className="mt-1 text-[15px] font-semibold text-neutral-700">{proOnboardingPriceLabel}</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Оплата картой через bePaid</p>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-[12px] font-medium leading-snug text-neutral-700">
                      <li>больше услуг</li>
                      <li>выше в поиске</li>
                      <li>бейдж Pro</li>
                      <li>акции и скидки</li>
                      <li>расширенная статистика</li>
                      <li>больше фото работ</li>
                      <li>приоритетная поддержка</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => setTariffSelection('pro_purchase')}
                      className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#E29595] px-3 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
                    >
                      {ONBOARDING_PLAN_COPY.tariffProCta}
                    </button>
                  </div>
                </div>

                <p className="mt-5 text-center text-[12px] font-medium leading-snug text-neutral-500">
                  Тариф можно изменить позже в кабинете мастера
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
      </main>

      {step > 1 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 shrink-0 border-t border-neutral-200 bg-white px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4 lg:z-40 lg:bg-white/95 lg:backdrop-blur-md">
          <div className={ONBOARDING_PAGE_WRAP}>
            {stepNavigateHint ? (
              <p className="mb-2 rounded-[18px] bg-[#FFF4E8] px-3 py-2.5 text-center text-[13px] font-semibold leading-snug text-[#B66A24]">
                {stepNavigateHint}
              </p>
            ) : null}
            {step === 7 && publishBlockingIssues.length > 0 ? (
              <div
                data-onboarding-field="review-issues"
                className="mb-2 scroll-mt-28 rounded-[18px] border border-[#F0D6CC] bg-[#FFF9F7] px-3 py-2.5 lg:scroll-mt-32"
              >
                <p className="text-center text-[13px] font-semibold text-[#8B4B3B]">Проверьте данные перед продолжением</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[12px] font-medium text-neutral-700">
                  {publishBlockingIssues.map((issue) => (
                    <li key={issue.id}>{issue.message}</li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {publishBlockingIssues.some((i) => i.fixStep === 3) ? (
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#E29595] shadow-sm transition active:scale-[0.98]"
                    >
                      Исправить профиль
                    </button>
                  ) : null}
                  {publishBlockingIssues.some((i) => i.fixStep === 4) ? (
                    <button
                      type="button"
                      onClick={() => goToStep(4)}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#E29595] shadow-sm transition active:scale-[0.98]"
                    >
                      Исправить адрес
                    </button>
                  ) : null}
                  {publishBlockingIssues.some((i) => i.fixStep === 5) ? (
                    <button
                      type="button"
                      onClick={() => goToStep(5)}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#E29595] shadow-sm transition active:scale-[0.98]"
                    >
                      Исправить услуги
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {step === TOTAL_STEPS && !authLoading && !isAuthenticated ? (
              <p className="mb-2 rounded-[18px] bg-[#FFF4E8] px-3 py-2.5 text-center text-[13px] font-semibold leading-snug text-[#B66A24]">
                Чтобы опубликовать профиль,{' '}
                <a href="#onboarding-auth-gate" className="underline underline-offset-2">
                  войдите через Google, Telegram или email
                </a>
                .
              </p>
            ) : null}
            {step === TOTAL_STEPS && freeServiceLimitBlocksPublish ? (
              <p className="mb-2 rounded-[18px] bg-[#FFF4E8] px-3 py-2.5 text-center text-[13px] font-semibold leading-snug text-[#B66A24]">
                {ONBOARDING_PLAN_COPY.tariffFreeBlocked}
              </p>
            ) : null}
            {serverPaymentHint && (step === 7 || step === TOTAL_STEPS) ? (
              <p className="mb-2 rounded-[18px] bg-[#EEF6FF] px-3 py-2.5 text-center text-[13px] font-semibold leading-snug text-[#1D4ED8]">
                {serverPaymentHint}
              </p>
            ) : null}
            {step === TOTAL_STEPS ? (
              <p className="mb-2 rounded-[18px] bg-[#F3F4F6] px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-[#4B5563]">
                {ONBOARDING_PLAN_COPY.profileDraftNotice}
              </p>
            ) : null}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={stepTransitionBusy}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 6 && certificates.length === 0 && educationItems.length === 0
                  ? 'Пропустить'
                  : 'Дальше'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void publish()}
                disabled={
                  saving ||
                  checkoutLoading ||
                  publishBlockingIssues.length > 0 ||
                  freeServiceLimitBlocksPublish ||
                  !selectedCategoryId ||
                  !isAuthenticated ||
                  !getApiBaseUrl()
                }
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? 'Публикуем…'
                  : checkoutLoading
                    ? 'Переход к оплате…'
                    : tariffSelection === 'pro_purchase'
                      ? ONBOARDING_PLAN_COPY.tariffPublishPro
                      : ONBOARDING_PLAN_COPY.tariffPublishFree}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {proConsentOpen ? (
        <ProSubscriptionConsentModal
          open={proConsentOpen}
          onClose={() => {
            if (!saving && !checkoutLoading) setProConsentOpen(false);
          }}
          amountLabel={proCheckoutPriceLabel}
          packageMonths={1}
          loading={saving || checkoutLoading}
          contextHint={ONBOARDING_PLAN_COPY.tariffProConsentHint(services.length)}
          onConfirm={() => void executePublishAndFinish(true)}
        />
      ) : null}

      <OnboardingFreeLimitSheet
        open={freeLimitSheetOpen}
        activeCount={activeServiceCount}
        onClose={() => setFreeLimitSheetOpen(false)}
        onChoosePro={() => {
          setFreeLimitSheetOpen(false);
          setTariffSelection('pro_purchase');
          setProConsentOpen(true);
        }}
        onAdjustServices={() => {
          setFreeLimitSheetOpen(false);
          goToStep(5);
        }}
      />

      {categoryChangeConfirmOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_24px_70px_rgba(17,17,17,0.18)]">
            <h3 className="text-[17px] font-semibold tracking-normal text-neutral-950">
              Проверьте услуги после смены категории
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
              Некоторые услуги могут не подходить новой категории. После изменения проверьте прайс.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setCategoryChangeConfirmOpen(false);
                  setCategoryChangePendingId(null);
                }}
                className="min-h-12 flex-1 rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800"
              >
                Оставить текущую
              </button>
              <button
                type="button"
                onClick={() => {
                  if (categoryChangePendingId) applyCategorySelection(categoryChangePendingId);
                  setCategoryChangeConfirmOpen(false);
                  setCategoryChangePendingId(null);
                }}
                className="min-h-12 flex-1 rounded-full bg-[#E29595] text-[15px] font-semibold text-white"
              >
                Изменить категорию
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}