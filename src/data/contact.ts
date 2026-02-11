export type ContactSocial = {
  id: 'github' | 'linkedin' | 'email' | 'x' | 'discord';
  label: string;
  href?: string;
  note?: string;
};

export const contactConfig: {
  heading: string;
  intro: string;
  availability: string;
  socials: ContactSocial[];
} = {
  heading: "Let's Build Something Together",
  intro:
    "Got an idea, a collaboration, or just want to talk systems and sound design? Send me a message and I’ll get back to you.",
  availability: 'Open to collaboration and freelance',
  socials: [
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/bobrossrtx',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      note: 'Not available yet',
    },
    {
      id: 'email',
      label: 'Email',
      href: 'mailto:bobrossrtx@gmail.com',
    },
    {
      id: 'x',
      label: 'Twitter / X',
      href: 'https://x.com/bobrossrtx',
    },
    {
      id: 'discord',
      label: 'Discord',
      href: 'https://discord.gg/KDm5dtyDxs',
      note: 'Join the Discord community',
    },
  ],
};
