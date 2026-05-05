import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

function Badge({ status }) {
  const value = String(status || 'unknown');
  const tone = value.includes('connected') || value.includes('detected') || value.includes('manual')
    ? 'green'
    : value.includes('error')
      ? 'red'
      : value.includes('not_configured') || value.includes('needs')
        ? 'amber'
        : 'gray';
  return <span className={`badge ${tone}`}>{value.replaceAll('_', ' ')}</span>;
}

function Dashboard() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setData(await api.dashboard());
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!data && !error) return <div className="page">Loading dashboard...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-description">
            {t('dashboard.description')}
          </p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={load}>{t('common.refresh')}</button>
          <button className="button primary" onClick={() => api.botAction('restart').then(load)}>Restart bot</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {data && (
        <>
          <div className="grid grid-4">
            <div className="card metric">
              <div className="metric-label">Telegram bot</div>
              <div className="metric-value"><Badge status={data.botStatus?.status} /></div>
              <div className="metric-note">{data.botStatus?.userCount || 0} allowed users</div>
            </div>
            <div className="card metric">
              <div className="metric-label">Enabled CLI providers</div>
              <div className="metric-value">{data.enabledProviders?.length || 0}</div>
              <div className="metric-note">{data.providers?.length || 0} configured providers</div>
            </div>
            <div className="card metric">
              <div className="metric-label">Projects</div>
              <div className="metric-value">{data.projectCount}</div>
              <div className="metric-note">available project paths</div>
            </div>
            <div className="card metric">
              <div className="metric-label">Running tasks</div>
              <div className="metric-value">{data.runningTaskCount}</div>
              <div className="metric-note">queue integration pending</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">CLI readiness</h2>
                  <p className="card-subtitle">Only enabled and valid providers appear in Telegram.</p>
                </div>
              </div>
              <div className="card-body table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Provider</th><th>Status</th><th>Command</th><th>Models</th></tr>
                  </thead>
                  <tbody>
                    {data.providers.map((provider) => (
                      <tr key={provider.key}>
                        <td><strong>{provider.display_name}</strong></td>
                        <td><Badge status={provider.status} /></td>
                        <td className="mono">{provider.command || 'Not set'}</td>
                        <td>{provider.enabledModelCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Recent logs</h2>
                  <p className="card-subtitle">Secrets are masked before rendering.</p>
                </div>
              </div>
              <div className="card-body">
                <div className="log-box" style={{ height: 360 }}>
                  {(data.recentLogs || []).map((line, index) => (
                    <div className="log-line" key={`${line}-${index}`}>{line}</div>
                  ))}
                  {(!data.recentLogs || data.recentLogs.length === 0) && <div className="empty">No logs yet.</div>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
