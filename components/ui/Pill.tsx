import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlassSurface, type GlassRadius, type GlowPreset } from './GlassSurface';
import styles from './Pill.module.css';

export type PillProps = {
  /** Leading signal dot — the status-badge treatment. */
  dot?: boolean;
  glow?: GlowPreset;
  radius?: GlassRadius;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'span'>, 'color'>;

/**
 * Inline glass pill — the non-interactive sibling of CTA/LinkButton, built the
 * same way (a GlassSurface plus a box/typography class). Serves status badges
 * (`radius="full"`, usually with `dot`) and tech chips (`radius="sm"`).
 */
export function Pill({
  dot = false,
  glow = 'subtle',
  radius = 'full',
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <GlassSurface
      as="span"
      radius={radius}
      glow={glow}
      className={cn(styles.pill, className)}
      {...rest}
    >
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </GlassSurface>
  );
}
