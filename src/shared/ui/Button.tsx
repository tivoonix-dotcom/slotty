import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
};

export function Button({ children, className = '', variant = 'primary', ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-[15px] font-medium shadow-sm transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100';
  const styles =
    variant === 'primary'
      ? 'bg-brand-primary text-white'
      : 'bg-white/80 text-brand-text shadow-sm';

  return (
    <button type="button" className={`${base} ${styles} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
