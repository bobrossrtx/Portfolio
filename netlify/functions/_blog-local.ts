import fs from 'node:fs/promises';
import path from 'node:path';

type LocalBlogPayload = {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  pinned?: boolean;
  publishedAt?: string;
};

const postsDir = path.join(process.cwd(), 'src', 'data', 'blog-posts');

export const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
};

const buildFrontmatter = (payload: LocalBlogPayload) => {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`title: "${payload.title}"`);
  lines.push(`date: "${payload.publishedAt ?? new Date().toISOString().slice(0, 10)}"`);
  if (payload.author) {
    lines.push(`author: "${payload.author}"`);
  }
  if (payload.tags?.length) {
    lines.push('tags:');
    payload.tags.forEach(tag => {
      lines.push(`  - "${tag}"`);
    });
  }
  if (payload.excerpt) {
    lines.push(`excerpt: "${payload.excerpt}"`);
  }
  if (payload.readTime) {
    lines.push(`readTime: "${payload.readTime}"`);
  }
  lines.push(`pinned: ${payload.pinned ? 'true' : 'false'}`);
  lines.push('---');
  lines.push('');
  return lines.join('\n');
};

export const writeLocalPost = async (payload: LocalBlogPayload, existingSlug?: string) => {
  const slug = payload.slug?.trim() || slugify(payload.title);
  await fs.mkdir(postsDir, { recursive: true });
  const frontmatter = buildFrontmatter(payload);
  const body = payload.content.trim();
  const fileContents = `${frontmatter}${body ? body + '\n' : ''}`;
  const newPath = path.join(postsDir, `${slug}.md`);
  await fs.writeFile(newPath, fileContents, 'utf8');

  if (existingSlug && existingSlug !== slug) {
    const oldPath = path.join(postsDir, `${existingSlug}.md`);
    try {
      await fs.unlink(oldPath);
    } catch {
      // Ignore missing files when renaming.
    }
  }

  return { slug };
};

export const deleteLocalPost = async (slug: string) => {
  const filePath = path.join(postsDir, `${slug}.md`);
  await fs.unlink(filePath);
};
