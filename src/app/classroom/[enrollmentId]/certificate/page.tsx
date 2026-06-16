'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const RULE_LABEL: Record<string, string> = {
  min_progress_percent: 'Course progress', min_quiz_percent: 'Quiz average',
  min_attendance_percent: 'Live attendance', min_project_score: 'Project score',
  require_all_mandatory_tasks_approved: 'All mandatory tasks approved',
};

export default function CertificatePage(): JSX.Element {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const eid = Number(enrollmentId);
  const toast = useToast();
  const [state, setState] = useState<{ title?: string; eligibility?: Any; cert?: Any; loading: boolean }>({ loading: true });
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const [curr, elig, mine] = await Promise.all([
      api<Any>(`/enrollments/${eid}/curriculum`).catch(() => null),
      api<Any>(`/enrollments/${eid}/certificate/eligibility`).catch(() => null),
      api<Any[]>('/certificates/me').catch(() => ({ data: [] as Any[] })),
    ]);
    const title = curr?.data?.internshipTitle;
    const cert = (mine.data as Any[]).find((c) => c.internshipTitle === title);
    setState({ title, eligibility: elig?.data, cert, loading: false });
  }, [eid]);

  useEffect(() => { void load(); }, [load]);

  const claim = async (): Promise<void> => {
    setClaiming(true);
    try {
      await api(`/enrollments/${eid}/certificate`, { method: 'POST' });
      toast('success', 'Certificate issued! 🎓');
      await load();
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not issue certificate yet.');
    } finally { setClaiming(false); }
  };

  const download = async (id: number): Promise<void> => {
    try {
      const { data } = await api<{ url: string }>(`/certificates/${id}/download`);
      window.open(data.url, '_blank', 'noopener');
    } catch {
      toast('info', 'PDF is still generating — try again in a moment.');
    }
  };

  const { loading, eligibility, cert } = state;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="glass sticky top-0 z-30">
        <div className="container-page flex h-16 items-center gap-3">
          <Link href={`/classroom/${eid}`} className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Classroom</Link>
          <h1 className="font-heading text-body font-semibold">Certificate</h1>
        </div>
      </header>
      <main className="container-page max-w-xl py-8">
        {loading ? <div className="flex justify-center p-12"><Spinner /></div>
        : cert ? (
          <div className="card overflow-hidden text-center shadow-e1">
            <div className="bg-brand-gradient px-6 py-8 text-white">
              <p className="text-5xl">🎓</p>
              <p className="mt-2 font-heading text-h2">Certificate issued</p>
              <p className="text-body-sm opacity-90">{cert.certificateNo}{cert.grade ? ` · Grade ${cert.grade}` : ''}</p>
            </div>
            <div className="space-y-2 p-6">
              <p className="text-neutral-700">{cert.internshipTitle}</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button size="sm" onClick={() => download(cert.id)} disabled={!cert.downloadReady}>{cert.downloadReady ? 'Download PDF' : 'Generating…'}</Button>
                <Link href={`/verify/${cert.certificateNo}`} className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-body-sm font-medium text-primary-700 hover:bg-neutral-50">Public verify</Link>
                {cert.linkedinAddUrl && (
                  <a href={cert.linkedinAddUrl} target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-xl bg-[#0a66c2] px-4 text-body-sm font-medium text-white hover:opacity-90">Add to LinkedIn</a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-h3">Completion certificate</h2>
            {eligibility?.eligible ? (
              <>
                <p className="mt-2 text-body-sm text-success-700">✓ You&apos;ve met all the requirements.</p>
                <Button className="mt-4" onClick={claim} loading={claiming}>Claim certificate</Button>
              </>
            ) : (
              <>
                <p className="mt-2 text-body-sm text-neutral-600">Complete these to unlock your certificate:</p>
                <ul className="mt-3 space-y-2">
                  {(eligibility?.checks as Any[] ?? []).map((c, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-body-sm">
                      <span className="flex items-center gap-2">
                        <span>{c.ok ? '✅' : '⬜'}</span>{RULE_LABEL[c.rule] ?? c.rule}
                      </span>
                      <span className={c.ok ? 'text-success-700' : 'text-neutral-500'}>
                        {typeof c.actual === 'boolean' ? (c.actual ? 'done' : 'pending') : `${c.actual} / ${c.required}`}
                      </span>
                    </li>
                  ))}
                  {(!eligibility || (eligibility.checks as Any[]).length === 0) && <li className="text-body-sm text-neutral-500">Keep learning — requirements will show here.</li>}
                </ul>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
