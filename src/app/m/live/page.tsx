import { MobileEmpty } from '@/components/MobileUI';
import { AppBar } from '@/components/mobile/AppBar';
export const metadata = { title: 'Live' };
export default function Live(): JSX.Element {
  return (
    <>
      <AppBar variant="large" title="Live sessions" subtitle="Your scheduled live classes" />
      <MobileEmpty title="No upcoming sessions" body="Your scheduled live classes will appear here with a join button." />
    </>
  );
}
