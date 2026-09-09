import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Trash2, ClipboardCheck, UserCheck } from 'lucide-react'
import { api } from '../lib/api'
import { isAdmin } from '../lib/auth'
import Toast from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import {
  ALL_SECTIONS, countSection, checklistProgress,
  STATUS_COLORS, STATUS_LABELS,
} from '../lib/checklistData'

function ReadOnlyGrid({ items, values }) {
  return (
    <div className="check-grid read-grid">
      {items.map((item) => (
        <div key={item.key} className={`read-item ${values?.[item.key] ? 'yes' : 'no'}`}>
          <span className={`check-icon ${values?.[item.key] ? 'yes' : 'no'}`}>
            {values?.[item.key] ? <CheckCircle2 size={12} /> : <span className="x-mark">✕</span>}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function SubmissionDetail({ profile }) {
  const { id } = useParams()
  const admin = isAdmin(profile)
  const [checklist, setChecklist] = useState(null)
  const [approvers, setApprovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getChecklist(id)
      const { approvers = [], ...checklist } = data || {}
      setChecklist(checklist)
      setApprovers(approvers)
    } catch (_e) {
      setChecklist(null)
      setApprovers([])
    }
    setLoading(false)
  }

  const updateStatus = async (newStatus, label) => {
    setUpdating(true)
    try {
      await api.updateStatus(id, newStatus)
      setChecklist((prev) => ({ ...prev, status: newStatus }))
      setToast(`Checklist marked as ${label}`)
    } catch (err) {
      setChecklist((prev) => prev)
    }
    setUpdating(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this checklist permanently?')) return
    setUpdating(true)
    try {
      await api.deleteChecklist(id)
    } catch (_e) { /* ignore */ }
    setUpdating(false)
    window.location.href = admin ? '/submissions' : '/my-submissions'
  }

  if (loading) return <div className="content-main"><div className="empty"><div className="spinner" /><p>Loading...</p></div></div>
  if (!checklist) return <div className="content-main"><div className="empty">Checklist not found. <Link to="/dashboard">Go back</Link></div></div>

  const approverMap = {}
  approvers.forEach((a) => { approverMap[a.role] = a })
  const isOwner = profile?.id === checklist.user_id
  const canApprove = admin
  const canDelete = admin || isOwner
  const progress = Math.round(checklistProgress(checklist) * 100)

  return (
    <div className="content-main">
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}

      <div className="page-header detail-header">
        <div>
          <Link to={admin ? '/submissions' : '/my-submissions'} className="back-link">
            <ArrowLeft size={15} /> Back to {admin ? 'All Submissions' : 'My Submissions'}
          </Link>
          <div className="eyebrow">Checklist Review</div>
          <h1>{checklist.video_title || 'Untitled'}</h1>
          <p>Submitted on {new Date(checklist.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="status-actions">
          <span className="status-badge large" style={{ background: STATUS_COLORS[checklist.status] }}>
            {STATUS_LABELS[checklist.status]}
          </span>
          {canDelete && (
            <button className="btn-delete" disabled={updating} onClick={handleDelete}>
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>

      {canApprove && (
        <div className="approve-bar card">
          <div className="approve-bar-label"><UserCheck size={16} /> Review Decision</div>
          <div className="approve-bar-actions">
            <button className="btn-approve" disabled={updating} onClick={() => updateStatus('approved', 'Approved')}>
              <CheckCircle2 size={15} /> Approve
            </button>
            <button className="btn-changes" disabled={updating} onClick={() => updateStatus('changes_required', 'Changes Required')}>
              <AlertTriangle size={15} /> Changes Required
            </button>
            <button className="btn-reject" disabled={updating} onClick={() => updateStatus('not_approved', 'Not Approved')}>
              <XCircle size={15} /> Not Approved
            </button>
          </div>
        </div>
      )}

      <div className="progress-banner card">
        <div className="banner-row">
          <div className="banner-icon"><ClipboardCheck size={22} /></div>
          <div className="banner-main">
            <h3>Overall Completion</h3>
            <p>Checklist submission quality</p>
          </div>
          <div className="big-pct">{progress}%</div>
        </div>
        <ProgressBar value={progress} label="Progress" />
      </div>

      <div className="card detail-card">
        <div className="card-header"><h3>Video Details</h3></div>
        <div className="detail-grid">
          <div><span>Title</span><strong>{checklist.video_title}</strong></div>
          <div><span>Topic / Project</span><strong>{checklist.video_topic || '—'}</strong></div>
          <div><span>Editor</span><strong>{checklist.video_editor || '—'}</strong></div>
          <div><span>Prepared By</span><strong>{checklist.prepared_by || '—'}</strong></div>
          <div><span>Date</span><strong>{checklist.video_date || '—'}</strong></div>
          <div><span>Duration</span><strong>{checklist.video_duration || '—'}</strong></div>
          <div><span>Type</span><strong className="capitalize">{checklist.video_type?.replace('_', ' ') || '—'}</strong></div>
        </div>
      </div>

      {ALL_SECTIONS.map((s, i) => {
        const total = s.items.length
        const done = countSection(checklist[s.key])
        const complete = done === total
        return (
          <div key={s.key} className={`card section-card ${s.mandatory ? 'mandatory' : ''} ${complete ? 'complete' : ''}`}>
            <div className="card-header">
              <h3>{i + 1}. {s.title}{s.mandatory && <span className="badge-inline">MANDATORY</span>}</h3>
              <span className={`cs-count ${complete ? 'done' : ''}`}>
                {complete ? '✓ Complete' : `${done}/${total}`}
              </span>
            </div>
            <ReadOnlyGrid items={s.items} values={checklist[s.key]} />
            {(s.key === 'title_check' || s.key === 'description_check' || s.key === 'hashtags_check') && (
              <div className="final-display">
                <div className="text-area-label">
                  {s.key === 'title_check' ? 'Final Title'
                    : s.key === 'description_check' ? 'Final Description'
                    : 'Final Hashtags'}:
                </div>
                <div className="final-content">
                  {checklist[s.key]?.[s.key === 'title_check' ? 'final_title' : s.key === 'description_check' ? 'final_description' : 'final_hashtags'] || '—'}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="card form-card">
        <div className="card-header"><h3>Approvals</h3></div>
        <div className="approval-section">
          {['video_editor', 'social_media', 'final_approver'].map((role, i) => {
            const a = approverMap[role]
            const label = role === 'video_editor' ? 'Video Editor'
              : role === 'social_media' ? 'Social Media Executive' : 'Final Approver'
            return (
              <div className={`approval-box role-${i + 1} readonly`} key={role}>
                <h4>{label}</h4>
                <div className="approval-detail"><span>Name:</span> {a?.name || '—'}</div>
                <div className="approval-detail"><span>Signature:</span> {a?.signature || '—'}</div>
                <div className="approval-detail"><span>Date:</span> {a?.approved_at ? new Date(a.approved_at).toLocaleDateString('en-IN') : '—'}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`publish-warning ${checklist.status === 'approved' ? 'ready' : ''}`}>
        {checklist.status === 'approved' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        <span>
          {checklist.status === 'approved'
            ? 'This checklist is APPROVED for upload.'
            : 'PUBLISH ONLY AFTER ALL MANDATORY CHECKS ARE COMPLETED AND APPROVED.'}
        </span>
      </div>
    </div>
  )
}
