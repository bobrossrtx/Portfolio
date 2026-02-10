type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

const getConfig = (): SupabaseConfig => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return { url, serviceRoleKey };
};

export const supabaseFetch = async (
  path: string,
  options: RequestInit = {},
) => {
  const { url, serviceRoleKey } = getConfig();
  const headers = new Headers(options.headers);
  headers.set('apikey', serviceRoleKey);
  headers.set('Authorization', `Bearer ${serviceRoleKey}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers,
  });

  return response;
};
