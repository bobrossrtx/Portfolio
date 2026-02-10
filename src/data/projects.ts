export type Project = {
  id: string;
  title: string;
  status: string;
  timeframe: string;
  description: string;
  highlights: string[];
  tech: string[];
  repo: string;
  links?: {
    label: string;
    url: string;
  }[];
};

export const projects: Project[] = [
  {
    id: 'demi',
    title: 'Demi Programming Language',
    status: 'Active development',
    timeframe: '2 years, early stage',
    description: 'A highly customizable programming language built to be the Vim of languages.',
    highlights: [
      'VM interpreter foundation is stable',
      'Customizable syntax and semantics per project',
      'Assembly language expansion in progress',
    ],
    tech: ['C', 'C++', 'VM', 'Language tooling'],
    repo: 'https://github.com/bobrossrtx/demi',
    links: [
      {
        label: 'Repository',
        url: 'https://github.com/bobrossrtx/demi',
      },
    ],
  },
  {
    id: 'tinykernel',
    title: 'TinyKernel',
    status: 'On hold (planned reboot)',
    timeframe: 'Last updated 5 years ago',
    description: 'Hobby VM kernel developed in C to learn OS fundamentals.',
    highlights: [
      'Deep dive into OS internals and boot flows',
      'Studied osdev.wiki and system-level architecture',
      'Rewrite to C++ planned',
    ],
    tech: ['C', 'OS Development', 'Low-level'],
    repo: 'https://github.com/bobrossrtx/tinykernel',
    links: [
      {
        label: 'Repository',
        url: 'https://github.com/bobrossrtx/tinykernel',
      },
      {
        label: 'Learning Resources',
        url: 'https://wiki.osdev.org/',
      },
    ],
  },
  {
    id: 'census-conquest',
    title: 'Census Conquest',
    status: 'Early development',
    timeframe: '2024-present',
    description: 'AI-driven alternate world history strategy game inspired by Pax Historia.',
    highlights: [
      'Strategy simulation with AI-driven world building',
      'Mixed Rust and TypeScript stack',
      'Backend experiments using Rocket',
    ],
    tech: ['Rust', 'TypeScript', 'React', 'Rocket', 'AI'],
    repo: 'https://github.com/bobrossrtx/Cencus-Conquest',
    links: [
      {
        label: 'Repository',
        url: 'https://github.com/bobrossrtx/Cencus-Conquest',
      },
    ],
  },
];
