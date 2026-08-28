import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/lib/utils';
import styles from './GlassSurface.module.css';

/**
 * Glow presets — control the conic ring stops + corner bloom.
 *  - diagonal: white top-left / violet bottom-right (cards, the signature look)
 *  - subtle:   faint white ring, no bloom (navbar treatment)
 *  - active:   violet-forward ring + violet bloom (selected nav-link state)
 *  - split:    white left half / violet right half, no bloom (CTAs)
 *  - shell:    near-uniform faint ring + bright specular top edge + one wide
 *              ambient bloom (large section containers — deliberately flatter
 *              and quieter than `diagonal` so the cards inside it still read
 *              as the foreground)
 */
export type GlowPreset = 'diagonal' | 'subtle' | 'active' | 'split' | 'shell';
export type GlassRadius = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const radiusClass: Record<GlassRadius, string> = {
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
  full: styles.radiusFull,
};

type GlassOwnProps<E extends ElementType> = {
  /** Element/component to render as. Defaults to 'div'. */
  as?: E;
  glow?: GlowPreset;
  radius?: GlassRadius;
};

/* ComponentProps (not ComponentPropsWithoutRef) — React 19 passes `ref`
   through as a plain prop, so it rides along in `...rest` below with no
   forwardRef needed. This lets consumers (e.g. AccordionCard, for
   useInView) get a real DOM ref without an extra wrapper element. */
export type GlassSurfaceProps<E extends ElementType> = GlassOwnProps<E> &
  Omit<ComponentProps<E>, keyof GlassOwnProps<E>>;

/**
 * Core liquid-glass primitive. Owns all mask-composite complexity: a
 * conic-gradient border ring (::before) + an outer corner bloom (::after),
 * over a glassy fill with an inner top highlight. Reads every value from the
 * --glass-* tokens in globals.css. `border-radius: inherit` on the pseudo
 * layers means the ring/bloom adapt to whatever radius the root carries.
 */
export function GlassSurface<E extends ElementType = 'div'>({
  as,
  glow = 'subtle',
  radius = 'md',
  className,
  children,
  ...rest
}: GlassSurfaceProps<E>) {
  const Component = (as ?? 'div') as ElementType;

  return (
    <Component
      data-glow={glow}
      className={cn(styles.surface, radiusClass[radius], className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
