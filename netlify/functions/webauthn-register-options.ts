import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { generateRegistrationOptions } from '@simplewebauthn/server';

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

export const handler = async (event: { headers?: Record<string, string> }) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const user = await getNetlifyUser(authHeader);

  if (!user?.email || !assertAdminEmail(user.email)) {
    return buildResponse(403, { error: 'Not authorized.' });
  }

  const credentialsResponse = await supabaseFetch(
    `/rest/v1/webauthn_credentials?select=credential_id,transports&email=eq.${encodeURIComponent(user.email)}`,
  );

  const credentials = credentialsResponse.ok
    ? (await credentialsResponse.json()) as Array<{ credential_id: string; transports: string[] | null }>
    : [];

  const { rpId } = getRpContext(event.headers);
  const options = await generateRegistrationOptions({
    rpName: 'Owen Boreham Portfolio',
    rpID: rpId,
    userID: new TextEncoder().encode(user.email),
    userName: user.email,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'preferred',
      requireResidentKey: false,
    },
    excludeCredentials: credentials.map(cred => ({
      id: cred.credential_id,
      type: 'public-key',
    })),
  });

  await supabaseFetch('/rest/v1/webauthn_challenges', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      challenge: options.challenge,
      type: 'register',
    }),
  });

  return buildResponse(200, { options });
};
