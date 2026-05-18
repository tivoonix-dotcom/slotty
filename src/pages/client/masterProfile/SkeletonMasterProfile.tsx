export function SkeletonMasterProfile() {
  return (
    <div className="animate-pulse space-y-6 px-4 pt-[calc(4.5rem+env(safe-area-inset-top))]">
      <div className="flex gap-4">
        <div className="h-[7.5rem] w-[7.5rem] rounded-[24px] bg-[#F1EFEF]" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-6 w-3/4 rounded-lg bg-[#F1EFEF]" />
          <div className="h-4 w-1/2 rounded-lg bg-[#F1EFEF]" />
          <div className="h-12 w-full rounded-xl bg-[#F1EFEF]" />
        </div>
      </div>
      <div className="h-16 rounded-[22px] bg-[#FFF1F4]" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[7.5rem] w-[7.5rem] shrink-0 rounded-[18px] bg-[#F1EFEF]" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[20px] bg-[#F1EFEF]" />
        ))}
      </div>
    </div>
  );
}
