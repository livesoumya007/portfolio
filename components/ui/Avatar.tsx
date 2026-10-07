import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md';

export type AvatarProps = {
  /** Letter shown when no custom node is supplied (e.g. "S"). */
  initial?: string;
  /** Icon or <img> rendered in place of the initial. */
  children?: ReactNode;
  size?: AvatarSize;
  /** Presence dot pinned to the bottom-right corner. */
  online?: boolean;
} & Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

/**
 * Circular identity mark filled with --gradient-signal — the round, gradient
 * sibling of IconTile. Use IconTile for a tech/brand logo on a glass tile,
 * Avatar for a person or the assistant.
 *
 * Sizing is a variant rather than a token so the two call sites (chat header,
 * chat launcher) can't drift apart; override width/height from a consumer
 * module for one-off sizes.
 */
export function Avatar({
  initial,
  children,
  size = 'md',
  online = false,
  className,
  ...rest
}: AvatarProps) {
  return (
    <span className={cn(styles.avatar, styles[size], className)} {...rest}>
      {children ?? <span className={styles.initial}>{initial}</span>}
      {online && <span className={styles.status} aria-hidden />}
    </span>
  );
}
