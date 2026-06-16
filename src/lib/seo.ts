import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** SEO metadata helper — every public page goes through this. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
}): Metadata {
  const url = `${SITE}${input.path}`;
  return {
    title: `${input.title} | GUM Internships`,
    description: input.description.slice(0, 155),
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description.slice(0, 155),
      url,
      siteName: 'GUM Internships',
      type: 'website',
      ...(input.image ? { images: [{ url: input.image }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  };
}
