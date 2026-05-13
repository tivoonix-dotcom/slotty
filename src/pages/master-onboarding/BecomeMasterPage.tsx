import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ADMIN_PATH, HUB_PATH } from '../../app/paths';
import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import type { MasterLocation, MasterVisitType } from '../../features/profile/model/masterLocation';
import {
  formatPublicAddress,
  masterVisitTypeLabel,
} from '../../features/profile/model/masterLocation';
import { OnboardingAddressMap } from './OnboardingAddressMap';
import { useAuth } from '../../features/auth/AuthProvider';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import {
  DEFAULT_WEEKDAY_SCHEDULE,
  fetchServiceCategories,
  submitMasterOnboarding,
  type ServiceCategoryDto,
} from '../../features/master-onboarding/api/becomeMasterApi';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';

const TOTAL_STEPS = 7;
const LOGO_SRC = '/photos/logo.png';

type PriceType = 'fixed' | 'from';

type OnboardingService = MasterOnboardingService & {
  priceType?: PriceType;
  isActive?: boolean;
  sortOrder?: number;
};

type MasterCertificate = {
  id: string;
  title: string;
  issuer: string;
  year?: string;
  imageUrl?: string;
  description?: string;
};

const CATEGORY_ICONS: Record<string, string> = {
  manicure: '💅',
  barbers: '✂️',
  'brows-lashes': '👁️',
  massage: '🤲',
  fitness: '💪',
  tattoo: '🖤',
};

const CATEGORY_HINTS: Record<string, string> = {
  manicure: 'Ногти, покрытие, уход',
  barbers: 'Стрижки, борода, стиль',
  'brows-lashes': 'Оформление и ламинирование',
  massage: 'Расслабление и восстановление',
  fitness: 'Тренировки и тело',
  tattoo: 'Татуировки и эскизы',
};

const VISIT_TYPES: MasterVisitType[] = ['studio', 'at_home'];

function newEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fieldClass(): string {
  return `
    mt-1.5
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

function buildLocationFromForm(
  visitType: MasterVisitType,
  fields: {
    city: string;
    street: string;
    building: string;
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

  if (
    typeof fields.lat === 'number' &&
    Number.isFinite(fields.lat) &&
    typeof fields.lng === 'number' &&
    Number.isFinite(fields.lng)
  ) {
    base.lat = fields.lat;
    base.lng = fields.lng;
  }

  if (visitType === 'studio') {
    return {
      ...base,
      entrance: fields.entrance.trim() || undefined,
      floor: fields.floor.trim() || undefined,
      room: fields.room.trim() || undefined,
      intercom: fields.intercom.trim() || undefined,
      landmark: fields.landmark.trim() || undefined,
      directions: fields.directions.trim() || undefined,
      clientNote: fields.clientNote.trim() || undefined,
    };
  }

  return {
    ...base,
    clientNote: fields.clientNote.trim() || undefined,
  };
}

function StepTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {eyebrow}
      </p>

      <h1 className="mt-2 text-[30px] font-semibold leading-[1.02] tracking-[-0.065em] text-neutral-950">
        {title}
      </h1>

      {text ? (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
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
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-neutral-500">
        {label}
      </span>

      {hint ? (
        <p className="mt-1 text-[12px] leading-snug text-neutral-400">{hint}</p>
      ) : null}

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className={`${fieldClass()} resize-none leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
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

function MiniInfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[26px] bg-[#F1EFEF] px-4 py-4">
      <p className="text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
        {title}
      </p>

      <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
        {text}
      </p>
    </div>
  );
}

