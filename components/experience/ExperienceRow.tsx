import { AccordionCard } from '@/components/ui/AccordionCard';
import { Pill } from '@/components/ui/Pill';
import { renderEmphasis, type ExperienceEntry } from './experience-data';
import styles from './ExperienceRow.module.css';

type ExperienceRowProps = {
  entry: ExperienceEntry;
};

export function ExperienceRow({ entry }: ExperienceRowProps) {
  return (
    <AccordionCard
      rail={
        <>
          <span className={styles.dot} aria-hidden>
            <span className={styles.dotHalo} />
            <span className={styles.dotCore} />
          </span>
          <span className={styles.year}>{entry.yearShort}</span>
          <span className={styles.line} aria-hidden />
        </>
      }
      header={
        <>
          <div className={styles.titleRow}>
            <h3 className={styles.role}>{entry.role}</h3>
            <span className={styles.company}>{entry.company}</span>
          </div>
          <div className={styles.meta}>
            <span>{entry.years}</span>
            <span className={styles.metaDot} aria-hidden />
            <span>{entry.location}</span>
            <span className={styles.metaDot} aria-hidden />
            <span>{entry.type}</span>
          </div>
          <p className={styles.summary}>{entry.summary}</p>
        </>
      }
    >
      <ul className={styles.bullets}>
        {entry.bullets.map((bullet, i) => (
          <li key={i} className={styles.bullet}>
            <span className={styles.marker} aria-hidden />
            <p className={styles.copy}>{renderEmphasis(bullet)}</p>
          </li>
        ))}
      </ul>

      <div className={styles.stack}>
        {entry.stack.map((tech) => (
          <Pill key={tech} radius="sm" className={styles.chip}>
            {tech}
          </Pill>
        ))}
      </div>
    </AccordionCard>
  );
}
