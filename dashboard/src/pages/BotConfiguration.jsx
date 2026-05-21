import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Badge, Switch as SwitchComponent } from '../components/ui';
import {
  TelegramMark, WhatsAppMark, ZaloMark, DiscordMark, SlackMark,
  MessengerMark, LineMark, WeChatMark, WebChatMark
} from '../components/icons';

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

    return (
      <label className="field" key={field.key}>
        <span className="label">{field.label}</span>
        {field.type === 'textarea' ? (
          <textarea className="textarea" value={value} placeholder={placeholder} onChange={(event) => updateField(channel.key, field.key, event.target.value)} />
        ) : (
          <input className="input" value={value} placeholder={placeholder} type={field.type === 'password' ? 'password' : 'text'} onChange={(event) => updateField(channel.key, field.key, event.target.value)} />
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
                    <Badge tone={runtimeTone(channel)}>{runtimeLabel(channel, t)}</Badge>
                    <SwitchComponent
                      label="On"
                      checked={Boolean(form.enabled)}
                      onChange={(event) => updateEnabled(channel.key, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                  <div className="provider-stats">
                    <Badge tone="gray">{channel.completeFieldCount}/{channel.requiredFieldCount} fields</Badge>
                    <Badge tone={channel.runtime === 'implemented' ? 'green' : 'amber'}>
                      {channel.runtime === 'implemented' ? 'Live' : 'Adapter'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {activeChannel && (
            <div className="detail-grid" style={{ marginTop: 18 }}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{activeChannel.displayName} {t('bot.setup')}</h2>
                    <p className="card-subtitle">{activeChannel.description}</p>
                  </div>
                  <Badge tone={runtimeTone(activeChannel)}>{runtimeLabel(activeChannel, t)}</Badge>
                </div>
                <div className="card-body stack">
                  <SwitchComponent
                    label={t('common.enabled')}
                    checked={Boolean(channelForms[activeChannel.key]?.enabled)}
                    onChange={(event) => updateEnabled(activeChannel.key, event.target.checked)}
                  />

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
            <div className="card" style={{ marginTop: 18 }}>
              <div className="card-header">
                <div>
                  <h2 className="card-title">{t('bot.allowedUsers')}</h2>
                  <p className="card-subtitle">Manage Telegram access in Access Control. Saved users are checked by the running bot immediately.</p>
                </div>
                <Link className="button primary" to="/access-control">{t('nav.access')}</Link>
              </div>
              <div className="card-body">
                <div className="provider-stats">
                  <Badge tone="green">{config.users.filter((user) => user.enabled).length} {t('common.enabled')}</Badge>
                  <Badge tone="gray">{config.users.length} total</Badge>
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
