import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';
import styles from './Card.module.css';

export type CardIcon = {
  /** The visual — an <img>, svg, or styled tile. Falls back to the label's
   *  initial when omitted (e.g. a tech with no available icon). */
  node?: ReactNode;
  /** Caption shown under the icon. */
  label?: string;
};

/**
 * Where the hairline rule sits.
 *  - 'before-text'  above the title, separating it from the icon row
 *                   (bottom-weighted cards — Skills)
 *  - 'after-header' below the title/subtitle row, separating it from the body
 *                   (top-weighted cards — Experience)
 * `true` is an alias for 'before-text' so boolean call sites keep working.
 */
export type CardDivider = boolean | 'before-text' | 'after-header';

type CardOwnProps<E extends ElementType> = {
  /** Element/component to render as, forwarded to GlassSurface. Defaults to 'div'. */
  as?: E;
  /** Top icon row (e.g. React / JS / Next.js / Svelte / D3). */
  icons?: CardIcon[];
  /** Full-width row above the title (e.g. a mono index + year line). */
  eyebrow?: ReactNode;
  divider?: CardDivider;
  title?: string;
  /** Secondary line under the title (e.g. a company name). */
  subtitle?: string;
  /** Top-right slot, baseline-aligned with the title (e.g. a status Pill). */
  aside?: ReactNode;
  /** Row below the body (e.g. a wrap of tech Pills). */
  footer?: ReactNode;
  description?: string;
  /** Escape hatch / arbitrary body content. */
  children?: ReactNode;
};

export type CardProps<E extends ElementType = 'div'> = CardOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, 'title' | keyof CardOwnProps<E>>;

/**
 * Liquid-glass card with the diagonal glow. Every slot is optional and only
 * renders when its prop is provided, so the same component serves a full
 * skill card, a role card, a title+description block, or a bare children
 * wrapper.
 *
 * Layout knobs are exposed as --card-* custom properties rather than as
 * variant classes, so consumers can retune spacing and hover behaviour from
 * their own module without fighting cross-module cascade order.
 */
export function Card<E extends ElementType = 'div'>({
  as,
  icons,
  eyebrow,
  divider,
  title,
  subtitle,
  aside,
  footer,
  description,
  className,
  children,
  ...rest
}: CardProps<E>) {
  const hasIcons = Boolean(icons && icons.length > 0);
  const hasHeader = Boolean(title || subtitle || aside);
  const dividerAt = divider === true ? 'before-text' : divider || undefined;
  const hasText = Boolean(eyebrow) || hasHeader || Boolean(description) || Boolean(children);

  const rule = <hr className={styles.divider} />;

  /* TypeScript can't carry a polymorphic `as` through two generic layers —
     it won't prove Omit<ComponentPropsWithoutRef<E>, …> assignable to
     itself. The cast is confined to this boundary; Card's own props stay
     fully typed for callers. */
  const surfaceProps = {
    as: as ?? 'div',
    radius: 'lg',
    glow: 'diagonal',
    className: cn(styles.card, className),
    ...rest,
  } as GlassSurfaceProps<ElementType>;

  return (
    <GlassSurface {...surfaceProps}>
      {hasIcons && (
        <ul className={styles.icons}>
          {icons!.map((icon, i) => (
            <li key={icon.label ?? i} className={styles.icon}>
              <span className={styles.iconTile}>
                {icon.node ?? (
                  <span className={styles.iconFallback}>
                    {icon.label?.charAt(0)}
                  </span>
                )}
              </span>
              {icon.label && <span className={styles.iconLabel}>{icon.label}</span>}
            </li>
          ))}
        </ul>
      )}

      {hasText && (
        /* .textFill sinks the block to the bottom of the card — only wanted
           when there's a media row above it to be pushed away from. */
        <div className={cn(styles.text, hasIcons && styles.textFill)}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}

          {dividerAt === 'before-text' && rule}

          {hasHeader && (
            <div className={styles.header}>
              <div className={styles.headerText}>
                {title && <h3 className={styles.title}>{title}</h3>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              {aside && <div className={styles.aside}>{aside}</div>}
            </div>
          )}

          {dividerAt === 'after-header' && rule}

          {description && <p className={styles.description}>{description}</p>}

          {children}
        </div>
      )}

      {footer && <div className={styles.footer}>{footer}</div>}
    </GlassSurface>
  );
}
