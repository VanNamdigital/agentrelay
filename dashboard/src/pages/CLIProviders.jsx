import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Badge, Switch as SwitchComponent } from '../components/ui';
import {
  AiderMark, ClaudeMark, CommandCodeMark, CrushMark, GeminiMark,
  GooseMark, KiloCodeMark, KiroMark,
  GithubMark, GoogleMark, OpenAIMark, AnthropicMark, MistralMark,
  LangChainMark, HuggingFaceMark
} from '../components/icons';

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
      { d: 'M240 0H0V300H240V0Z', fill: 'var(--color-bg-secondary)' },
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
    Component: GithubMark
  },
  crush: { Component: CrushMark, tone: 'provider-icon-crush', title: 'Crush' },
  'command-code': { Component: CommandCodeMark, tone: 'provider-icon-command-code', title: 'Command Code' },

  /* Official provider brandings via UI entries */
  openai: { title: 'OpenAI', tone: 'provider-icon-openai-official', Component: OpenAIMark },
  github: { title: 'GitHub', tone: 'provider-icon-github-official', Component: GithubMark },
  google: { title: 'Google', tone: 'provider-icon-google-official', Component: GoogleMark },
  anthropic: { title: 'Anthropic', tone: 'provider-icon-anthropic-official', Component: AnthropicMark },
  mistral: { title: 'Mistral', tone: 'provider-icon-mistral-official', Component: MistralMark },
  langchain: { title: 'LangChain', tone: 'provider-icon-langchain-official', Component: LangChainMark },
  huggingface: { title: 'Hugging Face', tone: 'provider-icon-huggingface-official', Component: HuggingFaceMark }
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
                <Badge tone={statusTone(provider.status)}>{String(provider.status).replaceAll('_', ' ')}</Badge>
                <SwitchComponent
                  label="On"
                  checked={Boolean(provider.enabled)}
                  onChange={(event) => run(
                    () => api.updateCliProvider(provider.key, { enabled: event.target.checked }),
                    event.target.checked ? 'Provider enabled.' : 'Provider disabled.',
                    provider.key
                  )}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>

              <div className="provider-stats">
                <Badge tone="gray">{enabledModels} enabled models</Badge>
                <Badge tone="gray">{provider.models?.length || 0} total</Badge>
              </div>
            </div>
          );
        })}
      </div>

      {activeProvider && (
        <div className="detail-grid" style={{ marginTop: 18 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">{activeProvider.display_name}</h2>
                <p className="card-subtitle">
                  {activeProvider.detected_path ? `Detected at ${activeProvider.detected_path}` : 'Not found in PATH. Enter a command manually and test it.'}
                </p>
              </div>
              <Badge tone={statusTone(activeProvider.status)}>{String(activeProvider.status).replaceAll('_', ' ')}</Badge>
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
                          <td><Badge tone="gray">{model.source}</Badge></td>
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
