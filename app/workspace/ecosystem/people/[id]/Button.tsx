import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger';

type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const baseClasses = [
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-2',
  'rounded-full',
  'font-semibold',
  'transition',
  'duration-200',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[#D9FF00]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[#050505]',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
].join(' ');

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#D9FF00]',
    'text-black',
    'hover:bg-[#C8ED00]',
    'active:scale-[0.98]',
  ].join(' '),

  secondary: [
    'border',
    'border-white/15',
    'bg-white/5',
    'text-white',
    'hover:border-white/30',
    'hover:bg-white/10',
    'active:scale-[0.98]',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-neutral-300',
    'hover:bg-white/5',
    'hover:text-white',
  ].join(' '),

  danger: [
    'bg-red-600',
    'text-white',
    'hover:bg-red-500',
    'active:scale-[0.98]',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-4 py-2 text-sm',
  md: 'min-h-11 px-5 py-3 text-sm',
  lg: 'min-h-13 px-7 py-4 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = '',
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      {...buttonProps}
    >
      {leadingIcon ? (
        <span
          aria-hidden="true"
          className="shrink-0"
        >
          {leadingIcon}
        </span>
      ) : null}

      <span>{children}</span>

      {trailingIcon ? (
        <span
          aria-hidden="true"
          className="shrink-0"
        >
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
} 