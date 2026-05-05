import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import Layout from './components/Layout';
import AccessControl from './pages/AccessControl';
import BotConfiguration from './pages/BotConfiguration';
import ChangePassword from './pages/ChangePassword';
import CLIProviders from './pages/CLIProviders';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Settings from './pages/Settings';

function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    api.getSession()
      .then((data) => {
        if (mounted) setSession(data);
      })
      .catch(() => {
        if (mounted) setSession({ authenticated: false });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="screen-center">Loading workspace...</div>;
  }

  if (!session?.authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (session.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children(session);
}

function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/change-password"
        element={(
          <AuthGate>
            {(session) => <ChangePassword session={session} />}
          </AuthGate>
        )}
      />
      <Route
        path="/"
        element={(
          <AuthGate>
            {(session) => (
              <Layout
                session={session}
                onLogout={async () => {
                  await api.logout();
                  navigate('/login', { replace: true });
                }}
              />
            )}
          </AuthGate>
        )}
      >
        <Route index element={<Dashboard />} />
        <Route path="bot" element={<BotConfiguration />} />
        <Route path="cli-providers" element={<CLIProviders />} />
        <Route path="projects" element={<Projects />} />
        <Route path="access-control" element={<AccessControl />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
