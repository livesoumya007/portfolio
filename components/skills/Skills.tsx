'use client';

import { Card } from '@/components/ui/Card';
import { FadeUp } from '@/components/ui/FadeUp';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SKILL_CATEGORIES } from './skills-data';
import styles from './Skills.module.css';

export default function Skills() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className={styles.skills}
    >
      <div className={styles.inner}>
        <FadeUp>
          <SectionHeader
            heading="Skills"
            headingId="skills-heading"
            intro="A snapshot of the tools and technologies I reach for across the stack."
          />
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[var(--spacing-lg)]">
          {SKILL_CATEGORIES.map((category, i) => (
            <FadeUp key={category.title} delay={i * 0.07}>
              <Card
                className={styles.skillCard}
                divider
                title={category.title}
                description={category.description}
                icons={category.techs.map((tech) => {
                  const Icon = tech.icon;
                  return {
                    label: tech.label,
                    node: Icon ? (
                      <Icon aria-hidden style={{ color: tech.color }} />
                    ) : undefined,
                  };
                })}
              />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

