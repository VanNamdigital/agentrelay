import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useI18n } from '../i18n';

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0Zm4.962 7.224c.1-.002.321.023.465.14.143.118.18.277.171.325.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
    </svg>
  );
}

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.296-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.437-9.884 9.889-9.884a9.826 9.826 0 0 1 6.988 2.898 9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
    </svg>
  );
}

function ZaloMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="6" width="26" height="20" rx="6" />
      <path className="channel-icon-cutout" d="M9 12h9.2L11.9 20H18v2H8.6l6.3-8H9z" />
      <circle className="channel-icon-cutout" cx="21.8" cy="21" r="1.35" />
      <path className="channel-icon-cutout" d="M20.8 12h2.2v7h-2.2z" />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.317 4.369A19.8 19.8 0 0 0 15.432 2.854a.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.249a18.3 18.3 0 0 0-5.49 0 12.5 12.5 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.1 14.1 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128c-.599.35-1.224.648-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.955 2.419-2.157 2.419Zm7.975 0c-1.184 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

function SlackMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="channel-icon-multicolor">
      <rect x="10" y="2" width="4" height="9" rx="2" fill="#36c5f0" />
      <rect x="2" y="10" width="9" height="4" rx="2" fill="#36c5f0" />
      <rect x="13" y="2" width="4" height="9" rx="2" transform="rotate(90 15 6.5)" fill="#2eb67d" />
      <rect x="14" y="10" width="8" height="4" rx="2" fill="#2eb67d" />
      <rect x="10" y="13" width="4" height="9" rx="2" fill="#ecb22e" />
      <rect x="13" y="13" width="9" height="4" rx="2" fill="#e01e5a" />
      <rect x="2" y="13" width="8" height="4" rx="2" fill="#ecb22e" />
      <rect x="7" y="13" width="4" height="9" rx="2" transform="rotate(90 9 17.5)" fill="#e01e5a" />
    </svg>
  );
}

function MessengerMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.454 5.513 3.727 7.211V22l3.405-1.869c.909.252 1.872.386 2.868.386 5.523 0 10-4.145 10-9.258S17.523 2 12 2Zm.994 12.469-2.547-2.716-4.97 2.716 5.462-5.806 2.609 2.716 4.908-2.716-5.462 5.806Z" />
    </svg>
  );
}

function LineMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="7" width="26" height="17" rx="6" />
      <path className="channel-icon-cutout" d="M7.5 12h2v6.1H13v1.8H7.5zM14 12h2v7.9h-2zM17.5 12h1.8l3.1 4.4V12h2v7.9h-1.8l-3.1-4.4v4.4h-2z" />
    </svg>
  );
}

function WeChatMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.1 4C5.18 4 2 6.65 2 9.93c0 1.89 1.08 3.59 2.75 4.67l-.68 2.05 2.46-1.19c.79.24 1.66.37 2.57.37 3.92 0 7.1-2.65 7.1-5.91S13.02 4 9.1 4Zm-2.43 4.8a.86.86 0 1 1 0-1.72.86.86 0 0 1 0 1.72Zm4.86 0a.86.86 0 1 1 0-1.72.86.86 0 0 1 0 1.72Z" />
      <path d="M22 14.36c0-2.64-2.55-4.79-5.7-4.79-.06 3.8-3.64 6.87-8.07 6.96.86 1.56 2.76 2.64 4.97 2.64.72 0 1.41-.1 2.04-.31l1.96.95-.54-1.63c1.33-.86 2.34-2.22 2.34-3.82Zm-7.58-.78a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm3.91 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z" opacity=".72" />
    </svg>
  );
}

function WebChatMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.806 2 11.5c0 2.49 1.277 4.737 3.315 6.291L4.5 21l3.663-1.595c1.17.38 2.462.595 3.837.595 5.523 0 10-3.806 10-8.5S17.523 3 12 3Zm-4 7.75h8v1.5H8v-1.5Zm0 3h5.5v1.5H8v-1.5Z" />
    </svg>
  );
}

