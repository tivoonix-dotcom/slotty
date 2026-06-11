import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { servicesCatalogAddBtn } from './adminServicesTheme';
import { ServicesBrandPhotoLayers } from './ServicesBrandPhotoLayers';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function ServicesSheetPrimaryButton({ children, className = '', ...props }: Props) {
  return (
    <button type="button" className={`${servicesCatalogAddBtn} ${className}`} {...props}>
      <ServicesBrandPhotoLayers roundedClassName="rounded-[12px]" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
