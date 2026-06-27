import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { servicesCatalogAddBtn } from './adminServicesTheme';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function ServicesSheetPrimaryButton({ children, className = '', ...props }: Props) {
  return (
    <button type="button" className={`${servicesCatalogAddBtn} ${className}`} {...props}>
      {children}
    </button>
  );
}
