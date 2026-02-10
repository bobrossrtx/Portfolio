type NetlifyUser = {
  email?: string;
};

const getIdentityUrl = () => {
  return process.env.URL
    || process.env.DEPLOY_PRIME_URL
    || process.env.SITE_URL
    || '';
};

export const getNetlifyUser = async (authorization: string | undefined) => {
  if (!authorization) return null;
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const baseUrl = getIdentityUrl();
  if (!baseUrl) return null;

  const response = await fetch(`${baseUrl}/.netlify/identity/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const user = (await response.json()) as NetlifyUser;
  return user;
};

export const assertAdminEmail = (email: string | undefined) => {
  const allowed = process.env.ADMIN_NETLIFY_EMAIL?.toLowerCase();
  if (!allowed || !email) return false;
  return email.toLowerCase() === allowed;
};
