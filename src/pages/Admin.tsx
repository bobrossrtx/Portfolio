import { useEffect, useMemo, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import './Admin.scss';

type AdminState = {
  ready: boolean;
  userEmail: string | null;
  userName: string | null;
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

type AccountFormState = {
  displayName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type RegisterFormState = {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

type AdminPanel = 'dashboard' | 'blog' | 'account';

const Admin = () => {
  const storedSessionId = sessionStorage.getItem('adminSessionId');
  const storedAccessToken = sessionStorage.getItem('adminAccessToken');
  const storedUserEmail = sessionStorage.getItem('adminUserEmail');
  const storedUserName = sessionStorage.getItem('adminUserName');
  const [state, setState] = useState<AdminState>({
    ready: false,
    userEmail: storedUserEmail,
    userName: storedUserName,
    accessToken: storedAccessToken,
    allowed: false,
    hasPasskey: false,
    sessionId: storedSessionId,
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
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    displayName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [activePanel, setActivePanel] = useState<AdminPanel>('dashboard');
  const [authPanel, setAuthPanel] = useState<'login' | 'register'>('login');
  const [devBypassEnabled, setDevBypassEnabled] = useState(
    import.meta.env.DEV ? localStorage.getItem('adminDevBypass') === 'true' : false,
  );

  const isVerified = Boolean(state.sessionId);
  const canManage = state.allowed && isVerified;

  useEffect(() => {
    if (!canManage) {
      setActivePanel('dashboard');
    }
  }, [canManage]);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      localStorage.removeItem('adminDevBypass');
      setDevBypassEnabled(false);
    }
  }, []);

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

  const persistIdentity = (email: string | null, name: string | null, token: string | null) => {
    if (email) {
      sessionStorage.setItem('adminUserEmail', email);
    } else {
      sessionStorage.removeItem('adminUserEmail');
    }
    if (name) {
      sessionStorage.setItem('adminUserName', name);
    } else {
      sessionStorage.removeItem('adminUserName');
    }
    if (token && token !== 'dev') {
      sessionStorage.setItem('adminAccessToken', token);
    } else {
      sessionStorage.removeItem('adminAccessToken');
    }
  };

  const isDevBypassActive = () => {
    return Boolean(import.meta.env.DEV && localStorage.getItem('adminDevBypass') === 'true');
  };

  const enableDevSession = (message?: string) => {
    if (!import.meta.env.DEV) return;
    sessionStorage.setItem('adminSessionId', 'dev');
    persistIdentity('dev@local', 'Dev Admin', null);
    setState(current => ({
      ...current,
      ready: true,
      userEmail: current.userEmail ?? 'dev@local',
      userName: current.userName ?? 'Dev Admin',
      accessToken: 'dev',
      allowed: true,
      hasPasskey: true,
      sessionId: 'dev',
      isCheckingAccess: false,
    }));
    if (message) setStatus(message, null);
  };

  const setDevBypassPreference = (enabled: boolean, message?: string) => {
    if (!import.meta.env.DEV) return;
    if (enabled) {
      localStorage.setItem('adminDevBypass', 'true');
      setDevBypassEnabled(true);
      enableDevSession(message);
      return;
    }
    localStorage.removeItem('adminDevBypass');
    setDevBypassEnabled(false);
    if (message) setStatus(message, null);
  };

  const getDisplayName = (identityUser?: { user_metadata?: { full_name?: string; name?: string; username?: string } } | null) => {
    const metadata = identityUser?.user_metadata;
    return metadata?.full_name ?? metadata?.name ?? metadata?.username ?? '';
  };

  const updateIdentityUser = async (identityUser: unknown, data: Record<string, unknown>) => {
    const updater = (identityUser as { update?: (data: Record<string, unknown>, callback?: (error?: { message?: string }) => void) => Promise<unknown> | void })?.update;
    if (!updater) throw new Error('Identity update unavailable.');
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: { message?: string }) => {
        if (settled) return;
        settled = true;
        if (error) {
          reject(new Error(error.message ?? 'Unable to update account.'));
        } else {
          resolve();
        }
      };
      const maybePromise = updater(data, finish);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
        (maybePromise as Promise<unknown>)
          .then(() => finish())
          .catch(error => finish({ message: error instanceof Error ? error.message : 'Unable to update account.' }));
      }
    });
  };

  const loginIdentityUser = async (email: string, password: string) => {
    const identity = window.netlifyIdentity as unknown as { login?: (email: string, password: string, remember: boolean, callback?: (error?: { message?: string }, result?: unknown) => void) => Promise<unknown> | void } | undefined;
    if (!identity?.login) throw new Error('Identity login unavailable.');
    const user = await new Promise<unknown>((resolve, reject) => {
      let settled = false;
      const finish = (error?: { message?: string }, result?: unknown) => {
        if (settled) return;
        settled = true;
        if (error) {
          reject(new Error(error.message ?? 'Unable to verify password.'));
        } else {
          resolve(result);
        }
      };
      const maybePromise = identity.login?.(email, password, true, finish);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
        (maybePromise as Promise<unknown>)
          .then(result => finish(undefined, result))
          .catch(error => finish({ message: error instanceof Error ? error.message : 'Unable to verify password.' }));
      }
    });
    return user as { delete?: (callback?: (error?: { message?: string }) => void) => Promise<unknown> | void } | null;
  };

  const deleteIdentityUser = async (identityUser: unknown) => {
    const deleter = (identityUser as { delete?: (callback?: (error?: { message?: string }) => void) => Promise<unknown> | void })?.delete;
    if (!deleter) throw new Error('Identity delete unavailable.');
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: { message?: string }) => {
        if (settled) return;
        settled = true;
        if (error) {
          reject(new Error(error.message ?? 'Unable to delete account.'));
        } else {
          resolve();
        }
      };
      const maybePromise = deleter(finish);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
        (maybePromise as Promise<unknown>)
          .then(() => finish())
          .catch(error => finish({ message: error instanceof Error ? error.message : 'Unable to delete account.' }));
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const hydrateFromToken = async (token: string) => {
      try {
        const response = await fetch('/.netlify/identity/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return false;
        const user = (await response.json()) as {
          email?: string;
          user_metadata?: { full_name?: string; name?: string; username?: string };
        };
        if (!user?.email) return false;

        const displayName = getDisplayName(user ?? null);
        setState({
          ready: true,
          userEmail: user.email,
          userName: displayName || null,
          accessToken: token,
          allowed: false,
          hasPasskey: false,
          sessionId: sessionStorage.getItem('adminSessionId'),
          status: null,
          error: null,
          isBusy: false,
          isCheckingAccess: false,
        });
        persistIdentity(user.email, displayName || null, token);
        setAccountForm(current => ({
          ...current,
          displayName,
        }));
        return true;
      } catch {
        return false;
      }
    };

    const hydrateUser = async (
      identity: { currentUser?: () => { email?: string; token?: { access_token?: string }; jwt?: () => Promise<string>; user_metadata?: { full_name?: string; name?: string; username?: string } } | null },
      user?: { email?: string; token?: { access_token?: string }; jwt?: () => Promise<string>; user_metadata?: { full_name?: string; name?: string; username?: string } } | null,
    ) => {
      if (cancelled) return;
      const currentUser = user ?? identity.currentUser?.() ?? null;
      const accessToken = await resolveAccessToken(currentUser ?? null);
      const displayName = getDisplayName(currentUser ?? null);

      if (cancelled) return;
      setState({
        ready: true,
        userEmail: currentUser?.email ?? null,
        userName: displayName || null,
        accessToken,
        allowed: false,
        hasPasskey: false,
        sessionId: sessionStorage.getItem('adminSessionId'),
        status: null,
        error: null,
        isBusy: false,
        isCheckingAccess: false,
      });
      persistIdentity(currentUser?.email ?? null, displayName || null, accessToken);
      setAccountForm(current => ({
        ...current,
        displayName,
      }));
    };

    const initIdentity = () => {
      if (cancelled) return;
      const identity = window.netlifyIdentity as unknown as {
        currentUser?: () => { email?: string; token?: { access_token?: string }; jwt?: () => Promise<string>; user_metadata?: { full_name?: string; name?: string; username?: string } } | null;
        on?: (event: string, handler: (user?: { email?: string } | null) => void) => void;
        init?: () => void;
      } | undefined;
      if (!identity) {
        attempts += 1;
        if (attempts <= 12) {
          window.setTimeout(initIdentity, 250);
        } else {
          if (sessionStorage.getItem('adminAccessToken') || isDevBypassActive()) return;
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
          persistIdentity(null, null, null);
        }
        return;
      }

      const retryHydrate = (remaining: number) => {
        if (cancelled) return;
        const existingUser = identity.currentUser?.() ?? null;
        if (existingUser) {
          void hydrateUser(identity, existingUser);
          return;
        }
        if (remaining <= 0) {
          if (sessionStorage.getItem('adminAccessToken') || isDevBypassActive()) return;
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
        window.setTimeout(() => retryHydrate(remaining - 1), 250);
      };

      const updateUser = (user?: { email?: string } | null) => {
        if (user) {
          void hydrateUser(identity, user);
          return;
        }
        retryHydrate(8);
      };

      identity.on?.('init', updateUser);
      identity.on?.('login', updateUser);
      identity.on?.('logout', () => updateUser(null));

      identity.init?.();
      retryHydrate(8);
    };

    const boot = async () => {
      if (isDevBypassActive()) {
        enableDevSession();
      }
      const storedToken = sessionStorage.getItem('adminAccessToken');
      if (storedToken) {
        const hydrated = await hydrateFromToken(storedToken);
        if (!hydrated) {
          persistIdentity(null, null, null);
        }
      }
      initIdentity();
    };

    void boot();

    return () => {
      cancelled = true;
    };
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
      enableDevSession('Dev mode login enabled.');
      return;
    }
    window.netlifyIdentity?.open('login');
  };

  const handleOpenRegister = () => {
    setAuthPanel('register');
    setStatus(null, null);
  };

  const handleCloseRegister = () => {
    setAuthPanel('login');
    setRegisterForm({
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    });
    setStatus(null, null);
  };

  const handleRegisterAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const identity = window.netlifyIdentity as unknown as {
      signup?: (email: string, password: string, data?: Record<string, unknown>, callback?: (error?: { message?: string }) => void) => Promise<unknown> | void;
    } | undefined;
    if (!identity?.signup) {
      setStatus(null, 'Identity signup unavailable.');
      return;
    }

    const email = registerForm.email.trim();
    const displayName = registerForm.displayName.trim();
    if (!email) {
      setStatus(null, 'Email is required.');
      return;
    }
    if (!registerForm.password) {
      setStatus(null, 'Password is required.');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setStatus(null, 'Password confirmation does not match.');
      return;
    }

    setBusy(true);
    setStatus('Creating account...', null);
    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (error?: { message?: string }) => {
          if (settled) return;
          settled = true;
          if (error) {
            reject(new Error(error.message ?? 'Unable to create account.'));
          } else {
            resolve();
          }
        };
        const maybePromise = identity.signup?.(
          email,
          registerForm.password,
          displayName ? { full_name: displayName } : undefined,
          finish,
        );
        if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
          (maybePromise as Promise<unknown>)
            .then(() => finish())
            .catch(error => finish({ message: error instanceof Error ? error.message : 'Unable to create account.' }));
        }
      });
      setStatus('Account created. Check your email to confirm before logging in.', null);
      handleCloseRegister();
    } catch (error) {
      setStatus(null, error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    window.netlifyIdentity?.logout();
    sessionStorage.removeItem('adminSessionId');
    persistIdentity(null, null, null);
    if (import.meta.env.DEV) {
      localStorage.removeItem('adminDevBypass');
      setDevBypassEnabled(false);
    }
    setState(current => ({
      ...current,
      userEmail: null,
      userName: null,
      accessToken: null,
      allowed: false,
      hasPasskey: false,
      sessionId: null,
    }));
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

      const credential = await startRegistration({ optionsJSON: options });
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

      const credential = await startAuthentication({ optionsJSON: options });
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
      if (state.userEmail) {
        sessionStorage.setItem('adminUserEmail', state.userEmail);
      }
      if (state.userName) {
        sessionStorage.setItem('adminUserName', state.userName);
      }
      if (state.accessToken) {
        sessionStorage.setItem('adminAccessToken', state.accessToken);
      }
      setState(current => ({ ...current, sessionId: payload.sessionId }));
      setStatus('Passkey verified. Admin tools unlocked.', null);
    } catch (error) {
      const message = error instanceof Error
        ? error.name === 'NotAllowedError'
          ? 'Passkey verification failed.'
          : error.message
        : 'Passkey verification failed.';
      setStatus(null, message);
    } finally {
      setBusy(false);
    }
  };

  const handleDevBypass = () => {
    enableDevSession('Dev bypass enabled.');
  };

  const openBlogPoster = () => setActivePanel('blog');
  const closeBlogPoster = () => setActivePanel('dashboard');
  const openAccountSettings = () => setActivePanel('account');
  const closeAccountSettings = () => setActivePanel('dashboard');

  const handleAccountUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const identityUser = window.netlifyIdentity?.currentUser();
    if (!identityUser) {
      setStatus(null, 'No authenticated user found.');
      return;
    }

    const displayName = accountForm.displayName.trim();
    const wantsPassword = Boolean(accountForm.newPassword || accountForm.confirmPassword || accountForm.currentPassword);
    if (wantsPassword) {
      if (!accountForm.currentPassword) {
        setStatus(null, 'Enter your current password to set a new one.');
        return;
      }
      if (!accountForm.newPassword) {
        setStatus(null, 'Enter a new password.');
        return;
      }
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        setStatus(null, 'New password and confirmation do not match.');
        return;
      }
    }

    const updates: Record<string, unknown> = {};
    if (displayName && displayName !== (state.userName ?? '')) {
      updates.user_metadata = { full_name: displayName };
    }
    if (wantsPassword) {
      updates.password = accountForm.newPassword;
      updates.current_password = accountForm.currentPassword;
    }

    if (!Object.keys(updates).length) {
      setStatus('No changes to save.', null);
      return;
    }

    setBusy(true);
    setStatus('Updating account...', null);
    try {
      await updateIdentityUser(identityUser, updates);
      setState(current => ({ ...current, userName: displayName || current.userName }));
      setAccountForm(current => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setStatus('Account updated.', null);
    } catch (error) {
      setStatus(null, error instanceof Error ? error.message : 'Unable to update account.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPasskeys = async () => {
    if (!state.accessToken || !state.sessionId) return;
    setBusy(true);
    setStatus('Resetting passkeys...', null);

    try {
      const response = await fetch('/api/webauthn-reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'X-Admin-Session': state.sessionId,
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to reset passkeys.');

      sessionStorage.removeItem('adminSessionId');
      setState(current => ({
        ...current,
        hasPasskey: false,
        sessionId: null,
      }));
      setActivePanel('dashboard');
      setStatus('Passkeys cleared. Register a new passkey to continue.', null);
    } catch (error) {
      setStatus(null, error instanceof Error ? error.message : 'Unable to reset passkeys.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!state.userEmail) {
      setStatus(null, 'No authenticated email found.');
      return;
    }
    if (!deletePassword) {
      setStatus(null, 'Enter your password to delete the account.');
      return;
    }
    const confirmation = window.prompt('Type DELETE to remove your admin account.');
    if (confirmation !== 'DELETE') return;

    setBusy(true);
    setStatus('Deleting account...', null);

    try {
      const deleteUser = await loginIdentityUser(state.userEmail, deletePassword);
      if (state.accessToken && state.sessionId) {
        await fetch('/api/webauthn-reset', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            'X-Admin-Session': state.sessionId,
          },
        });
      }
      if (!deleteUser) {
        throw new Error('Unable to verify account for deletion.');
      }
      await deleteIdentityUser(deleteUser);
      sessionStorage.removeItem('adminSessionId');
      setState({
        ready: true,
        userEmail: null,
        userName: null,
        accessToken: null,
        allowed: false,
        hasPasskey: false,
        sessionId: null,
        status: 'Account deleted.',
        error: null,
        isBusy: false,
        isCheckingAccess: false,
      });
      setDeletePassword('');
    } catch (error) {
      setStatus(null, error instanceof Error ? error.message : 'Unable to delete account.');
    } finally {
      setBusy(false);
    }
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
          authPanel === 'login'
            ? (
              <div className="admin__actions">
                <button className="btn btn--primary" type="button" onClick={handleLogin}>
                  Admin login
                </button>
                <button className="btn btn--ghost" type="button" onClick={handleOpenRegister}>
                  Create admin account
                </button>
                <p className="admin__note">
                  Only allowlisted accounts can access admin tools.
                </p>
              </div>
            )
            : (
              <form className="admin__form admin__auth" onSubmit={handleRegisterAccount}>
                <div className="admin__grid">
                  <label className="admin__field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={event => setRegisterForm(current => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="admin__field">
                    <span>Display name</span>
                    <input
                      type="text"
                      value={registerForm.displayName}
                      onChange={event => setRegisterForm(current => ({ ...current, displayName: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="admin__grid">
                  <label className="admin__field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={event => setRegisterForm(current => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="admin__field">
                    <span>Confirm password</span>
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={event => setRegisterForm(current => ({ ...current, confirmPassword: event.target.value }))}
                      required
                    />
                  </label>
                </div>
                <div className="admin__actions">
                  <button className="btn btn--primary" type="submit" disabled={state.isBusy}>
                    Create account
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={handleCloseRegister}>
                    Back to login
                  </button>
                </div>
                <p className="admin__note">
                  You'll receive a confirmation email before you can log in.
                </p>
              </form>
            )
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

            {state.allowed && !state.isCheckingAccess && !isVerified && (
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

            {canManage && activePanel === 'dashboard' && (
              <div className="admin__dashboard">
                <div className="admin__dashboard-header">
                  <div className="admin__panel-body">
                    <p>Welcome back. Choose a tool to continue.</p>
                  </div>
                  <span className="admin__badge">Verified</span>
                </div>
                <div className="admin__actions">
                  <button className="btn btn--primary" type="button" onClick={openBlogPoster}>
                    Open blog publisher
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={openAccountSettings}>
                    Admin account settings
                  </button>
                </div>
                {import.meta.env.DEV && (
                  <label className="admin__checkbox">
                    <input
                      type="checkbox"
                      checked={devBypassEnabled}
                      onChange={event => setDevBypassPreference(
                        event.target.checked,
                        event.target.checked ? 'Dev bypass enabled.' : 'Dev bypass disabled.',
                      )}
                    />
                    <span>Persist dev bypass on refresh</span>
                  </label>
                )}
              </div>
            )}

            {canManage && activePanel === 'blog' && (
              <div className="admin__blog">
                <div className="admin__actions">
                  <button className="btn btn--ghost" type="button" onClick={closeBlogPoster}>
                    Back to dashboard
                  </button>
                </div>
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
              </div>
            )}

            {canManage && activePanel === 'account' && (
              <div className="admin__account">
                <div className="admin__actions">
                  <button className="btn btn--ghost" type="button" onClick={closeAccountSettings}>
                    Back to dashboard
                  </button>
                </div>
                <form className="admin__form" onSubmit={handleAccountUpdate}>
                  <div className="admin__grid">
                    <label className="admin__field">
                      <span>Display name</span>
                      <input
                        type="text"
                        value={accountForm.displayName}
                        onChange={event => setAccountForm(current => ({ ...current, displayName: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="admin__panel-body">
                    <p>Password changes require your current password.</p>
                  </div>
                  <div className="admin__grid">
                    <label className="admin__field">
                      <span>Current password</span>
                      <input
                        type="password"
                        value={accountForm.currentPassword}
                        onChange={event => setAccountForm(current => ({ ...current, currentPassword: event.target.value }))}
                      />
                    </label>
                    <label className="admin__field">
                      <span>New password</span>
                      <input
                        type="password"
                        value={accountForm.newPassword}
                        onChange={event => setAccountForm(current => ({ ...current, newPassword: event.target.value }))}
                      />
                    </label>
                    <label className="admin__field">
                      <span>Confirm new password</span>
                      <input
                        type="password"
                        value={accountForm.confirmPassword}
                        onChange={event => setAccountForm(current => ({ ...current, confirmPassword: event.target.value }))}
                      />
                    </label>
                  </div>
                  <button className="btn btn--primary" type="submit" disabled={state.isBusy}>
                    Save account changes
                  </button>
                </form>
                <div className="admin__danger">
                  <div className="admin__panel-body">
                    <p>Security tools</p>
                  </div>
                  <label className="admin__field">
                    <span>Password required to delete</span>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={event => setDeletePassword(event.target.value)}
                    />
                  </label>
                  <div className="admin__actions">
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={handleResetPasskeys}
                      disabled={state.isBusy}
                    >
                      Reset passkeys
                    </button>
                    <button
                      className="btn btn--danger"
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={state.isBusy}
                    >
                      Delete admin account
                    </button>
                  </div>
                </div>
              </div>
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
