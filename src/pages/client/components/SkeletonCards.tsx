import { catalogInnerDivider, catalogListCardClass } from '../servicesCatalog/servicesCatalogTheme';

export function SkeletonServiceCard() {
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
