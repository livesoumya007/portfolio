import { Fragment, createElement, type ReactNode } from 'react';
import data from './experience-data.json';

export type ExperienceEntry = {
  role: string;
  company: string;
  location: string;
  /** Full range, shown in the row's meta line (e.g. "June 2024 — Present"). */
  years: string;
  /** Short form for the rail's vertical year (e.g. "2024 —", "2022"). */
  yearShort: string;
  type: string;
  /** Marks the present role — gives its rail dot the pulsing halo. */
  current?: boolean;
  /** One line, always visible whether the row is open or closed. */
  summary: string;
  stack: string[];
  /** Body copy. Wrap key phrases in **double asterisks** to emphasise them. */
  bullets: string[];
};

export const KICKER = data.kicker;
export const HEADING = data.heading;
export const INTRO = data.intro;
export const ENTRIES = data.entries as ExperienceEntry[];

/**
 * Splits `**emphasised**` runs out of a bullet into <strong> elements.
 * Odd indices of the split are the emphasised halves.
 */
export function renderEmphasis(text: string): ReactNode[] {
  return text.split('**').map((part, i) =>
    i % 2 === 1
      ? createElement('strong', { key: i }, part)
      : createElement(Fragment, { key: i }, part)
  );
}
