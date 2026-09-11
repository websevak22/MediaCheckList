import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, FileQuestion, Trash2, Eye, Pencil, CalendarDays,
  ClipboardList, Clock, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { STATUS_COLORS, STATUS_LABELS, checklistProgress } from '../lib/checklistData'

const EVENT_COLOR = '#8b5cf6'
const STATUS_FILTERS = ['all', 'pending', 'approved', 'changes_required', 'not_approved']

const statsFor = (submissions, events, admin) => [
  {
    label: admin ? 'Total Submissions' : 'My Checklists',
    value: submissions.length,
    icon: ClipboardList,
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  { label: 'Event Plans', value: events.length, icon: CalendarDays, color: EVENT_COLOR, bg: '#f5f3ff' },
  { label: 'Pending', value: submissions.filter((s) => s.status === 'pending').length, icon: Clock, color: '#f59e0b', bg: '#fff7ed' },
  { label: 'Approved', value: submissions.filter((s) => s.status === 'approved').length, icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
  { label: 'Changes Required', value: submissions.filter((s) => s.status === 'changes_required').length, icon: AlertTriangle, color: '#f97316', bg: '#fef3c7' },
  { label: 'Not Approved', value: submissions.filter((s) => s.status === 'not_approved').length, icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
]

const formatDay = (iso) => {
  const dt = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return iso || ''
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Submissions({ profile, admin }) {
  const showToast = useToast()
  const [submissions, setSubmissions] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all') // all | checklist | event
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line
  }, [admin, profile?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [checklists, eventPlans] = await Promise.all([
        api.listChecklists(),
        api.listEvents(),
      ])
      const sortNew = (arr) => (arr || []).sort((a, b) => new Date(b?.created_at) - new Date(a?.created_at))
      setSubmissions(sortNew(checklists))
      setEvents(sortNew(eventPlans))
    } catch (_e) {
      setSubmissions([])
      setEvents([])
    }
    setLoading(false)
  }

  const titleOf = (s) => s.video_title || s.program_title || 'Untitled'
  const term = search.trim().toLowerCase()
  const titleMatch = (s) => !term || titleOf(s).toLowerCase().includes(term)

  const checklists = submissions.filter((s) => titleMatch(s) && (statusFilter === 'all' || s.status === statusFilter))
  const eventPlans = events.filter(titleMatch)

  const showChecklists = typeFilter !== 'event'
  const showEvents = typeFilter !== 'checklist'

  const groupCount = (arr) => {
    if (arr.length === 0) return ''
    const total = typeFilter === 'all' ? arr.length : arr.length
    return `(${total})`
  }

  const handleDeleteChecklist = async (id) => {
    if (!confirm('Delete this checklist permanently?')) return
    try {
      await api.deleteChecklist(id)
      showToast('Checklist deleted')
    } catch (_e) { /* ignore */ }
    fetchData()
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event plan permanently?')) return
    try {
      await api.deleteEvent(id)
      showToast('Event plan deleted successfully!')
    } catch (_e) { /* ignore */ }
    fetchData()
  }

  const hasResults = (showChecklists && checklists.length > 0) || (showEvents && eventPlans.length > 0)

  return (
    <div className="content-main">
      <div className="page-header">
        <div>
          <div className="eyebrow">{admin ? 'Administration' : 'My Content'}</div>
          <h1>{admin ? 'All Submissions' : 'My Submissions'}</h1>
          <p>{admin ? 'Review, search and manage all checklist submissions and event plans.' : 'Track the status of your submitted checklists and event plans.'}</p>
        </div>
        <div className="header-actions">
          <Link to="/event-planner" className="btn-outline">
            <CalendarDays size={15} /><span>New Event Plan</span>
          </Link>
          <Link to="/new" className="btn-primary">
            <Plus size={16} /><span>New Checklist</span>
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        {statsFor(submissions, events, admin).map((s) => {
          const Icon = s.icon
          return (
            <div className="stat-card" style={{ '--edge-c': s.color }} key={s.label}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <Icon size={21} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="list-controls">
          <div className="sub-toolbar">
            <div className="search-wrap">
              <Search size={16} className="search-icon" />
              <input
                className="search-input"
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="seg" role="tablist" aria-label="Content type">
              {[
                { key: 'all', label: 'All' },
                { key: 'checklist', label: 'Checklists' },
                { key: 'event', label: 'Event Plans' },
              ].map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={typeFilter === t.key}
                  className={`seg-btn ${typeFilter === t.key ? 'active' : ''}`}
                  onClick={() => setTypeFilter(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {showChecklists && (
            <div className="filter-row">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'all' ? 'All' : STATUS_LABELS[f]}
                  <span className="filter-count">
                    {f === 'all' ? submissions.length : submissions.filter((s) => s.status === f).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty"><div className="spinner" /><p>Loading submissions...</p></div>
        ) : !hasResults ? (
          <div className="empty">
            <FileQuestion size={44} className="empty-icon" />
            {search || statusFilter !== 'all'
              ? <p>No {typeFilter === 'event' ? 'event plans' : 'submissions'} match your search.</p>
              : typeFilter === 'event'
                ? <p>No event plans yet.</p>
                : admin
                  ? <p>No submissions yet.</p>
                  : <p>You haven't submitted anything yet.</p>}
            {!search && statusFilter === 'all' && (
              <div className="empty-actions">
                {typeFilter !== 'event' && (
                  <Link to="/new" className="btn-primary"><Plus size={15} /> Create a checklist</Link>
                )}
                {typeFilter !== 'checklist' && (
                  <Link to="/event-planner" className="btn-outline"><CalendarDays size={15} /> Plan an event</Link>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="submission-list-wrap">
            {showChecklists && (
              <section className="sub-group">
                <h4 className="group-label">
                  <ClipboardList size={15} /> Checklists {groupCount(checklists)}
                </h4>
                {checklists.length === 0 ? (
                  <div className="empty small-empty">
                    <p>{search ? `No checklists match "${search}".` : 'No checklists in this filter.'}</p>
                  </div>
                ) : (
                  <div className="submission-list">
                    {checklists.map((s) => (
                      <div className="submission-row" key={s.id}>
                        <div
                          className="sub-progress-ring"
                          style={{ '--p': `${Math.round(checklistProgress(s) * 100)}%` }}
                        >
                          <span>{Math.round(checklistProgress(s) * 100)}</span>
                        </div>
                        <div className="sub-info">
                          <strong className="sub-title">{s.video_title || 'Untitled'}</strong>
                          <span className="sub-meta">
                            {formatDate(s.created_at)}
                            {s.video_editor ? ` · ${s.video_editor}` : ''}
                            {s.video_type ? ` · ${(s.video_type || '').replace('_', ' ')}` : ''}
                          </span>
                        </div>
                        <span
                          className="status-badge"
                          style={{ background: STATUS_COLORS[s.status] }}
                        >
                          {STATUS_LABELS[s.status]}
                        </span>
                        <div className="row-actions">
                          <Link to={`/submission/${s.id}`} className="btn-view"><Eye size={13} />View</Link>
                          <Link to={`/edit/${s.id}`} className="btn-edit"><Pencil size={13} />Edit</Link>
                          <Link to={`/submission/${s.id}`} className="icon-btn-sm view" title="View"><Eye size={15} /></Link>
                          <button
                            className="icon-btn-sm delete"
                            title="Delete"
                            onClick={() => handleDeleteChecklist(s.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {showEvents && (
              <section className="sub-group">
                <h4 className="group-label event">
                  <CalendarDays size={15} /> Event Plans {groupCount(eventPlans)}
                </h4>
                {eventPlans.length === 0 ? (
                  <div className="empty small-empty">
                    <p>{search ? `No event plans match "${search}".` : 'No event plans yet.'}</p>
                  </div>
                ) : (
                  <div className="submission-list">
                    {eventPlans.map((ev) => (
                      <div className="submission-row" key={`ev-${ev.id}`}>
                        <div className="event-ring">
                          <CalendarDays size={18} />
                        </div>
                        <div className="sub-info">
                          <strong className="sub-title">{ev.program_title || 'Untitled Event'}</strong>
                          <span className="sub-meta">
                            {formatDay(ev.program_date) || formatDate(ev.created_at)}
                            {ev.location ? ` · ${ev.location}` : ''}
                          </span>
                          <span className="sub-meta muted-line">
                            {ev.beneficiaries_required ? `${ev.beneficiaries_required} beneficiaries` : ''}
                            {ev.volunteers_required ? ` · ${ev.volunteers_required} volunteers` : ''}
                          </span>
                        </div>
                        <span className="status-badge" style={{ background: EVENT_COLOR }}>Event Plan</span>
                        <div className="row-actions">
                          <Link to={`/event-planner?id=${ev.id}`} className="btn-view"><Eye size={13} />View</Link>
                          <Link to={`/event-planner?edit=${ev.id}`} className="btn-edit"><Pencil size={13} />Edit</Link>
                          <Link to={`/event-planner?id=${ev.id}`} className="icon-btn-sm view" title="View"><Eye size={15} /></Link>
                          <button
                            className="icon-btn-sm delete"
                            title="Delete"
                            onClick={() => handleDeleteEvent(ev.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}