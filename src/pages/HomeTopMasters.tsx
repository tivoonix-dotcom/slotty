import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { MASTERS_PATH } from '../app/paths';
import type { MasterFeedItem } from '../features/booking/api/useMastersFeed';
import { NothingFoundCard } from '../shared/ui/NothingFoundCard';
import { LoadingVideo } from '../shared/ui/LoadingVideo';
import { MasterCard } from './HomeMasterCard';
import {
  homeLink,
  homePinkBtn,
  homeScrollRow,
  homeSection,
  homeSectionSubtitle,
  homeSectionTitle,
} from './home/homeTheme';

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
      <div className="mb-4 flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 id="top-masters-heading" className={homeSectionTitle}>
            Мастера в ленте
          </h2>
          <p className={homeSectionSubtitle}>
            Популярные специалисты — как в каталоге SLOTTY
          </p>
        </div>
        <Link to={MASTERS_PATH} className={homeLink}>
          Все мастера
        </Link>
      </div>

      <div className={homeScrollRow}>
        {isLoading ? (
          <div className="flex min-h-[14rem] w-full min-w-0 shrink-0 items-center justify-center py-8">
            <LoadingVideo size="lg" label="Загрузка мастеров…" />
          </div>
        ) : masters.length === 0 ? (
          <div className="w-full min-w-0 shrink-0 px-0.5">
            <NothingFoundCard
              title="Пока никого нет"
              text="Попробуйте позже или откройте каталог мастеров."
              action={
                <Link to={MASTERS_PATH} className={`${homePinkBtn} w-full max-w-xs`}>
                  Каталог мастеров
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
