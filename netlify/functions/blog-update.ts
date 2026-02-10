import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { slugify, writeLocalPost } from './_blog-local';

type BlogUpdatePayload = {
  id: string;
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

const buildResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const verifySession = async (email: string, sessionId: string | undefined) => {
  if (!sessionId) return false;
  if (sessionId === 'dev' && process.env.NODE_ENV !== 'production') return true;
  const response = await supabaseFetch(
    `/rest/v1/admin_sessions?select=id,expires_at&email=eq.${encodeURIComponent(email)}&id=eq.${sessionId}&limit=1`,
  );

  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ expires_at: string }>;
  if (!rows.length) return false;
  return new Date(rows[0].expires_at).getTime() > Date.now();
};

export const handler = async (event: { headers?: Record<string, string>; body?: string }) => {
  const sessionId = event.headers?.['x-admin-session'] || event.headers?.['X-Admin-Session'];
  const isDevBypass = sessionId === 'dev' && process.env.NODE_ENV !== 'production';
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const user = isDevBypass ? { email: process.env.ADMIN_NETLIFY_EMAIL ?? 'dev@local' } : await getNetlifyUser(authHeader);

  if (!user?.email || !assertAdminEmail(user.email)) {
    return buildResponse(403, { error: 'Not authorized.' });
  }

  const hasSession = await verifySession(user.email, sessionId);
  if (!hasSession) {
    return buildResponse(401, { error: 'Passkey verification required.' });
  }

  const payload = event.body ? (JSON.parse(event.body) as BlogUpdatePayload) : null;
  if (!payload?.id || !payload?.title || !payload?.content) {
    return buildResponse(400, { error: 'Post id, title, and content are required.' });
  }

  const slug = payload.slug?.trim() || slugify(payload.title);
  const excerpt = payload.excerpt?.trim() || payload.content.slice(0, 160);

  // Always try DB first
  const response = await supabaseFetch(`/rest/v1/blog_posts?id=eq.${payload.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      slug,
      title: payload.title.trim(),
      content: payload.content,
      excerpt,
      tags: payload.tags ?? [],
      author: payload.author?.trim() || user.email,
      read_time: payload.readTime?.trim() || null,
      pinned: payload.pinned ?? false,
      published_at: payload.publishedAt ?? new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }),
  });

  if (response.ok) {
    return buildResponse(200, { success: true, slug });
  }

  // fallback to local only in dev
  if (process.env.NODE_ENV !== 'production') {
    const result = await writeLocalPost({
      title: payload.title.trim(),
      slug,
      content: payload.content,
      excerpt,
      tags: payload.tags ?? [],
      author: payload.author?.trim() || user.email,
      readTime: payload.readTime?.trim() || undefined,
      pinned: payload.pinned ?? false,
      publishedAt: payload.publishedAt ?? new Date().toISOString().slice(0, 10),
    }, payload.id);
    return buildResponse(200, { success: true, slug: result.slug, fallback: true });
  }
  const error = await response.text();
  return buildResponse(500, { error: error || 'Unable to update post.' });
};
