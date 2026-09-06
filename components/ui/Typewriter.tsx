'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';
import styles from './Typewriter.module.css';

export interface TypewriterProps {
  /** The full string to type out. */
  text: string;
  /** Speed preset ('slow' = 120ms, 'normal' = 70ms, 'fast' = 35ms) or numeric ms per character. */
  speed?: 'slow' | 'normal' | 'fast' | number;
  /** 'natural' adds subtle micro-pauses at punctuation and realistic typing rhythm variance. */
  variance?: 'natural' | 'none';
  /** Delay in seconds before typing starts. */
  delay?: number;
  /** Whether to render the blinking cursor. Defaults to true. */
  cursor?: boolean;
  /** Optional custom CSS class for the cursor. */
  cursorClassName?: string;
  /** Optional inline styles for the cursor. */
  cursorStyle?: React.CSSProperties;
  /** Optional wrapper className. */
  className?: string;
  /** Callback fired when the typing animation completes. */
  onComplete?: () => void;
  /** Custom render function to format or segment the revealed text (e.g. adding accent spans). */
  renderText?: (revealed: string) => ReactNode;
}

const SPEED_MAP = {
  slow: 120,
  normal: 70,
  fast: 35,
};

function getCharDelay(
  char: string,
  prevChar: string,
  baseSpeed: number,
  variance: 'natural' | 'none'
): number {
  if (variance === 'none') return baseSpeed;

  let factor = 1;
  // Natural human typing cadence: pause on punctuation
  if (prevChar === ',' || prevChar === ';') {
    factor = 3.2;
  } else if (prevChar === '.' || prevChar === '!' || prevChar === '?') {
    factor = 4.0;
  } else if (prevChar === ' ') {
    factor = 1.35;
  } else if (char === ' ') {
    factor = 1.2;
  }

  // Subtle human jitter (+/- 20%)
  const jitter = (Math.random() - 0.5) * 0.4;
  return Math.max(20, Math.round(baseSpeed * (factor + jitter)));
}

export function Typewriter({
  text,
  speed = 'normal',
  variance = 'natural',
  delay = 0.2,
  cursor = true,
  cursorClassName,
  cursorStyle,
  className,
  onComplete,
  renderText,
}: TypewriterProps) {
  const shouldReduceMotion = useReducedMotion();
  const [revealedLength, setRevealedLength] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete?.();
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let currentIndex = 0;

    const baseSpeed =
      typeof speed === 'number' ? speed : SPEED_MAP[speed] || SPEED_MAP.normal;

    const startTyping = () => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          currentIndex++;
          setRevealedLength(currentIndex);

          if (currentIndex < text.length) {
            const nextChar = text[currentIndex];
            const prevChar = text[currentIndex - 1] || '';
            const nextDelay = getCharDelay(nextChar, prevChar, baseSpeed, variance);
            timeoutId = setTimeout(typeNextChar, nextDelay);
          } else {
            onComplete?.();
          }
        }
      };

      typeNextChar();
    };

    const initialDelayMs = Math.max(0, Math.round(delay * 1000));
    timeoutId = setTimeout(startTyping, initialDelayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, speed, variance, delay, shouldReduceMotion, onComplete]);

  const effectiveLength = shouldReduceMotion ? text.length : revealedLength;
  const revealedText = text.slice(0, effectiveLength);

  return (
    <span className={`${styles.wrapper} ${className || ''}`} aria-hidden="true">
      <span className={styles.text}>
        {renderText ? renderText(revealedText) : revealedText}
      </span>
      {cursor && (
        <m.span
          className={`${styles.cursor} ${cursorClassName || ''}`}
          style={cursorStyle}
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'loop',
            times: [0, 0.5, 0.5, 1],
            ease: 'linear',
          }}
        />
      )}
    </span>
  );
}
