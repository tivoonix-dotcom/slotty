import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { createMySlot, deleteMySlot, getMySlots, updateMySlot, type MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { SlottySelect } from '../../../shared/ui/SlottySelect';

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = 6; h <= 23; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 0) break;
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return out;
}

const TIME_OPTIONS = buildTimeOptions().map((time) => ({ value: time, label: time }));

function localDateTimeToUtcIso(dateIso: string, timeHm: string): string {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [hh, mm] = timeHm.split(':').map(Number);
  const local = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return local.toISOString();
}

function formatSlotRange(s: MySlotDto): string {
  const a = new Date(s.startsAt);
  const b = new Date(s.endsAt);
  const da = a.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const ta = a.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const tb = b.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${da}, ${ta}–${tb}`;
}

type Props = {
  services: MasterOnboardingService[];
};

export function AdminMasterRealSlotsPanel({ services }: Props) {
  const { useCabinetApi } = useAdminMasterCabinet();
  const [rows, setRows] = useState<MySlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [dateIso, setDateIso] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [serviceId, setServiceId] = useState<string>('');

  const [editing, setEditing] = useState<MySlotDto | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('10:00');
  const [editEnd, setEditEnd] = useState('11:00');
  const [editService, setEditService] = useState<string>('');

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Любая услуга' },
      ...services
        .filter((s) => isUuid(s.id))
        .map((s) => ({ value: s.id, label: s.title })),
    ],
    [services],
  );

  const reload = useCallback(async () => {
    if (!useCabinetApi) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getMySlots();
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить окна');
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const onCreate = useCallback(async () => {
    if (!useCabinetApi) return;
    setError(null);
    try {
      const startsAt = localDateTimeToUtcIso(dateIso, startTime);
      const endsAt = localDateTimeToUtcIso(dateIso, endTime);
      await createMySlot({
        startsAt,
        endsAt,
        serviceId: serviceId.trim() ? serviceId.trim() : null,
      });
      showToast('Окно добавлено');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания');
    }
  }, [dateIso, endTime, reload, serviceId, showToast, startTime, useCabinetApi]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!useCabinetApi) return;
      if (!window.confirm('Удалить это свободное окно?')) return;
      setError(null);
      try {
        await deleteMySlot(id);
        showToast('Удалено');
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось удалить');
      }
    },
    [reload, showToast, useCabinetApi],
  );

  const openEdit = useCallback((s: MySlotDto) => {
    const a = new Date(s.startsAt);
    const b = new Date(s.endsAt);
    const y = a.getFullYear();
    const m = pad2(a.getMonth() + 1);
    const d = pad2(a.getDate());
    setEditDate(`${y}-${m}-${d}`);
    setEditStart(`${pad2(a.getHours())}:${pad2(a.getMinutes())}`);
    setEditEnd(`${pad2(b.getHours())}:${pad2(b.getMinutes())}`);
    setEditService(s.serviceId ?? '');
    setEditing(s);
  }, []);

  const onSaveEdit = useCallback(async () => {
    if (!editing || !useCabinetApi) return;
    setError(null);
    try {
      const startsAt = localDateTimeToUtcIso(editDate, editStart);
      const endsAt = localDateTimeToUtcIso(editDate, editEnd);
      await updateMySlot(editing.id, {
        startsAt,
        endsAt,
        serviceId: editService.trim() ? editService.trim() : null,
      });
      setEditing(null);
      showToast('Окно обновлено');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  }, [editDate, editEnd, editService, editStart, editing, reload, showToast, useCabinetApi]);

  if (!useCabinetApi) return null;

  const futureRows = rows.filter((r) => new Date(r.endsAt).getTime() > Date.now());

  return (
    <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
      <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Запись клиентов</p>
        <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.055em] text-neutral-950">Свободные окна (каталог)</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
          Эти интервалы попадают в поиск и на экран записи. Шаблон по дням недели ниже остаётся для вашего планирования.
        </p>

        {toast ? (
          <p className="mt-3 rounded-full bg-[#EAFBF2] px-4 py-2 text-center text-[13px] font-semibold text-[#2F8A5B]">{toast}</p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-[20px] bg-[#FFF0F0] px-4 py-2 text-[13px] font-semibold text-[#9B2C2C]">{error}</p>
        ) : null}

        <div className="mt-5 space-y-3 rounded-[24px] bg-[#F1EFEF] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Новое окно</p>
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">Дата</span>
            <input
              type="date"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
              className="mt-1.5 w-full rounded-[18px] bg-white px-4 py-3 text-[15px] font-semibold text-neutral-900 outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">С</span>
              <SlottySelect className="mt-1 w-full" value={startTime} onChange={setStartTime} options={TIME_OPTIONS} />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">По</span>
              <SlottySelect className="mt-1 w-full" value={endTime} onChange={setEndTime} options={TIME_OPTIONS} />
            </label>
          </div>
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">Услуга (необязательно)</span>
            <SlottySelect className="mt-1 w-full" value={serviceId} onChange={setServiceId} options={serviceOptions} />
          </label>
          <button
            type="button"
            onClick={() => void onCreate()}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Добавить окно
          </button>
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Активные окна {loading ? '· загрузка…' : `(${futureRows.length})`}
          </p>
          <ul className="mt-3 space-y-2">
            {futureRows.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] bg-[#F1EFEF] px-4 py-3 text-[14px] font-semibold text-neutral-900"
              >
                <span className="min-w-0 flex-1">{formatSlotRange(s)}</span>
                <span className="text-[12px] font-medium text-neutral-500">
                  {s.status === 'available' ? 'Свободно' : s.status}
                </span>
                <div className="flex gap-2">
                  {s.status === 'available' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-800 shadow-sm transition active:scale-[0.97]"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(s.id)}
                        className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#9B2C2C] shadow-sm transition active:scale-[0.97]"
                      >
                        Удалить
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {!loading && futureRows.length === 0 ? (
            <p className="mt-3 text-[14px] text-neutral-500">Пока нет будущих окон. Создайте первое выше.</p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-center">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-xl">
            <p className="text-[18px] font-bold text-neutral-900">Изменить окно</p>
            <label className="mt-4 block">
              <span className="text-[13px] font-semibold text-neutral-500">Дата</span>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="mt-1.5 w-full rounded-[18px] bg-[#F1EFEF] px-4 py-3 text-[15px] font-semibold outline-none"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">С</span>
                <SlottySelect className="mt-1 w-full" value={editStart} onChange={setEditStart} options={TIME_OPTIONS} />
              </label>
              <label className="block">
                <span className="text-[13px] font-semibold text-neutral-500">По</span>
                <SlottySelect className="mt-1 w-full" value={editEnd} onChange={setEditEnd} options={TIME_OPTIONS} />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-[13px] font-semibold text-neutral-500">Услуга</span>
              <SlottySelect className="mt-1 w-full" value={editService} onChange={setEditService} options={serviceOptions} />
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800 transition active:scale-[0.98]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void onSaveEdit()}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white transition active:scale-[0.98]"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
