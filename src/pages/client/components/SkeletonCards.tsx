import { catalogInnerDivider, catalogListCardClass } from '../servicesCatalog/servicesCatalogTheme';

export function SkeletonServiceCard({ variant = 'stack' }: { variant?: 'stack' | 'grid' | 'wide' }) {
  if (variant === 'wide') {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] lg:grid lg:grid-cols-[176px_minmax(0,1fr)_200px]">
        <div className="h-36 animate-pulse bg-[#EBEBEB] lg:min-h-[148px]" />
        <div className="space-y-2 p-3.5">
          <div className="h-3 w-16 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-[#EBEBEB]/90" />
          <div className="flex gap-2">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#EBEBEB]" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-3 w-2/3 animate-pulse rounded bg-[#EBEBEB]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#EBEBEB]/80" />
            </div>
          </div>
          <div className="flex gap-1">
            <div className="h-6 w-20 animate-pulse rounded-[8px] bg-[#EBEBEB]" />
            <div className="h-6 w-16 animate-pulse rounded-[8px] bg-[#EBEBEB]/80" />
          </div>
        </div>
        <div className="space-y-2 border-t-0 bg-[#FFFBFC] p-3.5 lg:border-l-0 lg:border-t-0">
          <div className="h-3 w-14 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="h-6 w-24 animate-pulse rounded bg-[#EBEBEB]/90" />
          <div className="h-12 w-full animate-pulse rounded-[10px] bg-[#EBEBEB]/70" />
          <div className="h-10 w-full animate-pulse rounded-[12px] bg-[#F47C8C]/20" />
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-[12px] bg-white ring-1 ring-[#E8E8E8]">
        <div className="aspect-[4/3] w-full animate-pulse bg-[#EBEBEB]" />
        <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2">
          <div className="h-8 w-full animate-pulse rounded bg-[#EBEBEB]/80" />
          <div className="mt-1.5 ml-auto h-5 w-24 animate-pulse rounded bg-[#EBEBEB]" />
          <div className="mb-2 mt-1.5 space-y-1">
            <div className="h-2.5 w-4/5 animate-pulse rounded bg-[#EBEBEB]/80" />
            <div className="h-2.5 w-3/5 animate-pulse rounded bg-[#EBEBEB]/70" />
          </div>
          <div className="mt-auto flex items-start gap-2 pt-2.5">
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-[#EBEBEB]" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-3 w-2/3 animate-pulse rounded bg-[#EBEBEB]" />
              <div className="h-5 w-20 animate-pulse rounded bg-[#EBEBEB]/80" />
            </div>
            <div className="h-3 w-14 shrink-0 animate-pulse rounded bg-[#EBEBEB]/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${catalogListCardClass}`}>
      <div className="space-y-4 p-4">
        <div className="flex gap-3.5">
          <div className="h-[5.5rem] w-[5.5rem] shrink-0 animate-pulse rounded-[20px] bg-[#EEEEF0]" />
          <div className="min-w-0 flex-1 space-y-2.5 pt-1">
            <div className="h-6 w-3/4 animate-pulse rounded-full bg-[#EEEEF0]" />
            <div className="h-4 w-full animate-pulse rounded-full bg-[#EEEEF0]/80" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#EEEEF0]/70" />
          </div>
        </div>
        <div className={`space-y-2 pt-3 ${catalogInnerDivider}`}>
          <div className="h-10 animate-pulse rounded-[14px] bg-[#F6F7FB]" />
          <div className="h-10 animate-pulse rounded-[14px] bg-[#F6F7FB]" />
          <div className="h-10 animate-pulse rounded-[14px] bg-[#F6F7FB]" />
        </div>
        <div className="h-[7.5rem] animate-pulse rounded-[18px] bg-[#F6F7FB]" />
      </div>
    </div>
  );
}

export function SkeletonMasterCard() {
  return (
    <div className="rounded-[26px] bg-white p-4 shadow-[0_10px_36px_rgba(17,24,39,0.07)] ring-1 ring-[#f2f2f2]">
      <div className="flex gap-3.5">
        <div className="h-[8.25rem] w-[6.75rem] shrink-0 animate-pulse rounded-[22px] bg-neutral-200/80" />
        <div className="min-w-0 flex-1 space-y-2.5 pt-1">
          <div className="h-5 w-4/5 animate-pulse rounded-full bg-neutral-200/80" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-200/70" />
          <div className="h-4 w-3/5 animate-pulse rounded-full bg-neutral-200/60" />
          <div className="h-3 w-full animate-pulse rounded-full bg-neutral-200/50" />
        </div>
      </div>
      <div className="mt-3.5 h-14 animate-pulse rounded-[18px] bg-[#FFF1F4]/80" />
      <div className="mt-4 h-[52px] animate-pulse rounded-[20px] bg-neutral-200/70" />
    </div>
  );
}

export function SkeletonMasterCarouselCard() {
  return (
    <div className="w-[min(88vw,340px)] shrink-0">
      <SkeletonMasterCard />
    </div>
  );
}
