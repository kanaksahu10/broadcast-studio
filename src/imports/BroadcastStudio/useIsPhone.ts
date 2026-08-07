import { useEffect, useState } from 'react';

/**
 * Phone is < 640px. Written as min-width-and-negate rather than
 * `(max-width: 639px)` so it agrees with Tailwind's `sm:` / `max-sm:` at
 * fractional widths — a 639.5px viewport is phone to both, not one each.
 */
export const TABLET_UP_QUERY = '(min-width: 640px)';

/** Desktop is >= 1024px; below that is tablet or phone. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

/** True while the viewport does NOT match `query`. Re-renders on resize. */
function useBelow(query: string): boolean {
  const [below, setBelow] = useState(() => !window.matchMedia(query).matches);

  useEffect(() => {
    const list = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setBelow(!e.matches);
    setBelow(!list.matches); // query may have changed between renders
    list.addEventListener('change', handleChange);
    return () => list.removeEventListener('change', handleChange);
  }, [query]);

  return below;
}

/** Live phone check — re-renders on resize, so layout can branch on it. */
export function useIsPhone(): boolean {
  return useBelow(TABLET_UP_QUERY);
}

/**
 * Phone *or* tablet. Both are too narrow to put the compose form beside the
 * preview, so both get the tab strip and the scaled-down mocks.
 */
export function useIsBelowDesktop(): boolean {
  return useBelow(DESKTOP_QUERY);
}
