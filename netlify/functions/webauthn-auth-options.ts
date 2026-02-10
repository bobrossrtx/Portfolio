import { assertAdminEmail, getNetlifyUser } from './_netlify';
import { supabaseFetch } from './_supabase';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

const buildResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event: { headers?: Record<string, string> }) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const user = await getNetlifyUser(authHeader);

  if (!user?.email || !assertAdminEmail(user.email)) {
    return buildResponse(403, { error: 'Not authorized.' });
  }

  const credentialsResponse = await supabaseFetch(
    `/rest/v1/webauthn_credentials?select=credential_id,transports&email=eq.${encodeURIComponent(user.email)}`,
  );

  if (!credentialsResponse.ok) {
    return buildResponse(400, { error: 'No registered passkeys.' });
  }

  const credentials = (await credentialsResponse.json()) as Array<{ credential_id: string; transports: string[] | null }>;

  const options = await generateAuthenticationOptions({
    allowCredentials: credentials.map(cred => ({
      id: cred.credential_id,
      type: 'public-key',
    })),
    userVerification: 'preferred',
  });

  await supabaseFetch('/rest/v1/webauthn_challenges', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      challenge: options.challenge,
      type: 'auth',
    }),
  });

  return buildResponse(200, { options });
};
