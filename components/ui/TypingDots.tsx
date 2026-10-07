import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';
import styles from './TypingDots.module.css';

export type TypingDotsProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/**
 * Placeholder shown while a reply is in flight. Shares the bot bubble's fill,
 * border and tail so it reads as the message that's about to arrive rather
 * than as a separate spinner.
 *
 * role="status" announces it once to screen readers; the dots themselves are
 * decorative and stay hidden from the accessibility tree.
 */
export function TypingDots({ className, ...rest }: TypingDotsProps) {
  return (
    <div
      role="status"
      aria-label="Assistant is typing"
      className={cn(styles.dots, className)}
      {...rest}
    >
      <span className={styles.dot} aria-hidden />
      <span className={styles.dot} aria-hidden />
      <span className={styles.dot} aria-hidden />
    </div>
  );
}
