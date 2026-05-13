import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl bg-white px-4 py-3 text-[15px] shadow-sm outline-none ring-brand-primary/20 placeholder:text-neutral-400 focus:ring-2 ${className}`.trim()}
      {...rest}
    />
  );
}
