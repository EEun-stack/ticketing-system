import { useEffect, useState } from 'react'
import { FaDatabase, FaPlus, FaRotate, FaServer, FaTrash, FaXmark } from 'react-icons/fa6'
import Sidebar from '../components/sidebar'
import { getAuthToken } from '../services/authStorage'
import '../styles/dashboard.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const statusLabels = { NEW: 'New', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }

async function adminFetch(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}`, ...options.headers },
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Request failed.')
  return result
}

function RequestRows({ requests, onSelect }) {
  if (!requests.length) return <p className="empty-state">No submitted requests.</p>
  return <div className="request-list">{requests.map((request) => <button className="request-row" type="button" key={request.id} onClick={() => onSelect?.(request)}><span><strong>{request.subject}</strong><small>{request.employeeName} · {request.requestType}</small></span><span><time>{new Date(request.createdAt).toLocaleString()}</time><em className={`status-badge ${request.status.toLowerCase()}`}>{statusLabels[request.status]}</em></span></button>)}</div>
}

function DashboardTab({ refreshKey }) {
  const [data, setData] = useState({ total: 0, statusCounts: {}, recent: [] })
  const [health, setHealth] = useState({ backend: 'Checking', database: 'Checking' })
  useEffect(() => {
    adminFetch('/api/admin/analytics').then(setData).catch(() => {})
    fetch(`${apiUrl}/api/health`, { cache: 'no-store' }).then(async (response) => { const result = await response.json(); setHealth({ backend: response.ok ? 'Online' : 'Offline', database: result.database === 'ok' ? 'Connected' : 'Offline' }) }).catch(() => setHealth({ backend: 'Offline', database: 'Offline' }))
  }, [refreshKey])
  return <section className="admin-panel"><div className="panel-heading"><div><p className="home-eyebrow">System overview</p><h1>Dashboard</h1></div><button className="icon-button" type="button" onClick={() => window.location.reload()} aria-label="Refresh dashboard" title="Refresh dashboard"><FaRotate /></button></div><div className="health-grid"><div className={`health-indicator ${health.backend === 'Online' ? 'healthy' : 'unhealthy'}`}><FaServer /><span><small>Backend</small><strong>{health.backend}</strong></span></div><div className={`health-indicator ${health.database === 'Connected' ? 'healthy' : 'unhealthy'}`}><FaDatabase /><span><small>Database</small><strong>{health.database}</strong></span></div></div><div className="metric-grid"><div className="metric-card"><span>Total requests</span><strong>{data.total}</strong></div><div className="metric-card"><span>New</span><strong>{data.statusCounts.NEW || 0}</strong></div><div className="metric-card"><span>In progress</span><strong>{data.statusCounts.IN_PROGRESS || 0}</strong></div><div className="metric-card"><span>Resolved</span><strong>{data.statusCounts.RESOLVED || 0}</strong></div></div><div className="panel-section"><div className="section-heading"><h2>Recent requests</h2><span>{data.recent.length} latest</span></div><RequestRows requests={data.recent} /></div></section>
}

function RequestsTab({ onChange }) {
  const [requests, setRequests] = useState([])
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => { adminFetch('/api/admin/requests').then(setRequests).catch((error) => setMessage(error.message)) }, [onChange])
  async function updateStatus(status) { try { const updated = await adminFetch(`/api/admin/requests/${selected.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setRequests((current) => current.map((request) => request.id === updated.id ? updated : request)); setSelected(updated); onChange() } catch (error) { setMessage(error.message) } }
  return <section className="admin-panel"><div className="panel-heading"><div><p className="home-eyebrow">Work queue</p><h1>Requests</h1></div></div>{message && <p className="error-message">{message}</p>}<RequestRows requests={requests} onSelect={setSelected} />{selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close request details"><FaXmark /></button><p className="home-eyebrow">Request details</p><h2 id="request-modal-title">{selected.subject}</h2><p className="modal-meta">{selected.employeeName} · {selected.contact} · {new Date(selected.createdAt).toLocaleString()}</p><p className="modal-description">{selected.description}</p><label className="modal-field">Status<select value={selected.status} onChange={(event) => updateStatus(event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>}</section>
}

function SettingsTab() {
  const [settings, setSettings] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => { adminFetch('/api/admin/settings').then(setSettings).catch((error) => setMessage(error.message)) }, [])
  if (!settings) return <section className="admin-panel"><p className="empty-state">{message || 'Loading settings...'}</p></section>
  function updateList(key, index, value) { setSettings({ ...settings, [key]: settings[key].map((item, itemIndex) => itemIndex === index ? value : item) }) }
  function addOption(key) { setSettings({ ...settings, [key]: [...settings[key], ''] }) }
  function removeOption(key, index) { setSettings({ ...settings, [key]: settings[key].filter((_, itemIndex) => itemIndex !== index) }) }
  async function saveSettings(event) { event.preventDefault(); try { await adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }); setMessage('Settings saved.') } catch (error) { setMessage(error.message) } }
  return <section className="admin-panel"><div className="panel-heading"><div><p className="home-eyebrow">Guest experience</p><h1>Settings</h1></div></div><form className="settings-form" onSubmit={saveSettings}><label>Form title<input value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} required /></label><label>Form description<textarea value={settings.description} onChange={(event) => setSettings({ ...settings, description: event.target.value })} rows="3" required /></label><div className="settings-columns">{[['requestTypes', 'Request types'], ['priorities', 'Priorities']].map(([key, label]) => <fieldset key={key}><legend>{label}</legend>{settings[key].map((value, index) => <div className="option-editor" key={`${key}-${index}`}><input value={value} onChange={(event) => updateList(key, index, event.target.value)} required /><button className="icon-button danger" type="button" onClick={() => removeOption(key, index)} aria-label={`Remove ${label} option`}><FaTrash /></button></div>)}<button className="text-button" type="button" onClick={() => addOption(key)}><FaPlus /> Add option</button></fieldset>)}</div><div className="form-actions"><span className="save-message">{message}</span><button className="primary-button" type="submit">Save settings</button></div></form></section>
}

function SuperadminHome({ sidebarCollapsed }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((value) => value + 1)
  return <main className={`admin-home ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}><Sidebar collapsed={sidebarCollapsed} activeTab={activeTab} onTabChange={setActiveTab} />{activeTab === 'dashboard' && <DashboardTab refreshKey={refreshKey} />}{activeTab === 'requests' && <RequestsTab onChange={refresh} />}{activeTab === 'settings' && <SettingsTab />}</main>
}

export default SuperadminHome
