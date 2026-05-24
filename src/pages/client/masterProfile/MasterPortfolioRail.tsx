import { SectionHeading } from '../components/SectionHeading';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import type { MasterPortfolioItem } from './types';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = {
  items: MasterPortfolioItem[];
  onOpenGallery: (index: number) => void;
  onViewAll?: () => void;
  layout?: 'stack' | 'desktop';
};

export function MasterPortfolioRail({ items, onOpenGallery, onViewAll, layout = 'stack' }: Props) {
  const visible = items.filter((p) => p.imageUrl?.trim()).slice(0, layout === 'desktop' ? 8 : 6);
  if (!visible.length) return null;
  const isDesktop = layout === 'desktop';

  return (
    <section className={isDesktop ? '' : 'mt-0'}>
      <SectionHeading title="Работы мастера" linkLabel="Смотреть все" onLinkClick={onViewAll} />
      {isDesktop ? (
        <div className={`${catalogDesktopPanel} grid grid-cols-4 gap-2 p-3 xl:grid-cols-5`}>
          {visible.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenGallery(index)}
              className="aspect-square overflow-hidden rounded-[12px] bg-[#EBEBEB] transition hover:opacity-95"
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
      ) : (
        <div className={`${catalogDesktopPanel} p-3`}>
          <div className="-mx-0.5 flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visible.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenGallery(index)}
                className="h-[7.5rem] w-[7.5rem] shrink-0 overflow-hidden rounded-[12px] bg-[#EBEBEB] active:scale-[0.98]"
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
        </div>
      )}
    </section>
  );
}
