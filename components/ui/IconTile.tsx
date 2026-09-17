import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './IconTile.module.css';

export type IconTileSize = 'sm' | 'md' | 'lg';

export type IconTileProps = {
  /** The icon node to render inside the tile. */
  children: ReactNode;
  /** Size variant — maps to the same scale as the Card skill tiles. */
  size?: IconTileSize;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

/**
 * A rounded-square tile that wraps an icon — matches the `.iconTile` look
 * used inside Card (Skills section) for site-wide consistency.
 *
 * Uses the same --color-surface-raised background, --color-border border,
 * and inner hover-glow defined via --icon-hover-glow in globals.css.
 */
export function IconTile({
  children,
  size = 'md',
  className,
  ...rest
}: IconTileProps) {
  return (
    <span
      className={cn(styles.tile, styles[size], className)}
      {...rest}
    >
      {children}
    </span>
  );
}
