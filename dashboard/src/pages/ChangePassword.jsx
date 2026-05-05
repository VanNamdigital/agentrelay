import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useI18n } from '../i18n';

function ChangePassword() {
  const navigate = useNavigate();
  const { language, languages, setLanguage, t } = useI18n();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.changePassword(form);
      navigate('/', { replace: true });
      window.location.reload();
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
          <p className="eyebrow">Required setup</p>
          <h1 className="auth-title">Change default password</h1>
          <p className="auth-copy">The first login must replace the default admin password before the dashboard opens.</p>
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
          <span className="label">Current password</span>
          <input className="input" type="password" value={form.currentPassword} onChange={(event) => update('currentPassword', event.target.value)} />
        </label>
        <label className="field">
          <span className="label">New password</span>
          <input className="input" type="password" value={form.newPassword} onChange={(event) => update('newPassword', event.target.value)} />
        </label>
        <label className="field">
          <span className="label">Confirm new password</span>
          <input className="input" type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
        </label>
        <button className="button primary" disabled={loading}>{loading ? 'Saving...' : 'Save password'}</button>
      </form>
    </div>
  );
}

export default ChangePassword;
