import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

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
  try {
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
      const errorText = await challengeRes.text();
      return buildResponse(500, { error: errorText || 'Unable to verify passkey.' });
    }

    const challenges = (await challengeRes.json()) as Array<{ id: string; challenge: string }>;
    if (!challenges.length) {
      return buildResponse(400, { error: 'Challenge missing.' });
    }

    const expectedChallenge = challenges[0].challenge;
    const { rpId, origin } = getRpContext(event.headers);
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: payload.credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        requireUserVerification: false,
      });
    } catch (error) {
      return buildResponse(400, {
        error: error instanceof Error ? error.message : 'Passkey verification failed.',
      });
    }

    if (!verification.verified || !verification.registrationInfo) {
      return buildResponse(400, { error: 'Passkey verification failed.' });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const credentialId = Buffer.from(credentialID).toString('base64url');
    const publicKey = Buffer.from(credentialPublicKey).toString('base64url');

    const insertRes = await supabaseFetch('/rest/v1/webauthn_credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        credential_id: credentialId,
        public_key: publicKey,
        counter,
        transports: (payload.credential as { transports?: string[] })?.transports ?? [],
      }),
    });

    if (!insertRes.ok) {
      const errorText = await insertRes.text();
      return buildResponse(500, { error: errorText || 'Unable to store passkey.' });
    }

    const deleteRes = await supabaseFetch(`/rest/v1/webauthn_challenges?id=eq.${challenges[0].id}`, {
      method: 'DELETE',
    });

    if (!deleteRes.ok) {
      const errorText = await deleteRes.text();
      return buildResponse(500, { error: errorText || 'Unable to clean up challenge.' });
    }

    return buildResponse(200, { success: true });
  } catch (error) {
    return buildResponse(500, {
      error: error instanceof Error ? error.message : 'Unexpected error during passkey registration.',
    });
  }
};
