import { SectionHeading } from '../components/SectionHeading';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import type { MasterPortfolioItem } from './types';

type Props = {
  items: MasterPortfolioItem[];
  onOpenGallery: (index: number) => void;
  onViewAll?: () => void;
};

export function MasterPortfolioRail({ items, onOpenGallery, onViewAll }: Props) {
  const visible = items.filter((p) => p.imageUrl?.trim()).slice(0, 6);
  if (!visible.length) return null;

  return (
    <section className="mt-8">
      <SectionHeading title="Работы мастера" linkLabel="Смотреть все" onLinkClick={onViewAll} />
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenGallery(index)}
            className="h-[7.5rem] w-[7.5rem] shrink-0 overflow-hidden rounded-[18px] shadow-sm active:scale-[0.98]"
          >
            <ImageReveal
              src={item.imageUrl!}
              alt={item.title ?? ''}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
