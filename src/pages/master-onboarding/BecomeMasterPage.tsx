import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BY } from 'country-flag-icons/react/1x1';
import { ADMIN_PATH, getMasterPath, HUB_PATH } from '../../app/paths';
import { priceForPlan } from '../../features/billing/model/masterPlans';
import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import type { MasterLocation, MasterVisitType } from '../../features/profile/model/masterLocation';
import {
  formatHomePublicBeforeBooking,
  formatHomeAfterBookingMainLine,
  homeAfterBookingDetailLines,
  formatCityWithAddressLine,
  formatStoredPublicAddress,
  masterVisitTypeLabel,
} from '../../features/profile/model/masterLocation';
import { OnboardingAddressMap } from './OnboardingAddressMap';
import { OnboardingStep1Intro } from './OnboardingStep1Intro';
import { useAuth } from '../../features/auth/AuthProvider';
import { useTelegram } from '../../shared/hooks/useTelegram';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { LoadingVideo } from '../../shared/ui/LoadingVideo';
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
import { MasterProfileContactsBlock } from './MasterProfileContactsBlock';
import {
  getServiceTemplatesForCategoryCode,
  templatePriceTypeToApp,
  type ServiceTemplate,
} from '../../constants/serviceTemplates';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import { parseHttpsCertificateImageUrl } from '../../features/master-onboarding/model/masterCertificate';
import type { MasterPlanSelection } from '../../features/master-onboarding/model/masterOnboardingPlanTypes';

const TOTAL_STEPS = 8;
const ONBOARDING_PAGE_WRAP =
  'mx-auto w-full min-w-0 max-w-2xl px-3 sm:px-4 lg:max-w-[1320px] lg:px-6 xl:px-10';
const ONBOARDING_CITY = 'Минск';
const FINISH_ILLUSTRATION_SRC = '/photos/finish.webp';

type PriceType = 'fixed' | 'from';

type OnboardingService = MasterOnboardingService & {
  priceType?: PriceType;
  isActive?: boolean;
  sortOrder?: number;
};

/** Пути как на главной (`HomeCategories`): `public/photos/work/`. */
const CATEGORY_IMAGES: Record<string, string> = {
  manicure: '/photos/work/manicure.webp',
  barbers: '/photos/work/barbers.webp',
  'brows-lashes': '/photos/work/brows_lashes.webp',
  massage: '/photos/work/massage.webp',
  fitness: '/photos/work/fitness.webp',
  tattoo: '/photos/work/tattoo.webp',
};

const CATEGORY_HINTS: Record<string, string> = {
  manicure: 'Ногти и уход',
  barbers: 'Стрижки и борода',
  'brows-lashes': 'Брови и ресницы',
  massage: 'Расслабление',
  fitness: 'Тренировки',
  tattoo: 'Тату и эскизы',
};

const VISIT_TYPES: MasterVisitType[] = ['studio', 'at_home'];

const AT_HOME_ENTRANCE_MAX = 10;
const AT_HOME_ROOM_MAX = 20;
const AT_HOME_INTERCOM_MAX = 20;

function sanitizeAtHomeFloorInput(raw: string): string {
  let s = raw.replace(/[^\d-]/g, '');
  if (!s.includes('-')) return s.slice(0, 2);
  const negative = s.startsWith('-');
  const digits = s.replace(/-/g, '').slice(0, 2);
  return negative ? `-${digits}` : digits.slice(0, 2);
}

function validateAtHomeEntrance(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите подъезд';
  if (t.length > AT_HOME_ENTRANCE_MAX) return `Не длиннее ${AT_HOME_ENTRANCE_MAX} символов`;
  if (!/^[\dа-яА-Яa-zA-Z/-]+$/u.test(t)) return 'Только цифры и буквы';
  return null;
}

function validateAtHomeFloor(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите этаж';
  if (!/^-?\d{1,2}$/.test(t)) return 'Укажите этаж числом, например 3';
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < -3 || n > 99) return 'Этаж от −3 до 99';
  if (t === '0' || t === '-0') return 'Укажите этаж от −3 до 99';
  return null;
}

function validateAtHomeRoom(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите квартиру';
  if (t.length > AT_HOME_ROOM_MAX) return `Не длиннее ${AT_HOME_ROOM_MAX} символов`;
  if (!/^[\dа-яА-Яa-zA-Z/-]+$/u.test(t)) return 'Только цифры и буквы';
  return null;
}

