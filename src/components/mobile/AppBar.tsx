'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMobileShell } from './MobileShell';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export interface AppBarAction { icon: IconName; label: string; href?: string; onClick?: () => void; badge?: boolean }

/**
 * Native-style top app bar. Variants:
 *  - 'plain'  white surface, dark text (list screens)
 *  - 'brand'  brand-colored, white text (immersive screens)
 *  - 'large'  brand header with a bigger title + optional subtitle/children
 * Leading: 'menu' opens the drawer · 'back' pops navigation · 'none'.
 */
export function AppBar({
  title, subtitle, variant = 'plain', leading = 'menu', backHref, actions = [], children,
}: {
  title: string;
  subtitle?: string;
  variant?: 'plain' | 'brand' | 'large';
  leading?: 'menu' | 'back' | 'none';
  backHref?: string;
  actions?: AppBarAction[];
  children?: ReactNode;
}): JSX.Element {
  const router = useRouter();
  const { openDrawer } = useMobileShell();
  const onBrand = variant === 'brand' || variant === 'large';
  const surface = onBrand ? 'bg-brand-gradient text-white' : 'bg-white/90 backdrop-blur-xl text-neutral-900 border-b border-neutral-200/70';
  const iconColor = onBrand ? 'text-white' : 'text-neutral-700';

  const Leading = (): JSX.Element | null => {
    if (leading === 'none') return null;
    if (leading === 'back') {
      return (
        <button aria-label="Back" onClick={() => (backHref ? router.push(backHref) : router.back())} className={`grid h-9 w-9 place-items-center rounded-full transition active:bg-black/10 ${iconColor}`}>
          <Icon name="back" />
        </button>
      );
    }
    return (
      <button aria-label="Menu" onClick={openDrawer} className={`grid h-9 w-9 place-items-center rounded-full transition active:bg-black/10 ${iconColor}`}>
        <Icon name="menu" />
      </button>
    );
  };

  return (
    <header className={`sticky top-0 z-30 ${surface}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex h-14 items-center gap-1 px-2">
        <Leading />
        {variant !== 'large' ? <h1 className="flex-1 truncate px-1 text-[17px] font-semibold">{title}</h1> : <span className="flex-1" />}
        {actions.map((a) => {
          const inner = (
            <span className={`relative grid h-9 w-9 place-items-center rounded-full transition active:bg-black/10 ${iconColor}`}>
              <Icon name={a.icon} size={21} />
              {a.badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />}
            </span>
          );
          return a.href
            ? <a key={a.label} aria-label={a.label} href={a.href}>{inner}</a>
            : <button key={a.label} aria-label={a.label} onClick={a.onClick}>{inner}</button>;
        })}
      </div>
      {variant === 'large' && (
        <div className="px-4 pb-4">
          <h1 className="font-heading text-h2 text-white">{title}</h1>
          {subtitle && <p className="text-body-sm text-white/90">{subtitle}</p>}
          {children}
        </div>
      )}
    </header>
  );
}
