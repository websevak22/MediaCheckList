import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, FileQuestion, Trash2, Eye } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { STATUS_COLORS, STATUS_LABELS, checklistProgress } from '../lib/checklistData'

export default function Submissions({ profile, admin }) {
  const showToast = useToast()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line
  }, [admin, profile?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.listChecklists()
      setSubmissions(data || [])
    } catch (_e) {
      setSubmissions([])
    }
    setLoading(false)
  }

  const filtered = submissions.filter((s) => {
    const matchStatus = filter === 'all' || s.status === filter
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (s.video_title || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    changes_required: submissions.filter((s) => s.status === 'changes_required').length,
    not_approved: submissions.filter((s) => s.status === 'not_approved').length,
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this checklist permanently?')) return
    try {
      await api.deleteChecklist(id)
      showToast('Checklist deleted')
    } catch (_e) { /* ignore */ }
    fetchData()
  }

  return (
    <div className="content-main">
      <div className="page-header">
        <div>
          <div className="eyebrow">{admin ? 'Administration' : 'My Content'}</div>
          <h1>{admin ? 'All Submissions' : 'My Submissions'}</h1>
          <p>{admin ? 'Review, search and approve all checklist submissions.' : 'Track the status of your submitted checklists.'}</p>
        </div>
        <Link to="/new" className="btn-primary">
          <Plus size={16} /><span>New Checklist</span>
        </Link>
      </div>

      <div className="stats-grid compact">
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{counts.all}</div><div className="stat-label">Total</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{counts.pending}</div><div className="stat-label">Pending</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{counts.approved}</div><div className="stat-label">Approved</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{counts.changes_required}</div><div className="stat-label">Changes Required</div></div></div>
      </div>

      <div className="card">
        <div className="list-controls">
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Search by video title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row">
            {['all', 'pending', 'approved', 'changes_required', 'not_approved'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
                <span className="filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty"><div className="spinner" /><p>Loading submissions...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <FileQuestion size={44} className="empty-icon" />
            {search || filter !== 'all'
              ? <p>No submissions match your filters.</p>
              : <p>No submissions yet.</p>}
            {!search && filter === 'all' && (
              <Link to="/new" className="btn-primary"><Plus size={15} /> Create a checklist</Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Video Title</th>
                  <th>Editor</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-date" data-label="Date">{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="title-cell" data-label="Video Title">{s.video_title || 'Untitled'}</td>
                    <td data-label="Editor">{s.video_editor || '—'}</td>
                    <td data-label="Progress">
                      <div className="mini-progress">
                        <div className="mini-track">
                          <div className="mini-fill" style={{ width: `${Math.round(checklistProgress(s) * 100)}%` }} />
                        </div>
                        <span>{Math.round(checklistProgress(s) * 100)}%</span>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className="status-badge" style={{ background: STATUS_COLORS[s.status] }}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="cell-actions" data-label="Actions">
                      <Link to={`/submission/${s.id}`} className="icon-btn view" title="View"><Eye size={15} /></Link>
                      <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(s.id)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
