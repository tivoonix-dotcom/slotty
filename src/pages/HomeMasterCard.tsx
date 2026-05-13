import type { CSSProperties } from 'react';
import type { MasterFeedItem } from '../features/booking/api/useMastersFeed';

function IconStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function MasterCard({
  item,
  style,
  onPick,
}: {
  item: MasterFeedItem;
  style?: CSSProperties;
  onPick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(item.id)}
      style={style}
      className="
        animate-fade-enter
        group
        flex
        w-[320px]
        shrink-0
        flex-col
        overflow-hidden
        rounded-[36px]
        bg-[#F4F1F1]
        text-left
        shadow-[0_24px_70px_rgba(17,17,17,0.05)]
        transition-all
        duration-300
        active:scale-[0.985]
      "
    >
      <div className="relative overflow-hidden px-3 pt-3">
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_100%)]
          "
        />

        <div className="relative overflow-hidden rounded-[30px]">
          <img
            src={
              item.avatar_url ??
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80'
            }
            alt={item.full_name}
            loading="lazy"
            className="
              aspect-[4/4.5]
              w-full
              object-cover
              transition-transform
              duration-700
              group-hover:scale-[1.03]
            "
          />

          <span
            className="
              pointer-events-auto
              absolute
              right-3
              top-3
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/80
              text-neutral-600
              shadow-[0_4px_14px_rgba(17,17,17,0.08)]
              backdrop-blur-md
            "
            aria-hidden
          >
            <IconHeart className="shrink-0 opacity-90" />
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-4">
        <div
          className="
            rounded-[30px]
            bg-white/80
            p-4
            shadow-[0_10px_30px_rgba(17,17,17,0.04)]
            backdrop-blur-xl
          "
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                className="
                  text-[21px]
                  font-semibold
                  tracking-[-0.05em]
                  text-neutral-950
                "
              >
                {item.full_name}
              </h3>

              <p className="mt-1 text-[14px] text-neutral-400">
                {item.addressLine}
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-1
                rounded-full
                bg-[#F7F4F4]
                px-2.5
                py-1.5
              "
            >
              <IconStar className="text-[#E29595]" />

              <span
                className="
                  text-[13px]
                  font-semibold
                  text-neutral-700
                "
              >
                {item.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[13px] text-neutral-400">
                Стоимость
              </p>

              <p
                className="
                  mt-1
                  text-[24px]
                  font-semibold
                  tracking-[-0.05em]
                  text-neutral-950
                "
              >
                {item.priceFrom}
              </p>
            </div>

            <div
              className="
                rounded-full
                bg-[#E29595]
                px-5
                py-3
                text-[14px]
                font-semibold
                text-white
                shadow-[0_12px_30px_rgba(226,149,149,0.35)]
              "
            >
              Записаться
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}