export function BecomeMasterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, profile, backendConfigured, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesReady, setCategoriesReady] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});

  const [visitType, setVisitType] = useState<MasterVisitType>('studio');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [intercom, setIntercom] = useState('');
  const [landmark, setLandmark] = useState('');
  const [directions, setDirections] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [addressFieldErrors, setAddressFieldErrors] = useState<Record<string, string>>({});

  const [services, setServices] = useState<OnboardingService[]>([]);
  const [svcTitle, setSvcTitle] = useState('');
  const [svcDur, setSvcDur] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcPriceType, setSvcPriceType] = useState<PriceType>('fixed');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcFieldErrors, setSvcFieldErrors] = useState<Record<string, string>>({});

  const [certificates, setCertificates] = useState<MasterCertificate[]>([]);
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState('');
  const [certDesc, setCertDesc] = useState('');
  const [certImageUrl, setCertImageUrl] = useState<string | undefined>(undefined);
  const [certFieldErrors, setCertFieldErrors] = useState<Record<string, string>>({});

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

  const progressPct = useMemo(
    () => (success ? 100 : (step / TOTAL_STEPS) * 100),
    [step, success],
  );

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const locationDraft = useMemo(
    () =>
      buildLocationFromForm(visitType, {
        city,
        street,
        building,
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

  const publicAddressForApi = useMemo(() => {
    const base = formatPublicAddress(locationDraft);
    const c = city.trim();
    const combined = c && base ? `${c}, ${base}` : c || base;
    return combined.slice(0, 600);
  }, [city, locationDraft]);

  const canGoNext = useMemo(() => {
    if (step === 2) return Boolean(selectedCategoryId);
    if (step === 3) {
      const n = name.trim();
      return n.length >= 2 && n.length <= 200;
    }
    if (step === 4) {
      return city.trim().length > 0 && street.trim().length > 0 && building.trim().length > 0;
    }
    if (step === 5) return services.length > 0;

    if (step === 6) return true;

    return true;
  }, [building, city, name, selectedCategoryId, services.length, step, street]);

  const addService = useCallback(() => {
    const title = svcTitle.trim();
    const duration = Number.parseInt(svcDur, 10);
    const price = Number.parseFloat(svcPrice.replace(',', '.').trim());
    const desc = svcDesc.trim();

    const errs: Record<string, string> = {};

    if (title.length < 1) errs.title = 'Введите название услуги.';
    else if (title.length > 300) errs.title = 'Не длиннее 300 символов.';

    if (!Number.isInteger(duration) || duration < 1) {
      errs.duration = 'Укажите целое число минут от 1.';
    } else if (duration > 24 * 60) {
      errs.duration = 'Максимум 1440 минут (24 часа).';
    }

    if (!Number.isFinite(price) || price < 0) {
      errs.price = 'Укажите цену числом от 0.';
    }

    if (desc.length > 20_000) errs.description = 'Описание не длиннее 20 000 символов.';

    setSvcFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setServices((prev) => [
      ...prev,
      {
        id: newEntityId('svc'),
        title,
        durationMin: duration,
        priceByn: price,
        priceType: svcPriceType,
        isActive: true,
        sortOrder: prev.length,
        description: desc || undefined,
      },
    ]);

    setSvcTitle('');
    setSvcDur('');
    setSvcPrice('');
    setSvcPriceType('fixed');
    setSvcDesc('');
    setSvcFieldErrors({});
  }, [svcDesc, svcDur, svcPrice, svcPriceType, svcTitle]);

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
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

    setCertImageUrl((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });
  }, []);

  const addCertificate = useCallback(() => {
    const title = certTitle.trim();
    const issuer = certIssuer.trim();
    const yearStr = certYear.trim();
    const desc = certDesc.trim();

    const errs: Record<string, string> = {};

    if (title.length < 1) errs.title = 'Введите название.';
    else if (title.length > 300) errs.title = 'Не длиннее 300 символов.';

    if (issuer.length < 1) errs.issuer = 'Укажите школу, организацию или курс.';
    else if (issuer.length > 300) errs.issuer = 'Не длиннее 300 символов.';

    if (yearStr) {
      const y = Number.parseInt(yearStr, 10);
      if (!Number.isInteger(y) || y < 1950 || y > 2100) {
        errs.year = 'Год от 1950 до 2100 или оставьте пустым.';
      }
    }

    if (desc.length > 5000) errs.description = 'Не длиннее 5000 символов.';

    setCertFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCertificates((prev) => [
      ...prev,
      {
        id: newEntityId('cert'),
        title,
        issuer,
        year: yearStr || undefined,
        description: desc || undefined,
        imageUrl: certImageUrl,
      },
    ]);

    setCertTitle('');
    setCertIssuer('');
    setCertYear('');
    setCertDesc('');
    setCertImageUrl(undefined);
    setCertFieldErrors({});
  }, [certDesc, certImageUrl, certIssuer, certTitle, certYear]);

  const removeCertificate = useCallback((id: string) => {
    setCertificates((prev) => {
      const target = prev.find((certificate) => certificate.id === id);

      if (target?.imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.imageUrl);
      }

      return prev.filter((certificate) => certificate.id !== id);
    });
  }, []);

  const validateProfileStep = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 2) errs.name = 'Минимум 2 символа.';
    if (n.length > 200) errs.name = 'Не длиннее 200 символов.';

    const bio = description.trim();
    if (bio.length > 10_000) errs.description = 'Не длиннее 10 000 символов.';

    const phoneTrim = phone.trim();
    if (phoneTrim && !/^[\d\s+()\-]{5,50}$/.test(phoneTrim)) {
      errs.phone = 'Только цифры, +, пробелы и скобки, от 5 до 50 символов.';
    }

    const contactTrim = contact.trim();
    if (contactTrim.length > 500) errs.contact = 'Не длиннее 500 символов.';

    setProfileFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [contact, description, name, phone]);

  const validateAddressStep = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (!city.trim()) errs.city = 'Укажите город.';
    else if (city.trim().length > 120) errs.city = 'Не длиннее 120 символов.';

    if (!street.trim()) errs.street = 'Укажите улицу и дом (или район для выезда).';
    else if (street.trim().length > 200) errs.street = 'Не длиннее 200 символов.';

    const b = building.trim();
    if (!b) errs.building = 'Укажите дом, корпус или «б/н», если не применимо.';
    else if (b.length > 80) errs.building = 'Не длиннее 80 символов.';

    if (entrance.trim().length > 120) errs.entrance = 'Не длиннее 120 символов.';
    if (floor.trim().length > 40) errs.floor = 'Не длиннее 40 символов.';
    if (room.trim().length > 80) errs.room = 'Не длиннее 80 символов.';
    if (intercom.trim().length > 80) errs.intercom = 'Не длиннее 80 символов.';
    if (landmark.trim().length > 240) errs.landmark = 'Не длиннее 240 символов.';
    if (directions.trim().length > 2000) errs.directions = 'Не длиннее 2000 символов.';
    if (clientNote.trim().length > 2000) errs.clientNote = 'Не длиннее 2000 символов.';

    setAddressFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [
    building,
    city,
    clientNote,
    directions,
    entrance,
    floor,
    intercom,
    landmark,
    room,
    street,
  ]);

  const goNext = useCallback(() => {
    if (step === 3 && !validateProfileStep()) return;
    if (step === 4 && !validateAddressStep()) return;

    if (step === 5 && services.length === 0) {
      setSvcFieldErrors({ form: 'Добавьте хотя бы одну услугу.' });
      return;
    }

    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return next;
    });
    setAddressFieldErrors({});
    setCertFieldErrors({});
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }, [services.length, step, validateAddressStep, validateProfileStep]);

  const goBack = useCallback(() => {
    setStep((current) => Math.max(1, current - 1));
    setSvcFieldErrors((prev) => {
      const next = { ...prev };
      delete next.form;
      return next;
    });
    setAddressFieldErrors({});
    setCertFieldErrors({});
  }, []);

  const publish = useCallback(async () => {
    if (!selectedCategoryId || !name.trim() || services.length === 0) return;
    if (!getApiBaseUrl()) {
      setPublishError('Не настроен адрес API (VITE_API_URL).');
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
          issuer: c.issuer.trim(),
          year: c.year ? Number.parseInt(String(c.year), 10) : null,
          description: c.description?.trim() || null,
          imageUrl:
            c.imageUrl && (c.imageUrl.startsWith('http://') || c.imageUrl.startsWith('https://'))
              ? c.imageUrl
              : null,
          sortOrder,
        }))
        .filter((c) => c.title && c.issuer);

      await submitMasterOnboarding({
        categoryCode: cat.code,
        name: name.trim(),
        description: description.trim() || undefined,
        phone: phone.trim() || null,
        contact: contact.trim() || null,
        photoUrl,
        location: {
          visitType,
          city: city.trim(),
          street: street.trim(),
          building: building.trim(),
          buildingDetail: null,
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
          description: s.description ?? '',
          durationMinutes: s.durationMin,
          priceAmount: s.priceByn,
          priceType: s.priceType ?? 'fixed',
          sortOrder: i,
        })),
        certificates: certPayload,
      });

      await refreshProfile();
      setSuccess(true);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [
    categories,
    certificates,
    city,
    clientNote,
    contact,
    description,
    directions,
    entrance,
    floor,
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
    selectedCategoryId,
    services,
    street,
    validateAddressStep,
    validateProfileStep,
    visitType,
    building,
  ]);

  if (success) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-neutral-900">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[42px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.06)]">
            <div className="rounded-[34px] bg-white px-6 py-8 text-center">
              <img
                src={LOGO_SRC}
                alt="SLOTTY"
                className="mx-auto h-auto max-h-48 w-auto max-w-[min(100%,28rem)] object-contain"
                draggable={false}
              />

              <h1 className="mt-8 text-[31px] font-semibold leading-[1.05] tracking-[-0.065em] text-neutral-950">
                Профиль мастера создан
              </h1>

              <p className="mx-auto mt-3 max-w-[20rem] text-[15px] leading-relaxed text-neutral-500">
                Теперь можно открыть кабинет, настроить расписание и принимать записи.
              </p>

              <button
                type="button"
                onClick={() => navigate(ADMIN_PATH)}
                className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
              >
                Перейти в кабинет
              </button>

              <Link
                to={HUB_PATH}
                className="mt-3 flex min-h-[3.15rem] w-full items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authLoading && step >= 2 && !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-lg pt-6">
          <NothingFoundCard
            title="Нужен вход"
            text="Войдите через Telegram, чтобы сохранить анкету мастера на сервере SLOTTY."
            action={
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-[#E29595] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
              >
                К описанию
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (step >= 2 && !backendConfigured) {
    return (
      <div className="min-h-dvh bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-lg pt-6">
          <NothingFoundCard
            title="Нет подключения к API"
            text="Укажите VITE_API_URL в .env и перезапустите приложение, затем откройте анкету снова."
            action={
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-[#E29595] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
              >
                К описанию
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-dvh bg-white pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-neutral-900 ${
        step === 1
          ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
          : 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]'
      }`}
    >
      <div className="mx-auto max-w-lg px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to={HUB_PATH}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition active:scale-[0.99]"
          >
            ← На главную
          </Link>

          <span className="rounded-full bg-[#F1EFEF] px-3 py-2 text-[13px] font-semibold text-neutral-500">
            {step} / {TOTAL_STEPS}
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#F1EFEF]">
          <div
            className="h-full rounded-full bg-[#E29595] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-6 rounded-[42px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.06)]">
          <div className="rounded-[34px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
            {step === 1 ? (
              <div className="text-center">
                <img
                  src={LOGO_SRC}
                  alt="SLOTTY"
                  className="mx-auto h-auto max-h-48 w-auto max-w-[min(100%,28rem)] object-contain"
                  draggable={false}
                />

                <div className="-translate-y-10 text-center">
                  <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.07em] text-neutral-950">
                    Анкета мастера
                  </h1>

                  <p className="mx-auto mt-3 max-w-[21rem] text-[15px] leading-relaxed text-neutral-500">
                    Заполните профиль, добавьте услуги и начните принимать записи в SLOTTY.
                  </p>

                  <div className="mt-7 grid grid-cols-2 gap-2 text-left">
                    <MiniInfoCard title="Профиль" text="Имя, описание и контакты." />
                    <MiniInfoCard title="Адрес" text="Куда клиенту ехать и как пройти." />
                    <MiniInfoCard title="Услуги" text="Цена, длительность и описание." />
                    <MiniInfoCard title="Доверие" text="Сертификаты можно добавить сразу или позже." />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-7 flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
                  >
                    Начать
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <>
                <StepTitle
                  eyebrow="Категория"
                  title="Чем вы занимаетесь?"
                  text="Выберите основное направление. Оно будет показываться в профиле мастера."
                />

                {categoriesError ? (
                  <p className="mt-6 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                    {categoriesError}
                  </p>
                ) : null}

                {!categoriesReady ? (
                  <p className="mt-8 text-center text-[15px] text-neutral-500">Загрузка категорий…</p>
                ) : categories.length === 0 ? (
                  <p className="mt-8 text-center text-[15px] text-neutral-500">
                    Категории не найдены. Обратитесь в поддержку.
                  </p>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-2">
                    {[...categories]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item) => {
                        const active = selectedCategoryId === item.id;
                        const icon = CATEGORY_ICONS[item.code] ?? '✨';
                        const hint = CATEGORY_HINTS[item.code] ?? 'Основное направление работы';

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(item.id)}
                            className={`flex min-h-[4.8rem] items-center gap-3 rounded-[28px] px-4 text-left transition active:scale-[0.98] ${
                              active
                                ? 'bg-[#E29595] text-white shadow-[0_12px_30px_rgba(226,149,149,0.25)]'
                                : 'bg-[#F1EFEF] text-neutral-950'
                            }`}
                          >
                            <span
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] text-[22px] ${
                                active ? 'bg-white/20' : 'bg-white'
                              }`}
                              aria-hidden
                            >
                              {icon}
                            </span>

                            <span className="min-w-0">
                              <span className="block text-[17px] font-semibold tracking-[-0.04em]">
                                {item.name}
                              </span>

                              <span
                                className={`mt-0.5 block text-[13px] leading-snug ${
                                  active ? 'text-white/80' : 'text-neutral-500'
                                }`}
                              >
                                {hint}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </>
            ) : null}

            {step === 3 ? (
              <>
                <StepTitle
                  eyebrow="Профиль"
                  title="Расскажите о себе"
                  text="Эти данные увидит клиент перед записью."
                />

                <div className="mt-6 space-y-4">
                  <Field
                    label="Имя мастера или название студии *"
                    value={name}
                    onChange={setName}
                    placeholder="Например, Анна Смирнова"
                    hint="Как вас увидят в поиске и в карточке. 2–200 символов."
                    error={profileFieldErrors.name}
                    maxLength={200}
                  />

                  <Field
                    label="Краткое описание"
                    value={description}
                    onChange={setDescription}
                    placeholder="Расскажите, чем вы занимаетесь и почему к вам стоит записаться"
                    multiline
                    hint="Необязательно. До 10 000 символов — стиль, опыт, для кого вы работаете."
                    error={profileFieldErrors.description}
                    maxLength={10_000}
                  />

                  <Field
                    label="Телефон для связи"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+375 29 000-00-00"
                    inputMode="tel"
                    hint="Необязательно. Только цифры, +, пробелы и скобки, от 5 символов, если заполняете."
                    error={profileFieldErrors.phone}
                    maxLength={50}
                  />

                  <Field
                    label="Контакт (мессенджер, соцсеть)"
                    value={contact}
                    onChange={setContact}
                    placeholder="@username или ссылка"
                    hint="Необязательно. Удобный способ связи для клиента, до 500 символов."
                    error={profileFieldErrors.contact}
                    maxLength={500}
                  />
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <StepTitle
                  eyebrow="Адрес"
                  title="Где вас найти?"
                  text="Клиент должен понимать не только адрес, но и как пройти внутрь."
                />

                <div className="mt-6">
                  <p className="text-[13px] font-semibold text-neutral-500">
                    Формат приема
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5">
                    {VISIT_TYPES.map((type) => {
                      const active = visitType === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setVisitType(type);
                            setAddressFieldErrors({});
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

                <div className="mt-5 space-y-4">
                  <Field
                    label="Город *"
                    value={city}
                    onChange={(value) => {
                      setCity(value);
                      setAddressFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.city;
                        return next;
                      });
                    }}
                    placeholder="Например, Минск"
                    hint="Город или населённый пункт приёма / выезда. До 120 символов."
                    error={addressFieldErrors.city}
                    maxLength={120}
                  />
                </div>

                <div className="mt-5 overflow-hidden rounded-[30px] bg-[#F1EFEF] p-3">
                  <OnboardingAddressMap
                    key={visitType}
                    addressLine={street}
                    onPick={(result) => {
                      setStreet(result.addressLine);
                      setLat(result.lat);
                      setLng(result.lng);
                      setAddressFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.street;
                        return next;
                      });
                    }}
                  />
                </div>

                <div className="mt-5 space-y-4">
                  <Field
                    label={visitType === 'studio' ? 'Улица и дом (строка для карты) *' : 'Район или адрес выезда *'}
                    value={street}
                    onChange={(value) => {
                      setStreet(value);
                      setAddressFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.street;
                        return next;
                      });
                    }}
                    placeholder="Например, ул. Немига, 5"
                    hint="Можно уточнить на карте выше. До 200 символов."
                    error={addressFieldErrors.street}
                    maxLength={200}
                  />

                  <Field
                    label="Дом, корпус, строение *"
                    value={building}
                    onChange={(value) => {
                      setBuilding(value);
                      setAddressFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.building;
                        return next;
                      });
                    }}
                    placeholder={visitType === 'studio' ? '12, корп. 2' : '12А'}
                    hint="Если не применимо, укажите «б/н». До 80 символов."
                    error={addressFieldErrors.building}
                    maxLength={80}
                  />

                  <Field
                    label="Подъезд"
                    value={entrance}
                    onChange={setEntrance}
                    placeholder="Например, 2 или парадная А"
                    hint="Необязательно. До 120 символов."
                    error={addressFieldErrors.entrance}
                    maxLength={120}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Этаж"
                      value={floor}
                      onChange={setFloor}
                      placeholder="3"
                      hint="До 40 символов."
                      error={addressFieldErrors.floor}
                      maxLength={40}
                    />

                    <Field
                      label={visitType === 'at_home' ? 'Квартира' : 'Квартира / кабинет'}
                      value={room}
                      onChange={setRoom}
                      placeholder={visitType === 'at_home' ? '45' : '312'}
                      hint="До 80 символов."
                      error={addressFieldErrors.room}
                      maxLength={80}
                    />
                  </div>

                  <Field
                    label="Код домофона"
                    value={intercom}
                    onChange={setIntercom}
                    placeholder="Например, 12В или кнопка вызова"
                    hint="До 80 символов."
                    error={addressFieldErrors.intercom}
                    maxLength={80}
                  />

                  {visitType === 'studio' ? (
                    <>
                      <Field
                        label="Ориентир"
                        value={landmark}
                        onChange={setLandmark}
                        placeholder="Рядом с кофейней, аптекой или входом"
                        hint="Необязательно. До 240 символов."
                        error={addressFieldErrors.landmark}
                        maxLength={240}
                      />

                      <Field
                        label="Как пройти"
                        value={directions}
                        onChange={setDirections}
                        placeholder="Зайдите в главный вход, поднимитесь на 3 этаж, поверните направо"
                        multiline
                        hint="Необязательно. До 2000 символов."
                        error={addressFieldErrors.directions}
                        maxLength={2000}
                      />
                    </>
                  ) : null}

                  <Field
                    label="Комментарий для клиента"
                    value={clientNote}
                    onChange={setClientNote}
                    placeholder={
                      visitType === 'studio'
                        ? 'Например, приходите за 5 минут до записи'
                        : 'Например, зона выезда и что подготовить дома'
                    }
                    multiline
                    hint="Необязательно. До 2000 символов."
                    error={addressFieldErrors.clientNote}
                    maxLength={2000}
                  />
                </div>

                {Object.keys(addressFieldErrors).length > 0 ? (
                  <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                    Проверьте поля адреса выше.
                  </p>
                ) : null}

                <div className="mt-6 rounded-[30px] bg-[#F1EFEF] p-4">
                  <p className="text-[13px] font-semibold text-neutral-500">
                    Как это увидит клиент
                  </p>

                  {city.trim() ? (
                    <p className="mt-2 text-[14px] font-medium text-neutral-600">Город: {city.trim()}</p>
                  ) : null}

                  <p className="mt-2 text-[16px] font-semibold leading-snug text-neutral-950">
                    {formatPublicAddress(locationDraft)}
                  </p>

                  <div className="mt-2 space-y-1 text-[13px] leading-relaxed text-neutral-500">
                    {entrance.trim() ? <p>Подъезд: {entrance.trim()}</p> : null}
                    {floor.trim() ? <p>Этаж: {floor.trim()}</p> : null}
                    {room.trim() ? (
                      <p>
                        {visitType === 'at_home' ? 'Квартира' : 'Кабинет / квартира'}: {room.trim()}
                      </p>
                    ) : null}
                    {intercom.trim() ? <p>Домофон: {intercom.trim()}</p> : null}
                    {landmark.trim() ? <p>Ориентир: {landmark.trim()}</p> : null}
                    {directions.trim() ? <p>Как пройти: {directions.trim()}</p> : null}
                    {clientNote.trim() ? <p>{clientNote.trim()}</p> : null}
                  </div>
                </div>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <StepTitle
                  eyebrow="Услуги"
                  title="Добавьте услуги"
                  text="Укажите, что клиент сможет выбрать при записи."
                />

                <div className="mt-6 rounded-[30px] bg-[#F1EFEF] p-3">
                  <div className="rounded-[26px] bg-white p-4">
                    <Field
                      label="Название услуги *"
                      value={svcTitle}
                      onChange={setSvcTitle}
                      placeholder="Маникюр с покрытием"
                      hint="До 300 символов. Кратко и понятно для записи."
                      error={svcFieldErrors.title}
                      maxLength={300}
                    />

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Field
                        label="Длительность *"
                        value={svcDur}
                        onChange={setSvcDur}
                        placeholder="90"
                        inputMode="numeric"
                        hint="Минуты, от 1 до 1440."
                        error={svcFieldErrors.duration}
                      />

                      <Field
                        label="Цена, BYN *"
                        value={svcPrice}
                        onChange={setSvcPrice}
                        placeholder="45"
                        inputMode="decimal"
                        hint="Можно 0. Дробная часть через точку или запятую."
                        error={svcFieldErrors.price}
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-neutral-500">
                        Тип цены
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-2 rounded-[26px] bg-[#F1EFEF] p-1.5">
                        <button
                          type="button"
                          onClick={() => setSvcPriceType('fixed')}
                          className={`min-h-11 rounded-full text-[14px] font-semibold transition active:scale-[0.98] ${
                            svcPriceType === 'fixed'
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-500'
                          }`}
                        >
                          Точная цена
                        </button>

                        <button
                          type="button"
                          onClick={() => setSvcPriceType('from')}
                          className={`min-h-11 rounded-full text-[14px] font-semibold transition active:scale-[0.98] ${
                            svcPriceType === 'from'
                              ? 'bg-white text-neutral-950 shadow-[0_8px_20px_rgba(17,17,17,0.05)]'
                              : 'text-neutral-500'
                          }`}
                        >
                          Цена от
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Field
                        label="Описание"
                        value={svcDesc}
                        onChange={setSvcDesc}
                        placeholder="Что входит в услугу"
                        multiline
                        hint="Необязательно. До 20 000 символов."
                        error={svcFieldErrors.description}
                        maxLength={20_000}
                      />
                    </div>

                    {Object.keys(svcFieldErrors).length > 0 ? (
                      <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                        {Object.values(svcFieldErrors).join(' ')}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={addService}
                      className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
                    >
                      Добавить услугу
                    </button>
                  </div>
                </div>

                {services.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-3 rounded-[30px] bg-[#F1EFEF] p-3">
                    {services.map((service) => (
                      <li
                        key={service.id}
                        className="rounded-[26px] bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.04)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">
                              {service.title}
                            </p>

                            <p className="mt-1 text-[14px] font-medium text-neutral-500">
                              {service.durationMin} мин · {formatPrice(service)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeService(service.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[18px] font-light text-neutral-500 transition active:scale-[0.96]"
                            aria-label="Удалить услугу"
                          >
                            ×
                          </button>
                        </div>

                        {service.description ? (
                          <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
                            {service.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-[30px] bg-[#F1EFEF] px-5 py-8 text-center">
                    <p className="text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">
                      Услуг пока нет
                    </p>

                    <p className="mx-auto mt-2 max-w-[19rem] text-[14px] leading-relaxed text-neutral-500">
                      Добавьте хотя бы одну услугу, чтобы клиенты могли записываться.
                    </p>
                  </div>
                )}
              </>
            ) : null}

            {step === 6 ? (
              <>
                <StepTitle
                  eyebrow="Доверие"
                  title="Сертификаты"
                  text="Этот шаг необязательный. Добавьте курсы или дипломы, если хотите повысить доверие клиентов."
                />

                <div className="mt-6 rounded-[30px] bg-[#F1EFEF] p-3">
                  <div className="rounded-[26px] bg-white p-4">
                    <Field
                      label="Название сертификата"
                      value={certTitle}
                      onChange={setCertTitle}
                      placeholder="Курс аппаратного маникюра"
                      hint="До 300 символов."
                      error={certFieldErrors.title}
                      maxLength={300}
                    />

                    <div className="mt-4">
                      <Field
                        label="Школа / организация"
                        value={certIssuer}
                        onChange={setCertIssuer}
                        placeholder="Nail School Minsk"
                        hint="До 300 символов."
                        error={certFieldErrors.issuer}
                        maxLength={300}
                      />
                    </div>

                    <div className="mt-4">
                      <Field
                        label="Год"
                        value={certYear}
                        onChange={setCertYear}
                        placeholder="2024"
                        inputMode="numeric"
                        hint="Необязательно. От 1950 до 2100."
                        error={certFieldErrors.year}
                        maxLength={4}
                      />
                    </div>

                    <div className="mt-4">
                      <Field
                        label="Описание"
                        value={certDesc}
                        onChange={setCertDesc}
                        placeholder="Коротко о курсе или направлении"
                        multiline
                        hint="Необязательно. До 5000 символов."
                        error={certFieldErrors.description}
                        maxLength={5000}
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-neutral-500">
                        Фото сертификата
                      </p>

                      <p className="mt-1 text-[12px] leading-snug text-neutral-400">
                        Необязательно. На сервер попадут только ссылки https — загрузка файла из браузера пока
                        только для предпросмотра.
                      </p>

                      <label className="mt-2 flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]">
                        {certImageUrl ? 'Заменить фото' : 'Добавить фото'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={onPickCertificateImage}
                        />
                      </label>

                      {certImageUrl ? (
                        <div className="mt-3 overflow-hidden rounded-[24px] bg-[#F1EFEF]">
                          <img
                            src={certImageUrl}
                            alt=""
                            className="h-40 w-full object-cover"
                            decoding="async"
                          />
                        </div>
                      ) : null}

                      {certFieldErrors.image ? (
                        <p className="mt-2 text-[12px] font-medium text-red-600">{certFieldErrors.image}</p>
                      ) : null}
                    </div>

                    {Object.keys(certFieldErrors).filter((k) => k !== 'image').length > 0 ? (
                      <p className="mt-4 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                        {Object.entries(certFieldErrors)
                          .filter(([k]) => k !== 'image')
                          .map(([, v]) => v)
                          .join(' ')}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={addCertificate}
                      className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
                    >
                      Добавить сертификат
                    </button>
                  </div>
                </div>

                {certificates.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-3 rounded-[30px] bg-[#F1EFEF] p-3">
                    {certificates.map((certificate) => (
                      <li
                        key={certificate.id}
                        className="rounded-[26px] bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.04)]"
                      >
                        {certificate.imageUrl ? (
                          <div className="mb-3 overflow-hidden rounded-[22px] bg-[#F1EFEF]">
                            <img
                              src={certificate.imageUrl}
                              alt=""
                              className="h-36 w-full object-cover"
                              decoding="async"
                            />
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">
                              {certificate.title}
                            </p>

                            <p className="mt-1 text-[14px] font-medium text-neutral-500">
                              {certificate.issuer}
                              {certificate.year ? ` · ${certificate.year}` : ''}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCertificate(certificate.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[18px] font-light text-neutral-500 transition active:scale-[0.96]"
                            aria-label="Удалить сертификат"
                          >
                            ×
                          </button>
                        </div>

                        {certificate.description ? (
                          <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
                            {certificate.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-[30px] bg-[#F1EFEF] px-5 py-8 text-center">
                    <p className="text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">
                      Можно пропустить
                    </p>

                    <p className="mx-auto mt-2 max-w-[19rem] text-[14px] leading-relaxed text-neutral-500">
                      Сертификаты необязательны. Их можно добавить позже в кабинете мастера.
                    </p>
                  </div>
                )}
              </>
            ) : null}

            {step === 7 ? (
              <>
                <StepTitle
                  eyebrow="Проверка"
                  title="Проверьте профиль"
                  text="Так клиент будет видеть вашу карточку перед записью. После публикации данные сохранятся на сервере."
                />

                {publishError ? (
                  <p className="mt-5 rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
                    {publishError}
                  </p>
                ) : null}

                <div className="mt-6 rounded-[34px] bg-[#F1EFEF] p-3">
                  <div className="rounded-[30px] bg-white p-5 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#E29595] text-[26px] font-semibold text-white shadow-[0_10px_26px_rgba(226,149,149,0.26)]">
                        {name.trim().charAt(0).toUpperCase() || 'S'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[24px] font-semibold leading-tight tracking-[-0.06em] text-neutral-950">
                          {name.trim()}
                        </p>

                        <p className="mt-1 text-[15px] font-medium text-neutral-500">
                          {selectedCategory?.name ?? 'Категория'}
                        </p>

                        <p className="mt-2 inline-flex rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-600">
                          {masterVisitTypeLabel(visitType)}
                        </p>
                      </div>
                    </div>

                    {description.trim() ? (
                      <p className="mt-5 text-[15px] leading-relaxed text-neutral-600">
                        {description.trim()}
                      </p>
                    ) : null}

                    {phone.trim() || contact.trim() ? (
                      <div className="mt-5 space-y-3">
                        {phone.trim() ? (
                          <div className="rounded-[26px] bg-[#F1EFEF] px-4 py-4">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                              Телефон
                            </p>

                            <p className="mt-2 text-[15px] font-semibold leading-snug text-neutral-950">
                              {phone.trim()}
                            </p>
                          </div>
                        ) : null}

                        {contact.trim() ? (
                          <div className="rounded-[26px] bg-[#F1EFEF] px-4 py-4">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                              Контакт
                            </p>

                            <p className="mt-2 text-[15px] font-semibold leading-snug text-neutral-950">
                              {contact.trim()}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-5 rounded-[26px] bg-[#F1EFEF] px-4 py-4">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Адрес
                      </p>

                      {city.trim() ? (
                        <p className="mt-2 text-[14px] font-medium text-neutral-600">Город: {city.trim()}</p>
                      ) : null}

                      <p className="mt-2 text-[15px] font-semibold leading-snug text-neutral-950">
                        {publicAddressForApi || formatPublicAddress(locationDraft)}
                      </p>

                      <div className="mt-2 space-y-1 text-[13px] leading-relaxed text-neutral-500">
                        {entrance.trim() ? <p>Подъезд: {entrance.trim()}</p> : null}
                        {floor.trim() ? <p>Этаж: {floor.trim()}</p> : null}
                        {room.trim() ? (
                          <p>
                            {visitType === 'at_home' ? 'Квартира' : 'Кабинет / квартира'}: {room.trim()}
                          </p>
                        ) : null}
                        {intercom.trim() ? <p>Домофон: {intercom.trim()}</p> : null}
                        {landmark.trim() ? <p>Ориентир: {landmark.trim()}</p> : null}
                        {directions.trim() ? <p>Как пройти: {directions.trim()}</p> : null}
                        {clientNote.trim() ? <p>{clientNote.trim()}</p> : null}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Услуги
                      </p>

                      <ul className="mt-3 flex flex-col gap-2">
                        {services.map((service) => (
                          <li
                            key={service.id}
                            className="rounded-[24px] bg-[#F1EFEF] px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                                  {service.title}
                                </p>

                                <p className="mt-1 text-[13px] font-medium text-neutral-500">
                                  {service.durationMin} мин
                                </p>
                              </div>

                              <p className="shrink-0 text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">
                                {formatPrice(service)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Сертификаты
                      </p>

                      {certificates.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-2">
                          {certificates.map((certificate) => (
                            <li
                              key={certificate.id}
                              className="rounded-[24px] bg-[#F1EFEF] p-3"
                            >
                              {certificate.imageUrl ? (
                                <div className="mb-3 overflow-hidden rounded-[18px] bg-white">
                                  <img
                                    src={certificate.imageUrl}
                                    alt=""
                                    className="h-28 w-full object-cover"
                                    decoding="async"
                                  />
                                </div>
                              ) : null}

                              <p className="text-[15px] font-semibold tracking-[-0.035em] text-neutral-950">
                                {certificate.title}
                              </p>

                              <p className="mt-1 text-[13px] font-medium text-neutral-500">
                                {certificate.issuer}
                                {certificate.year ? ` · ${certificate.year}` : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 rounded-[24px] bg-[#F1EFEF] px-4 py-3 text-[14px] leading-relaxed text-neutral-500">
                          Сертификаты не добавлены. Их можно прикрепить позже в кабинете мастера.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 rounded-[26px] bg-[#F1EFEF] px-4 py-4">
                      <p className="text-[14px] font-semibold text-neutral-950">
                        Расписание
                      </p>

                      <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
                        Сохраняем базовое расписание: понедельник–пятница, 9:00–18:00. Слоты и исключения
                        настраиваются в кабинете мастера.
                      </p>
                    </div>

                    <p
                      className="mt-5 rounded-full bg-[#F1EFEF] px-4 py-3 text-center text-[13px] font-semibold leading-relaxed text-neutral-600"
                      aria-hidden
                    >
                      Для клиентов здесь будет кнопка «Записаться»
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {step > 1 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg gap-2">
            <button
              type="button"
              onClick={goBack}
              className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              Назад
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="flex min-h-12 flex-[1.15] items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 6 && certificates.length === 0 ? 'Пропустить' : 'Дальше'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void publish()}
                disabled={
                  saving ||
                  !selectedCategoryId ||
                  !name.trim() ||
                  services.length === 0 ||
                  !publicAddressForApi.trim()
                }
                className="flex min-h-12 flex-[1.15] items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? 'Сохранение…' : 'Опубликовать'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}