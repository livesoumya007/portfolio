"use client";

import type { MouseEvent } from "react";
import { m, type MotionValue } from "motion/react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { PROFILE } from "@/lib/profile";
import { ProgressRing } from "./ProgressRing";
import { HERO_ID, LINKS, MORPH_DURATION, MORPH_EASE } from "./nav-links";
import styles from "./NavRail.module.css";

export type NavRailProps = {
  activeId: string;
  condensed: boolean;
  progress: MotionValue<number>;
  reducedMotion: boolean;
  onSelect: (id: string, smooth: boolean) => void;
};

/**
 * Unified nav component for every viewport.
 *
 * Desktop (full): wordmark · links · social discs · divider · ProgressRing
 * Mobile/Tablet (condensed): ProgressRing/monogram · divider · icon-only links
 *
 * ONE tree — `data-condensed` on the root drives every difference through CSS
 * transitions, so the bar reads as a single element resizing.
 */
export function NavRail({
  activeId,
  condensed,
  progress,
  reducedMotion,
  onSelect,
}: NavRailProps) {
  const handle = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    onSelect(id, !reducedMotion);
  };

  return (
    /* `layout` on the panel itself: the rail is width:fit-content, so its
       width depends on which label is showing ("Experience" is wider than
       "Home"). fit-content isn't an animatable value, so without this the
       glass panel resizes in a single frame — a visible snap of up to 35px
       at tablet widths — while the pill inside glides. Motion animates the
       panel over the same curve so the whole bar resizes as one piece. */
    <GlassSurface
      as={m.nav}
      layout={!reducedMotion}
      transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
      radius="full"
      glow="subtle"
      aria-label="Main navigation"
      data-condensed={condensed || undefined}
      className={styles.rail}
    >
      {/* ── Brand wordmark — visible in full, collapses in condensed ── */}
      <a
        href={`#${HERO_ID}`}
        onClick={handle(HERO_ID)}
        className={styles.brand}
        title="Back to top"
      >
        <span className={styles.wordmark}>
          <span className={styles.brace}>{"{"}</span>
          {PROFILE.brandName}
          <span className={styles.dot}>{PROFILE.brandTld}</span>
          <span className={styles.brace}>{"}"}</span>
        </span>
      </a>

      {/* ── ProgressRing — CSS order places it at end (full) or start (condensed) ── */}
      <a
        href={`#${HERO_ID}`}
        onClick={handle(HERO_ID)}
        className={styles.progressWrap}
        title="Back to top"
      >
        <ProgressRing progress={progress}>{PROFILE.monogram}</ProgressRing>
      </a>

      {/* ── Divider — visible in condensed only (between ProgressRing and links) ── */}
      {/* <span className={styles.divider} aria-hidden /> */}

      {/* ── Nav links ── */}
      <ul className={styles.links}>
        {LINKS.map(({ id, label, Icon }) => {
          const isActive = id === activeId;
          return (
            <li key={id} className={styles.item}>
              {/* `layout` on the link itself is what keeps the condensed rail
                  smooth. When the active item changes, this link's box changes
                  size (the active row is the only one showing a label) and every
                  sibling shifts. Those size/position changes MUST be animated by
                  Motion, not by CSS: Motion measures its layout targets in the
                  same frame the DOM commits, so a CSS transition on the same
                  properties would still be sitting at its start value at
                  measurement time — the indicator would then animate toward a
                  stale box while CSS dragged the real one elsewhere, and the two
                  would compound into an overshoot. */}
              <m.a
                href={`#${id}`}
                onClick={handle(id)}
                title={label}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={styles.link}
                layout={!reducedMotion}
                transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
              >
                {isActive && (
                  <m.span
                    data-nav-indicator
                    layoutId={reducedMotion ? undefined : "nav-indicator"}
                    style={{ borderRadius: 999 }}
                    transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
                    className={styles.indicator}
                  />
                )}
                {/* layout="position" — these ride along with the link's resize
                    but are never scaled themselves, which is what stops the
                    glyph and the text from squashing while the pill morphs. */}
                <m.span
                  layout={reducedMotion ? false : "position"}
                  transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
                  className={styles.iconWrap}
                >
                  <Icon size={16} stroke={1.8} className={styles.icon} />
                </m.span>
                <m.span
                  layout={!reducedMotion}
                  transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
                  className={styles.label}
                >
                  <m.span
                    layout={reducedMotion ? false : "position"}
                    transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
                    className={styles.labelText}
                  >
                    {label}
                  </m.span>
                </m.span>
              </m.a>
            </li>
          );
        })}
      </ul>

      {/* ── Social icons — desktop only ── */}
      <div className={styles.socials}>
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialDisc}
          title="GitHub"
          aria-label="GitHub"
        >
          <IconBrandGithub size={18} stroke={1.8} />
        </a>
        <a
          href={PROFILE.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialDisc}
          title="LinkedIn"
          aria-label="LinkedIn"
        >
          <IconBrandLinkedin size={18} stroke={1.8} />
        </a>
      </div>

      {/* ── Divider between socials and ProgressRing — desktop only ── */}
      <span className={styles.socialDivider} aria-hidden />
    </GlassSurface>
  );
}
