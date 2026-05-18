export function SkeletonServiceCard() {
  return (
    <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_10px_36px_rgba(17,24,39,0.07)] ring-1 ring-[#f2f2f2]">
      <div className="flex gap-3.5 p-3.5">
        <div className="h-[8.75rem] w-[7.25rem] shrink-0 animate-pulse rounded-[20px] bg-neutral-200/80" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-neutral-200/80" />
          <div className="h-3 w-full animate-pulse rounded-full bg-neutral-200/60" />
          <div className="h-10 animate-pulse rounded-[14px] bg-neutral-200/50" />
          <div className="h-12 animate-pulse rounded-[16px] bg-[#FFF1F4]/80" />
        </div>
      </div>
      <div className="h-11 animate-pulse border-t border-[#F3F4F6] bg-[#FFFBFC]" />
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
