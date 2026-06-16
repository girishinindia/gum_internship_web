'use client';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ShellCtx {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}
const Ctx = createContext<ShellCtx>({ drawerOpen: false, openDrawer: () => undefined, closeDrawer: () => undefined });

export function MobileShellProvider({ children }: { children: ReactNode }): JSX.Element {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const value = useMemo<ShellCtx>(() => ({
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  }), [drawerOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMobileShell(): ShellCtx {
  return useContext(Ctx);
}
