import { supabaseFetch } from './_supabase';

const buildResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, s-maxage=300',
  },
  body: JSON.stringify(body),
});

export const handler = async () => {
  const response = await supabaseFetch(
    '/rest/v1/blog_posts?select=id,slug,title,excerpt,tags,author,read_time,pinned,published_at,content&order=pinned.desc,published_at.desc',
  );

  if (!response.ok) {
    return buildResponse(500, { error: 'Unable to load posts.' });
  }

  const posts = await response.json();
  return buildResponse(200, { posts });
};
