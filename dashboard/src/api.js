async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options,
    body: options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || response.statusText };
  }

  if (!response.ok) {
    const error = new Error(data.error || response.statusText);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  getSession: () => request('/auth/session'),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  dashboard: () => request('/dashboard'),
  getBotConfig: () => request('/bot/config'),
  saveBotConfig: (payload) => request('/bot/config', { method: 'PATCH', body: payload }),
  saveBotChannel: (key, payload) => request(`/bot/channels/${key}`, { method: 'PATCH', body: payload }),
  testTelegram: (payload) => request('/bot/test-telegram', { method: 'POST', body: payload }),
  botAction: (action) => request(`/bot/${action}`, { method: 'POST' }),

  getGeneralSettings: () => request('/settings/general'),
  saveGeneralSettings: (payload) => request('/settings/general', { method: 'PATCH', body: payload }),

  getTelegramUsers: () => request('/telegram-users'),
  addTelegramUser: (payload) => request('/telegram-users', { method: 'POST', body: payload }),
  updateTelegramUser: (id, payload) => request(`/telegram-users/${id}`, { method: 'PATCH', body: payload }),
  deleteTelegramUser: (id) => request(`/telegram-users/${id}`, { method: 'DELETE' }),

  getProjects: () => request('/projects'),
  browseProjectPath: () => request('/projects/browse', { method: 'POST' }),
  addProject: (payload) => request('/projects', { method: 'POST', body: payload }),
  updateProject: (id, payload) => request(`/projects/${id}`, { method: 'PATCH', body: payload }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  testProjectPath: (path) => request(`/projects/test?path=${encodeURIComponent(path)}`),

  getLogs: (params = {}) => request(`/logs?${new URLSearchParams(params).toString()}`),

  getCliProviders: () => request('/cli-providers'),
  scanCliProviders: () => request('/cli-providers/scan', { method: 'POST' }),
  testCliCommand: (key, payload) => request(`/cli-providers/${key}/test-command`, { method: 'POST', body: payload }),
  updateCliProvider: (key, payload) => request(`/cli-providers/${key}`, { method: 'PATCH', body: payload }),
  detectModels: (key) => request(`/cli-providers/${key}/models/detect`, { method: 'POST' }),
  addModel: (key, payload) => request(`/cli-providers/${key}/models`, { method: 'POST', body: payload }),
  updateModel: (key, id, payload) => request(`/cli-providers/${key}/models/${id}`, { method: 'PATCH', body: payload }),
  deleteModel: (key, id) => request(`/cli-providers/${key}/models/${id}`, { method: 'DELETE' })
};
