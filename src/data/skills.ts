export type Skill = {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years: string;
  description: string;
  projects: string[];
  proficiency: number;
};

export type SkillCategory = {
  id: string;
  title: string;
  description: string;
  skills: Skill[];
};

export const skillCategories: SkillCategory[] = [
  {
    id: 'languages',
    title: 'Languages',
    description: 'Systems-first languages and practical tooling for real-world builds.',
    skills: [
      {
        id: 'cpp',
        name: 'C/C++',
        level: 'Advanced',
        years: '4 years',
        description: 'Native apps, VM work, and low-level projects.',
        projects: ['Demi', 'TinyKernel'],
        proficiency: 82,
      },
      {
        id: 'python',
        name: 'Python',
        level: 'Advanced',
        years: '6-7 years',
        description: 'Automation, scripts, and rapid prototypes.',
        projects: ['Tooling scripts', 'Automation'],
        proficiency: 85,
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        level: 'Advanced',
        years: '6 years',
        description: 'Full-stack apps with a focus on type safety.',
        projects: ['Demi website', 'Census Conquest'],
        proficiency: 80,
      },
      {
        id: 'rust',
        name: 'Rust',
        level: 'Intermediate',
        years: '2 years',
        description: 'Security tooling and backend experimentation.',
        projects: ['Census Conquest'],
        proficiency: 55,
      },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Frameworks',
    description: 'Interfaces that feel responsive, intentional, and bold.',
    skills: [
      {
        id: 'react',
        name: 'React',
        level: 'Advanced',
        years: '6-10 projects',
        description: 'Production UI and experimentation across apps.',
        projects: ['Demi website', 'Census Conquest'],
        proficiency: 78,
      },
      {
        id: 'tailwind',
        name: 'Tailwind',
        level: 'Intermediate',
        years: '1-2 years',
        description: 'Utility-first builds when speed matters.',
        projects: ['Quick prototypes'],
        proficiency: 45,
      },
    ],
  },
  {
    id: 'backend',
    title: 'Backend Frameworks',
    description: 'Infrastructure and services that support bold ideas.',
    skills: [
      {
        id: 'node',
        name: 'Node.js',
        level: 'Advanced',
        years: '5+ years',
        description: 'Modules, APIs, and automation backends.',
        projects: ['Custom modules', 'Deploy tooling'],
        proficiency: 75,
      },
      {
        id: 'rocket',
        name: 'Rocket',
        level: 'Intermediate',
        years: '1-2 years',
        description: 'Rust services for security experiments.',
        projects: ['Security tooling'],
        proficiency: 50,
      },
    ],
  },
  {
    id: 'tools',
    title: 'Tools and DevOps',
    description: 'Daily workflow essentials and deployment helpers.',
    skills: [
      {
        id: 'git',
        name: 'Git/GitHub',
        level: 'Expert',
        years: '6+ years',
        description: 'Version control, collaboration, and CI workflows.',
        projects: ['Every project'],
        proficiency: 92,
      },
      {
        id: 'linux',
        name: 'Linux',
        level: 'Intermediate',
        years: '3+ years',
        description: 'Ubuntu, Debian, Kali, Parrot OS, and Pop OS.',
        projects: ['Server deployments'],
        proficiency: 60,
      },
      {
        id: 'docker',
        name: 'Docker',
        level: 'Intermediate',
        years: '1-2 years',
        description: 'Container deployments and local dev setups.',
        projects: ['Demi deployment'],
        proficiency: 48,
      },
    ],
  },
  {
    id: 'systems',
    title: 'Systems and Security',
    description: 'Low-level understanding and defensive awareness.',
    skills: [
      {
        id: 'assembly',
        name: 'Assembly',
        level: 'Intermediate',
        years: '2 years',
        description: 'Learning CPU-level thinking for OS work.',
        projects: ['TinyKernel'],
        proficiency: 50,
      },
      {
        id: 'osdev',
        name: 'OS Development',
        level: 'Intermediate',
        years: '1 year',
        description: 'Kernel work and VM experimentation.',
        projects: ['TinyKernel'],
        proficiency: 42,
      },
      {
        id: 'language-dev',
        name: 'Language Design',
        level: 'Intermediate',
        years: '2 years',
        description: 'Building Demi and exploring compiler tooling.',
        projects: ['Demi'],
        proficiency: 55,
      },
      {
        id: 'security',
        name: 'Security',
        level: 'Intermediate',
        years: '2 years',
        description: 'Pen testing concepts and personal security focus.',
        projects: ['Security tooling'],
        proficiency: 45,
      },
    ],
  },
];
