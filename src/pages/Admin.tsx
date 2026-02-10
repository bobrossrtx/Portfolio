import { useEffect, useMemo, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import './Admin.scss';

type AdminState = {
  ready: boolean;
  userEmail: string | null;
  accessToken: string | null;
  allowed: boolean;
  hasPasskey: boolean;
  sessionId: string | null;
  status: string | null;
  error: string | null;
  isBusy: boolean;
  isCheckingAccess: boolean;
};

type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  tags: string;
  content: string;
  readTime: string;
  pinned: boolean;
  publishedAt: string;
};

const Admin = () => {
  const [state, setState] = useState<AdminState>({
    ready: false,
    userEmail: null,
    accessToken: null,
    allowed: false,
    hasPasskey: false,
    sessionId: sessionStorage.getItem('adminSessionId'),
    status: null,
    error: null,
    isBusy: false,
    isCheckingAccess: false,
  });
  const [form, setForm] = useState<BlogFormState>({
    title: '',
    slug: '',
    excerpt: '',
    tags: '',
    content: '',
    readTime: '',
    pinned: false,
    publishedAt: '',
  });

  const isVerified = Boolean(state.sessionId);
  const canManage = state.allowed && isVerified;

  const tagList = useMemo(() => {
    return form.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }, [form.tags]);

  const setStatus = (status: string | null, error: string | null = null) => {
    setState(current => ({ ...current, status, error }));
  };

  const setBusy = (isBusy: boolean) => {
    setState(current => ({ ...current, isBusy }));
  };

  const resolveAccessToken = async (identityUser?: { token?: { access_token?: string }; jwt?: () => Promise<string> } | null) => {
    const accessToken = identityUser?.token?.access_token ?? null;
    if (accessToken) return accessToken;
    if (identityUser?.jwt) {
      try {
        return await identityUser.jwt();
      } catch {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const identity = window.netlifyIdentity;
    if (!identity) {
      setState(current => ({
        ...current,
        ready: true,
        userEmail: null,
        accessToken: null,
        allowed: false,
        hasPasskey: false,
        status: null,
        error: null,
      }));
      return;
    }

    const hydrateUser = async (user?: { email?: string; token?: { access_token?: string }; jwt?: () => Promise<string> } | null) => {
      const currentUser = user ?? identity.currentUser();
      const accessToken = await resolveAccessToken(currentUser ?? null);

      setState({
        ready: true,
        userEmail: currentUser?.email ?? null,
        accessToken,
        allowed: false,
        hasPasskey: false,
        sessionId: sessionStorage.getItem('adminSessionId'),
        status: null,
        error: null,
        isBusy: false,
        isCheckingAccess: false,
      });
    };

    const updateUser = (user?: { email?: string } | null) => {
      void hydrateUser(user);
    };

    identity.on('init', updateUser);
    identity.on('login', updateUser);
    identity.on('logout', () => updateUser(null));

    updateUser(identity.currentUser());
  }, []);

  useEffect(() => {
    const run = async () => {
      if (import.meta.env.DEV && state.accessToken === 'dev') {
        setState(current => ({
          ...current,
          allowed: true,
          hasPasskey: true,
        }));
        return;
      }
      if (!state.userEmail) return;
      if (!state.accessToken) {
        const identityUser = window.netlifyIdentity?.currentUser();
        if (!identityUser) return;
        const accessToken = await resolveAccessToken(identityUser);
        if (!accessToken) return;
        setState(current => ({ ...current, accessToken, isCheckingAccess: true }));
        return;
      }
      try {
        setState(current => ({ ...current, isCheckingAccess: true }));
        const response = await fetch('/api/admin-status', {
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
          },
        });
        const payload = (await response.json()) as { allowed: boolean; hasPasskey: boolean };
        setState(current => ({
          ...current,
          allowed: payload.allowed,
          hasPasskey: payload.hasPasskey,
          isCheckingAccess: false,
        }));
      } catch {
        setState(current => ({
          ...current,
          allowed: false,
          hasPasskey: false,
          isCheckingAccess: false,
        }));
      }
    };

    run();
  }, [state.accessToken, state.userEmail]);

  const handleLogin = () => {
    if (import.meta.env.DEV) {
      sessionStorage.setItem('adminSessionId', 'dev');
      setState(current => ({
        ...current,
        ready: true,
        userEmail: current.userEmail ?? 'dev@local',
        accessToken: current.accessToken ?? 'dev',
        allowed: true,
        hasPasskey: true,
        sessionId: 'dev',
        isCheckingAccess: false,
      }));
      setStatus('Dev mode login enabled.', null);
      return;
    }
    window.netlifyIdentity?.open('login');
  };

  const handleLogout = () => {
    window.netlifyIdentity?.logout();
    sessionStorage.removeItem('adminSessionId');
    setState(current => ({ ...current, sessionId: null }));
  };

  const handleRegisterPasskey = async () => {
    if (!state.accessToken) return;
    setBusy(true);
    setStatus('Starting passkey registration...', null);

    try {
      const optionsResponse = await fetch('/api/webauthn-register-options', {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      });
      const { options, error } = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(error ?? 'Unable to register passkey.');

      const credential = await startRegistration(options);
      const verifyResponse = await fetch('/api/webauthn-register-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({ credential }),
      });
      const verifyPayload = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyPayload.error ?? 'Passkey verification failed.');

      setState(current => ({ ...current, hasPasskey: true }));
      setStatus('Passkey registered. You can now verify to unlock admin tools.', null);
    } catch (error) {
      const message = error instanceof Error
        ? error.name === 'NotAllowedError'
          ? 'Passkey creation failed.'
          : error.message
        : 'Passkey creation failed.';
      setStatus(null, message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPasskey = async () => {
    if (!state.accessToken) return;
    setBusy(true);
    setStatus('Waiting for passkey...', null);

    try {
      const optionsResponse = await fetch('/api/webauthn-auth-options', {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      });
      const { options, error } = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(error ?? 'Unable to verify passkey.');

      const credential = await startAuthentication(options);
      const verifyResponse = await fetch('/api/webauthn-auth-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({ credential }),
      });
      const payload = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(payload.error ?? 'Passkey verification failed.');

      sessionStorage.setItem('adminSessionId', payload.sessionId);
      setState(current => ({ ...current, sessionId: payload.sessionId }));
      setStatus('Passkey verified. Admin tools unlocked.', null);
    } catch (error) {
      setStatus(null, error instanceof Error ? error.message : 'Passkey verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDevBypass = () => {
    sessionStorage.setItem('adminSessionId', 'dev');
    setState(current => ({ ...current, sessionId: 'dev' }));
    setStatus('Dev bypass enabled.', null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.accessToken) return;

    setBusy(true);
    setStatus('Publishing post...', null);

    try {
      const response = await fetch('/api/blog-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.accessToken}`,
          'X-Admin-Session': state.sessionId ?? '',
        },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt || undefined,
          tags: tagList,
          content: form.content,
          readTime: form.readTime || undefined,
          pinned: form.pinned,
          publishedAt: form.publishedAt || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to publish post.');

      setForm({
        title: '',
        slug: '',
        excerpt: '',
        tags: '',
        content: '',
        readTime: '',
        pinned: false,
        publishedAt: '',
      });
      setStatus(`Post published (${payload.slug}).`, null);
    } catch (error) {
      setStatus(null, error instanceof Error ? error.message : 'Unable to publish post.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin" aria-labelledby="admin-title">
      <div className="admin__card">
        <p className="admin__eyebrow">Admin</p>
        <h1 id="admin-title">Private controls</h1>
        <p className="admin__lead">
          Sign in with Netlify Identity to unlock admin-only tools.
        </p>

        {!state.ready && (
          <p className="admin__status">Checking authentication...</p>
        )}

        {state.ready && !state.userEmail && (
          <div className="admin__actions">
            <button className="btn btn--primary" type="button" onClick={handleLogin}>
              Admin login
            </button>
            <p className="admin__note">
              Only you should have access. We'll add passkeys next.
            </p>
          </div>
        )}

        {state.ready && state.userEmail && (
          <div className="admin__panel">
            <div className="admin__user">
              <span className="admin__label">Signed in as</span>
              <span className="admin__value">{state.userEmail}</span>
            </div>

            {state.isCheckingAccess && (
              <div className="admin__alert admin__alert--neutral">
                <p>Checking admin access...</p>
              </div>
            )}

            {!state.allowed && !state.isCheckingAccess && (
              <div className="admin__alert">
                <p>This account is not allowlisted for admin access.</p>
              </div>
            )}

            {state.allowed && !state.isCheckingAccess && (
              <div className="admin__passkey">
                <p className="admin__label">Passkey verification</p>
                <div className="admin__actions">
                  {!state.hasPasskey && (
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={handleRegisterPasskey}
                      disabled={state.isBusy}
                    >
                      Register passkey
                    </button>
                  )}
                  {state.hasPasskey && (
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={handleVerifyPasskey}
                      disabled={state.isBusy}
                    >
                      Verify passkey
                    </button>
                  )}
                  {import.meta.env.DEV && (
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={handleDevBypass}
                      disabled={state.isBusy}
                    >
                      Dev bypass
                    </button>
                  )}
                </div>
                {import.meta.env.DEV && state.sessionId === 'dev' && (
                  <p className="admin__note">Dev bypass enabled (local only).</p>
                )}
              </div>
            )}

            {canManage && (
              <form className="admin__form" onSubmit={handleSubmit}>
                <div className="admin__grid">
                  <label className="admin__field">
                    <span>Title</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="admin__field">
                    <span>Slug (optional)</span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={event => setForm(current => ({ ...current, slug: event.target.value }))}
                    />
                  </label>
                </div>
                <label className="admin__field">
                  <span>Excerpt</span>
                  <textarea
                    rows={3}
                    value={form.excerpt}
                    onChange={event => setForm(current => ({ ...current, excerpt: event.target.value }))}
                  />
                </label>
                <label className="admin__field">
                  <span>Tags (comma-separated)</span>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={event => setForm(current => ({ ...current, tags: event.target.value }))}
                  />
                </label>
                <label className="admin__field">
                  <span>Content (Markdown)</span>
                  <textarea
                    rows={10}
                    value={form.content}
                    onChange={event => setForm(current => ({ ...current, content: event.target.value }))}
                    required
                  />
                </label>
                <div className="admin__grid">
                  <label className="admin__field">
                    <span>Read time</span>
                    <input
                      type="text"
                      value={form.readTime}
                      onChange={event => setForm(current => ({ ...current, readTime: event.target.value }))}
                    />
                  </label>
                  <label className="admin__field">
                    <span>Publish date</span>
                    <input
                      type="date"
                      value={form.publishedAt}
                      onChange={event => setForm(current => ({ ...current, publishedAt: event.target.value }))}
                    />
                  </label>
                </div>
                <label className="admin__checkbox">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={event => setForm(current => ({ ...current, pinned: event.target.checked }))}
                  />
                  <span>Pin this post</span>
                </label>
                <button className="btn btn--primary" type="submit" disabled={state.isBusy}>
                  Publish post
                </button>
              </form>
            )}

            <button className="btn btn--ghost" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}

        {(state.status || state.error) && (
          <p className={`admin__status ${state.error ? 'is-error' : ''}`}>
            {state.error ?? state.status}
          </p>
        )}
      </div>
    </section>
  );
};

export default Admin;
