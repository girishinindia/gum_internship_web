import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 60;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Verification = Record<string, any>;

export function generateMetadata({ params }: { params: { certificateNo: string } }): ReturnType<typeof pageMetadata> {
  return pageMetadata({
    title: `Verify certificate ${params.certificateNo}`,
    description: 'Independently verify a GUM Internships completion certificate.',
    path: `/verify/${params.certificateNo}`,
  });
}

export default async function VerifyPage({ params }: { params: { certificateNo: string } }): Promise<JSX.Element> {
  const { data: v } = await apiGet<Verification>(`/verify/${encodeURIComponent(params.certificateNo)}`, { revalidate: 60 });
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-xl overflow-hidden shadow-e1">
        <div className={`${v.valid ? 'bg-success-600' : 'bg-danger-600'} px-6 py-4 text-white`}>
          <p className="font-heading text-h3">{v.valid ? '✓ Valid certificate' : '✕ Not valid'}</p>
          <p className="text-body-sm opacity-90">{params.certificateNo}</p>
        </div>
        <div className="space-y-3 p-6">
          {v.valid ? (
            <>
              <Rowi label="Issued to" value={v.learnerName} strong />
              <Rowi label="Program" value={v.internshipTitle} />
              {v.durationWeeks && <Rowi label="Duration" value={`${v.durationWeeks} weeks`} />}
              <Rowi label="Grade" value={v.grade} />
              <Rowi label="Issued on" value={new Date(v.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <p className="pt-2 text-caption text-neutral-500">
                Verified against GUM Internships records, integrity-checked via HMAC signature.
              </p>
            </>
          ) : (
            <p className="text-neutral-800">{v.reason}. If you believe this is a mistake, contact support with the certificate number.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Rowi({ label, value, strong }: { label: string; value: string; strong?: boolean }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-neutral-100 pb-2">
      <span className="text-body-sm text-neutral-600">{label}</span>
      <span className={strong ? 'font-heading text-h3' : 'font-medium'}>{value}</span>
    </div>
  );
}
