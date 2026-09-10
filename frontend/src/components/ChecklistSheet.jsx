import { CheckCircle2, AlertTriangle, ClipboardCheck } from 'lucide-react'
import ProgressBar from './ProgressBar'
import {
  ALL_SECTIONS, countSection, checklistProgress,
  STATUS_COLORS, STATUS_LABELS,
} from '../lib/checklistData'

function ReadOnlyGrid({ items, values }) {
  return (
    <div className="check-grid read-grid">
      {items.map((item) => {
        const val = !!values?.[item.key]
        return (
          <div key={item.key} className={`read-item ${val ? 'yes' : 'no'}`}>
            <span className={`check-icon ${val ? 'yes' : 'no'}`}>
              {val ? <CheckCircle2 size={12} /> : <span className="x-mark">✕</span>}
            </span>
            <span className="read-label">{item.label}</span>
            <span className="yn-boxes" aria-hidden="true">
              <span className={`yn-box no ${!val ? 'on' : ''}`}>No</span>
              <span className={`yn-box yes ${val ? 'on' : ''}`}>Yes</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function ChecklistSheet({ checklist }) {
  const progress = Math.round(checklistProgress(checklist) * 100)
  const approverMap = {}
  ;(checklist?.approvers || []).forEach((a) => { approverMap[a.role] = a })

  return (
    <>
      <div className="print-only print-header">
        <h1>BEING SEVAK CHARITABLE TRUST</h1>
        <h2>YouTube Video — Pre-Upload Checklist &amp; Approval Form</h2>
        <div className="print-meta">
          <span><strong>Video:</strong> {checklist.video_title || 'Untitled'}</span>
          <span><strong>Editor:</strong> {checklist.video_editor || '—'}</span>
          <span><strong>Submitted:</strong> {checklist.created_at ? new Date(checklist.created_at).toLocaleString('en-IN') : '—'}</span>
          <span><strong>Completion:</strong> {progress}%</span>
          <span className="print-status" style={{ background: STATUS_COLORS[checklist.status] }}>
            {STATUS_LABELS[checklist.status] || checklist.status || ''}
          </span>
        </div>
      </div>

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
          <div><span>Title</span><strong>{checklist.video_title || '—'}</strong></div>
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
    </>
  )
}