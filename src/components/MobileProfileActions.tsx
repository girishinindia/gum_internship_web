'use client';
import { useRouter } from 'next/navigation';

export function ProfileActions({ signedIn }: { signedIn: boolean }): JSX.Element {
  const router = useRouter();
  return (
    <div className="p-4">
      {signedIn ? (
        <button
          onClick={async () => { await fetch('/api/session', { method: 'DELETE' }); router.push('/m'); router.refresh(); }}
          className="h-12 w-full rounded-lg border border-danger-300 font-medium text-danger-700 active:bg-danger-50">
          Log out
        </button>
      ) : (
        <button onClick={() => router.push('/login')} className="h-12 w-full rounded-lg bg-primary-600 font-medium text-white">Log in</button>
      )}
    </div>
  );
}
