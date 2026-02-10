import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { generateRegistrationOptions } from '@simplewebauthn/server';

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

  const options = await generateRegistrationOptions({
    rpName: 'Owen Boreham Portfolio',
    rpID: getRpId(),
    userID: new TextEncoder().encode(user.email),
    userName: user.email,
    attestationType: 'none',
    excludeCredentials: credentials.map(cred => ({
      id: Buffer.from(cred.credential_id, 'base64url'),
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
