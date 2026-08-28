"use client";

import { type ComponentPropsWithoutRef, type ElementType } from "react";
import { m } from "motion/react";

type FadeUpProps = {
  /**
   * Seconds to delay before the animation starts. Use to stagger a list
   * of siblings — e.g. `delay={index * 0.08}`.
   */
  delay?: number;
  /** Override the rendered element. Defaults to `div`. */
  as?: ElementType;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/**
 * Wraps its children in a `motion` element that fades + slides up when the
 * element enters the viewport. Fires once per page load (`viewport.once`).
 *
 * Works for both above-the-fold content (Hero — fires on mount since the
 * element is already in view) and below-the-fold sections (fires as the user
 * scrolls to each section). `MotionConfig reducedMotion="user"` in
 * MotionProvider disables it automatically for users who prefer reduced motion.
 *
 * Uses `m.*` (not `motion.*`) to stay compatible with `LazyMotion strict`
 * mode declared in MotionProvider.
 */
export function FadeUp({
  delay = 0,
  as: Tag = "div",
  className,
  children,
  ...rest
}: FadeUpProps) {
  const MotionTag = m[Tag as keyof typeof m] as typeof m.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px 0px" }}
      transition={{
        duration: 1.92,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
      {...(rest as ComponentPropsWithoutRef<typeof m.div>)}
    >
      {children}
    </MotionTag>
  );
}