function validateAtHomeIntercom(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Укажите код домофона';
  if (t.length > AT_HOME_INTERCOM_MAX) return `Не длиннее ${AT_HOME_INTERCOM_MAX} символов`;
  if (!/^[\dа-яА-Яa-zA-Z#*+\s-]+$/u.test(t)) return 'Недопустимые символы в коде';
  return null;
}

/** Для «На дому»: подъезд, этаж, квартира и домофон обязательны и проходят проверку формата. */
function isAtHomeAddressDetailsComplete(
  entrance: string,
  floor: string,
  room: string,
  intercom: string,
): boolean {
  return (
    validateAtHomeEntrance(entrance) === null &&
    validateAtHomeFloor(floor) === null &&
    validateAtHomeRoom(room) === null &&
    validateAtHomeIntercom(intercom) === null
  );
}

function newEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fieldClass(): string {
  return `
    mt-1.5
    min-w-0
    max-w-full
    w-full
    rounded-[24px]
    bg-[#F1EFEF]
    px-4
    py-3.5
    text-[16px]
    font-semibold
    text-neutral-950
    outline-none
    ring-0
    placeholder:text-neutral-400
    transition
    focus:bg-white
    focus:shadow-[0_10px_28px_rgba(17,17,17,0.05)]
  `;
}

function formatPrice(service: OnboardingService): string {
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${service.priceByn} BYN`;
}

/** Цена в предпросмотре для клиента */
function formatPreviewServicePrice(service: OnboardingService): string {
  if (service.priceByn === 0) return 'Бесплатно';
  return formatPrice(service);
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
  return p.length > 0 && isOptionalBelarusPhoneValid(p);
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

/** На шаге профиля и при публикации нужны и телефон РБ, и минимум один контакт. */
function isProfileReachabilityComplete(phone: string, clientContacts: MasterContactRow[]): boolean {
  return hasValidBelarusPhoneForOnboarding(phone) && hasAtLeastOneValidMessengerContact(clientContacts);
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
  }

  const phoneTrim = phone.trim();
  if (phoneTrim.length > 0 && !isOptionalBelarusPhoneValid(phoneTrim)) {
    out.push({ id: 'phone-invalid', message: 'Введите корректный номер Беларуси', fixStep: 3 });
  }

  if (!hasValidBelarusPhoneForOnboarding(phone)) {
    if (phoneTrim.length === 0) {
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

function formatContactLineForPreview(type: ContactType, value: string): string {
  const v = value.trim();
  const label = CONTACT_CHANNEL_META.find((c) => c.type === type)?.label ?? 'Контакт';
  return `${label}: ${v}`;
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {eyebrow}
      </p>

      <h1
        className={`break-words text-balance font-semibold leading-[1.08] tracking-[-0.05em] text-neutral-950 sm:tracking-[-0.065em] ${
          dense ? 'mt-1.5 text-[22px] sm:text-[30px]' : 'mt-2 text-[24px] sm:text-[30px]'
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  inputMode,
  hint,
  error,
  maxLength,
  onBlur,
  labelAdornment,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url';
  hint?: string;
  error?: string | null;
  maxLength?: number;
  onBlur?: () => void;
  labelAdornment?: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-500">
        {labelAdornment ? <span className="inline-flex shrink-0 items-center">{labelAdornment}</span> : null}
        <span>{label}</span>
      </span>

      {hint ? (
        <p className="mt-1 text-[12px] leading-snug text-neutral-400">{hint}</p>
      ) : null}

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className={`${fieldClass()} resize-none leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className={fieldClass()}
        />
      )}

      {error ? (
        <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">{error}</p>
      ) : null}
    </label>
  );
}

export function BecomeMasterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, profile, backendConfigured, refreshProfile } = useAuth();
  const { telegramUserPreview } = useTelegram();

  const suggestedTgUsername = useMemo(() => {
    const fromProfile = profile?.telegram_username?.trim();
    if (fromProfile) return fromProfile.replace(/^@+/, '');
    const fromTg = telegramUserPreview?.username?.trim();
    if (fromTg) return fromTg.replace(/^@+/, '');
    return '';
  }, [profile?.telegram_username, telegramUserPreview?.username]);

  const contactTgPrefilledRef = useRef(false);

  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [tariffSelection, setTariffSelection] = useState<MasterPlanSelection>('basic');

  const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesReady, setCategoriesReady] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientContacts, setClientContacts] = useState<MasterContactRow[]>([]);
  const [phone, setPhone] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [step3NavigateAttempted, setStep3NavigateAttempted] = useState(false);

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
  const [certFormVisible, setCertFormVisible] = useState(false);
  const [certEditingId, setCertEditingId] = useState<string | null>(null);
  const [certTitle, setCertTitle] = useState('');
  const [certOrganization, setCertOrganization] = useState('');
  const [certYear, setCertYear] = useState('');
  const [certDesc, setCertDesc] = useState('');
  const [certImageUrl, setCertImageUrl] = useState<string | undefined>(undefined);
  const [certPhotoLink, setCertPhotoLink] = useState('');
  const [certImageFileName, setCertImageFileName] = useState<string | undefined>(undefined);
  const [certFieldErrors, setCertFieldErrors] = useState<Record<string, string>>({});
  const [certTouched, setCertTouched] = useState<Record<string, boolean>>({});
  const [certAttemptedSubmit, setCertAttemptedSubmit] = useState(false);

  useEffect(() => {
    return () => {
      if (certImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(certImageUrl);
      }

      certificates.forEach((certificate) => {
        if (certificate.imageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(certificate.imageUrl);
        }
      });
    };
  }, [certImageUrl, certificates]);

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setCategoriesReady(true);
      return;
    }

    let cancelled = false;
    setCategoriesError(null);

    void (async () => {
      try {
        const list = await fetchServiceCategories();
        if (!cancelled) setCategories(list);
      } catch (e) {
        if (!cancelled) {
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

  const progressPct = useMemo(
    () => (success ? 100 : (step / TOTAL_STEPS) * 100),
    [step, success],
  );

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const popularServiceTemplates = useMemo(
    () => getServiceTemplatesForCategoryCode(selectedCategory?.code ?? ''),
    [selectedCategory?.code],
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

  const contactPreviewRows = useMemo(
    () => clientContacts.filter((r) => r.value.trim()),
    [clientContacts],
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

  const proOnboardingPriceLabel = useMemo(() => `от ${priceForPlan('pro', 'month')} BYN / месяц`, []);

  const canGoNext = useMemo(() => {
    if (step === 2) return Boolean(selectedCategoryId);
    if (step === 3) {
      const n = name.trim();
      if (n.length < 2 || n.length > 200) return false;
      if (getMasterDisplayNameQualityError(n)) return false;
      return isProfileReachabilityComplete(phone, clientContacts);
    }
    if (step === 4) {
      if (visitType === 'studio') {
        const sn = salonName.trim();
        if (!sn || sn.length < 2) return false;
      }
      if (!street.trim()) return false;
      const coordsRequired = mapScriptOk === true;
      if (coordsRequired) {
        const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
        if (!hasCoords) return false;
        if (!addressPinnedToMap) return false;
      }
      if (visitType === 'at_home' && !isAtHomeAddressDetailsComplete(entrance, floor, room, intercom)) {
        return false;
      }
      return true;
    }
    if (step === 5) return services.length > 0;

    if (step === 6) return true;

    if (step === 7) return publishBlockingIssues.length === 0;

    return true;
  }, [
    addressPinnedToMap,
    building,
    city,
    lat,
    lng,
    mapScriptOk,
    name,
    phone,
    publishBlockingIssues.length,
    selectedCategoryId,
    services.length,
    step,
    street,
    visitType,
    salonName,
    clientContacts,
    entrance,
    floor,
    room,
    intercom,
  ]);

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

  const startEditService = useCallback((service: OnboardingService) => {
    setSvcEditingId(service.id);
    setSvcTitle(service.title);
    setSvcDur(String(service.durationMin));
    setSvcPrice(String(service.priceByn));
    setSvcPriceType(service.priceType ?? 'fixed');
    setSvcDesc(service.description ?? '');
    setSvcFieldErrors({});
    setSvcTouched({});
    setSvcAttemptedAdd(false);
    setSvcHighlightId(null);
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

    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return Object.keys(errs).length > 0 ? errs : {};
    });
    if (Object.keys(errs).length > 0) return;

    const nextPayload = {
      title,
      durationMin: duration,
      priceByn: price,
      priceType: svcPriceType,
      isActive: true as const,
      description: desc || undefined,
    };

    if (svcEditingId) {
      setServices((prev) =>
        prev.map((s) => (s.id === svcEditingId ? { ...s, ...nextPayload, id: s.id, sortOrder: s.sortOrder } : s)),
      );
    } else {
      setServices((prev) => [
        ...prev,
        {
          id: newEntityId('svc'),
          ...nextPayload,
          sortOrder: prev.length,
        },
      ]);
    }

    cancelSvcForm();
  }, [cancelSvcForm, svcDesc, svcDur, svcEditingId, svcPrice, svcPriceType, svcTitle]);

  const duplicateService = useCallback((service: OnboardingService) => {
    setServices((prev) => [
      ...prev,
      {
        ...service,
        id: newEntityId('svc'),
        sortOrder: prev.length,
      },
    ]);
  }, []);

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearCertLocalImage = useCallback(() => {
    setCertImageUrl((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return undefined;
    });
    setCertImageFileName(undefined);
  }, []);

  const detachCertFormImage = useCallback(() => {
    setCertImageUrl(undefined);
    setCertImageFileName(undefined);
  }, []);

  const onPickCertificateImage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCertFieldErrors((prev) => ({ ...prev, image: 'Выберите файл изображения.' }));
      return;
    }

    setCertFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setCertPhotoLink('');
    setCertImageFileName(file.name?.trim() || 'Фото добавлено');

    setCertImageUrl((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return URL.createObjectURL(file);
    });
  }, []);

  const clearCertPhoto = useCallback(() => {
    clearCertLocalImage();
    setCertPhotoLink('');
    setCertFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      delete next.photoLink;
      return next;
    });
  }, [clearCertLocalImage]);

  const cancelCertForm = useCallback(() => {
    clearCertLocalImage();
    setCertTitle('');
    setCertOrganization('');
    setCertYear('');
    setCertDesc('');
    setCertPhotoLink('');
    setCertFieldErrors({});
    setCertTouched({});
    setCertAttemptedSubmit(false);
    setCertEditingId(null);
    setCertFormVisible(false);
  }, [clearCertLocalImage]);

  const resetCertFormAfterSubmit = useCallback(() => {
    detachCertFormImage();
    setCertTitle('');
    setCertOrganization('');
    setCertYear('');
    setCertDesc('');
    setCertPhotoLink('');
    setCertFieldErrors({});
    setCertTouched({});
    setCertAttemptedSubmit(false);
    setCertEditingId(null);
    setCertFormVisible(false);
  }, [detachCertFormImage]);

  const openCertFormForAdd = useCallback(() => {
    clearCertLocalImage();
    setCertTitle('');
    setCertOrganization('');
    setCertYear('');
    setCertDesc('');
    setCertPhotoLink('');
    setCertFieldErrors({});
    setCertTouched({});
    setCertAttemptedSubmit(false);
    setCertEditingId(null);
    setCertFormVisible(true);
  }, [clearCertLocalImage]);

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
      clearCertLocalImage();
      const url = c.imageUrl?.trim();
      const isRemote = Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));
      if (isRemote && url) {
        setCertPhotoLink(url);
        setCertImageUrl(undefined);
        setCertImageFileName(undefined);
      } else if (url) {
        setCertPhotoLink('');
        setCertImageUrl(url);
        setCertImageFileName(undefined);
      } else {
        setCertPhotoLink('');
        setCertImageUrl(undefined);
        setCertImageFileName(undefined);
      }
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
    [clearCertLocalImage],
  );

  const submitCertificateForm = useCallback(() => {
    setCertAttemptedSubmit(true);

    const title = certTitle.trim();
    const organization = certOrganization.trim();
    const yearStr = certYear.trim();
    const desc = certDesc.trim();
    const httpsImage = parseHttpsCertificateImageUrl(certPhotoLink);
    const blobImage = certImageUrl?.trim() ? certImageUrl : undefined;
    const resolvedImage = httpsImage ?? blobImage;

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

    if (certPhotoLink.trim() && !httpsImage) {
      errs.photoLink = 'Укажите корректную ссылку https://…';
    }

    setCertFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      title,
      organization,
      year: yearStr || undefined,
      description: desc || undefined,
      imageUrl: resolvedImage,
    };

    if (certEditingId) {
      setCertificates((prev) =>
        prev.map((x) => (x.id === certEditingId ? { ...x, ...payload, id: x.id } : x)),
      );
    } else {
      setCertificates((prev) => [...prev, { ...payload, id: newEntityId('cert') }]);
    }

    resetCertFormAfterSubmit();
  }, [
    certDesc,
    certEditingId,
    certImageUrl,
    certOrganization,
    certPhotoLink,
    certTitle,
    certYear,
    resetCertFormAfterSubmit,
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

  const validateProfileStep = useCallback((): boolean => {
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
    if (phoneTrim && !isOptionalBelarusPhoneValid(phoneTrim)) {
      errs.phone = 'Введите корректный номер Беларуси';
    } else if (!phoneTrim) {
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

    setProfileFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [clientContacts, description, name, phone]);

  /** Сброс подтверждения адреса без сброса координат — чтобы карта не пересоздавалась на каждый символ. */
  const invalidatePrimaryAddressOnMap = useCallback(() => {
    setAddressPinnedToMap(false);
    setPickedAddressSummary(null);
  }, []);

  const resetPrimaryAddressCoordinates = useCallback(() => {
    setAddressPinnedToMap(false);
    setPickedAddressSummary(null);
    setLat(undefined);
    setLng(undefined);
  }, []);

  const touchAddressField = useCallback((key: string) => {
    setAddressTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const touchAndValidateAtHomeField = useCallback(
    (key: 'entrance' | 'floor' | 'room' | 'intercom') => {
      touchAddressField(key);
      if (visitType !== 'at_home') return;

      const err =
        key === 'entrance'
          ? validateAtHomeEntrance(entrance)
          : key === 'floor'
            ? validateAtHomeFloor(floor)
            : key === 'room'
              ? validateAtHomeRoom(room)
              : validateAtHomeIntercom(intercom);

      setAddressFieldErrors((prev) => {
        const next = { ...prev };
        if (err) next[key] = err;
        else delete next[key];
        return next;
      });
    },
    [entrance, floor, intercom, room, touchAddressField, visitType],
  );

  const showAddressFieldError = useCallback(
    (key: string) => Boolean(addressFieldErrors[key] && (addressTouched[key] || addressNavigateAttempted)),
    [addressFieldErrors, addressNavigateAttempted, addressTouched],
  );

  const validateAddressStep = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (!street.trim()) errs.street = visitType === 'studio' ? 'Укажите адрес салона' : 'Укажите адрес приёма';
    else if (street.trim().length > 200) errs.street = 'Не длиннее 200 символов.';

    if (visitType === 'studio') {
      const sn = salonName.trim();
      if (!sn) errs.salonName = 'Укажите название салона или студии';
      else if (sn.length < 2) errs.salonName = 'Минимум 2 символа.';
    }

    if (visitType === 'at_home') {
      const entranceErr = validateAtHomeEntrance(entrance);
      if (entranceErr) errs.entrance = entranceErr;

      const floorErr = validateAtHomeFloor(floor);
      if (floorErr) errs.floor = floorErr;

      const roomErr = validateAtHomeRoom(room);
      if (roomErr) errs.room = roomErr;

      const intercomErr = validateAtHomeIntercom(intercom);
      if (intercomErr) errs.intercom = intercomErr;
    } else {
      if (entrance.trim().length > 120) errs.entrance = 'Не длиннее 120 символов.';
      const studioFloorErr = floor.trim() ? validateAtHomeFloor(floor) : null;
      if (studioFloorErr) errs.floor = studioFloorErr;
      if (room.trim().length > 80) errs.room = 'Не длиннее 80 символов.';
      if (intercom.trim().length > 80) errs.intercom = 'Не длиннее 80 символов.';
    }
    if (directions.trim().length > 2000) errs.directions = 'Не длиннее 2000 символов.';
    if (clientNote.trim().length > 2000) errs.clientNote = 'Не длиннее 2000 символов.';
    if (salonName.trim().length > 120) errs.salonName = 'Не длиннее 120 символов.';
    if (houseDetail.trim().length > 120) errs.houseDetail = 'Не длиннее 120 символов.';

    const coordsRequired = mapScriptOk === true;
    if (coordsRequired) {
      const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
      if (!hasCoords) {
        errs.coords = 'Уточните точку на карте';
      } else if (!addressPinnedToMap) {
        errs.coords = 'Подтвердите адрес: выберите вариант из подсказок или уточните метку на карте';
      }
    }

    setAddressFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [
    addressPinnedToMap,
    building,
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

  const touchProfileField = useCallback((key: string) => {
    setProfileTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const touchContactRow = useCallback((id: string) => {
    setProfileTouched((t) => ({ ...t, [id]: true }));
  }, []);

  const showProfileFieldError = useCallback(
    (key: string) => Boolean(profileFieldErrors[key] && (profileTouched[key] || step3NavigateAttempted)),
    [profileFieldErrors, profileTouched, step3NavigateAttempted],
  );

  const showContactRowError = useCallback(
    (id: string) => Boolean(profileFieldErrors[id] && (profileTouched[id] || step3NavigateAttempted)),
    [profileFieldErrors, profileTouched, step3NavigateAttempted],
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
    if (step === 3) {
      setStep3NavigateAttempted(true);
      if (!validateProfileStep()) return;
      setStep3NavigateAttempted(false);
    }
    if (step === 4) {
      setAddressNavigateAttempted(true);
      if (!validateAddressStep()) {
        if (visitType === 'at_home') setAddressMoreOpen(true);
        return;
      }
      setAddressNavigateAttempted(false);
    }

    if (step === 5 && services.length === 0) {
      setSvcFieldErrors({ form: 'Добавьте хотя бы одну услугу' });
      return;
    }

    if (step === 7) {
      if (publishBlockingIssues.length > 0) return;
      if (!validateProfileStep() || !validateAddressStep()) {
        if (visitType === 'at_home') setAddressMoreOpen(true);
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
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }, [publishBlockingIssues.length, services.length, step, validateAddressStep, validateProfileStep, visitType]);

  const goBack = useCallback(() => {
    setStep((current) => Math.max(1, current - 1));
    setPublishError(null);
    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return next;
    });
    setAddressFieldErrors({});
    setCertFieldErrors({});
  }, []);

  const publish = useCallback(async () => {
    if (step !== 8) return;

    if (!isAuthenticated) {
      setPublishError('Войдите через Telegram, чтобы опубликовать профиль.');
      return;
    }
    if (!getApiBaseUrl()) {
      setPublishError('Сейчас нельзя опубликовать профиль. Попробуйте позже.');
      return;
    }

    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (!cat) {
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

    const photoRaw = profile?.avatar_url?.trim();
    let photoUrl: string | null = null;
    if (photoRaw) {
      try {
        photoUrl = new URL(photoRaw).toString();
      } catch {
        photoUrl = null;
      }
    }

    setSaving(true);
    setPublishError(null);

    try {
      const certPayload = certificates
        .map((c, sortOrder) => ({
          title: c.title.trim(),
          issuer: c.organization.trim() || null,
          year: c.year ? Number.parseInt(String(c.year), 10) : null,
          description: c.description?.trim().slice(0, 1000) || null,
          imageUrl:
            c.imageUrl && (c.imageUrl.startsWith('http://') || c.imageUrl.startsWith('https://'))
              ? c.imageUrl
              : null,
          sortOrder,
        }))
        .filter((c) => c.title.length >= 2);

      const contactItems = clientContacts
        .map((r) => ({ type: r.type, value: r.value.trim() }))
        .filter((c) => c.value.length > 0);
      const phoneNorm = phone.trim() ? normalizeBelarusPhone(phone.trim()) : null;

      await submitMasterOnboarding({
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
        })),
        certificates: certPayload,
        masterPlan: 'basic',
        proInterested: tariffSelection === 'pro_interest',
      });

      await refreshProfile();
      setSuccess(true);
    } catch {
      setPublishError('Не удалось опубликовать профиль');
    } finally {
      setSaving(false);
    }
  }, [
    categories,
    certificates,
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
    publicAddressForApi,
    refreshProfile,
    room,
    salonName,
    selectedCategoryId,
    services,
    showExactAddressAfterBooking,
    street,
    validateAddressStep,
    validateProfileStep,
    visitType,
    building,
    isAuthenticated,
    step,
    tariffSelection,
  ]);

  if (success) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-[42px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.06)]">
            <div className="rounded-[34px] bg-white px-6 py-8 text-center">
              <img
                src={FINISH_ILLUSTRATION_SRC}
                alt=""
                aria-hidden
                className="mx-auto w-full max-w-[min(100%,17.5rem)] object-contain"
                draggable={false}
              />

              <h1 className="mt-6 text-[31px] font-semibold leading-[1.05] tracking-[-0.065em] text-neutral-950">
                Профиль опубликован
              </h1>

              <p className="mx-auto mt-3 max-w-[20rem] text-[15px] leading-relaxed text-neutral-500">
                Теперь клиенты смогут записываться к вам
              </p>

              <button
                type="button"
                onClick={() => {
                  if (profile?.id) {
                    navigate(getMasterPath(profile.id));
                    return;
                  }
                  navigate(ADMIN_PATH);
                }}
                className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
              >
                Перейти в профиль
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-dvh overflow-x-hidden text-neutral-900 ${
        step === 1
          ? 'bg-white pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:bg-[#F5F5F5]'
          : 'bg-white pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]'
      }`}
    >
      <header className="sticky top-0 z-40 bg-[#F1EFEF] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] lg:border-b lg:border-[#EBEBEB] lg:bg-[#FFFCFC]/95 lg:backdrop-blur-md">
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

            <span className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-white/90 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums leading-none text-neutral-600 shadow-none sm:px-3">
              {step} / {TOTAL_STEPS}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70 sm:mt-3.5">
            <div
              className="h-full rounded-full bg-[#E29595] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {step >= 2 && (!backendConfigured || (!authLoading && !isAuthenticated)) ? (
        <div className={`${ONBOARDING_PAGE_WRAP} space-y-2 pt-3`}>
          {!backendConfigured ? (
            <p className="rounded-[18px] bg-[#FFF4E8] px-4 py-3 text-[13px] font-semibold leading-snug text-[#B66A24]">
              Не задан <span className="font-mono text-[12px]">VITE_API_URL</span> — категории и публикация профиля не заработают, пока не подключите бэкенд.
            </p>
          ) : null}
          {!authLoading && !isAuthenticated ? (
            <p className="rounded-[18px] bg-[#FFF4E8] px-4 py-3 text-[13px] font-semibold leading-snug text-[#B66A24]">
              Войдите через Telegram, чтобы сохранить анкету на сервере. Пока можно просмотреть шаги анкеты.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`${ONBOARDING_PAGE_WRAP} ${step === 1 ? 'pt-2 sm:pt-3 lg:pt-6' : 'pt-4'}`}>
        <div
          className={`min-w-0 ${
            step === 1
              ? 'rounded-[42px] bg-[#F1EFEF] p-2 shadow-[0_24px_70px_rgba(17,17,17,0.06)] sm:p-2.5 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none'
              : 'rounded-[42px] bg-[#F1EFEF] p-2.5 shadow-[0_24px_70px_rgba(17,17,17,0.06)] sm:p-3'
          }`}
        >
          <div
            className={`relative z-10 min-w-0 overflow-hidden ${
              step === 1
                ? 'rounded-[34px] bg-white px-3 pb-5 pt-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:px-6 sm:pb-6 sm:pt-5 lg:rounded-[16px] lg:px-8 lg:pb-8 lg:pt-8 lg:shadow-[0_8px_40px_rgba(17,17,17,0.06)]'
                : 'rounded-[34px] bg-white shadow-[0_10px_30px_rgba(17,17,17,0.035)] ' +
                  (step === 2
                    ? 'px-3 py-4 sm:px-6 sm:py-5'
                    : 'px-3 py-5 sm:px-6 sm:py-6')
            }`}
          >
            {step === 1 ? (
              <div className="w-full">
                <OnboardingStep1Intro onStart={() => setStep(2)} />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mx-auto w-full max-w-xl">
                <StepTitle dense eyebrow="Категория" title="Чем вы занимаетесь?" />

                {categoriesError ? (
                  <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                    {categoriesError}
                  </p>
                ) : null}

                {!categoriesReady ? (
                  <div className="mt-6 flex justify-center py-4">
                    <LoadingVideo label="Загрузка категорий…" />
                  </div>
                ) : categories.length === 0 ? (
                  <p className="mt-6 text-center text-[15px] text-neutral-500">
                    Категории не найдены. Обратитесь в поддержку.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-1.5">
                    {[...categories]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item, index) => {
                        const active = selectedCategoryId === item.id;
                        const imageSrc = CATEGORY_IMAGES[item.code];
                        const hint = CATEGORY_HINTS[item.code] ?? '';

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(item.id)}
                            className={`flex min-h-[4.25rem] w-full items-center gap-3 rounded-[26px] px-3.5 py-2.5 text-left transition sm:min-h-[4.35rem] sm:gap-3.5 sm:px-4 sm:py-3 ${
                              active
                                ? 'bg-[#FDF9F9] text-neutral-950 shadow-[0_8px_22px_rgba(226,149,149,0.18)] ring-1 ring-[#E29595]/40'
                                : 'bg-[#F1EFEF] text-neutral-950 ring-1 ring-transparent hover:bg-[#E9E6E6] active:scale-[0.99]'
                            }`}
                          >
                            <span
                              className={`relative flex h-[3.35rem] w-[3.35rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white sm:h-14 sm:w-14 ${
                                active ? 'ring-2 ring-[#E29595]/45 ring-offset-2 ring-offset-[#FDF9F9]' : ''
                              }`}
                              aria-hidden
                            >
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt=""
                                  width={112}
                                  height={112}
                                  loading={index < 3 ? 'eager' : 'lazy'}
                                  decoding="async"
                                  draggable={false}
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <span className="text-[12px] font-semibold text-neutral-400" aria-hidden>
                                  {item.name.slice(0, 1)}
                                </span>
                              )}
                            </span>

                            <span className="min-w-0 flex-1 py-0.5">
                              <span className="block text-[16px] font-semibold leading-tight tracking-[-0.035em] text-neutral-950 sm:text-[17px] sm:tracking-[-0.04em]">
                                {item.name}
                              </span>

                              {hint ? (
                                <span className="mt-0.5 block text-[12.5px] leading-snug text-neutral-500 sm:text-[13px]">
                                  {hint}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : null}

            {step === 3 ? (
              <>
                <StepTitle
                  eyebrow="Профиль"
                  title="Расскажите о себе"
                  text="Эти данные увидят клиенты перед записью"
                />

                <div className="mt-7 space-y-6">
                  <Field
                    label="Имя мастера или студии"
                    value={name}
                    onChange={(v) => {
                      setName(v);
                      setProfileFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }}
                    onBlur={() => touchProfileField('name')}
                    placeholder="Фамилия Имя Отчество"
                    error={showProfileFieldError('name') ? profileFieldErrors.name : undefined}
                    maxLength={200}
                  />

                  <Field
                    label="Описание"
                    value={description}
                    onChange={(v) => {
                      setDescription(v);
                      setProfileFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.description;
                        return next;
                      });
                    }}
                    onBlur={() => touchProfileField('description')}
                    placeholder="Расскажите, чем занимаетесь и почему к вам стоит записаться"
                    multiline
                    error={showProfileFieldError('description') ? profileFieldErrors.description : undefined}
                    maxLength={10_000}
                  />

                  <Field
                    label="Телефон для связи"
                    labelAdornment={
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white shadow-[0_2px_6px_rgba(17,17,17,0.04)]"
                        title="Беларусь"
                        aria-hidden
                      >
                        <BY title="Беларусь" className="h-full w-full object-cover" />
                      </span>
                    }
                    value={phone}
                    onChange={(v) => {
                      setPhone(sanitizeBelarusPhoneInput(v));
                      setProfileFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.phone;
                        delete next.contactReachability;
                        return next;
                      });
                    }}
                    onBlur={() => touchProfileField('phone')}
                    placeholder="+375 29 000-00-00"
                    inputMode="tel"
                    error={showProfileFieldError('phone') ? profileFieldErrors.phone : undefined}
                    maxLength={19}
                  />

                  {step3NavigateAttempted && profileFieldErrors.contactReachability ? (
                    <p className="mt-3 rounded-[18px] bg-[#FFF4E8] px-3 py-2 text-[12px] font-semibold leading-snug text-[#B66A24]">
                      {profileFieldErrors.contactReachability}
                    </p>
                  ) : null}

                  <MasterProfileContactsBlock
                    rows={clientContacts}
                    onAdd={addClientContactRow}
                    onChange={updateClientContactRow}
                    onRemove={removeClientContactRow}
                    onBlurRow={touchContactRow}
                    rowErrors={profileFieldErrors}
                    showRowError={showContactRowError}
                  />
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <div className="mx-auto w-full max-w-xl">
                <StepTitle dense eyebrow="Адрес" title="Место приёма" />

                <div className="mt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Формат</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5 sm:grid-cols-2">
                    {VISIT_TYPES.map((type) => {
                      const active = visitType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setVisitType(type);
                            setAddressFieldErrors({});
                            setAddressNavigateAttempted(false);
                            resetPrimaryAddressCoordinates();
                          }}
                          className={`min-h-11 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
                            active
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-500'
                          }`}
                        >
                          {masterVisitTypeLabel(type)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-3 text-[13px] font-medium text-neutral-500">Город: Минск</p>

                {visitType === 'studio' ? (
                  <>
                    <div className="mt-4">
                      <Field
                        label="Название салона или студии"
                        value={salonName}
                        onChange={(v) => {
                          setSalonName(v);
                          setAddressFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.salonName;
                            return next;
                          });
                        }}
                        onBlur={() => touchAddressField('salonName')}
                        placeholder="Например, Beauty Studio"
                        error={showAddressFieldError('salonName') ? addressFieldErrors.salonName : undefined}
                        maxLength={120}
                      />
                    </div>

                    <div className="mt-4 overflow-visible rounded-[26px] bg-[#F1EFEF] p-3">
                      <OnboardingAddressMap
                        key={`map-${visitType}`}
                        city={ONBOARDING_CITY}
                        visitType={visitType}
                        street={street}
                        onStreetChange={(value) => {
                          invalidatePrimaryAddressOnMap();
                          setStreet(value);
                          setAddressFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.street;
                            return next;
                          });
                        }}
                        inputLabel="Адрес салона *"
                        inputPlaceholder="Адрес"
                        inputError={showAddressFieldError('street') ? addressFieldErrors.street : undefined}
                        onInputBlur={() => touchAddressField('street')}
                        viewportDropdown
                        initialLat={lat ?? null}
                        initialLng={lng ?? null}
                        addressSummary={pickedAddressSummary}
                        coordsError={showAddressFieldError('coords') ? addressFieldErrors.coords : undefined}
                        onMapAvailabilityChange={(ok) => setMapScriptOk(ok)}
                        onPick={(result) => {
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
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Этаж"
                        value={floor}
                        onChange={setFloor}
                        onBlur={() => touchAddressField('floor')}
                        placeholder="3"
                        error={showAddressFieldError('floor') ? addressFieldErrors.floor : undefined}
                        maxLength={40}
                      />
                      <Field
                        label="Кабинет"
                        value={room}
                        onChange={setRoom}
                        onBlur={() => touchAddressField('room')}
                        placeholder="312"
                        error={showAddressFieldError('room') ? addressFieldErrors.room : undefined}
                        maxLength={80}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-4 overflow-visible rounded-[26px] bg-[#F1EFEF] p-3">
                      <OnboardingAddressMap
                        key={`map-${visitType}`}
                        city={ONBOARDING_CITY}
                        visitType={visitType}
                        street={street}
                        onStreetChange={(value) => {
                          invalidatePrimaryAddressOnMap();
                          setStreet(value);
                          setAddressFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.street;
                            return next;
                          });
                        }}
                        inputLabel="Адрес приёма *"
                        inputPlaceholder="Адрес"
                        inputError={showAddressFieldError('street') ? addressFieldErrors.street : undefined}
                        onInputBlur={() => touchAddressField('street')}
                        viewportDropdown
                        initialLat={lat ?? null}
                        initialLng={lng ?? null}
                        addressSummary={pickedAddressSummary}
                        coordsError={showAddressFieldError('coords') ? addressFieldErrors.coords : undefined}
                        onMapAvailabilityChange={(ok) => setMapScriptOk(ok)}
                        onPick={(result) => {
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
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-neutral-500">Детали адреса для клиентов</p>
                      <p className="mt-1 text-[12px] leading-snug text-neutral-400">
                        Улица из поля выше видна всем. Подъезд, этаж, квартира и домофон — в дополнительных деталях ниже.
                      </p>
                      <div
                        className="mt-2 grid grid-cols-1 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5 sm:grid-cols-2"
                        role="radiogroup"
                        aria-label="Когда показывать детали адреса"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={!showExactAddressAfterBooking}
                          onClick={() => setShowExactAddressAfterBooking(false)}
                          className={`min-h-11 rounded-full px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
                            !showExactAddressAfterBooking
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-500'
                          }`}
                        >
                          Видно сразу
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={showExactAddressAfterBooking}
                          onClick={() => setShowExactAddressAfterBooking(true)}
                          className={`min-h-11 rounded-full px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
                            showExactAddressAfterBooking
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-500'
                          }`}
                        >
                          После записи
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setAddressMoreOpen((v) => !v)}
                  aria-expanded={addressMoreOpen}
                  className="mt-4 flex w-full items-center gap-3 rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-left transition hover:bg-[#E9E6E6] active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1 text-[14px] font-semibold leading-none tracking-[-0.02em] text-neutral-900">
                    Дополнительные детали
                  </span>
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400 transition-transform duration-200 ease-out ${
                      addressMoreOpen ? 'rotate-45' : ''
                    }`}
                    aria-hidden
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="block">
                      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                {addressMoreOpen ? (
                  <div className="mt-3 space-y-3 rounded-[22px] border border-neutral-200/80 bg-white/60 px-3 py-3 sm:px-4">
                    {visitType === 'at_home' ? (
                      <Field
                        label="Корпус / строение"
                        value={houseDetail}
                        onChange={(v) => {
                          setHouseDetail(v);
                          setAddressFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.houseDetail;
                            return next;
                          });
                        }}
                        onBlur={() => touchAddressField('houseDetail')}
                        placeholder="При необходимости"
                        error={showAddressFieldError('houseDetail') ? addressFieldErrors.houseDetail : undefined}
                        maxLength={120}
                      />
                    ) : null}

                    {visitType === 'at_home' ? (
                      <Field
                        label="Подъезд *"
                        value={entrance}
                        onChange={(v) => {
                          setEntrance(v.slice(0, AT_HOME_ENTRANCE_MAX));
                          setAddressFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.entrance;
                            return next;
                          });
                        }}
                        onBlur={() => touchAndValidateAtHomeField('entrance')}
                        placeholder="2"
                        error={showAddressFieldError('entrance') ? addressFieldErrors.entrance : undefined}
                        maxLength={AT_HOME_ENTRANCE_MAX}
                      />
                    ) : null}

                    {visitType === 'at_home' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field
                          label="Этаж *"
                          value={floor}
                          onChange={(v) => {
                            setFloor(sanitizeAtHomeFloorInput(v));
                            setAddressFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.floor;
                              return next;
                            });
                          }}
                          onBlur={() => touchAndValidateAtHomeField('floor')}
                          placeholder="3"
                          inputMode="numeric"
                          error={showAddressFieldError('floor') ? addressFieldErrors.floor : undefined}
                          maxLength={3}
                        />
                        <Field
                          label="Квартира *"
                          value={room}
                          onChange={(v) => {
                            setRoom(v.slice(0, AT_HOME_ROOM_MAX));
                            setAddressFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.room;
                              return next;
                            });
                          }}
                          onBlur={() => touchAndValidateAtHomeField('room')}
                          placeholder="45"
                          error={showAddressFieldError('room') ? addressFieldErrors.room : undefined}
                          maxLength={AT_HOME_ROOM_MAX}
                        />
                      </div>
                    ) : null}

                    <Field
                      label={visitType === 'at_home' ? 'Код домофона *' : 'Код домофона'}
                      value={intercom}
                      onChange={(v) => {
                        setIntercom(v.slice(0, visitType === 'at_home' ? AT_HOME_INTERCOM_MAX : 80));
                        setAddressFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.intercom;
                          return next;
                        });
                      }}
                      onBlur={() =>
                        visitType === 'at_home'
                          ? touchAndValidateAtHomeField('intercom')
                          : touchAddressField('intercom')
                      }
                      placeholder="12В"
                      error={showAddressFieldError('intercom') ? addressFieldErrors.intercom : undefined}
                      maxLength={visitType === 'at_home' ? AT_HOME_INTERCOM_MAX : 80}
                    />

                    <Field
                      label="Как пройти"
                      value={directions}
                      onChange={setDirections}
                      onBlur={() => touchAddressField('directions')}
                      placeholder="Главный вход, направо"
                      multiline
                      error={showAddressFieldError('directions') ? addressFieldErrors.directions : undefined}
                      maxLength={2000}
                    />

                    <Field
                      label="Комментарий для клиента"
                      value={clientNote}
                      onChange={setClientNote}
                      onBlur={() => touchAddressField('clientNote')}
                      placeholder="Например, приходите за 5 минут"
                      multiline
                      error={showAddressFieldError('clientNote') ? addressFieldErrors.clientNote : undefined}
                      maxLength={2000}
                    />
                  </div>
                ) : null}

                {mapScriptOk === false ? (
                  <p className="mt-3 text-[12px] leading-snug text-neutral-500">
                    Карта не загрузилась — сохраните адрес текстом. Координаты не обязательны.
                  </p>
                ) : null}

                <div className="mt-5 rounded-[26px] bg-[#F1EFEF] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Как увидит клиент
                  </p>

                  {!street.trim() ? (
                    <p className="mt-2 text-[15px] font-semibold text-neutral-500">Адрес пока не указан</p>
                  ) : visitType === 'studio' ? (
                    <div className="mt-2 space-y-1.5 text-[14px] leading-snug text-neutral-700">
                      <p className="font-semibold text-neutral-950">Салон</p>
                      {salonName.trim() ? <p className="font-medium text-neutral-800">{salonName.trim()}</p> : null}
                      <p>{formatCityWithAddressLine(locationDraft)}</p>
                      {floor.trim() || room.trim() ? (
                        <p className="text-neutral-600">
                          {[floor.trim() ? `${floor.trim()} этаж` : null, room.trim() ? `кабинет ${room.trim()}` : null]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      ) : null}
                      {directions.trim() ? (
                        <p className="text-neutral-600">
                          Как пройти: {directions.trim()}
                        </p>
                      ) : null}
                      {clientNote.trim() ? <p className="text-neutral-600">{clientNote.trim()}</p> : null}
                    </div>
                  ) : showExactAddressAfterBooking ? (
                    <div className="mt-3 space-y-4">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          До записи
                        </p>
                        <p className="mt-1 font-semibold text-neutral-950">На дому</p>
                        <p className="mt-1 text-neutral-700">{formatHomePublicBeforeBooking(locationDraft)}</p>
                        <p className="mt-1 text-[13px] text-neutral-500">
                          Подъезд, этаж и другие детали — только после записи
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          После записи
                        </p>
                        <p className="mt-1 text-neutral-700">{formatHomeAfterBookingMainLine(locationDraft)}</p>
                        <div className="mt-1 space-y-0.5 text-[13px] text-neutral-600">
                          {homeAfterBookingDetailLines(locationDraft).map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1 text-[14px] leading-snug text-neutral-700">
                      <p className="font-semibold text-neutral-950">На дому</p>
                      <p>{formatCityWithAddressLine(locationDraft)}</p>
                      <div className="space-y-0.5 text-[13px] text-neutral-600">
                        {entrance.trim() ? <p>подъезд {entrance.trim()}</p> : null}
                        {floor.trim() ? <p>этаж {floor.trim()}</p> : null}
                        {room.trim() ? <p>квартира {room.trim()}</p> : null}
                        {intercom.trim() ? <p>код домофона {intercom.trim()}</p> : null}
                        {clientNote.trim() ? <p>Комментарий: {clientNote.trim()}</p> : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <>
                <StepTitle
                  eyebrow="Услуги"
                  title="Добавьте услуги"
                  text="Добавьте минимум одну услугу для записи"
                />

                <div className="mt-6 space-y-6 rounded-[30px] bg-white p-3 shadow-[0_10px_30px_rgba(17,17,17,0.035)] sm:p-4">
                  {popularServiceTemplates.length > 0 ? (
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        Популярные услуги
                      </p>
                      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch]">
                        {popularServiceTemplates.map((tm) => (
                          <button
                            key={tm.id}
                            type="button"
                            onClick={() => applyServiceTemplate(tm)}
                            className={`shrink-0 max-w-[min(100%,14rem)] rounded-full px-3.5 py-2 text-left text-[13px] font-semibold leading-snug transition active:scale-[0.98] ${
                              svcHighlightId === tm.id
                                ? 'bg-[#E8BCBC] text-neutral-950'
                                : 'bg-[#F5E0E0] text-neutral-900'
                            }`}
                          >
                            {tm.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    <Field
                      label="Название услуги"
                      value={svcTitle}
                      onChange={setSvcTitle}
                      onBlur={() => touchSvcField('title')}
                      placeholder="Например, маникюр с покрытием"
                      error={showSvcFieldError('title') ? svcFieldErrors.title : undefined}
                      maxLength={300}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                      <Field
                        label="Длительность"
                        value={svcDur}
                        onChange={setSvcDur}
                        onBlur={() => touchSvcField('duration')}
                        placeholder="90"
                        inputMode="numeric"
                        error={showSvcFieldError('duration') ? svcFieldErrors.duration : undefined}
                      />

                      <Field
                        label="Цена, BYN"
                        value={svcPrice}
                        onChange={setSvcPrice}
                        onBlur={() => touchSvcField('price')}
                        placeholder="45"
                        inputMode="decimal"
                        error={showSvcFieldError('price') ? svcFieldErrors.price : undefined}
                      />
                    </div>

                    <div>
                      <p className="text-[13px] font-semibold text-neutral-500">Тип цены</p>

                      <div
                        className="mt-2 grid grid-cols-2 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5"
                        role="radiogroup"
                        aria-label="Тип цены"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={svcPriceType === 'fixed'}
                          onClick={() => setSvcPriceType('fixed')}
                          className={`min-h-11 rounded-full px-2 text-[14px] font-semibold leading-tight transition active:scale-[0.98] ${
                            svcPriceType === 'fixed'
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-600'
                          }`}
                        >
                          Точная
                        </button>

                        <button
                          type="button"
                          role="radio"
                          aria-checked={svcPriceType === 'from'}
                          onClick={() => setSvcPriceType('from')}
                          className={`min-h-11 rounded-full px-2 text-[14px] font-semibold leading-tight transition active:scale-[0.98] ${
                            svcPriceType === 'from'
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-600'
                          }`}
                        >
                          От
                        </button>
                      </div>

                      <p className="mt-2 text-[12px] font-medium leading-snug text-neutral-500">
                        {svcPricePreviewLabel ? (
                          <>
                            Клиент увидит:{' '}
                            <span className="font-semibold text-neutral-800">{svcPricePreviewLabel}</span>
                          </>
                        ) : (
                          'Укажите цену — покажем, как она отобразится в каталоге'
                        )}
                      </p>
                    </div>

                    <div>
                      <Field
                        label="Описание"
                        value={svcDesc}
                        onChange={setSvcDesc}
                        onBlur={() => touchSvcField('description')}
                        placeholder="Что входит в услугу"
                        multiline
                        error={showSvcFieldError('description') ? svcFieldErrors.description : undefined}
                        maxLength={1000}
                      />
                    </div>
                  </div>

                  {svcFieldErrors.form ? (
                    <p className="rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                      {svcFieldErrors.form}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <button
                      type="button"
                      onClick={submitServiceForm}
                      className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
                    >
                      {svcEditingId ? 'Сохранить услугу' : 'Добавить услугу'}
                    </button>

                    {svcEditingId ? (
                      <button
                        type="button"
                        onClick={cancelSvcForm}
                        className="flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[14px] font-semibold text-neutral-600 transition active:scale-[0.98]"
                      >
                        Отмена
                      </button>
                    ) : null}
                  </div>

                  <div className="border-t border-[#F1EFEF] pt-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Ваши услуги
                    </p>

                    {services.length === 0 ? (
                      <div className="mt-3 rounded-[22px] bg-[#F1EFEF] px-4 py-5 text-center">
                        <p className="text-[16px] font-semibold text-neutral-950">Пока нет услуг</p>
                        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-neutral-500">
                          Добавьте первую услугу — она появится здесь
                        </p>
                      </div>
                    ) : (
                      <ul className="mt-3 flex flex-col gap-2.5">
                        {services.map((service) => (
                          <li
                            key={service.id}
                            className={`rounded-[22px] bg-white px-4 py-3.5 shadow-[0_6px_20px_rgba(17,17,17,0.04)] ${
                              svcEditingId === service.id ? 'ring-2 ring-[#E29595]/50' : ''
                            }`}
                          >
                            <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
                              <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                                <p className="break-words text-[17px] font-semibold tracking-[-0.03em] text-neutral-950">
                                  {service.title}
                                </p>
                                <p className="mt-2 inline-flex rounded-full bg-[#F8F0F0] px-2.5 py-1 text-[12px] font-semibold text-neutral-700">
                                  {service.durationMin} мин · {formatPrice(service)}
                                </p>
                                {service.description ? (
                                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words rounded-[14px] bg-[#F1EFEF] px-3 py-2.5 text-[13px] leading-relaxed text-neutral-600">
                                    {service.description}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold">
                                <button
                                  type="button"
                                  onClick={() => startEditService(service)}
                                  className="text-[#E29595] underline-offset-2 hover:underline"
                                >
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => duplicateService(service)}
                                  className="text-neutral-600 underline-offset-2 hover:underline"
                                >
                                  Дублировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeService(service.id)}
                                  className="text-neutral-500 underline-offset-2 hover:underline"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <StepTitle
                  eyebrow="Доверие"
                  title="Сертификаты"
                  text="Добавьте дипломы или курсы, чтобы повысить доверие клиентов"
                />

                <div className="mt-6 space-y-4 rounded-[30px] bg-[#F1EFEF] p-3 sm:p-4">
                  <button
                    type="button"
                    onClick={openCertFormForAdd}
                    className="flex min-h-11 w-full items-center justify-center rounded-full border border-dashed border-neutral-300/80 bg-white/70 px-4 text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98]"
                  >
                    + Добавить сертификат
                  </button>

                  {certFormVisible ? (
                    <div className="space-y-3.5 rounded-[22px] bg-white/80 px-3 py-3.5 sm:px-4">
                      <Field
                        label="Название сертификата"
                        value={certTitle}
                        onChange={setCertTitle}
                        onBlur={() => touchCertField('title')}
                        placeholder="Например, курс аппаратного маникюра"
                        error={showCertFieldError('title') ? certFieldErrors.title : undefined}
                        maxLength={300}
                      />

                      <Field
                        label="Организация"
                        value={certOrganization}
                        onChange={setCertOrganization}
                        onBlur={() => touchCertField('organization')}
                        placeholder="Например, Nail School Minsk"
                        error={showCertFieldError('organization') ? certFieldErrors.organization : undefined}
                        maxLength={300}
                      />

                      <Field
                        label="Год"
                        value={certYear}
                        onChange={setCertYear}
                        onBlur={() => touchCertField('year')}
                        placeholder="2024"
                        inputMode="numeric"
                        error={showCertFieldError('year') ? certFieldErrors.year : undefined}
                        maxLength={4}
                      />

                      <Field
                        label="Описание"
                        value={certDesc}
                        onChange={setCertDesc}
                        onBlur={() => touchCertField('description')}
                        placeholder="Коротко о курсе или направлении"
                        multiline
                        error={showCertFieldError('description') ? certFieldErrors.description : undefined}
                        maxLength={1000}
                      />

                      <div>
                        <p className="text-[13px] font-semibold text-neutral-500">Фото сертификата</p>

                        <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]">
                          Добавить фото
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={onPickCertificateImage}
                          />
                        </label>

                        <Field
                          label="Ссылка на фото"
                          value={certPhotoLink}
                          onChange={(v) => {
                            setCertPhotoLink(v);
                            if (v.trim()) clearCertLocalImage();
                            setCertFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.photoLink;
                              return next;
                            });
                          }}
                          onBlur={() => touchCertField('photoLink')}
                          placeholder="https://…"
                          error={showCertFieldError('photoLink') ? certFieldErrors.photoLink : undefined}
                        />

                        {(() => {
                          const previewSrc =
                            parseHttpsCertificateImageUrl(certPhotoLink) ?? certImageUrl ?? undefined;
                          const hasPhoto = Boolean(previewSrc);
                          if (!hasPhoto) return null;
                          return (
                            <div className="mt-3 flex gap-3 rounded-[18px] bg-[#F1EFEF] p-2.5">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-white">
                                <img src={previewSrc} alt="" className="h-full w-full object-cover" decoding="async" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-neutral-900">
                                  {certImageFileName
                                    ? certImageFileName
                                    : parseHttpsCertificateImageUrl(certPhotoLink)
                                      ? 'Ссылка на фото'
                                      : 'Фото добавлено'}
                                </p>
                                <button
                                  type="button"
                                  onClick={clearCertPhoto}
                                  className="mt-2 text-[13px] font-semibold text-[#E29595] underline-offset-2 hover:underline"
                                >
                                  Удалить фото
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {certFieldErrors.image ? (
                          <p className="mt-2 text-[12px] font-medium text-red-600">{certFieldErrors.image}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3">
                        <button
                          type="button"
                          onClick={submitCertificateForm}
                          className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
                        >
                          {certEditingId ? 'Сохранить сертификат' : 'Добавить сертификат'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelCertForm}
                          className="flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-700 transition active:scale-[0.98]"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {certificates.length === 0 && !certFormVisible ? (
                    <p className="rounded-[18px] bg-white/60 px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-neutral-500">
                      Сертификаты можно добавить позже
                    </p>
                  ) : null}

                  {certificates.length > 0 ? (
                    <ul className="space-y-2.5 border-t border-white/50 pt-4">
                      {certificates.map((certificate) => {
                        const meta = [certificate.organization.trim(), certificate.year].filter(Boolean).join(' · ');
                        return (
                          <li
                            key={certificate.id}
                            className={`flex flex-col gap-3 min-[360px]:flex-row rounded-[22px] bg-white px-3 py-3 shadow-[0_6px_18px_rgba(17,17,17,0.04)] ${
                              certEditingId === certificate.id ? 'ring-2 ring-[#E29595]/45' : ''
                            }`}
                          >
                            {certificate.imageUrl ? (
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-[#F1EFEF]">
                                <img
                                  src={certificate.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  decoding="async"
                                />
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-[16px] font-semibold tracking-[-0.03em] text-neutral-950">
                                {certificate.title}
                              </p>
                              {meta ? (
                                <p className="mt-0.5 text-[13px] font-medium text-neutral-500">{meta}</p>
                              ) : null}
                              {certificate.description ? (
                                <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-neutral-500">
                                  {certificate.description}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold">
                                <button
                                  type="button"
                                  onClick={() => startEditCertificate(certificate)}
                                  className="text-[#E29595] underline-offset-2 hover:underline"
                                >
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeCertificate(certificate.id)}
                                  className="text-neutral-500 underline-offset-2 hover:underline"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 7 ? (
              <>
                <StepTitle
                  eyebrow="Проверка"
                  title="Проверьте профиль"
                  text="Так клиенты увидят вашу карточку после публикации"
                />

                <div className="mt-6 rounded-[30px] bg-[#F1EFEF] p-3 sm:p-4">
                  <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_12px_34px_rgba(17,17,17,0.06)]">
                    <div className="border-b border-neutral-100 px-3 pb-5 pt-5 sm:px-5">
                      <div className="flex flex-col items-center gap-4 text-center min-[420px]:flex-row min-[420px]:items-start min-[420px]:text-left">
                        {(() => {
                          const raw = profile?.avatar_url?.trim();
                          const src =
                            raw && (raw.startsWith('https://') || raw.startsWith('http://')) ? raw : null;
                          return src ? (
                            <img
                              src={src}
                              alt=""
                              className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[22px] object-cover"
                              decoding="async"
                            />
                          ) : (
                            <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[22px] bg-[#E29595] text-[26px] font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.26)]">
                              {name.trim().charAt(0).toUpperCase() || 'S'}
                            </div>
                          );
                        })()}

                        <div className="min-w-0 w-full flex-1 [overflow-wrap:anywhere]">
                          <p className="text-[18px] font-semibold leading-snug tracking-[-0.04em] text-neutral-950 sm:text-[22px] sm:leading-tight sm:tracking-[-0.055em]">
                            {name.trim() || 'Имя'}
                          </p>

                          {visitType === 'studio' && salonName.trim() ? (
                            <p className="mt-1 break-words text-[14px] font-medium text-neutral-600">{salonName.trim()}</p>
                          ) : null}

                          <p className="mt-1.5 break-words text-[14px] font-medium text-neutral-500">
                            {selectedCategory?.name ?? 'Категория'}
                          </p>

                          <p className="mt-2 inline-flex max-w-full rounded-full bg-[#F1EFEF] px-3 py-1 text-[12px] font-semibold text-neutral-600">
                            {masterVisitTypeLabel(visitType)}
                          </p>

                          <p className="mt-2.5 text-[11px] font-medium text-neutral-400 sm:text-[12px]">
                            отзывов: 0
                          </p>

                          <button
                            type="button"
                            disabled
                            className="mt-4 flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-[#E29595]/35 px-4 text-[14px] font-semibold text-white/90 min-[420px]:max-w-[16rem]"
                          >
                            Записаться
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 px-3 py-5 sm:px-5">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Основное
                        </p>
                        <ul className="mt-2 space-y-1.5 text-[14px] leading-snug text-neutral-800">
                          <li>
                            <span className="font-semibold text-neutral-950">Имя: </span>
                            {name.trim() || '—'}
                          </li>
                          <li>
                            <span className="font-semibold text-neutral-950">Категория: </span>
                            {selectedCategory?.name ?? '—'}
                          </li>
                          <li>
                            <span className="font-semibold text-neutral-950">Формат приёма: </span>
                            {masterVisitTypeLabel(visitType)}
                          </li>
                        </ul>
                      </div>

                      {description.trim() ? (
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                            О себе
                          </p>
                          <div className="mt-2 rounded-[18px] bg-[#F8F0F0] px-3.5 py-3 ring-1 ring-[#E29595]/10">
                            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-neutral-700">
                              {description.trim()}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {phone.trim() || contactPreviewRows.length > 0 ? (
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                            Контакты
                          </p>
                          <ul className="mt-2 space-y-1.5 text-[14px] font-medium leading-snug text-neutral-900">
                            {phone.trim() ? (
                              <li className="break-words">
                                Телефон: {normalizeBelarusPhone(phone.trim()) ?? phone.trim()}
                              </li>
                            ) : null}
                            {contactPreviewRows.map((row) => (
                              <li key={row.id} className="break-words">
                                {formatContactLineForPreview(row.type, row.value)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Адрес
                        </p>
                        {visitType === 'studio' ? (
                          <div className="mt-2 space-y-1.5 text-[14px] leading-snug text-neutral-800">
                            <p className="font-semibold text-neutral-950">Салон</p>
                            {salonName.trim() ? <p>{salonName.trim()}</p> : null}
                            <p>{formatCityWithAddressLine(locationDraft)}</p>
                            {floor.trim() || room.trim() ? (
                              <p className="text-[13px] text-neutral-600">
                                {[floor.trim() ? `${floor.trim()} этаж` : null, room.trim() ? `кабинет ${room.trim()}` : null]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            ) : null}
                            {directions.trim() ? (
                              <p className="text-[13px] text-neutral-600">Как пройти: {directions.trim()}</p>
                            ) : null}
                            {entrance.trim() || intercom.trim() || clientNote.trim() ? (
                              <div className="space-y-0.5 text-[13px] text-neutral-600">
                                {entrance.trim() ? <p>Подъезд {entrance.trim()}</p> : null}
                                {intercom.trim() ? <p>Домофон {intercom.trim()}</p> : null}
                                {clientNote.trim() ? <p>{clientNote.trim()}</p> : null}
                              </div>
                            ) : null}
                          </div>
                        ) : showExactAddressAfterBooking ? (
                          <div className="mt-2 space-y-1.5 text-[14px] leading-snug text-neutral-800">
                            <p className="font-semibold text-neutral-950">На дому</p>
                            <p>{formatHomePublicBeforeBooking(locationDraft)}</p>
                            <p className="text-[13px] text-neutral-500">
                              Подъезд, этаж и другие детали — только после записи
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-1.5 text-[14px] leading-snug text-neutral-800">
                            <p className="font-semibold text-neutral-950">На дому</p>
                            <p>{formatCityWithAddressLine(locationDraft)}</p>
                            <div className="space-y-0.5 text-[13px] text-neutral-600">
                              {entrance.trim() ? <p>Подъезд {entrance.trim()}</p> : null}
                              {floor.trim() ? <p>Этаж {floor.trim()}</p> : null}
                              {room.trim() ? <p>Квартира {room.trim()}</p> : null}
                              {intercom.trim() ? <p>Домофон {intercom.trim()}</p> : null}
                              {directions.trim() ? <p>Как пройти: {directions.trim()}</p> : null}
                              {clientNote.trim() ? <p>{clientNote.trim()}</p> : null}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Услуги
                        </p>
                        <ul className="mt-2 flex flex-col gap-2.5">
                          {services.map((service) => (
                            <li
                              key={service.id}
                              className="overflow-hidden rounded-[20px] bg-white px-4 py-3.5 shadow-[0_6px_22px_rgba(17,17,17,0.05)] ring-1 ring-[#F1EFEF]"
                            >
                              <p className="break-words text-[16px] font-semibold tracking-[-0.03em] text-neutral-950">
                                {service.title}
                              </p>
                              <p className="mt-2 inline-flex rounded-full bg-[#F8F0F0] px-2.5 py-1 text-[12px] font-semibold text-neutral-700">
                                {service.durationMin} мин · {formatPreviewServicePrice(service)}
                              </p>
                              {service.description ? (
                                <p className="mt-3 whitespace-pre-wrap break-words rounded-[14px] bg-[#F1EFEF] px-3 py-2.5 text-[13px] leading-relaxed text-neutral-600">
                                  {service.description}
                                </p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Сертификаты
                        </p>
                        {certificates.length > 0 ? (
                          <ul className="mt-2 flex flex-col gap-2">
                            {certificates.map((certificate) => {
                              const meta = [certificate.organization.trim(), certificate.year]
                                .filter(Boolean)
                                .join(' · ');
                              return (
                                <li
                                  key={certificate.id}
                                  className="flex gap-2.5 rounded-[16px] bg-[#F1EFEF] px-2.5 py-2"
                                >
                                  {certificate.imageUrl ? (
                                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-white">
                                      <img
                                        src={certificate.imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        decoding="async"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="min-w-0 flex-1">
                                    <p className="break-words text-[14px] font-semibold text-neutral-950">
                                      {certificate.title}
                                    </p>
                                    {meta ? (
                                      <p className="mt-0.5 text-[12px] font-medium text-neutral-500">{meta}</p>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2 text-[13px] leading-snug text-neutral-500">Можно добавить позже</p>
                        )}
                      </div>

                      <div className="rounded-[18px] bg-[#F1EFEF] px-3 py-3">
                        <p className="text-[13px] font-semibold text-neutral-950">График работы</p>
                        <p className="mt-1 text-[14px] font-medium text-neutral-700">Пн–Пт, 9:00–18:00</p>
                        <p className="mt-1.5 text-[12px] leading-snug text-neutral-500">
                          Изменить график работы можно в кабинете мастера
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : step === 8 ? (
              <>
                <StepTitle
                  eyebrow="Тариф"
                  title="Выберите тариф"
                  text="Начните бесплатно или подключите Pro для продвижения"
                />

                {publishError ? (
                  <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                    {publishError}
                  </p>
                ) : null}

                {services.length > 3 && tariffSelection === 'basic' ? (
                  <p className="mt-4 rounded-[22px] bg-[#F8F6F6] px-4 py-3 text-[13px] font-medium leading-snug text-neutral-600">
                    На базовом тарифе можно опубликовать до 3 услуг. Остальные можно активировать после подключения Pro.
                  </p>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
                  <div
                    className={`flex flex-col rounded-[26px] border bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] transition ${
                      tariffSelection === 'basic' ? 'border-[#E29595]/55 ring-1 ring-[#E29595]/25' : 'border-neutral-100'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Тариф</p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">Базовый</p>
                    <p className="mt-1 text-[20px] font-semibold text-[#E29595]">0 BYN</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Для старта</p>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-[12px] font-medium leading-snug text-neutral-700">
                      <li>до 3 услуг</li>
                      <li>обычная позиция в поиске</li>
                      <li>профиль мастера</li>
                      <li>записи от клиентов</li>
                      <li>базовая поддержка</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => setTariffSelection('basic')}
                      className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-3 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
                    >
                      Остаться на базовом
                    </button>
                  </div>

                  <div
                    className={`relative flex flex-col rounded-[26px] border bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] transition ${
                      tariffSelection === 'pro_interest'
                        ? 'border-[#E29595]/55 ring-1 ring-[#E29595]/25'
                        : 'border-neutral-100'
                    }`}
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-[#FFF4F4] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C96B6B]">
                      Для роста
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Тариф</p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">Pro</p>
                    <p className="mt-1 text-[15px] font-semibold text-neutral-700">{proOnboardingPriceLabel}</p>
                    <p className="mt-1 text-[13px] font-medium text-neutral-500">Для роста записей</p>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-[12px] font-medium leading-snug text-neutral-700">
                      <li>больше услуг</li>
                      <li>выше в поиске</li>
                      <li>бейдж Pro</li>
                      <li>акции и скидки</li>
                      <li>расширенная статистика</li>
                      <li>больше фото работ</li>
                      <li>приоритетная поддержка</li>
                    </ul>
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setTariffSelection('pro_interest')}
                        className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#E29595] px-3 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
                      >
                        Оставить заявку на Pro
                      </button>
                      <button
                        type="button"
                        onClick={() => setTariffSelection('pro_interest')}
                        className="flex min-h-10 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-3 text-[13px] font-semibold text-neutral-800 transition active:scale-[0.98]"
                      >
                        Подключить позже
                      </button>
                    </div>
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

      {step > 1 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4">
          <div className={ONBOARDING_PAGE_WRAP}>
            {step === 5 && services.length === 0 ? (
              <p className="mb-2 text-center text-[13px] font-medium text-neutral-500">
                Добавьте хотя бы одну услугу
              </p>
            ) : null}
            {step === 7 && publishBlockingIssues.length > 0 ? (
              <div className="mb-2 rounded-[18px] border border-[#F0D6CC] bg-[#FFF9F7] px-3 py-2.5">
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
                      onClick={() => setStep(3)}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#E29595] shadow-sm transition active:scale-[0.98]"
                    >
                      Исправить профиль
                    </button>
                  ) : null}
                  {publishBlockingIssues.some((i) => i.fixStep === 4) ? (
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#E29595] shadow-sm transition active:scale-[0.98]"
                    >
                      Исправить адрес
                    </button>
                  ) : null}
                  {publishBlockingIssues.some((i) => i.fixStep === 5) ? (
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#E29595] shadow-sm transition active:scale-[0.98]"
                    >
                      Исправить услуги
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={step !== 6 && !canGoNext}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition enabled:hover:opacity-90 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {step === 6 && certificates.length === 0 ? 'Пропустить' : 'Дальше'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void publish()}
                disabled={
                  saving ||
                  publishBlockingIssues.length > 0 ||
                  !selectedCategoryId ||
                  !isAuthenticated ||
                  !getApiBaseUrl()
                }
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? 'Публикуем…' : 'Опубликовать профиль'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}