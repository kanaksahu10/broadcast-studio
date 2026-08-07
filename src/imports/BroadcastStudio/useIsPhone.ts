import { useEffect, useState } from 'react';

/**
 * Phone is < 640px. Written as min-width-and-negate rather than
 * `(max-width: 639px)` so it agrees with Tailwind's `sm:` / `max-sm:` at
 * fractional widths — a 639.5px viewport is phone to both, not one each.
 */
export const TABLET_UP_QUERY = '(min-width: 640px)';

/** Live phone check — re-renders on resize, so layout can branch on it. */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(() => !window.matchMedia(TABLET_UP_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(TABLET_UP_QUERY);
    const handleChange = (e: MediaQueryListEvent) => setIsPhone(!e.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isPhone;
}
