import {
  IconBriefcase,
  IconFolder,
  IconHome2,
  IconMessageDots,
  IconStar,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

export type NavLink = {
  /** Also the id of the section element this link tracks. */
  id: string;
  label: string;
  Icon: Icon;
};

/* The icon is not decoration: it is the label in the condensed rail and on
   the mobile sheet's rows, so each one has to stay recognisable at 16px and
   constant across every state. */
export const LINKS: readonly NavLink[] = [
  { id: 'home', label: 'Home', Icon: IconHome2 },
  { id: 'skills', label: 'Skills', Icon: IconStar },
  { id: 'experience', label: 'Experience', Icon: IconBriefcase },
  { id: 'projects', label: 'Projects', Icon: IconFolder },
  { id: 'contact', label: 'Contact', Icon: IconMessageDots },
] as const;

export const SECTION_IDS = LINKS.map((link) => link.id);

/** The section whose bottom edge drives the condense transition. */
export const HERO_ID = 'home';

export const CONTACT_HREF = '#contact';

/** Shared morph timing — the design's easing, used by every state change
 *  that has to read as one element resizing. */
export const MORPH_EASE = [0.22, 1, 0.36, 1] as const;
export const MORPH_DURATION = 0.48;
