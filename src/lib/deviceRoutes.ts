/**
 * Shared device route map used by BOTH the middleware (server-side UA routing)
 * and the client-side DeviceRedirect (viewport-width routing). One source of
 * truth so the two can never drift.
 */

// Desktop path → mobile path (longest-prefix first).
const TO_MOBILE: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/internships\/([^/]+)$/, (m) => `/m/internships/${m[1]}`],
  [/^\/internships\/?$/, () => '/m/explore'],
  [/^\/classroom\/([^/]+)$/, (m) => `/m/classroom/${m[1]}`],
  [/^\/jobs\/([^/]+)$/, (m) => `/m/jobs/${m[1]}`],
  [/^\/jobs\/?$/, () => '/m/jobs'],
  [/^\/applications\/?$/, () => '/m/applications'],
  [/^\/mentorship\/?$/, () => '/m/mentorship'],
  [/^\/assessment\/?$/, () => '/m/assessment'],
  [/^\/interview\/?$/, () => '/m/interview'],
  [/^\/forum\/([^/]+)$/, (m) => `/m/forum/${m[1]}`],
  [/^\/forum\/?$/, () => '/m/forum'],
  [/^\/achievements\/?$/, () => '/m/achievements'],
  [/^\/notifications\/?$/, () => '/m/notifications'],
  [/^\/bundles\/([^/]+)$/, (m) => `/m/bundles/${m[1]}`],
  [/^\/bundles\/?$/, () => '/m/bundles'],
  [/^\/cpd\/?$/, () => '/m/cpd'],
  // /my and learning sub-paths → mobile learn, but NOT /my/portfolio (renders responsively).
  [/^\/my(?!\/portfolio)(\/.*)?$/, () => '/m/learn'],
  [/^\/$/, () => '/m'],
];

// Mobile path → desktop path.
const TO_DESKTOP: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/m\/internships\/([^/]+)$/, (m) => `/internships/${m[1]}`],
  [/^\/m\/explore\/?$/, () => '/internships'],
  [/^\/m\/classroom\/([^/]+)$/, (m) => `/classroom/${m[1]}`],
  [/^\/m\/jobs\/([^/]+)$/, (m) => `/jobs/${m[1]}`],
  [/^\/m\/jobs\/?$/, () => '/jobs'],
  [/^\/m\/applications\/?$/, () => '/applications'],
  [/^\/m\/mentorship\/?$/, () => '/mentorship'],
  [/^\/m\/assessment\/?$/, () => '/assessment'],
  [/^\/m\/interview\/?$/, () => '/interview'],
  [/^\/m\/forum\/([^/]+)$/, (m) => `/forum/${m[1]}`],
  [/^\/m\/forum\/?$/, () => '/forum'],
  [/^\/m\/achievements\/?$/, () => '/achievements'],
  [/^\/m\/notifications\/?$/, () => '/notifications'],
  [/^\/m\/bundles\/([^/]+)$/, (m) => `/bundles/${m[1]}`],
  [/^\/m\/bundles\/?$/, () => '/bundles'],
  [/^\/m\/cpd\/?$/, () => '/cpd'],
  [/^\/m\/(?:learn|profile|live)(?:\/.*)?$/, () => '/my'],
  [/^\/m\/?$/, () => '/'],
];

export function isMobilePath(pathname: string): boolean {
  return pathname === '/m' || pathname.startsWith('/m/');
}

/** Desktop path → its mobile equivalent, or null if none. */
export function toMobilePath(pathname: string): string | null {
  for (const [re, to] of TO_MOBILE) {
    const m = pathname.match(re);
    if (m) return to(m);
  }
  return null;
}

/** Mobile path → its desktop equivalent, or null if none. */
export function toDesktopPath(pathname: string): string | null {
  for (const [re, to] of TO_DESKTOP) {
    const m = pathname.match(re);
    if (m) return to(m);
  }
  return null;
}
