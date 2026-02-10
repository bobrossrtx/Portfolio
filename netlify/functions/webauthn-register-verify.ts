import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

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
    `/rest/v1/webauthn_challenges?select=id,challenge&email=eq.${encodeURIComponent(user.email)}&type=eq.register&order=created_at.desc&limit=1`,
  );

  if (!challengeRes.ok) {
    return buildResponse(500, { error: 'Unable to verify passkey.' });
  }

  const challenges = (await challengeRes.json()) as Array<{ id: string; challenge: string }>;
  if (!challenges.length) {
    return buildResponse(400, { error: 'Challenge missing.' });
  }

  const expectedChallenge = challenges[0].challenge;
  const verification = await verifyRegistrationResponse({
    response: payload.credential,
    expectedChallenge,
    expectedOrigin: process.env.URL || 'http://localhost:5173',
    expectedRPID: getRpId(),
  });

  if (!verification.verified || !verification.registrationInfo) {
    return buildResponse(400, { error: 'Passkey verification failed.' });
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
  const credentialId = Buffer.from(credentialID).toString('base64url');
  const publicKey = Buffer.from(credentialPublicKey).toString('base64url');

  await supabaseFetch('/rest/v1/webauthn_credentials', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      credential_id: credentialId,
      public_key: publicKey,
      counter,
      transports: (payload.credential as { transports?: string[] })?.transports ?? [],
    }),
  });

  await supabaseFetch(`/rest/v1/webauthn_challenges?id=eq.${challenges[0].id}`, {
    method: 'DELETE',
  });

  return buildResponse(200, { success: true });
};
