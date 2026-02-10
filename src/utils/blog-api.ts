import { getBlogPosts } from './blog';

export type BlogPostRecord = {
  id?: string;
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

type BlogApiResponse = {
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    tags: string[] | null;
    author: string | null;
    read_time: string | null;
    pinned: boolean | null;
    published_at: string | null;
    content: string;
  }>;
};

export const fetchBlogPosts = async (): Promise<BlogPostRecord[]> => {
  if (import.meta.env.DEV) {
    return getBlogPosts();
  }
  try {
    const response = await fetch('/api/blog-posts');
    if (!response.ok) throw new Error('Failed to load posts');
    const payload = (await response.json()) as BlogApiResponse;
    if (!Array.isArray(payload.posts)) throw new Error('Invalid blog payload');
    return payload.posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      date: post.published_at ?? '1970-01-01',
      author: post.author ?? undefined,
      tags: post.tags ?? [],
      excerpt: post.excerpt ?? '',
      readTime: post.read_time ?? undefined,
      pinned: post.pinned ?? false,
      content: post.content,
    }));
  } catch {
    return getBlogPosts();
  }
};
