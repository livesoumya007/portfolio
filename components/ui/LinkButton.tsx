import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GlassSurface, type GlowPreset } from './GlassSurface';
import styles from './controls.module.css';
import type { ControlVariant } from './CTA';

export type LinkButtonProps = {
  href: string;
  variant?: ControlVariant;
  /** Glow preset for the surface — e.g. 'active' for a selected nav item. */
  glow?: GlowPreset;
  /** Opens in a new tab with safe rel attributes; renders a plain anchor. */
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href'>;

/**
 * Navigation twin of CTA — same look, renders an anchor. Uses Next.js Link for
 * internal hrefs, a plain <a> for external ones.
 */
export function LinkButton({
  href,
  variant = 'ghost',
  glow,
  external = false,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const resolvedGlow = glow ?? (variant === 'ghost' ? 'split' : 'subtle');
  const classes = cn(styles.control, styles[variant], className);

  if (external) {
    return (
      <GlassSurface
        as="a"
        radius="full"
        glow={resolvedGlow}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...rest}
      >
        {children}
      </GlassSurface>
    );
  }

  return (
    <GlassSurface
      as={Link}
      radius="full"
      glow={resolvedGlow}
      href={href}
      className={classes}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}
