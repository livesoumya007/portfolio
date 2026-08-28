'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';
import { GlassSurface } from './GlassSurface';
import styles from './controls.module.css';

export type ControlVariant = 'primary' | 'ghost';

export type CTAProps = {
  variant?: ControlVariant;
} & ComponentPropsWithoutRef<'button'>;

/**
 * Button built on GlassSurface.
 *  - ghost:   glassy surface with the white/violet split-border ring
 *  - primary: filled inverted style (fg fill / bg text), via token overrides
 */
export function CTA({
  variant = 'primary',
  className,
  type = 'button',
  children,
  ...rest
}: CTAProps) {
  return (
    <GlassSurface
      as="button"
      radius="full"
      glow={variant === 'ghost' ? 'split' : 'subtle'}
      type={type}
      className={cn(styles.control, styles[variant], className)}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}
