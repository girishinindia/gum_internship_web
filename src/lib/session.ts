import 'server-only';
import { cookies } from 'next/headers';

export interface DisplayUser {
  name: string;
  roles: string[];
}

/**
 * Reads the non-httpOnly `gum_user` display cookie set at login. This is a UX
 * hint only (name + roles for rendering nav/menus) — NEVER an authorization
 * source. Real authorization is enforced by the API on every request.
 */
export function getSessionUser(): DisplayUser | null {
  const raw = cookies().get('gum_user')?.value;
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Partial<DisplayUser>;
    if (!u.name || !Array.isArray(u.roles)) return null;
    return { name: u.name, roles: u.roles };
  } catch {
    return null;
  }
}

export function hasRole(user: DisplayUser | null, ...roles: string[]): boolean {
  if (!user) return false;
  if (user.roles.includes('super_admin')) return true;
  return user.roles.some((r) => roles.includes(r));
}
