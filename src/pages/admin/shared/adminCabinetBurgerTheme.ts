/** Бургер-меню кабинета мастера — в стиле catalog-sheet (#F5F5F5 + белые карточки). */

export const cabinetBurgerSectionLabel =
  'px-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]';

export function cabinetBurgerNavItemClass(active: boolean): string {
  return `flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition active:scale-[0.99] ${
    active ? 'bg-[#F47C8C] text-white' : 'bg-white text-[#111827] hover:bg-[#FAFAFA]'
  }`;
}

export function cabinetBurgerIconWrapClass(active: boolean): string {
  return `flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
    active ? 'bg-white/20 text-white' : 'bg-[#FFF1F4] text-[#F47C8C]'
  }`;
}

export function cabinetBurgerPlanBadgeClass(active: boolean): string {
  return `shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
    active ? 'bg-white/25 text-white' : 'bg-[#FFF1F4] text-[#F47C8C]'
  }`;
}
