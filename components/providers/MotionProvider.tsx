'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';

/**
 * Single, app-wide LazyMotion registration. Motion's own docs are explicit
 * that a tree should have exactly one LazyMotion ancestor — every `m.*`
 * component anywhere in the app (AccordionCard, ProjectSlider, …) resolves
 * its feature set from this one provider, so it belongs at the root rather
 * than duplicated per section.
 *
 * `domMax` — not `domAnimation` — because the nav's active-item indicator
 * uses `layoutId`, and layout projection ships ONLY in the max bundle:
 * `domMax = { ...domAnimation, ...drag, ...layout }`. With `domAnimation`
 * a `layoutId` silently does nothing. `drag` rides along unused; it is not
 * separable from `layout` in Motion's published feature bundles.
 *
 * Loaded eagerly (not the `features={() => import(...)}` lazy form): at root
 * level it's needed immediately for above-the-fold content, so deferring it
 * would only add a loading-state flash for no bundle-size benefit. `strict`
 * turns an accidental `motion.*` import (bypassing this registration) into a
 * build-time error.
 *
 * `MotionConfig reducedMotion="user"` makes every Motion animation in the
 * app respect prefers-reduced-motion automatically, on top of (not instead
 * of) each component's own explicit reduced-motion handling for the
 * properties Motion can't cover itself (e.g. height, which isn't a
 * transform).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
