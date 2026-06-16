import { MobileShellProvider } from '@/components/mobile/MobileShell';
import { BottomNav } from '@/components/mobile/BottomNav';
import { Drawer } from '@/components/mobile/Drawer';

/** Mobile-device app shell: persistent bottom nav + slide-in drawer, content
 *  swaps in between. Reached only by phones/tablets (UA + width routing). */
export default function MobileShell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <MobileShellProvider>
      <div className="app-screen">
        <div className="app-body screen-enter">{children}</div>
        <BottomNav />
      </div>
      <Drawer />
    </MobileShellProvider>
  );
}
