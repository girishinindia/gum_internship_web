'use client';
import Link from 'next/link';
import { Icon } from './Icon';
import type { IconName } from './Icon';

/**
 * Floating action button — one contextual primary action per screen. Sits above
 * the bottom nav, respecting safe-area. Extended variant shows an inline label.
 */
export function Fab({ icon, label, href, onClick }: { icon: IconName; label?: string; href?: string; onClick?: () => void }): JSX.Element {
  const cls = `fixed right-4 z-20 flex items-center gap-2 rounded-2xl bg-brand-gradient px-4 text-white shadow-lift transition active:scale-95 ${label ? 'h-12 py-3' : 'h-14 w-14 justify-center !px-0'}`;
  const style = { bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' };
  const inner = <><Icon name={icon} size={22} />{label && <span className="pr-1 text-body-sm font-medium">{label}</span>}</>;
  if (href) return <Link href={href} className={cls} style={style} aria-label={label ?? 'Action'}>{inner}</Link>;
  return <button onClick={onClick} className={cls} style={style} aria-label={label ?? 'Action'}>{inner}</button>;
}
