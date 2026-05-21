import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Badge, Metric, Spinner } from '../components/ui';

function Dashboard() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await api.dashboard());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card metric">
              <div className="metric-label" style={{ background: 'var(--color-bg-tertiary)', height: 12, borderRadius: 4, width: '60%' }} />
              <div className="metric-value" style={{ background: 'var(--color-bg-tertiary)', height: 32, borderRadius: 4, marginTop: 10, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function statusBadge(status) {
    const value = String(status || 'unknown');
    const tone = value.includes('connected') || value.includes('detected') || value.includes('manual')
      ? 'green'
      : value.includes('error')
        ? 'red'
        : value.includes('not_configured') || value.includes('needs')
          ? 'amber'
          : 'gray';
    return <Badge tone={tone}>{value.replaceAll('_', ' ')}</Badge>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-description">{t('dashboard.description')}</p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={load}>{t('common.refresh')}</button>
          <button className="button primary" onClick={() => api.botAction('restart').then(load)}>
            Restart bot
          </button>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      {data && (
        <>
          <div className="grid grid-4">
            <Metric
              label="Telegram bot"
              value={data.botStatus ? <Badge tone={data.botStatus.status === 'connected' ? 'green' : 'amber'}>{data.botStatus.status.replaceAll('_', ' ')}</Badge> : '—'}
              note={`${data.botStatus?.userCount || 0} allowed users`}
            />
            <Metric
              label="Enabled CLI providers"
              value={data.enabledProviders?.length || 0}
              note={`${data.providers?.length || 0} configured providers`}
            />
            <Metric
              label="Projects"
              value={data.projectCount}
              note="available project paths"
            />
            <Metric
              label="Running tasks"
              value={data.runningTaskCount}
              note="queue integration pending"
            />
          </div>

          <div className="grid grid-2" style={{ marginTop: 18 }}>
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
                        <td>{statusBadge(provider.status)}</td>
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
                  {(!data.recentLogs || data.recentLogs.length === 0) && (
                    <div className="empty">No logs yet.</div>
                  )}
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
