'use client';

import { FadeUp } from '@/components/ui/FadeUp';
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProjectSlider } from "./ProjectSlider";
import { HEADING, INTRO, KICKER } from "./projects-data";
import styles from "./Projects.module.css";

export default function Projects() {
  return (
    <section id="projects" className={styles.projects}>
      <div className={styles.inner}>
        <FadeUp>
          <SectionHeader
            kicker={KICKER}
            heading={HEADING}
            headingId="projects-heading"
            intro={INTRO}
          />
        </FadeUp>
        <FadeUp delay={0.15}>
          <ProjectSlider />
        </FadeUp>
      </div>
    </section>
  );
}

