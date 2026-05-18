type Props = {
  total: number;
  freeTodayCount: number;
  hasGeo: boolean;
};

export function MastersCatalogHero({ total, freeTodayCount, hasGeo }: Props) {
  if (total === 0) return null;

  return (
    <div className="rounded-[24px] bg-gradient-to-br from-[#FFF1F4] via-white to-[#FAFAFA] p-4 ring-1 ring-[#FCE7EC]/80">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[#F47C8C]">Каталог SLOTTY</p>
      <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-[#111827]">
        К кому записаться?
      </h1>
      <p className="mt-2 text-[14px] leading-snug text-[#6B7280]">
        {total}{' '}
        {total === 1 ? 'мастер' : total < 5 ? 'мастера' : 'мастеров'}
        {freeTodayCount > 0
          ? ` · ${freeTodayCount} ${freeTodayCount === 1 ? 'свободен' : freeTodayCount < 5 ? 'свободны' : 'свободны'} сегодня`
          : ''}
        {hasGeo ? ' · сортировка по расстоянию' : ' · Минск'}
      </p>
    </div>
  );
}
