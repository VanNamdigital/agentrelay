import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Badge } from '../components/ui';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', path: '', is_default: false });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [browsing, setBrowsing] = useState(false);

  async function load() {
    setProjects(await api.getProjects());
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function browseProjectPath() {
    if (browsing) return;
    setError('');
    setMessage('');
    setBrowsing(true);
    try {
      const result = await api.browseProjectPath();
      if (result.cancelled) return;
      setForm((current) => ({
        ...current,
        name: current.name || result.name || '',
        path: result.path || ''
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBrowsing(false);
    }
  }

  async function add(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const path = form.path.trim();
      if (!path) {
        setError('Choose a project folder first.');
        return;
      }
      await api.addProject({ ...form, path });
      setForm({ name: '', path: '', is_default: false });
      await load();
      setMessage('Project saved.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function update(id, payload) {
    setError('');
    try {
      await api.updateProject(id, payload);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api.deleteProject(id);
    await load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Workspace paths</p>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">Register local project directories that Telegram users can select before running a CLI task.</p>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}
      {message && <div className="alert success" style={{ marginBottom: 16 }}>{message}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Add project</h2>
              <p className="card-subtitle">Choose a local folder, then save it as a project.</p>
            </div>
          </div>
          <div className="card-body stack">
            <form className="form-grid" onSubmit={add}>
              <label className="field full">
                <span className="label">Project path</span>
                <div className="input-action">
                  <input className="input mono" value={form.path} onChange={(event) => setForm({ ...form, path: event.target.value })} placeholder="G:/projects/my-project" disabled={browsing} />
                  <button className="button" type="button" onClick={browseProjectPath} disabled={browsing}>
                    {browsing ? 'Opening...' : 'Browse...'}
                  </button>
                </div>
              </label>
              <label className="field">
                <span className="label">Project name</span>
                <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Optional (default: folder name)" disabled={browsing} />
              </label>
              <label className="switch">
                <input type="checkbox" checked={form.is_default} onChange={(event) => setForm({ ...form, is_default: event.target.checked })} disabled={browsing} />
                Set as default project
              </label>
              <div className="toolbar" style={{ gridColumn: '1 / -1' }}>
                <button className="button" type="button" disabled={browsing || !form.path} onClick={() => form.path && api.testProjectPath(form.path).then((result) => setMessage(result.exists ? 'Path exists.' : 'Path is missing.'))}>Test path</button>
                <button className="button primary" disabled={browsing}>{browsing ? 'Waiting...' : 'Add project'}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Configured projects</h2>
              <p className="card-subtitle">Missing paths stay visible so admins can fix them.</p>
            </div>
          </div>
          <div className="card-body table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Path</th><th>Status</th><th>Default</th><th>Actions</th></tr></thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td><strong>{project.name}</strong></td>
                    <td className="mono">{project.path}</td>
                    <td><Badge tone={project.exists ? 'green' : 'red'}>{project.exists ? 'Exists' : 'Missing'}</Badge></td>
                    <td>{project.is_default ? <Badge tone="blue">Default</Badge> : <button className="button" onClick={() => update(project.id, { is_default: true })}>Set default</button>}</td>
                    <td><button className="button danger" onClick={() => remove(project.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projects.length === 0 && <div className="empty">No projects configured yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Projects;
