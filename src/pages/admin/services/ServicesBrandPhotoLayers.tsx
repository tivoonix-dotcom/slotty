import { SERVICES_CATALOG_ADD_BTN_BG } from './adminServicesTheme';

type Props = {
  className?: string;
  roundedClassName?: string;
};

/** Фото-фон кнопки «Добавить услугу» (`public/photos/history/красный.png`). */
export function ServicesBrandPhotoLayers({
  className = '',
  roundedClassName = 'rounded-[12px]',
}: Props) {
  return (
    <>
      <span
        className={`pointer-events-none absolute inset-0 overflow-hidden bg-cover bg-center ${roundedClassName} ${className}`}
        style={{ backgroundImage: `url(${SERVICES_CATALOG_ADD_BTN_BG})` }}
        aria-hidden
      />
      <span
        className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#EF4444]/20 ${roundedClassName} ${className}`}
        aria-hidden
      />
    </>
  );
}
