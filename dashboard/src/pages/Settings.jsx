import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

function Settings() {
  const { language, languages, setLanguage, t } = useI18n();
  const [timeout, setTimeoutValue] = useState('120');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getGeneralSettings()
      .then((data) => {
        setTimeoutValue(data.task_timeout_minutes || '120');
        setSelectedLanguage(data.system_language || language);
      })
      .catch((err) => setError(err.message));
  }, [language]);

  async function save(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.saveGeneralSettings({ task_timeout_minutes: timeout, system_language: selectedLanguage });
      await setLanguage(selectedLanguage, { persist: false });
      setMessage(t('settings.saved'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('settings.eyebrow')}</p>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-description">{t('settings.description')}</p>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}
      {message && <div className="alert success" style={{ marginBottom: 16 }}>{message}</div>}

      <form className="card" onSubmit={save}>
        <div className="card-header">
          <div>
            <h2 className="card-title">{t('settings.timeoutTitle')}</h2>
            <p className="card-subtitle">{t('settings.timeoutDescription')}</p>
          </div>
        </div>
        <div className="card-body form-grid">
          <label className="field">
            <span className="label">TASK_TIMEOUT_MINUTES</span>
            <input className="input" type="number" min="1" max="1440" value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} />
            <span className="hint">Allowed range: 1 to 1440 minutes.</span>
          </label>
          <label className="field">
            <span className="label">{t('settings.languageTitle')}</span>
            <select className="select" value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)}>
              {languages.map((option) => (
                <option key={option.value} value={option.value}>{option.nativeLabel}</option>
              ))}
            </select>
            <span className="hint">{t('settings.languageDescription')}</span>
          </label>
          <div className="field" style={{ justifyContent: 'end' }}>
            <button className="button primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Settings;
