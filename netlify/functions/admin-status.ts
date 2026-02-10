import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';

const buildResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event: { headers?: Record<string, string> }) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const user = await getNetlifyUser(authHeader);

  if (!user?.email || !assertAdminEmail(user.email)) {
    return buildResponse(403, { allowed: false, hasPasskey: false });
  }

  const response = await supabaseFetch(
    `/rest/v1/webauthn_credentials?select=id&email=eq.${encodeURIComponent(user.email)}&limit=1`,
  );

  if (!response.ok) {
    return buildResponse(200, { allowed: true, hasPasskey: false });
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return buildResponse(200, { allowed: true, hasPasskey: rows.length > 0 });
};
