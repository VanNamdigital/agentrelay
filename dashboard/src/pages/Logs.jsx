import React, { useEffect, useState } from 'react';
import { api } from '../api';

function Logs() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.getLogs({ filter, search });
      setLines(data.lines || []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Monitoring</p>
          <h1 className="page-title">Logs</h1>
          <p className="page-description">Read recent application logs with filtering, search, and secret masking.</p>
        </div>
        <div className="toolbar">
          <select className="select" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="error">Error</option>
            <option value="cli">CLI</option>
            <option value="telegram">Telegram</option>
          </select>
          <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search logs" />
          <button className="button primary" onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">logs/app.log</h2>
            <p className="card-subtitle">{lines.length} lines shown. Tokens and API keys are redacted.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="log-box">
            {lines.map((line, index) => (
              <div className="log-line" key={`${index}-${line}`}>{line}</div>
            ))}
            {lines.length === 0 && <div className="empty">No log entries match this filter.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logs;
