import type { ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-primary-50 text-primary-700',
};

/** Maps common backend status strings to a sensible tone. */
const STATUS_TONE: Record<string, Tone> = {
  active: 'success', completed: 'primary', published: 'success', confirmed: 'success',
  pending: 'warning', pending_payment: 'warning', pending_review: 'warning', submitted: 'warning',
  draft: 'neutral', closed: 'neutral', cancelled: 'neutral', withdrawn: 'neutral', removed: 'neutral',
  rejected: 'danger', revoked: 'danger', failed: 'danger',
  shortlisted: 'info', interview: 'info', offered: 'success', applied: 'neutral',
  issued: 'success', verified: 'success',
};

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }): JSX.Element {
  return <span className={`badge ${TONES[tone]} ${className}`}>{children}</span>;
}

/** Convenience: colour a raw status string automatically. */
export function StatusBadge({ status, className = '' }: { status: string; className?: string }): JSX.Element {
  const tone = STATUS_TONE[status] ?? 'neutral';
  const label = status.replace(/_/g, ' ');
  return <Badge tone={tone} className={`capitalize ${className}`}>{label}</Badge>;
}
