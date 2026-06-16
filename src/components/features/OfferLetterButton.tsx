'use client';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

/**
 * Opens the student's internship offer letter. The API route
 * GET /enrollments/:id/offer-letter returns a short-lived signed URL (the PDF is
 * generated automatically right after enrolment). If it is still being produced
 * the API answers 404 — we surface that as a friendly "try again shortly" note.
 *
 * Style-agnostic: pass `className` + `children` so it can render as a sidebar
 * link, a dashboard pill, or a mobile row.
 */
export function OfferLetterButton({ enrollmentId, className, children }:
  { enrollmentId: number; className?: string; children?: ReactNode }): JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const open = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api<{ url: string }>(`/enrollments/${enrollmentId}/offer-letter`);
      window.open(data.url, '_blank', 'noopener');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast('info', 'Your offer letter is still being generated — please try again in a moment.');
      } else {
        toast('danger', e instanceof ApiError ? e.message : 'Could not open the offer letter.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={open} disabled={busy} className={className}>
      {busy ? 'Opening…' : children ?? 'Offer letter'}
    </button>
  );
}
