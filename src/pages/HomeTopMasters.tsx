import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES_PATH } from '../app/paths';
import type { MasterFeedItem } from '../features/booking/api/useMastersFeed';
import { NothingFoundCard } from '../shared/ui/NothingFoundCard';
import { MasterCard } from './HomeMasterCard';

export type HomeTopMastersProps = {
  masters: MasterFeedItem[];
  isLoading: boolean;
  onPick: (id: string) => void;
};

function LoadingCard({ delay }: { delay: number }) {
  return (
    <div
      className="w-[min(19.5rem,82vw)] shrink-0 sm:w-64"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="
          h-[22rem]
          animate-pulse
          rounded-[34px]
          bg-[#F1EFEF]
          p-3
          shadow-[0_18px_55px_rgba(17,17,17,0.05)]
        "
      >
        <div className="h-full rounded-[30px] bg-white/70 p-4">
          <div className="h-36 rounded-[26px] bg-[#F1EFEF]" />

          <div className="mt-4 h-4 w-2/3 rounded-full bg-[#F1EFEF]" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-[#F1EFEF]" />

          <div className="mt-5 h-10 rounded-full bg-[#F1EFEF]" />
        </div>
      </div>
    </div>
  );
}

export const HomeTopMasters: FC<HomeTopMastersProps> = ({
  masters,
  isLoading,
  onPick,
}) => {
  return (
    <section
      className="mt-16 animate-fade-enter scroll-mt-28 sm:mt-20"
      style={{ animationDelay: '140ms' }}
      aria-labelledby="top-masters-heading"
    >
      <div
        className="
          rounded-[38px]
          bg-[#F1EFEF]
          p-3
          shadow-[0_24px_70px_rgba(17,17,17,0.05)]
          sm:rounded-[44px]
        "
      >
        <div
          className="
            overflow-hidden
            rounded-[32px]
            bg-white
            px-5
            py-6
            shadow-[0_10px_30px_rgba(17,17,17,0.035)]
            sm:rounded-[38px]
            sm:px-7
            sm:py-8
          "
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[24rem]">

              <h2
                id="top-masters-heading"
                className="
                  mt-2
                  text-[clamp(1.9rem,5.2vw,2.8rem)]
                  font-semibold
                  leading-[1.04]
                  tracking-[-0.065em]
                  text-neutral-950
                "
              >
                Мастера в ленте
              </h2>


            </div>

            <Link
              to={SERVICES_PATH}
              className="
                inline-flex
                min-h-12
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-full
                bg-[#F1EFEF]
                px-5
                text-[15px]
                font-semibold
                text-neutral-900
                transition
                active:scale-[0.98]
              "
            >
              Все услуги
            </Link>
          </div>
        </div>

        <div
          className="
            -mx-1
            mt-4
            flex
            gap-4
            overflow-x-auto
            pb-1
            pl-1
            pr-1
            pt-1
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {isLoading ? (
            [0, 1, 2, 3].map((item) => (
              <LoadingCard key={item} delay={item * 70} />
            ))
          ) : masters.length === 0 ? (
            <div className="w-full min-w-0 shrink-0 px-1">
              <div className="rounded-[32px] bg-white p-3 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
                <NothingFoundCard
                  title="Пока никого нет"
                  text="Попробуйте позже или откройте каталог услуг."
                  action={
                    <Link
                      to={SERVICES_PATH}
                      className="
                        inline-flex
                        min-h-[3.15rem]
                        w-full
                        max-w-xs
                        items-center
                        justify-center
                        rounded-full
                        bg-[#E29595]
                        text-[15px]
                        font-semibold
                        text-white
                        shadow-[0_12px_30px_rgba(226,149,149,0.26)]
                        transition
                        active:scale-[0.98]
                      "
                    >
                      Найти услуги
                    </Link>
                  }
                />
              </div>
            </div>
          ) : (
            masters.map((item, index) => (
              <div
                key={item.id}
                className="w-[min(19.5rem,82vw)] shrink-0 sm:w-64"
              >
                <MasterCard
                  item={item}
                  style={{ animationDelay: `${160 + index * 50}ms` }}
                  onPick={onPick}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};