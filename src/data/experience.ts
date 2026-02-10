export type ExperienceEntry = {
  id: string;
  title: string;
  timeframe: string;
  context: string;
  highlights: string[];
};

export const experienceEntries: ExperienceEntry[] = [
  {
    id: 'language-design-demi',
    title: 'Language Design & Tooling (Demi)',
    timeframe: 'Ongoing',
    context: 'Project-led experience',
    highlights: [
      'Prototyped ideas in TypeScript, then rebuilt the core in C++ for performance and control.',
      'Designed an interpreter pipeline with a custom VM + ISA layer (Dasm) to keep execution predictable.',
      'Iterated on syntax/semantics while keeping a practical roadmap (native code generation next).',
    ],
  },
  {
    id: 'systems-osdev',
    title: 'Low-Level Systems & OSDev',
    timeframe: 'Multi-year exploration',
    context: 'Self-driven learning',
    highlights: [
      'Built kernel experiments and explored drivers and low-level architecture decisions.',
      'Learned to debug with limited tooling and reason about hardware/software boundaries.',
      'Got comfortable with constraints, tradeoffs, and performance-oriented thinking.',
    ],
  },
  {
    id: 'factory-internet',
    title: 'Work Experience (Factory Internet — Cyber Security)',
    timeframe: 'Secondary school (Year 10)',
    context: 'On-site work experience placement',
    highlights: [
      'Started on programming tasks and quickly took on more technical work after demonstrating prior experience.',
      'Worked hands-on with Linux and virtualization, including setting up a fresh Proxmox host and creating VMs.',
      'Completed mock cyber security scenarios to build practical, real-world problem-solving skills.',
      'Was offered an apprenticeship at the end of the placement — I didn’t take it at the time, and later regretted that decision.',
    ],
  },
  {
    id: 'community-learning',
    title: 'Community Learning (Twitch Dev Streams)',
    timeframe: 'Ongoing',
    context: 'Community-driven growth',
    highlights: [
      'Picked up new topics through real discussions, reviews, and “why is it done this way?” moments.',
      'Learned to think beyond the immediate problem and design for maintainability and clarity.',
      'Kept momentum by building in public and learning from others’ approaches.',
    ],
  },
  {
    id: 'dj-sets',
    title: 'DJing',
    timeframe: 'Ongoing',
    context: 'Creative work',
    highlights: [
      'Bedroom sets and the occasional private party.',
      'Focused on DnB, techno, hardcore, garage, and occasional heavier trance.',
      'Treats mixing like engineering: transitions, timing, energy management, and iteration.',
    ],
  },
];
