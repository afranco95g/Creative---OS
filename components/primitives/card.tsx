import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  elevated = false,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-3xl',
        'border',
        'border-white/10',
        elevated ? 'bg-[#111111]' : 'bg-[#0B0B0B]',
        elevated ? 'shadow-2xl' : '',
        interactive
          ? 'transition hover:border-lime-400 hover:-translate-y-1'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}