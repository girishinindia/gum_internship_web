import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60';
const SIZES: Record<Size, string> = { sm: 'h-10 px-4 text-body-sm', md: 'h-12 px-6 text-body' };
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-glow hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 disabled:bg-none disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none',
  outline: 'border border-neutral-200 bg-white text-primary-700 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary', size = 'md', loading = false, fullWidth = false, children, className = '', disabled, ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    <button
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

/** Same look as Button, but renders a Next <Link>. */
export function LinkButton({
  href, variant = 'primary', size = 'md', fullWidth = false, children, className = '',
}: { href: string } & Omit<CommonProps, 'loading'> & { className?: string }): JSX.Element {
  return (
    <Link href={href} className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {children}
    </Link>
  );
}