const CHANNEL_VISUALS = {
  telegram: { Icon: TelegramMark, tone: 'channel-icon-telegram', title: 'Telegram' },
  whatsapp: { Icon: WhatsAppMark, tone: 'channel-icon-whatsapp', title: 'WhatsApp Business' },
  zalo: { Icon: ZaloMark, tone: 'channel-icon-zalo', title: 'Zalo Official Account' },
  discord: { Icon: DiscordMark, tone: 'channel-icon-discord', title: 'Discord' },
  slack: { Icon: SlackMark, tone: 'channel-icon-slack', title: 'Slack' },
  messenger: { Icon: MessengerMark, tone: 'channel-icon-messenger', title: 'Facebook Messenger' },
  line: { Icon: LineMark, tone: 'channel-icon-line', title: 'LINE' },
  wechat: { Icon: WeChatMark, tone: 'channel-icon-wechat', title: 'WeChat Work' },
  webchat: { Icon: WebChatMark, tone: 'channel-icon-webchat', title: 'Web Chat Widget' }
};

function ChannelIcon({ channelKey }) {
  const visual = CHANNEL_VISUALS[channelKey] || { Icon: WebChatMark, tone: 'channel-icon-webchat', title: channelKey };
  const Icon = visual.Icon;
  return (
    <div className={`channel-icon ${visual.tone}`} aria-label={visual.title} title={visual.title}>
      <Icon />
    </div>
  );
}

function runtimeLabel(channel, t) {
  if (!channel.enabled) return t('common.disabled');
  if (channel.runtime === 'implemented') return t('bot.runtimeLive');
  if (channel.runtimeStatus === 'configured') return t('bot.configured');
  return t('bot.runtimePlanned');
}

function runtimeTone(channel) {
  if (!channel.enabled) return 'gray';
  if (channel.runtime === 'implemented' && ['connected', 'ready_to_start'].includes(channel.runtimeStatus)) return 'green';
  if (channel.runtimeStatus === 'configured') return 'blue';
  return 'amber';
}

