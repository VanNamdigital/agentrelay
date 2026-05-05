import React, { useEffect, useState } from 'react';
import { api } from '../api';

function AccessControl() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: '', display_name: '', role: 'user' });
  const [error, setError] = useState('');

  async function load() {
    setUsers(await api.getTelegramUsers());
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function add(event) {
    event.preventDefault();
    setError('');
    try {
      await api.addTelegramUser(form);
      setForm({ user_id: '', display_name: '', role: 'user' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function update(id, payload) {
    await api.updateTelegramUser(id, payload);
    await load();
  }

  async function remove(id) {
    await api.deleteTelegramUser(id);
    await load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Permissions</p>
          <h1 className="page-title">Access Control</h1>
          <p className="page-description">Manage Telegram user IDs allowed to use the bot. Changes are stored in SQLite and checked by the running bot immediately.</p>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Add allowed user</h2>
              <p className="card-subtitle">Use @userinfobot or Telegram APIs to find numeric user IDs.</p>
            </div>
          </div>
          <form className="card-body form-grid" onSubmit={add}>
            <label className="field">
              <span className="label">Telegram user ID</span>
              <input className="input mono" value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} />
            </label>
            <label className="field">
              <span className="label">Display name</span>
              <input className="input" value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} />
            </label>
            <label className="field">
              <span className="label">Role</span>
              <select className="select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            <div className="field" style={{ justifyContent: 'end' }}>
              <button className="button primary">Add user</button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Allowed users</h2>
              <p className="card-subtitle">Disabled users are blocked from the Telegram bot.</p>
            </div>
          </div>
          <div className="card-body table-wrap">
            <table className="table">
              <thead><tr><th>User ID</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="mono">{user.user_id}</td>
                    <td>{user.display_name || 'Unnamed'}</td>
                    <td>
                      <select className="select" value={user.role} onChange={(event) => update(user.id, { role: event.target.value })}>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td><span className={`badge ${user.enabled ? 'green' : 'gray'}`}>{user.enabled ? 'Enabled' : 'Disabled'}</span></td>
                    <td className="row-actions">
                      <button className="button" onClick={() => update(user.id, { enabled: !user.enabled })}>{user.enabled ? 'Disable' : 'Enable'}</button>
                      <button className="button danger" onClick={() => remove(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="empty">No Telegram users configured yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessControl;
