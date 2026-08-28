"use client";

import { FadeUp } from "@/components/ui/FadeUp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ExperienceRow } from "./ExperienceRow";
import { ENTRIES, HEADING, INTRO, KICKER } from "./experience-data";
import styles from "./Experience.module.css";

export default function Experience() {
  return (
    <section id="experience" className={styles.experience}>
      <div className={styles.inner}>
        <FadeUp>
          <SectionHeader
            kicker={KICKER}
            heading={HEADING}
            headingId="experience-heading"
            intro={INTRO}
          />
        </FadeUp>

        <div className={styles.rows} aria-labelledby="experience-heading">
          {ENTRIES.map((entry, i) => (
            <FadeUp key={`${entry.company}-${entry.years}`} delay={i * 0.38}>
              <ExperienceRow entry={entry} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
