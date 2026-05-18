import { HiChevronLeft, HiChevronRight, HiXMark } from 'react-icons/hi2';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function PortfolioImagePreview({ urls, index, onClose, onIndexChange }: Props) {
  if (!urls.length) return null;
  const url = urls[index] ?? urls[0];

  const prev = () => onIndexChange(index <= 0 ? urls.length - 1 : index - 1);
  const next = () => onIndexChange(index >= urls.length - 1 ? 0 : index + 1);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <HiXMark className="h-6 w-6" />
        </button>
        <span className="text-[14px] font-medium text-white/80">
          {index + 1} / {urls.length}
        </span>
        <span className="w-11" />
      </div>
      <div className="relative flex flex-1 items-center justify-center px-2">
        {urls.length > 1 ? (
          <button
            type="button"
            onClick={prev}
            aria-label="Предыдущее"
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <HiChevronLeft className="h-6 w-6" />
          </button>
        ) : null}
        <ImageReveal src={url} alt="" className="max-h-[70dvh] max-w-full rounded-lg object-contain" />
        {urls.length > 1 ? (
          <button
            type="button"
            onClick={next}
            aria-label="Следующее"
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <HiChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
