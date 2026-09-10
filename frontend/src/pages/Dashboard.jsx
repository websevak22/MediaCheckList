import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Clock, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, FileQuestion, FileDown, Trash2, Eye, Printer,
} from 'lucide-react'
import { api } from '../lib/api'
import { isAdmin } from '../lib/auth'
import { useToast } from '../components/Toast'
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, TYPE_COLORS, checklistProgress, countSection, ALL_SECTIONS } from '../lib/checklistData'
import ProgressBar from '../components/ProgressBar'

export default function Dashboard({ profile }) {
  const admin = isAdmin(profile)
  const showToast = useToast()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listChecklists()
      .then((data) => setSubmissions(data || []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false))
  }, [])

  const countBy = (status) => submissions.filter((s) => s.status === status).length
  const recent = submissions.slice(0, 6)
  const avgProgress = submissions.length
    ? Math.round(submissions.reduce((a, s) => a + checklistProgress(s), 0) / submissions.length * 100)
    : 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const statusOrder = ['pending', 'changes_required', 'approved', 'not_approved']
  const statusBreakdown = statusOrder
    .map((status) => ({ status, count: countBy(status) }))
    .filter((s) => s.count > 0)
  const maxCount = Math.max(1, ...statusBreakdown.map((s) => s.count))

  const deleteSubmission = async (s) => {
    if (!confirm(`Delete "${s.video_title || 'this checklist'}" permanently?`)) return
    try {
      await api.deleteChecklist(s.id)
      setSubmissions((prev) => prev.filter((x) => x.id !== s.id))
      showToast('Checklist deleted')
    } catch (_e) { /* ignore */ }
  }

  const reportRows = () => submissions.map((s) => {
    const sec = {}
    ALL_SECTIONS.forEach((x) => {
      const total = x.items.length
      const done = countSection(s[x.key])
      sec[x.title] = total ? `${done}/${total}` : '0/0'
    })
    return {
      'Title': s.video_title || '',
      'Topic': s.video_topic || '',
      'Editor': s.video_editor || '',
      'Prepared By': s.prepared_by || '',
      'Date': s.video_date || '',
      'Duration': s.video_duration || '',
      'Type': s.video_type?.replace('_', ' ') || '',
      'Accuracy %': Math.round(checklistProgress(s) * 100),
      'Status': STATUS_LABELS[s.status] || s.status || '',
      'Submitted': s.created_at ? new Date(s.created_at).toLocaleString('en-IN') : '',
      ...sec,
    }
  })

  const downloadReport = () => {
    if (!submissions.length) return
    const rows = reportRows()
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => {
        const v = r[h]
        const str = v === null || v === undefined ? '' : String(v)
        return `"${str.replace(/"/g, '""')}"`
      }).join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-marketing-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printReport = () => {
    if (!submissions.length) return
    document.body.classList.add('report-print')
    const cleanup = () => {
      document.body.classList.remove('report-print')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    setTimeout(cleanup, 1000)
    window.print()
  }

  const stats = admin
    ? [
        { label: 'Total Submissions', value: submissions.length, icon: FileQuestion, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Pending', value: countBy('pending'), icon: Clock, color: '#f59e0b', bg: '#fff7ed' },
        { label: 'Approved', value: countBy('approved'), icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
        { label: 'Changes Required', value: countBy('changes_required'), icon: AlertTriangle, color: '#f97316', bg: '#fef3c7' },
        { label: 'Not Approved', value: countBy('not_approved'), icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
      ]
    : [
        { label: 'My Submissions', value: submissions.length, icon: FileQuestion, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Pending', value: countBy('pending'), icon: Clock, color: '#f59e0b', bg: '#fff7ed' },
        { label: 'Approved', value: countBy('approved'), icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
        { label: 'Changes Required', value: countBy('changes_required'), icon: AlertTriangle, color: '#f97316', bg: '#fef3c7' },
      ]

  return (
    <div className="content-main">
      <div className="hero-banner">
        <div className="hero-text">
          <div className="eyebrow">{admin ? 'Admin Overview' : 'Personal Overview'}</div>
          <h1>{greeting}, {firstName}</h1>
          <p>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {' · '}
            {admin ? 'Monitor and approve all checklist submissions.' : 'Track your video checklists and approvals.'}
          </p>
        </div>
        <Link to="/new" className="btn-primary hero-cta">
          <Plus size={16} />
          <span>New Checklist</span>
        </Link>
      </div>

      <div className="stats-grid">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div className="stat-card" style={{ '--edge-c': s.color }} key={s.label}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <Icon size={22} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <div className="card recent-card">
          <div className="card-header">
            <h3>{admin ? 'Recent Submissions' : 'My Recent Submissions'}</h3>
            <Link to={admin ? '/submissions' : '/my-submissions'} className="link-view">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="empty"><div className="spinner" /><p>Loading submissions...</p></div>
          ) : recent.length === 0 ? (
            <div className="empty">
              <FileQuestion size={40} className="empty-icon" />
              <p>No submissions yet.</p>
              <Link to="/new" className="btn-primary">
                <Plus size={15} /> Create your first checklist
              </Link>
            </div>
          ) : (
            <div className="submission-list">
              {recent.map((s) => (
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
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {s.video_editor ? ` · ${s.video_editor}` : ''}
                    </span>
                    {s.video_type && (
                      <span className="type-chip" style={{ color: TYPE_COLORS[s.video_type] || '#66717f' }}>
                        <span className="type-dot" style={{ background: TYPE_COLORS[s.video_type] || '#66717f' }} />
                        {TYPE_LABELS[s.video_type] || s.video_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: STATUS_COLORS[s.status] }}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                  <Link to={`/submission/${s.id}`} className="btn-view">View</Link>
                  <Link to={`/submission/${s.id}`} className="icon-btn-sm view" title="View">
                    <Eye size={15} />
                  </Link>
                  <button
                    className="icon-btn-sm delete"
                    title="Delete"
                    onClick={() => deleteSubmission(s)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stack-col">
          {submissions.length > 0 && (
            <div className="card overview-card">
              <div className="overview-head">
                <div className="banner-icon"><FileQuestion size={20} /></div>
                <div>
                  <div className="overview-title">Completion Overview</div>
                  <div className="overview-sub">
                    {admin ? 'Average accuracy across all submissions' : 'Average accuracy of my submissions'}
                  </div>
                </div>
                <div className="overview-pct">{avgProgress}%</div>
              </div>
              <div className="banner-progress">
                <ProgressBar value={avgProgress} label="Average completion" />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3>Status Breakdown</h3>
            </div>
            {statusBreakdown.length === 0 ? (
              <p className="status-empty">No submissions yet.</p>
            ) : (
              <div className="status-breakdown">
                {statusBreakdown.map((s) => (
                  <div className="status-line" key={s.status}>
                    <div className="status-line-top">
                      <span className="status-line-label">
                        <span className="status-dot" style={{ background: STATUS_COLORS[s.status] }} />
                        {STATUS_LABELS[s.status]}
                      </span>
                      <strong>{s.count}</strong>
                    </div>
                    <div className="status-track">
                      <div
                        className="status-fill"
                        style={{ width: `${(s.count / maxCount) * 100}%`, background: STATUS_COLORS[s.status] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card report-card">
        <div className="report-head">
          <div className="report-icon"><FileDown size={22} /></div>
          <div className="report-main">
            <h3>Download Report</h3>
            <p>Export all {admin ? 'submissions' : 'your submissions'} to CSV or PDF with section-wise completion. CSV opens in Excel.</p>
          </div>
          <div className="report-actions">
            <button
              className="btn-primary report-btn"
              onClick={downloadReport}
              disabled={!submissions.length}
            >
              <FileDown size={16} />
              <span>{submissions.length ? `Download CSV (${submissions.length})` : 'No data yet'}</span>
            </button>
            <button
              className="btn-primary report-btn"
              onClick={printReport}
              disabled={!submissions.length}
            >
              <Printer size={16} />
              <span>{submissions.length ? `Download PDF (${submissions.length})` : 'No data yet'}</span>
            </button>
          </div>
        </div>
      </div>

      {submissions.length > 0 && (
        <div className="report-sheet" aria-hidden="true">
          <div className="report-sheet-head">
            <h1>BEING SEVAK CHARITABLE TRUST</h1>
            <h2>Digital Marketing — YouTube Checklist Report</h2>
            <p>
              Prepared by {profile?.full_name || profile?.email || '—'} ·{' '}
              {new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}{submissions.length} submission(s)
            </p>
          </div>
          <table className="report-sheet-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Editor</th>
                <th>Date</th>
                <th>Accuracy</th>
                <th>Status</th>
                {ALL_SECTIONS.map((sec) => <th key={sec.key}>{sec.title}</th>)}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.video_title || 'Untitled'}</td>
                  <td>{s.video_editor || ''}</td>
                  <td>{s.video_date || ''}</td>
                  <td>{Math.round(checklistProgress(s) * 100)}%</td>
                  <td>
                    <span className="report-status" style={{ background: STATUS_COLORS[s.status] }}>
                      {STATUS_LABELS[s.status] || s.status || ''}
                    </span>
                  </td>
                  {ALL_SECTIONS.map((sec) => {
                    const total = sec.items.length
                    const done = countSection(s[sec.key])
                    return <td key={sec.key}>{total ? `${done}/${total}` : ''}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}