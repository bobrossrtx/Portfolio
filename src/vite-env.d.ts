/// <reference types="vite/client" />

declare module '*.wav' {
  const src: string;
  export default src;
}

interface NetlifyIdentityUser {
  email?: string;
  id?: string;
  token?: {
    access_token?: string;
  };
  jwt?: () => Promise<string>;
}

interface NetlifyIdentityAPI {
  on: (event: string, callback: (user?: NetlifyIdentityUser) => void) => void;
  open: (dialog?: 'login' | 'signup') => void;
  close: () => void;
  currentUser: () => NetlifyIdentityUser | null;
  logout: () => void;
}

interface Window {
  netlifyIdentity?: NetlifyIdentityAPI;
}
