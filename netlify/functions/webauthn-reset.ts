import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';

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

export const handler = async (event: { headers?: Record<string, string> }) => {
  const sessionId = event.headers?.['x-admin-session'] || event.headers?.['X-Admin-Session'];
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const user = await getNetlifyUser(authHeader);

  if (!user?.email || !assertAdminEmail(user.email)) {
    return buildResponse(403, { error: 'Not authorized.' });
  }

  const hasSession = await verifySession(user.email, sessionId);
  if (!hasSession) {
    return buildResponse(401, { error: 'Passkey verification required.' });
  }

  const encodedEmail = encodeURIComponent(user.email);
  const deleteCredentials = await supabaseFetch(`/rest/v1/webauthn_credentials?email=eq.${encodedEmail}`, {
    method: 'DELETE',
  });

  if (!deleteCredentials.ok) {
    const errorText = await deleteCredentials.text();
    return buildResponse(500, { error: errorText || 'Unable to reset passkeys.' });
  }

  const deleteChallenges = await supabaseFetch(`/rest/v1/webauthn_challenges?email=eq.${encodedEmail}`, {
    method: 'DELETE',
  });

  if (!deleteChallenges.ok) {
    const errorText = await deleteChallenges.text();
    return buildResponse(500, { error: errorText || 'Unable to reset passkeys.' });
  }

  const deleteSessions = await supabaseFetch(`/rest/v1/admin_sessions?email=eq.${encodedEmail}`, {
    method: 'DELETE',
  });

  if (!deleteSessions.ok) {
    const errorText = await deleteSessions.text();
    return buildResponse(500, { error: errorText || 'Unable to reset passkeys.' });
  }

  return buildResponse(200, { success: true });
};
