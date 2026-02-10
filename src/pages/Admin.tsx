import { useEffect, useState } from 'react';
import './Admin.scss';

type AdminState = {
  ready: boolean;
  userEmail: string | null;
};

const Admin = () => {
  const [state, setState] = useState<AdminState>({
    ready: false,
    userEmail: null,
  });

  useEffect(() => {
    const identity = window.netlifyIdentity;
    if (!identity) {
      setState({ ready: true, userEmail: null });
      return;
    }

    const updateUser = (user?: { email?: string } | null) => {
      setState({
        ready: true,
        userEmail: user?.email ?? identity.currentUser()?.email ?? null,
      });
    };

    identity.on('init', updateUser);
    identity.on('login', updateUser);
    identity.on('logout', () => updateUser(null));
    identity.on('close', updateUser);

    updateUser(identity.currentUser());
  }, []);

  const handleLogin = () => {
    window.netlifyIdentity?.open('login');
  };

  const handleLogout = () => {
    window.netlifyIdentity?.logout();
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
            <div className="admin__panel-body">
              <p>Admin tools will live here once the passkey gate is wired up.</p>
            </div>
            <button className="btn btn--ghost" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Admin;
