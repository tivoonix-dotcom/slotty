import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { MASTERS_PATH } from '../app/paths';
import type { MasterFeedItem } from '../features/booking/api/useMastersFeed';
import { NothingFoundCard } from '../shared/ui/NothingFoundCard';
import { LoadingVideo } from '../shared/ui/LoadingVideo';
import { MasterCard } from './HomeMasterCard';
import { homeLink, homePinkBtn, homeScrollRow, homeSection } from './home/homeTheme';

export type HomeTopMastersProps = {
  masters: MasterFeedItem[];
  isLoading: boolean;
  onPick: (id: string) => void;
};

export const HomeTopMasters: FC<HomeTopMastersProps> = ({
  masters,
  isLoading,
  onPick,
}) => {
  return (
    <section
      className={homeSection}
      style={{ animationDelay: '140ms' }}
      aria-labelledby="top-masters-heading"
    >
      <div className="mx-auto max-w-[40rem] text-center">
        <h2
          id="top-masters-heading"
          className="text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
        >
          Мастера рядом с вами
        </h2>
        <Link to={MASTERS_PATH} className={`${homeLink} mt-4 inline-flex`}>
          Все мастера
        </Link>
      </div>

      <div className={`${homeScrollRow} mt-10 sm:mt-14`}>
        {isLoading ? (
          <div className="flex min-h-[14rem] w-full min-w-0 shrink-0 items-center justify-center py-8">
            <LoadingVideo size="lg" label="Загрузка мастеров…" />
          </div>
        ) : masters.length === 0 ? (
          <div className="w-full min-w-0 shrink-0 px-0.5">
            <NothingFoundCard
              title="Мастера скоро появятся"
              text="Откройте каталог и выберите услугу — мы подберём специалиста."
              action={
                <Link to={MASTERS_PATH} className={`${homePinkBtn} w-full max-w-xs`}>
                  Все мастера
                </Link>
              }
            />
          </div>
        ) : (
          masters.map((item, index) => (
            <div
              key={item.id}
              className="w-[min(18.5rem,86vw)] shrink-0 sm:w-[19.5rem]"
            >
              <MasterCard
                item={item}
                style={{ animationDelay: `${160 + index * 50}ms` }}
                priorityImage={index < 6}
                onPick={onPick}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
};
