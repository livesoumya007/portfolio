import data from './projects-data.json';

export type Project = {
  /** Mono index shown in the card's eyebrow row (e.g. "01"). */
  index: string;
  year: string;
  title: string;
  description: string;
  stack: string[];
  /** Either URL is optional — its CTA is omitted from the card when absent. */
  liveUrl?: string;
  repoUrl?: string;
};

export const KICKER = data.kicker;
export const HEADING = data.heading;
export const INTRO = data.intro;
export const PROJECTS = data.projects as Project[];
