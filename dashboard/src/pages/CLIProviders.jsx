import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

function ClaudeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-icon-stroke">
      {Array.from({ length: 12 }).map((_, index) => (
        <line
          key={index}
          x1="12"
          y1="4"
          x2="12"
          y2="9.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.6"
          transform={`rotate(${index * 30} 12 12)`}
        />
      ))}
    </svg>
  );
}

function GeminiMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-icon-gemini">
      <defs>
        <linearGradient id="gemini-mark-gradient" x1="3" x2="21" y1="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285f4" />
          <stop offset=".5" stopColor="#34a853" />
          <stop offset=".75" stopColor="#fbbc05" />
          <stop offset="1" stopColor="#ea4335" />
        </linearGradient>
      </defs>
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#gemini-mark-gradient)" />
    </svg>
  );
}

function KiroMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 20V8.4C6 5.4 8.52 3 12 3s6 2.4 6 5.4V20l-2.35-1.75L13.55 20 12 18.25 10.45 20l-2.1-1.75L6 20Z" />
      <circle className="provider-icon-cutout" cx="9.8" cy="10.8" r="1.3" />
      <circle className="provider-icon-cutout" cx="14.2" cy="10.8" r="1.3" />
    </svg>
  );
}

function KiloCodeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path className="provider-icon-cutout" d="M7 7h2v4l3-4h2.5l-3.3 4.25L15 17h-2.5l-2.7-4.1-.8 1V17H7V7Zm9 0h2v2h-2V7Zm0 4h2v6h-2v-6Z" />
    </svg>
  );
}

function AiderMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 21 21h-3.7l-1.55-3.35H8.2L6.7 21H3L12 3Zm-2.4 11.65h4.8L12 9.2l-2.4 5.45Z" />
      <path d="M17.3 5.2 20.8 3l-1.1 4.1 3.3 2.5-4.2.22-1.5 3.88-1.5-3.88-4.2-.22 3.3-2.5-1.1-4.1 3.5 2.2Z" opacity=".52" />
    </svg>
  );
}

function GooseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 15.6c3.2-5.2 6.7-7.9 10.4-8.1 2.3-.12 4.2.7 5.6 2.5-2.1-.25-3.75.2-4.95 1.35 2.55.45 4.2 1.85 4.95 4.2-2.55-.95-5.08-1.07-7.6-.35-2.52.72-5.32.85-8.4.4Z" />
      <path className="provider-icon-cutout" d="M6.9 14.1c1.75-2.25 3.85-3.8 6.3-4.65-1.55 1.25-2.45 2.83-2.7 4.75-1.1.15-2.3.12-3.6-.1Z" />
    </svg>
  );
}

function CrushMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7.2-4.28-9.38-8.76C.74 8.37 2.8 4.8 6.78 4.8c2.02 0 3.42 1.03 4.22 2.16.8-1.13 2.2-2.16 4.22-2.16 3.98 0 6.04 3.57 4.16 7.44C17.2 16.72 12 21 12 21Z" />
      <path className="provider-icon-cutout" d="M8.4 9.2h2v2.1h2.2V9.2h2v6h-2v-2.25h-2.2v2.25h-2v-6Z" />
    </svg>
  );
}

function CommandCodeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path className="provider-icon-cutout" d="M7 8.2 4.8 12 7 15.8h2.15L6.95 12l2.2-3.8H7Zm10 0h-2.15l2.2 3.8-2.2 3.8H17l2.2-3.8L17 8.2ZM10.6 17.2h2.05l.75-10.4h-2.05l-.75 10.4Z" />
    </svg>
  );
}

