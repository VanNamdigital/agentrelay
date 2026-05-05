import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useI18n } from '../i18n';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, languages, setLanguage, t } = useI18n();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.login({ username, password });
      if (result.mustChangePassword) navigate('/change-password', { replace: true });
      else navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card stack" onSubmit={submit}>
        <div>
          <p className="eyebrow">Admin console</p>
          <h1 className="auth-title">Sign in to AgentRelay</h1>
          <p className="auth-copy">Use the default admin account on first boot, then change the password.</p>
        </div>
        <label className="field">
          <span className="label">{t('common.language')}</span>
          <select className="select" value={language} onChange={(event) => setLanguage(event.target.value, { persist: false })}>
            {languages.map((option) => (
              <option key={option.value} value={option.value}>{option.nativeLabel}</option>
            ))}
          </select>
        </label>
        {error && <div className="alert error">{error}</div>}
        <label className="field">
          <span className="label">{t('auth.username')}</span>
          <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label className="field">
          <span className="label">{t('auth.password')}</span>
          <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
          <span className="hint">Default: admin / 123456</span>
        </label>
        <button className="button primary" disabled={loading}>{loading ? t('auth.signingIn') : t('auth.signIn')}</button>
      </form>
    </div>
  );
}

export default Login;
