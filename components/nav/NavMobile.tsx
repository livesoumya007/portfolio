'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { IconX } from '@tabler/icons-react';
import { LinkButton } from '@/components/ui/LinkButton';
import {
  CONTACT_HREF,
  HERO_ID,
  LINKS,
  MORPH_DURATION,
  MORPH_EASE,
} from './nav-links';
import styles from './NavMobile.module.css';

/** Closed height of the pill. Single source of truth — applied as an inline
 *  style on the bar so CSS can't drift from the animation target. */
const BAR_HEIGHT = 60;
const ROW_STAGGER = 0.04;
/** Long enough for the sheet to be visibly closing before the page moves. */
const CLOSE_BEFORE_SCROLL_MS = 190;

export type NavMobileProps = {
  activeId: string;
  reducedMotion: boolean;
  onSelect: (id: string, smooth: boolean) => void;
};

/**
 * Mobile nav. The pill IS the sheet — one element animating height and
 * radius, not a bar plus a separate drawer.
 *
 * The sheet's contents stay mounted and are marked `inert` when closed rather
 * than being unmounted: `inert` already removes them from the tab order, the
 * accessibility tree and find-in-page, and keeping them mounted means the
 * open height is measured and correct *before* the open animation starts
 * instead of a frame into it.
 */
export function NavMobile({ activeId, reducedMotion, onSelect }: NavMobileProps) {
  const [open, setOpen] = useState(false);
  const sheetId = useId();

  const navRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstRowRef = useRef<HTMLAnchorElement>(null);
  const hasOpened = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  /* Measured continuously rather than once: the row labels rewrap when the
     viewport changes, which changes the sheet's height without changing any
     prop this component could key an effect on. */
  const [sheetHeight, setSheetHeight] = useState(0);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setSheetHeight(el.scrollHeight));
    observer.observe(el);
    setSheetHeight(el.scrollHeight);
    return () => observer.disconnect();
  }, []);

  /* Body scroll lock. The padding compensation keeps the page from shifting
     sideways on any platform that reserves space for a scrollbar. */
  useEffect(() => {
    if (!open) return;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  /* Escape to dismiss, and a focus trap so Tab can't walk out of the sheet
     into the page underneath it. */
  useEffect(() => {
    if (!open) return;
    const nav = navRef.current;
    if (!nav) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        nav.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const outside = !nav.contains(current);

      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  /* Move focus into the sheet on open and hand it back to the button on
     close — but never steal focus on first mount. */
  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      firstRowRef.current?.focus();
    } else if (hasOpened.current) {
      menuButtonRef.current?.focus();
    }
  }, [open]);

  const handleSelect = (id: string) => {
    setOpen(false);
    /* Close first, then scroll: the scroll lock is released by the effect
       cleanup above, and letting the sheet start collapsing before the page
       moves keeps the two motions from overlapping. */
    window.setTimeout(
      () => onSelect(id, !reducedMotion),
      reducedMotion ? 0 : CLOSE_BEFORE_SCROLL_MS,
    );
  };

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: MORPH_DURATION, ease: MORPH_EASE };

  return (
    <>
      <AnimatePresence>
        {open && (
          <m.div
            key="backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            onClick={close}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <m.nav
        ref={navRef}
        aria-label="Main navigation"
        className={styles.pill}
        data-open={open || undefined}
        initial={false}
        animate={{
          height: open ? BAR_HEIGHT + sheetHeight : BAR_HEIGHT,
          borderRadius: open ? 28 : 999,
        }}
        transition={transition}
      >
        <div className={styles.bar} style={{ height: BAR_HEIGHT }}>
          <a
            href={`#${HERO_ID}`}
            className={styles.brand}
            title="Back to top"
            onClick={(event) => {
              event.preventDefault();
              handleSelect(HERO_ID);
            }}
          >
            <span className={styles.brace}>{'{'}</span>
            soumya
            <span className={styles.dot}>.dev</span>
            <span className={styles.brace}>{'}'}</span>
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls={sheetId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            title={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <IconX size={16} stroke={2} />
            ) : (
              /* Asymmetric mark — two rules, the lower one short and
                 right-aligned, per the design. */
              <span className={styles.menuMark} aria-hidden>
                <span />
                <span />
              </span>
            )}
          </button>
        </div>

        <div id={sheetId} ref={sheetRef} className={styles.sheet} inert={!open}>
          <ul className={styles.rows}>
            {LINKS.map(({ id, label, Icon }, index) => {
              const isActive = id === activeId;
              return (
                <m.li
                  key={id}
                  animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : open
                        ? {
                            duration: 0.32,
                            delay: index * ROW_STAGGER,
                            ease: MORPH_EASE,
                          }
                        : /* No stagger on the way out — dismissal should
                             feel instant, not choreographed. */
                          { duration: 0.16 }
                  }
                >
                  <a
                    ref={index === 0 ? firstRowRef : undefined}
                    href={`#${id}`}
                    className={styles.row}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      handleSelect(id);
                    }}
                  >
                    <span className={styles.rowIcon}>
                      <Icon size={16} stroke={1.8} />
                    </span>
                    <span className={styles.rowLabel}>{label}</span>
                    <span className={styles.rowDot} aria-hidden />
                  </a>
                </m.li>
              );
            })}
          </ul>

          <div className={styles.rule} aria-hidden />

          <LinkButton
            href={CONTACT_HREF}
            variant="primary"
            className={styles.cta}
            onClick={(event) => {
              event.preventDefault();
              handleSelect('contact');
            }}
          >
            Let&apos;s talk
          </LinkButton>
        </div>
      </m.nav>
    </>
  );
}
