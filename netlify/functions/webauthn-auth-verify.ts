import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const buildResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const getRpId = () => {
  const url = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || '';
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
};

export const handler = async (event: { headers?: Record<string, string>; body?: string }) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const user = await getNetlifyUser(authHeader);

  if (!user?.email || !assertAdminEmail(user.email)) {
    return buildResponse(403, { error: 'Not authorized.' });
  }

  const payload = event.body ? JSON.parse(event.body) as { credential: unknown } : null;
  if (!payload?.credential) {
    return buildResponse(400, { error: 'Missing credential.' });
  }

  const challengeRes = await supabaseFetch(
    `/rest/v1/webauthn_challenges?select=id,challenge&email=eq.${encodeURIComponent(user.email)}&type=eq.auth&order=created_at.desc&limit=1`,
  );

  if (!challengeRes.ok) {
    return buildResponse(500, { error: 'Unable to verify passkey.' });
  }

  const challenges = (await challengeRes.json()) as Array<{ id: string; challenge: string }>;
  if (!challenges.length) {
    return buildResponse(400, { error: 'Challenge missing.' });
  }

  const expectedChallenge = challenges[0].challenge;

  const credentialId = (payload.credential as { id?: string })?.id;
  if (!credentialId) {
    return buildResponse(400, { error: 'Credential id missing.' });
  }

  const credentialRes = await supabaseFetch(
    `/rest/v1/webauthn_credentials?select=credential_id,public_key,counter&email=eq.${encodeURIComponent(user.email)}&credential_id=eq.${credentialId}&limit=1`,
  );

  if (!credentialRes.ok) {
    return buildResponse(400, { error: 'Passkey not registered.' });
  }

  const stored = (await credentialRes.json()) as Array<{ credential_id: string; public_key: string; counter: number }>;
  if (!stored.length) {
    return buildResponse(400, { error: 'Passkey not registered.' });
  }

  const verification = await verifyAuthenticationResponse({
    response: payload.credential,
    expectedChallenge,
    expectedOrigin: process.env.URL || 'http://localhost:5173',
    expectedRPID: getRpId(),
    authenticator: {
      credentialID: Buffer.from(stored[0].credential_id, 'base64url'),
      credentialPublicKey: Buffer.from(stored[0].public_key, 'base64url'),
      counter: stored[0].counter,
    },
  });

  if (!verification.verified) {
    return buildResponse(400, { error: 'Passkey verification failed.' });
  }

  await supabaseFetch(`/rest/v1/webauthn_credentials?email=eq.${encodeURIComponent(user.email)}&credential_id=eq.${credentialId}`, {
    method: 'PATCH',
    body: JSON.stringify({ counter: verification.authenticationInfo.newCounter }),
  });

  await supabaseFetch(`/rest/v1/webauthn_challenges?id=eq.${challenges[0].id}`, {
    method: 'DELETE',
  });

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await supabaseFetch('/rest/v1/admin_sessions', {
    method: 'POST',
    body: JSON.stringify({
      id: sessionId,
      email: user.email,
      expires_at: expiresAt,
    }),
  });

  return buildResponse(200, { success: true, sessionId, expiresAt });
};
