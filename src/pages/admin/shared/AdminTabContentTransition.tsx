import type { ReactNode } from 'react';

type Props = {
  activeKey: string;
  children: ReactNode;
  className?: string;
  minMs?: number;
};

/** Мгновенная смена таба без оверлея загрузки (activeKey оставлен для совместимости). */
export function AdminTabContentTransition({ children, className = '' }: Props) {
  return <div className={`min-w-0 ${className}`.trim()}>{children}</div>;
}
