export type EducationEntry = {
  id: string;
  title: string;
  institution: string;
  timeframe: string;
  status: 'Completed' | 'In Progress';
  highlights: string[];
};

export const educationEntries: EducationEntry[] = [
  {
    id: 'it-digital-skills-2024',
    title: 'Level 2 Diploma in IT and Digital Skills',
    institution: 'EKC Ashford College',
    timeframe: '2024',
    status: 'Completed',
    highlights: [
      'Built a solid foundation in core IT concepts and practical digital skills.',
      'Focused on problem-solving, structured learning, and consistent delivery.',
    ],
  },
  {
    id: 'machining-welding-2025',
    title: 'Level 2 Diploma in Machining and Welding (Engineering)',
    institution: 'East Sussex College',
    timeframe: '2025',
    status: 'Completed',
    highlights: [
      'Hands-on engineering background that influences how I approach systems and reliability.',
      'Comfortable working to constraints, tolerances, and real-world tradeoffs.',
    ],
  },
  {
    id: 'tlevel-it-programming-2026',
    title: 'T-Level Certification in IT and Programming',
    institution: 'East Sussex College',
    timeframe: '2026–2027',
    status: 'In Progress',
    highlights: [
      'Doubling down on software engineering, programming, and building production-ready skills.',
      'Actively working towards a stronger, more specialized career in tech.',
    ],
  },
];