const PROVIDER_VISUALS = {
  codex: {
    title: 'OpenAI Codex',
    tone: 'provider-icon-openai',
    viewBox: '0 0 20 20',
    path: 'M11.248 18.25q-.825 0-1.568-.314a4.3 4.3 0 0 1-1.32-.874 4 4 0 0 1-1.304.214 4 4 0 0 1-2.046-.544 4.27 4.27 0 0 1-1.518-1.485 4 4 0 0 1-.56-2.095q0-.48.131-1.04A4.4 4.4 0 0 1 2.04 10.71a4.07 4.07 0 0 1 .017-3.4 4.2 4.2 0 0 1 1.056-1.418 3.8 3.8 0 0 1 1.6-.842 3.9 3.9 0 0 1 .76-1.683q.593-.759 1.451-1.188a4.04 4.04 0 0 1 1.832-.429q.825 0 1.567.313.742.314 1.32.875a4 4 0 0 1 1.304-.215q1.106 0 2.046.545a4.14 4.14 0 0 1 1.501 1.485q.578.941.578 2.095 0 .48-.132 1.04.66.61 1.023 1.419.363.792.363 1.666 0 .892-.38 1.717a4.3 4.3 0 0 1-1.072 1.435 3.8 3.8 0 0 1-1.584.825 3.8 3.8 0 0 1-.775 1.683 4.06 4.06 0 0 1-1.436 1.188 4.04 4.04 0 0 1-1.832.429m-4.076-2.062q.825 0 1.435-.347l3.103-1.782a.36.36 0 0 0 .164-.313v-1.42L7.881 14.62a.67.67 0 0 1-.726 0l-3.118-1.798a.5.5 0 0 1-.017.115v.198q0 .841.396 1.551.413.693 1.139 1.089a3.2 3.2 0 0 0 1.617.412m.165-2.69a.4.4 0 0 0 .181.05q.083 0 .165-.05l1.238-.71-3.977-2.31a.7.7 0 0 1-.363-.643v-3.58q-.825.362-1.32 1.122a2.9 2.9 0 0 0-.495 1.65q0 .809.413 1.55.412.743 1.072 1.123zm3.91 3.663q.875 0 1.585-.396a2.96 2.96 0 0 0 1.534-2.64v-3.564a.32.32 0 0 0-.165-.297l-1.254-.726v4.604a.7.7 0 0 1-.363.643l-3.119 1.799a3 3 0 0 0 1.783.577m.627-6.039V8.878L10.01 7.822 8.129 8.878v2.244l1.881 1.056zM7.057 5.859a.7.7 0 0 1 .363-.644l3.119-1.798a3 3 0 0 0-1.782-.578q-.874 0-1.584.396A2.96 2.96 0 0 0 6.05 4.324a3.07 3.07 0 0 0-.396 1.551v3.547q0 .199.165.314l1.237.726zm8.383 7.887q.825-.364 1.303-1.123.495-.758.495-1.65a3.15 3.15 0 0 0-.412-1.55q-.413-.743-1.073-1.123l-3.086-1.782q-.099-.065-.181-.049a.3.3 0 0 0-.165.05l-1.238.692 3.993 2.327a.6.6 0 0 1 .264.264.64.64 0 0 1 .1.363zm-3.317-8.382a.63.63 0 0 1 .726 0l3.135 1.831v-.297q0-.792-.396-1.501a2.86 2.86 0 0 0-1.105-1.155q-.71-.43-1.65-.43-.825 0-1.436.347L8.294 5.941a.36.36 0 0 0-.165.314v1.418z'
  },
  opencode: {
    title: 'OpenCode',
    tone: 'provider-icon-native',
    viewBox: '0 0 240 300',
    paths: [
      { d: 'M240 0H0V300H240V0Z', fill: 'white' },
      { d: 'M180 240H60V120H180V240Z', fill: '#CFCECD' },
      { d: 'M180 60H60V240H180V60ZM240 300H0V0H240V300Z', fill: '#211E1E' }
    ]
  },
  claude: {
    title: 'Claude Code',
    tone: 'provider-icon-claude',
    Component: ClaudeMark
  },
  gemini: {
    title: 'Google Gemini',
    tone: 'provider-icon-gemini-shell',
    Component: GeminiMark
  },
  kiro: { Component: KiroMark, tone: 'provider-icon-kiro', title: 'Kiro' },
  kilocode: { Component: KiloCodeMark, tone: 'provider-icon-kilocode', title: 'Kilo Code' },
  aider: { Component: AiderMark, tone: 'provider-icon-aider', title: 'Aider' },
  goose: { Component: GooseMark, tone: 'provider-icon-goose', title: 'Goose' },
  'github-copilot': {
    title: 'GitHub Copilot',
    tone: 'provider-icon-dark',
    path: 'M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z'
  },
  crush: { Component: CrushMark, tone: 'provider-icon-crush', title: 'Crush' },
  'command-code': { Component: CommandCodeMark, tone: 'provider-icon-command-code', title: 'Command Code' }
};

function statusTone(status) {
  if (status === 'detected') return 'green';
  if (status === 'manual_valid') return 'blue';
  if (status === 'error') return 'red';
  if (status === 'needs_setup') return 'amber';
  return 'gray';
}

