function initials(name: string): string {
  return name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const SIZES = { sm: 'h-8 w-8 text-caption', md: 'h-10 w-10 text-body-sm', lg: 'h-16 w-16 text-h3', xl: 'h-20 w-20 text-h2' };

export function Avatar({ name, src, size = 'md', className = '' }:
  { name: string; src?: string | null; size?: keyof typeof SIZES; className?: string }): JSX.Element {
  const cls = `${SIZES[size]} shrink-0 rounded-2xl object-cover ${className}`;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cls} />;
  }
  return (
    <span className={`${SIZES[size]} grid shrink-0 place-items-center rounded-2xl bg-brand-gradient font-semibold text-white ${className}`}>
      {initials(name)}
    </span>
  );
}
