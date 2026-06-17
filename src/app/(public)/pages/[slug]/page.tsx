import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiGet } from '@/lib/serverApi';
import { pageMetadata } from '@/lib/seo';
import { ApiError } from '@/lib/types';
import { Markdown } from '@/components/ui/Markdown';

export const revalidate = 300;

interface CmsPage {
  slug: string;
  title: string;
  contentMd: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

async function getPage(slug: string): Promise<CmsPage | null> {
  try {
    const res = await apiGet<CmsPage>(`/catalog/pages/${slug}`, { revalidate: 300 });
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPage(params.slug);
  if (!p) return { title: 'Page not found' };
  return pageMetadata({
    title: p.metaTitle ?? p.title,
    description: p.metaDescription ?? `${p.title} — GI Internship.`,
    path: `/pages/${p.slug}`,
  });
}

export default async function CmsPageView({ params }: { params: { slug: string } }): Promise<JSX.Element> {
  const p = await getPage(params.slug);
  if (!p) notFound();
  return (
    <div className="container-page max-w-3xl py-10 md:py-14">
      <h1 className="text-h1">{p.title}</h1>
      <article className="mt-6 text-body text-neutral-700">
        <Markdown>{p.contentMd}</Markdown>
      </article>
    </div>
  );
}
