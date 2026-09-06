'use client';

import { AmbientField } from './AmbientField';
import { FadeUp } from '@/components/ui/FadeUp';
import { LinkButton } from '@/components/ui/LinkButton';
import {
  CTA_PRIMARY,
  CTA_SECONDARY,
  EYEBROW,
  NAME,
  PARAGRAPH,
  SUBTITLE,
  TITLE_LEAD,
} from './hero-content';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className={styles.hero}>
      <AmbientField className={styles.ambient} />
      <div className={styles.inner}>
        <FadeUp delay={0.06}>
          <div className={styles.eyebrow}>{EYEBROW}</div>
        </FadeUp>
        <FadeUp delay={0.18}>
          <div className={styles.nameStage}>
            <h1 id="hero-title" className={styles.title}>
              {TITLE_LEAD}
              <span className={styles.accent}>{NAME}</span>
            </h1>
          </div>
        </FadeUp>
        <FadeUp delay={0.36}>
          <p className={styles.subtitle}>{SUBTITLE}</p>
        </FadeUp>
        <FadeUp delay={0.52}>
          <p className={styles.copy}>{PARAGRAPH}</p>
        </FadeUp>
        <FadeUp delay={0.68}>
          <div className={styles.ctas}>
            <LinkButton href={CTA_PRIMARY.href} variant="primary" external>
              {CTA_PRIMARY.label} →
            </LinkButton>
            <LinkButton href={CTA_SECONDARY.href} variant="ghost">
              {CTA_SECONDARY.label}
            </LinkButton>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
