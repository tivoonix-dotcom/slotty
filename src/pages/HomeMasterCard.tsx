import type { CSSProperties } from 'react';
import { HiMapPin, HiStar } from 'react-icons/hi2';
import type { MasterFeedItem } from '../features/booking/api/useMastersFeed';
import { defaultMasterAvatarUrl } from '../features/master/model/masterDraftStorage';
import { ImageReveal } from '../shared/ui/ImageReveal';
import { homeCard, homePinkBtn } from './home/homeTheme';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return (name[0] ?? 'M').toUpperCase();
}

export function MasterCard({
  item,
  style,
  onPick,
  priorityImage,
}: {
  item: MasterFeedItem;
  style?: CSSProperties;
  onPick: (id: string) => void;
  priorityImage?: boolean;
}) {
  const photo = item.avatar_url?.trim() || defaultMasterAvatarUrl(item.full_name);
  const ratingLabel = item.rating > 0 ? item.rating.toFixed(1) : '—';

  return (
    <article
      style={style}
      className={`animate-fade-enter flex h-full w-full flex-col ${homeCard} p-4 transition active:scale-[0.99]`}
    >
      <button
        type="button"
        onClick={() => onPick(item.id)}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <div className="flex gap-3.5">
          <div className="relative h-[7.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-[20px] bg-[#FFF1F4]">
            {item.avatar_url ? (
              <ImageReveal
                src={photo}
                alt=""
                className="h-full w-full object-cover"
                loading={priorityImage ? 'eager' : 'lazy'}
                fetchPriority={priorityImage ? 'high' : 'low'}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[20px] font-bold text-[#F47C8C]">
                {initials(item.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-[#111827]">
              {item.full_name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-[#6B7280]">
              {item.addressLine}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F3F4F6] pt-2.5">
              <span className="inline-flex items-center gap-1 text-[15px] font-bold text-[#111827]">
                <HiStar className="h-4 w-4 text-amber-400" aria-hidden />
                {ratingLabel}
              </span>
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[11px] font-medium text-[#4B5563]">
                <HiMapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                <span className="truncate">{item.addressLine}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 rounded-[18px] bg-gradient-to-r from-[#FFF5F7] to-[#FFEEF2] px-3 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">от</p>
            <p className="text-[16px] font-bold text-[#111827]">{item.priceFrom}</p>
          </div>
          <span className={`${homePinkBtn} pointer-events-none min-h-10 px-4 text-[13px]`}>Записаться</span>
        </div>
      </button>
    </article>
  );
}
