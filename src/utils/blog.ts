type BlogFrontmatter = {
  title?: string;
  date?: string;
  author?: string;
  tags?: string[];
  excerpt?: string;
  readTime?: string;
  pinned?: boolean;
};

type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author?: string;
  tags: string[];
  excerpt: string;
  readTime?: string;
  pinned: boolean;
  content: string;
};

const parseFrontmatter = (raw: string) => {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*/);
  if (!match) {
    return { frontmatter: {}, body: raw.trim() } as {
      frontmatter: BlogFrontmatter;
      body: string;
    };
  }

  const frontmatterRaw = match[1];
  const body = raw.slice(match[0].length).trim();
  const lines = frontmatterRaw.split('\n');
  const frontmatter: BlogFrontmatter = {};
  let currentKey: keyof BlogFrontmatter | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('- ') && currentKey === 'tags') {
      const value = trimmed.slice(2).trim().replace(/^"|"$/g, '');
      frontmatter.tags = [...(frontmatter.tags ?? []), value];
      continue;
    }

    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      const key = parts.shift()!.trim();
      const value = parts.join(':').trim().replace(/^"|"$/g, '');

      if (key === 'tags') {
        currentKey = 'tags';
        frontmatter.tags = [];
        continue;
      }

      currentKey = null;
      if (key === 'title') frontmatter.title = value;
      if (key === 'date') frontmatter.date = value;
      if (key === 'author') frontmatter.author = value;
      if (key === 'excerpt') frontmatter.excerpt = value;
      if (key === 'readTime') frontmatter.readTime = value;
      if (key === 'pinned') frontmatter.pinned = value.toLowerCase() === 'true';
    }
  }

  return { frontmatter, body } as {
    frontmatter: BlogFrontmatter;
    body: string;
  };
};

const postModules = import.meta.glob('../data/blog-posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export const getBlogPosts = (): BlogPost[] => {
  return Object.entries(postModules)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()?.replace('.md', '') ?? 'post';
      const { frontmatter, body } = parseFrontmatter(raw as string);
      const date = frontmatter.date ?? '1970-01-01';

      return {
        slug,
        title: frontmatter.title ?? slug.replace(/-/g, ' '),
        date,
        author: frontmatter.author,
        tags: frontmatter.tags ?? [],
        excerpt: frontmatter.excerpt ?? '',
        readTime: frontmatter.readTime,
        pinned: frontmatter.pinned ?? false,
        content: body,
      };
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.date);
      const bTime = Date.parse(b.date);
      return bTime - aTime;
    });
};

export type { BlogPost };
