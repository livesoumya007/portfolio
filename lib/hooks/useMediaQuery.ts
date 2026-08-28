import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reactive `matchMedia`, built the same way as useReducedMotion — a
 * useSyncExternalStore subscription rather than state-in-effect, so there is
 * no render-then-correct flash and no lint exception needed.
 *
 * `getServerSnapshot` returns false: the project is mobile-first, so on the
 * server every `min-width` query reads as unmatched and the smallest layout
 * is what gets rendered. Consumers that swap whole subtrees on the result
 * must tolerate that first client render (see components/nav/Navbar.tsx).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot(): boolean {
  return false;
}