function BotConfiguration() {
  const { t } = useI18n();
  const [active, setActive] = useState('');
  const [config, setConfig] = useState(null);
  const [channelForms, setChannelForms] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function hydrate(data, preferredKey = active) {
    const forms = {};
    for (const channel of data.channels || []) {
      forms[channel.key] = {
        enabled: Boolean(channel.enabled),
        fields: Object.fromEntries((channel.fields || []).map((field) => [field.key, field.value || '']))
      };
    }
    setConfig(data);
    setChannelForms(forms);
    if (!preferredKey || !data.channels?.some((channel) => channel.key === preferredKey)) {
      setActive(data.channels?.[0]?.key || '');
    } else {
      setActive(preferredKey);
    }
  }

  async function load(preferredKey = active) {
    const data = await api.getBotConfig();
    hydrate(data, preferredKey);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const activeChannel = useMemo(
    () => config?.channels?.find((channel) => channel.key === active) || config?.channels?.[0],
    [active, config]
  );

  function updateField(channelKey, fieldKey, value) {
    setChannelForms((current) => ({
      ...current,
      [channelKey]: {
        ...(current[channelKey] || { fields: {} }),
        fields: {
          ...(current[channelKey]?.fields || {}),
          [fieldKey]: value
        }
      }
    }));
  }

  function updateEnabled(channelKey, enabled) {
    setChannelForms((current) => ({
      ...current,
      [channelKey]: {
        ...(current[channelKey] || { fields: {} }),
        enabled
      }
    }));
  }

  async function saveChannel(channelKey) {
    setError('');
    setMessage('');
    try {
      const form = channelForms[channelKey] || { enabled: false, fields: {} };
      const result = await api.saveBotChannel(channelKey, form);
      hydrate(result.config, channelKey);
      setMessage(channelKey === 'telegram' ? t('bot.telegramSaved') : t('bot.channelSaved'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function testTelegram() {
    setError('');
    setMessage('');
    try {
      const token = channelForms.telegram?.fields?.token || '';
      const result = await api.testTelegram({ token });
      if (result.success) setMessage(`${t('bot.telegramConnected')} @${result.botName || 'telegram bot'}.`);
      else setError(result.error || 'Telegram connection failed.');
    } catch (err) {
      setError(err.message);
    }
  }

  function renderField(channel, field) {
    const form = channelForms[channel.key] || { fields: {} };
    const value = form.fields?.[field.key] || '';
    const placeholder = field.secret && field.hasValue
      ? `${t('bot.secretSaved')}: ${field.maskedValue}`
      : field.placeholder;
    const commonProps = {
      className: field.type === 'textarea' ? 'textarea' : 'input',
      value,
      placeholder,
      onChange: (event) => updateField(channel.key, field.key, event.target.value)
    };

    return (
      <label className="field" key={field.key}>
        <span className="label">{field.label}</span>
        {field.type === 'textarea' ? (
          <textarea {...commonProps} />
        ) : (
          <input {...commonProps} type={field.type === 'password' ? 'password' : 'text'} />
        )}
        {field.secret && field.hasValue && <span className="hint">{t('bot.secretSaved')}: {field.maskedValue}</span>}
      </label>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('bot.eyebrow')}</p>
          <h1 className="page-title">{t('bot.title')}</h1>
          <p className="page-description">{t('bot.description')}</p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={() => load(active)}>{t('common.refresh')}</button>
          <button className="button primary" onClick={() => api.botAction('restart').then(() => load('telegram'))}>{t('bot.restartTelegram')}</button>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}
      {message && <div className="alert success" style={{ marginBottom: 16 }}>{message}</div>}

      {config && (
        <>
          <div className="section-title">{t('bot.channels')}</div>
          <div className="channel-grid">
            {config.channels.map((channel) => {
              const form = channelForms[channel.key] || {};
              return (
                <div
                  className={`channel-card ${channel.key === activeChannel?.key ? 'active' : ''}`}
                  key={channel.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(channel.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setActive(channel.key);
                  }}
                >
                  <div className="channel-head">
                    <ChannelIcon channelKey={channel.key} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 className="channel-name">{channel.displayName}</h2>
                      <div className="channel-category">{channel.category}</div>
                    </div>
                  </div>
                  <div className="provider-meta">
                    <span className={`badge ${runtimeTone(channel)}`}>{runtimeLabel(channel, t)}</span>
                    <label className="switch" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={Boolean(form.enabled)}
                        onChange={(event) => updateEnabled(channel.key, event.target.checked)}
                      />
                      On
                    </label>
                  </div>
                  <div className="provider-stats">
                    <span className="badge gray">{channel.completeFieldCount}/{channel.requiredFieldCount} fields</span>
                    <span className={`badge ${channel.runtime === 'implemented' ? 'green' : 'amber'}`}>
                      {channel.runtime === 'implemented' ? 'Live' : 'Adapter'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {activeChannel && (
            <div className="detail-grid" style={{ marginTop: 16 }}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{activeChannel.displayName} {t('bot.setup')}</h2>
                    <p className="card-subtitle">{activeChannel.description}</p>
                  </div>
                  <span className={`badge ${runtimeTone(activeChannel)}`}>{runtimeLabel(activeChannel, t)}</span>
                </div>
                <div className="card-body stack">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(channelForms[activeChannel.key]?.enabled)}
                      onChange={(event) => updateEnabled(activeChannel.key, event.target.checked)}
                    />
                    {t('common.enabled')}
                  </label>

                  <div className="form-grid">
                    {activeChannel.fields.map((field) => renderField(activeChannel, field))}
                  </div>

                  {activeChannel.runtime !== 'implemented' && (
                    <div className="alert info">
                      {activeChannel.displayName} credentials are saved now. Runtime delivery will be enabled when its adapter is implemented.
                    </div>
                  )}

                  <div className="toolbar">
                    {activeChannel.key === 'telegram' && (
                      <button className="button" onClick={testTelegram}>{t('bot.testTelegram')}</button>
                    )}
                    <button className="button primary" onClick={() => saveChannel(activeChannel.key)}>{t('bot.saveChannel')}</button>
                    {activeChannel.key === 'telegram' && (
                      <button className="button" onClick={() => api.botAction('restart').then(() => load('telegram'))}>{t('bot.restartTelegram')}</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{t('bot.createGuide')}</h2>
                    <p className="card-subtitle">{activeChannel.displayName}</p>
                  </div>
                  {activeChannel.setupUrl && (
                    <a className="button" href={activeChannel.setupUrl} target="_blank" rel="noreferrer">{t('bot.openGuide')}</a>
                  )}
                </div>
                <div className="card-body">
                  <ol className="step-list">
                    {activeChannel.setupSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeChannel?.key === 'telegram' && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <div>
                  <h2 className="card-title">{t('bot.allowedUsers')}</h2>
                  <p className="card-subtitle">Manage Telegram access in Access Control. Saved users are checked by the running bot immediately.</p>
                </div>
                <Link className="button primary" to="/access-control">{t('nav.access')}</Link>
              </div>
              <div className="card-body">
                <div className="provider-stats">
                  <span className="badge green">{config.users.filter((user) => user.enabled).length} {t('common.enabled')}</span>
                  <span className="badge gray">{config.users.length} total</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BotConfiguration;
