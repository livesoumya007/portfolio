import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';
import styles from './SectionHeader.module.css';

export type SectionHeaderProps = {
  /** Small tracked-out label above the heading, with the violet lead rule. */
  kicker?: string;
  heading: string;
  /** id applied to the <h2>, for the section's aria-labelledby. */
  headingId?: string;
  intro?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/**
 * Kicker + h2 + intro paragraph, shared by every major section (Skills,
 * Experience, Projects) so the site carries one heading scale
 * (--text-section-heading) instead of each section inventing its own.
 */
export function SectionHeader({
  kicker,
  heading,
  headingId,
  intro,
  className,
  ...rest
}: SectionHeaderProps) {
  return (
    <div className={cn(styles.header, className)} {...rest}>
      {kicker && <p className={styles.kicker}>{kicker}</p>}
      <h2 id={headingId} className={styles.heading}>
        {heading}
      </h2>
      {intro && <p className={styles.intro}>{intro}</p>}
    </div>
  );
}
