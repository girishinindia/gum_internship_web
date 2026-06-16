import Link from 'next/link';
import { inr, MODE_LABEL } from '@/lib/format';
import type { InternshipSummary } from '@/lib/types';

export function InternshipCard({ i }: { i: InternshipSummary }): JSX.Element {
  const live = i.deliveryMode === 'live';
  return (
    <Link href={`/internships/${i.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {i.thumbnailUrl && (
          <img src={i.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="badge bg-white/90 text-neutral-700 shadow-soft backdrop-blur">{i.category.name}</span>
          <span className={`badge shadow-soft backdrop-blur ${live ? 'bg-danger-600 text-white' : 'bg-white/90 text-neutral-700'}`}>
            {live && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
            {MODE_LABEL[i.deliveryMode] ?? i.deliveryMode}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="line-clamp-2 text-h3 text-neutral-900 transition group-hover:text-primary-700">{i.title}</h3>
        <p className="flex items-center gap-1.5 text-body-sm text-neutral-500">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
            {i.instructorName.slice(0, 1)}
          </span>
          {i.instructorName} · {i.durationWeeks ? `${i.durationWeeks} wks` : 'Self-paced'}{i.level ? ` · ${i.level}` : ''}
        </p>
        <div className="mt-auto flex items-end justify-between pt-2">
          {i.pricingType === 'free' ? (
            <span className="font-heading text-h2 font-bold text-success-600">FREE</span>
          ) : (
            <span className="font-heading text-h2 font-bold text-neutral-900">
              {inr(i.price)}<span className="ml-1 align-middle text-caption font-normal text-neutral-400">+GST</span>
            </span>
          )}
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-caption text-neutral-500">{i.enrollmentCount} enrolled</span>
        </div>
      </div>
    </Link>
  );
}