function ProviderIcon({ providerKey }) {
  const visual = PROVIDER_VISUALS[providerKey] || { label: providerKey.slice(0, 2).toUpperCase(), tone: 'provider-icon-slate', title: providerKey };
  const Component = visual.Component;
  return (
    <div className={`provider-icon ${visual.tone}`} aria-label={visual.title} title={visual.title}>
      {Component ? (
        <Component />
      ) : visual.path || visual.paths ? (
        <svg viewBox={visual.viewBox || '0 0 24 24'} aria-hidden="true">
          {visual.paths
            ? visual.paths.map((item) => <path key={item.d} d={item.d} fill={item.fill || 'currentColor'} />)
            : <path d={visual.path} />}
        </svg>
      ) : (
        <span className="provider-mark" aria-hidden="true">{visual.label}</span>
      )}
    </div>
  );
}

function CLIProviders() {
  const [providers, setProviders] = useState([]);
  const [activeKey, setActiveKey] = useState('');
  const [editingCommands, setEditingCommands] = useState({});
  const [newModels, setNewModels] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(preferredKey = activeKey) {
    const data = await api.getCliProviders();
    setProviders(data);
    setEditingCommands(Object.fromEntries(data.map((provider) => [provider.key, provider.command || ''])));

    if (!preferredKey || !data.some((provider) => provider.key === preferredKey)) {
      setActiveKey(data[0]?.key || '');
    } else {
      setActiveKey(preferredKey);
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function run(action, successMessage, preferredKey = activeKey) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await action();
      await load(preferredKey);
      if (successMessage) setMessage(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeProvider = useMemo(
    () => providers.find((provider) => provider.key === activeKey) || providers[0],
    [providers, activeKey]
  );

  const activeCommand = activeProvider ? (editingCommands[activeProvider.key] ?? activeProvider.command ?? '') : '';
  const activeHasModels = activeProvider?.models?.some((model) => model.enabled === 1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Provider registry</p>
          <h1 className="page-title">CLI Providers</h1>
          <p className="page-description">
            Configure local AI coding CLIs. Enabled and valid providers appear in the Telegram bot.
          </p>
        </div>
        <div className="toolbar">
          <button className="button" disabled={loading} onClick={() => run(() => api.scanCliProviders(), 'Local CLI scan completed.')}>Scan local CLI</button>
          <button className="button primary" onClick={() => load()}>Refresh</button>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}
      {message && <div className="alert success" style={{ marginBottom: 16 }}>{message}</div>}

      <div className="provider-grid">
        {providers.map((provider) => {
          const enabledModels = provider.models?.filter((model) => model.enabled === 1).length || 0;
          return (
            <div
              className={`provider-card ${provider.key === activeProvider?.key ? 'active' : ''}`}
              key={provider.key}
              role="button"
              tabIndex={0}
              onClick={() => setActiveKey(provider.key)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setActiveKey(provider.key);
              }}
            >
              <div className="provider-head">
                <ProviderIcon providerKey={provider.key} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 className="provider-name">{provider.display_name}</h2>
                  <div className="provider-command">{provider.command || 'No command configured'}</div>
                </div>
              </div>

              <div className="provider-meta">
                <span className={`badge ${statusTone(provider.status)}`}>{String(provider.status).replaceAll('_', ' ')}</span>
                <label className="switch" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={Boolean(provider.enabled)}
                    onChange={(event) => run(
                      () => api.updateCliProvider(provider.key, { enabled: event.target.checked }),
                      event.target.checked ? 'Provider enabled.' : 'Provider disabled.',
                      provider.key
                    )}
                  />
                  On
                </label>
              </div>

              <div className="provider-stats">
                <span className="badge gray">{enabledModels} enabled models</span>
                <span className="badge gray">{provider.models?.length || 0} total</span>
              </div>
            </div>
          );
        })}
      </div>

      {activeProvider && (
        <div className="detail-grid" style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">{activeProvider.display_name}</h2>
                <p className="card-subtitle">
                  {activeProvider.detected_path ? `Detected at ${activeProvider.detected_path}` : 'Not found in PATH. Enter a command manually and test it.'}
                </p>
              </div>
              <span className={`badge ${statusTone(activeProvider.status)}`}>{String(activeProvider.status).replaceAll('_', ' ')}</span>
            </div>

            <div className="card-body stack">
              <label className="field">
                <span className="label">Command/path</span>
                <input
                  className="input mono"
                  value={activeCommand}
                  onChange={(event) => setEditingCommands((current) => ({ ...current, [activeProvider.key]: event.target.value }))}
                />
                <span className="hint">Version: {activeProvider.version || 'not available'}</span>
                <span className="hint">Last checked: {activeProvider.last_checked_at || 'never'}</span>
              </label>

              <div className="toolbar">
                <button className="button" onClick={() => run(() => api.testCliCommand(activeProvider.key, { command: activeCommand }), 'Command test completed.')}>Test command</button>
                <button className="button primary" onClick={() => run(() => api.updateCliProvider(activeProvider.key, { command: activeCommand }), 'Command saved.')}>Save command</button>
                <button className="button" onClick={() => run(() => api.detectModels(activeProvider.key), 'Model detection completed.')}>Detect models</button>
              </div>

              {activeProvider.enabled && !activeHasModels && (
                <div className="alert info">Enable at least one model before this provider can be used by Telegram users.</div>
              )}
              {activeProvider.enabled && !['detected', 'manual_valid'].includes(activeProvider.status) && (
                <div className="alert info">Test this command before enabling the provider.</div>
              )}
              {!activeProvider.enabled && (
                <div className="alert info">This provider is hidden from Telegram users.</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Models for {activeProvider.display_name}</h2>
                <p className="card-subtitle">Only enabled models are shown to Telegram users.</p>
              </div>
            </div>
            <div className="card-body stack">
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  const model = newModels[activeProvider.key] || {};
                  run(() => api.addModel(activeProvider.key, {
                    model_name: model.model_name,
                    display_name: model.display_name,
                    enabled: true,
                    is_default: model.is_default
                  }), 'Model added.');
                  setNewModels((current) => ({ ...current, [activeProvider.key]: {} }));
                }}
              >
                <label className="field">
                  <span className="label">Model name</span>
                  <input
                    className="input mono"
                    value={newModels[activeProvider.key]?.model_name || ''}
                    onChange={(event) => setNewModels((current) => ({
                      ...current,
                      [activeProvider.key]: { ...(current[activeProvider.key] || {}), model_name: event.target.value }
                    }))}
                    placeholder={activeProvider.key === 'opencode' ? 'provider/model' : activeProvider.key === 'command-code' ? 'default' : 'model-name'}
                  />
                </label>
                <label className="field">
                  <span className="label">Display name</span>
                  <input
                    className="input"
                    value={newModels[activeProvider.key]?.display_name || ''}
                    onChange={(event) => setNewModels((current) => ({
                      ...current,
                      [activeProvider.key]: { ...(current[activeProvider.key] || {}), display_name: event.target.value }
                    }))}
                  />
                </label>
                <label className="switch" style={{ alignSelf: 'end' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(newModels[activeProvider.key]?.is_default)}
                    onChange={(event) => setNewModels((current) => ({
                      ...current,
                      [activeProvider.key]: { ...(current[activeProvider.key] || {}), is_default: event.target.checked }
                    }))}
                  />
                  Default
                </label>
                <div className="field" style={{ justifyContent: 'end' }}>
                  <button className="button primary">Add model</button>
                </div>
              </form>

              {activeProvider.models?.length > 0 ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Enabled</th><th>Model</th><th>Source</th><th>Default</th><th /></tr>
                    </thead>
                    <tbody>
                      {activeProvider.models.map((model) => (
                        <tr key={model.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={model.enabled === 1}
                              onChange={(event) => run(() => api.updateModel(activeProvider.key, model.id, { enabled: event.target.checked }), 'Model updated.')}
                            />
                          </td>
                          <td>
                            <div><strong>{model.display_name || model.model_name}</strong></div>
                            <div className="mono hint">{model.model_name}</div>
                          </td>
                          <td><span className="badge gray">{model.source}</span></td>
                          <td>
                            <input
                              type="radio"
                              name={`default-${activeProvider.key}`}
                              checked={model.is_default === 1}
                              onChange={() => run(() => api.updateModel(activeProvider.key, model.id, { is_default: true, enabled: true }), 'Default model updated.')}
                            />
                          </td>
                          <td>
                            <button className="button danger" onClick={() => run(() => api.deleteModel(activeProvider.key, model.id), 'Model deleted.')}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">No models configured yet. Detect models automatically or add one manually.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CLIProviders;
