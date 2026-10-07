import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './Bubble.module.css';

/** Who is speaking — drives side, fill and which corner carries the tail. */
export type BubbleFrom = 'me' | 'bot';

export type BubbleProps = {
  from?: BubbleFrom;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/**
 * A single chat turn. Deliberately not built on Card or GlassSurface: bubbles
 * live *inside* the glass chat panel, and a second ring there would stack
 * glass on glass and muddy both. It's a flat fill plus one squared corner —
 * all of it driven by the --bubble-* tokens in globals.css.
 *
 * The outer row owns the alignment so a list of bubbles is a plain flex
 * column, with no per-item alignment logic at the call site.
 */
export function Bubble({ from = 'bot', className, children, ...rest }: BubbleProps) {
  return (
    <div className={cn(styles.row, className)} data-from={from} {...rest}>
      <div className={styles.bubble}>{children}</div>
    </div>
  );
}
