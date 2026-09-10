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
        'border-borde/10',
        elevated ? 'bg-superficie-elevada' : 'bg-superficie-elevada',
        elevated ? 'shadow-2xl' : '',
        interactive
          ? 'transition hover:border-acento hover:-translate-y-1'
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