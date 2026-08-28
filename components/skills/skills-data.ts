import {
  IconBrandReact,
  IconBrandNextjs,
  IconBrandTypescript,
  IconBrandJavascript,
  IconBrandTailwind,
  IconBrandNodejs,
  IconBrandPython,
  IconBrandGraphql,
  IconBrandMongodb,
  IconBrandMysql,
  IconBrandPrisma,
  IconBrandDocker,
  IconBrandGit,
  IconBrandAws,
  IconBrandVercel,
  IconBrandOpenai,
} from '@tabler/icons-react';

/** All Tabler icon components share this type; deriving it avoids importing a
 *  non-exported type name from the package. */
export type TablerIcon = typeof IconBrandReact;

export type SkillTech = {
  label: string;
  /** Omit when Tabler has no brand icon — the card falls back to the label. */
  icon?: TablerIcon;
  /** Brand color applied to the (currentColor) icon. Falls back to fg. */
  color?: string;
};

export type SkillCategory = {
  title: string;
  description: string;
  techs: SkillTech[];
};

/** Placeholder content — real copy/icons to be supplied later. Techs without a
 *  Tabler brand icon intentionally omit `icon` (card shows the label only). */
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Frontend',
    description:
      'Libraries and tools that simplify building and managing the user interface of websites and web apps.',
    techs: [
      { label: 'React', icon: IconBrandReact, color: '#61DAFB' },
      { label: 'Next.js', icon: IconBrandNextjs, color: '#FFFFFF' },
      { label: 'TypeScript', icon: IconBrandTypescript, color: '#3178C6' },
      { label: 'JavaScript', icon: IconBrandJavascript, color: '#F7DF1E' },
      { label: 'Tailwind', icon: IconBrandTailwind, color: '#38BDF8' },
    ],
  },
  {
    title: 'Backend',
    description:
      'Runtimes and frameworks for building APIs, services, and the logic that powers applications server-side.',
    techs: [
      { label: 'Node.js', icon: IconBrandNodejs, color: '#5FA04E' },
      { label: 'Python', icon: IconBrandPython, color: '#4B8BBE' },
      { label: 'GraphQL', icon: IconBrandGraphql, color: '#E10098' },
      { label: 'Express' }, // no Tabler brand icon
    ],
  },
  {
    title: 'Database',
    description:
      'Stores and data layers for modelling, persisting, and querying application data reliably.',
    techs: [
      { label: 'MongoDB', icon: IconBrandMongodb, color: '#47A248' },
      { label: 'MySQL', icon: IconBrandMysql, color: '#4479A1' },
      { label: 'Prisma', icon: IconBrandPrisma, color: '#FFFFFF' },
      { label: 'PostgreSQL' }, // no Tabler brand icon
      { label: 'Redis' }, // no Tabler brand icon
    ],
  },
  {
    title: 'DevOps',
    description:
      'Tooling for building, shipping, and running applications across environments with confidence.',
    techs: [
      { label: 'Docker', icon: IconBrandDocker, color: '#2496ED' },
      { label: 'Git', icon: IconBrandGit, color: '#F05032' },
      { label: 'AWS', icon: IconBrandAws, color: '#FF9900' },
      { label: 'Kubernetes'}, // no Tabler brand icon
    ],
  },
  {
    title: 'AI',
    description:
      'Frameworks and platforms for building LLM-powered features, agents, and intelligent workflows.',
    techs: [
      { label: 'OpenAI', icon: IconBrandOpenai, color: '#10A37F' },
      { label: 'Vercel AI', icon: IconBrandVercel, color: '#FFFFFF' },
      { label: 'LangChain' }, // no Tabler brand icon
      { label: 'LangGraph' }, // no Tabler brand icon
    ],
  },
];
