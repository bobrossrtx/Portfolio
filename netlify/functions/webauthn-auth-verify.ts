import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const buildResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const getRpContext = (headers?: Record<string, string>) => {
  const forwardedHost = headers?.['x-forwarded-host'] || headers?.host;
  const forwardedProto = headers?.['x-forwarded-proto'] || 'https';
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    return {
      rpId: host.split(':')[0],
      origin: `${forwardedProto}://${host}`,
    };
  }
  const url = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || '';
  try {
    const parsed = new URL(url);
    return { rpId: parsed.hostname, origin: parsed.origin };
  } catch {
    return { rpId: 'localhost', origin: 'http://localhost:5173' };
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

  const stored = (await credentialRes.json()) as Array<{ credential_id: string; public_key: string; counter: number | null } | null>;
  if (!stored.length || !stored[0]) {
    return buildResponse(400, { error: 'Passkey not registered.' });
  }

  const record = stored[0];
  if (!record?.credential_id || !record?.public_key) {
    return buildResponse(400, { error: 'Passkey record incomplete.' });
  }
  const storedCounter = typeof record.counter === 'number' ? record.counter : 0;

  const { rpId, origin } = getRpContext(event.headers);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: payload.credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      requireUserVerification: false,
      credential: {
        id: record.credential_id,
        publicKey: Buffer.from(record.public_key, 'base64url'),
        counter: storedCounter,
      },
    });
  } catch (error) {
    return buildResponse(400, {
      error: error instanceof Error ? error.message : 'Passkey verification failed.',
    });
  }

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
