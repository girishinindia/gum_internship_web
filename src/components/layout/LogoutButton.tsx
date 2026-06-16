'use client';
import { useRouter } from 'next/navigation';

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  return (
    <button
      className="text-neutral-500 hover:text-danger-600"
      onClick={async () => {
        await fetch('/api/session', { method: 'DELETE' });
        router.push('/');
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
