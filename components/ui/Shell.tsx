import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlassSurface } from './GlassSurface';
import styles from './Shell.module.css';

export type ShellProps = {
  children?: ReactNode;
} & ComponentPropsWithoutRef<'div'>;

/**
 * The large outer glass container each major section sits inside (Experience,
 * Projects). Deliberately quieter than `Card` — see the `shell` glow preset
 * in GlassSurface.module.css — so its cards read as the foreground and the
 * shell itself recedes. The one loud detail is the specular top edge, which
 * needs a real element: GlassSurface's own ::before/::after are already
 * spent on the ring and the ambient bloom.
 */
export function Shell({ className, children, ...rest }: ShellProps) {
  return (
    <GlassSurface
      radius="xl"
      glow="shell"
      className={cn(styles.shell, className)}
      {...rest}
    >
      <div className={styles.edge} aria-hidden />
      {children}
    </GlassSurface>
  );
}
