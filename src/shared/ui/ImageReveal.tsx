import { forwardRef, useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

/**
 * Показывает изображение только после полной загрузки (событие load / уже закэшировано),
 * чтобы не было видимой «полоски» progressive JPEG при скролле.
 */
type ImageRevealProps = ImgHTMLAttributes<HTMLImageElement> & {
  fetchPriority?: 'high' | 'low' | 'auto';
};

export const ImageReveal = forwardRef<HTMLImageElement, ImageRevealProps>(function ImageReveal(
  { className, style, onLoad, onError, src, decoding = 'sync', fetchPriority, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLImageElement | null>(null);
  const [shown, setShown] = useState(false);

  const setRefs = (el: HTMLImageElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === 'function') {
      forwardedRef(el);
    } else if (forwardedRef) {
      forwardedRef.current = el;
    }
  };

  useLayoutEffect(() => {
    setShown(false);
    const el = innerRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setShown(true);
    }
  }, [src]);

  return (
    <img
      ref={setRefs}
      src={src}
      {...rest}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
      decoding={decoding}
      style={{ ...style, opacity: shown ? 1 : 0 }}
      className={className}
      onLoad={(e) => {
        setShown(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setShown(true);
        onError?.(e);
      }}
    />
  );
});
