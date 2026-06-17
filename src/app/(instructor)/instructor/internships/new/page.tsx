'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { InternshipForm } from '@/components/instructor/InternshipForm';
import type { InternshipFormValues } from '@/components/instructor/InternshipForm';

export default function NewInstructorInternshipPage(): JSX.Element {
  const router = useRouter();
  const toast = useToast();

  const create = async (values: InternshipFormValues): Promise<boolean> => {
    try {
      const { data } = await api<{ id: number }>('/internships', { method: 'POST', body: JSON.stringify(values) });
      toast('success', 'Internship created — add a curriculum next.');
      router.push(`/instructor/internships/${data.id}`);
      return true;
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not create the internship.');
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/instructor/internships" className="text-body-sm text-primary-700 hover:underline">‹ My internships</Link>
      <h1 className="text-h1">New internship</h1>
      <InternshipForm mode="create" submitLabel="Create internship" onSubmit={create} />
    </div>
  );
}
