import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, PlaySquare, Palette, Users, Type, AlignLeft, Hash, Image as ImageIcon, MonitorPlay, Settings2, BadgeCheck, Send, ShieldAlert } from 'lucide-react'
import { api } from '../lib/api'
import CollapsibleSection from '../components/CollapsibleSection'
import CheckGroup from '../components/CheckGroup'
import TextArea from '../components/TextArea'
import Toast from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import {
  VIDEO_QUALITY_ITEMS, NGO_BRANDING_ITEMS, BENEFICIARY_ITEMS,
  TITLE_CHECK_ITEMS, DESCRIPTION_ITEMS, HASHTAG_ITEMS,
  THUMBNAIL_ITEMS, END_SCREEN_ITEMS, YOUTUBE_SETTINGS_ITEMS,
  FINAL_QUALITY_ITEMS, defaultChecks, ALL_SECTIONS, countSection,
} from '../lib/checklistData'

const TYPE_OPTIONS = [
  ['long_video', 'Long Video'],
  ['short', 'Short'],
  ['event', 'Event'],
  ['story', 'Story'],
  ['awareness', 'Awareness'],
]

export default function NewChecklist({ profile }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    video_title: '',
    video_topic: '',
    video_editor: '',
    prepared_by: '',
    video_date: new Date().toISOString().split('T')[0],
    video_duration: '',
    video_type: 'long_video',
    user_id: profile?.id,

    video_quality: defaultChecks(VIDEO_QUALITY_ITEMS),
    ngo_branding: defaultChecks(NGO_BRANDING_ITEMS),
    beneficiary_content: defaultChecks(BENEFICIARY_ITEMS),
    title_check: { ...defaultChecks(TITLE_CHECK_ITEMS), final_title: '' },
    description_check: { ...defaultChecks(DESCRIPTION_ITEMS), final_description: '' },
    hashtags_check: { ...defaultChecks(HASHTAG_ITEMS), final_hashtags: '' },
    thumbnail: defaultChecks(THUMBNAIL_ITEMS),
    end_screen: defaultChecks(END_SCREEN_ITEMS),
    youtube_settings: defaultChecks(YOUTUBE_SETTINGS_ITEMS),
    final_quality: defaultChecks(FINAL_QUALITY_ITEMS),

    approvers: [
      { role: 'video_editor', name: '', signature: '' },
      { role: 'social_media', name: '', signature: '' },
      { role: 'final_approver', name: '', signature: '' },
    ],
  })

  const sectionIcons = [
    PlaySquare, Palette, Users, Type, AlignLeft, Hash,
    ImageIcon, MonitorPlay, Settings2, BadgeCheck,
  ]

  const progress = useMemo(() => {
    let done = 0
    let total = 0
    ALL_SECTIONS.forEach((s) => {
      total += s.items.length
      done += countSection(form[s.key])
    })
    return total ? Math.round((done / total) * 100) : 0
  }, [form])

  const mandatoryDone = useMemo(() => {
    const keys = ['title_check', 'description_check', 'hashtags_check', 'end_screen']
    return keys.every((k) => {
      const def = ALL_SECTIONS.find((s) => s.key === k)
      return countSection(form[k]) === def.items.length
    })
  }, [form])

  const toggle = (section, key) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [key]: !prev[section][key] } }))

  const setText = (section, key, value) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const setApprover = (index, key, value) =>
    setForm((prev) => {
      const approvers = [...prev.approvers]
      approvers[index] = { ...approvers[index], [key]: value }
      return { ...prev, approvers }
    })

  const sectionDefs = [
    { key: 'video_quality', title: 'Video Quality', items: VIDEO_QUALITY_ITEMS },
    { key: 'ngo_branding', title: 'NGO Branding', items: NGO_BRANDING_ITEMS },
    { key: 'beneficiary_content', title: 'Beneficiary & Content', items: BENEFICIARY_ITEMS },
    { key: 'title_check', title: 'Title Check', mandatory: true, items: TITLE_CHECK_ITEMS, textField: 'final_title', tfLabel: 'Final Title' },
    { key: 'description_check', title: 'Description Check', mandatory: true, items: DESCRIPTION_ITEMS, textField: 'final_description', tfLabel: 'Final Description', rows: 4 },
    { key: 'hashtags_check', title: 'Hashtags', mandatory: true, items: HASHTAG_ITEMS, textField: 'final_hashtags', tfLabel: 'Final Hashtags' },
    { key: 'thumbnail', title: 'Thumbnail', items: THUMBNAIL_ITEMS },
    { key: 'end_screen', title: 'End Screen', mandatory: true, items: END_SCREEN_ITEMS },
    { key: 'youtube_settings', title: 'YouTube Settings', items: YOUTUBE_SETTINGS_ITEMS },
    { key: 'final_quality', title: 'Final Quality Check', items: FINAL_QUALITY_ITEMS },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { approvers, user_id, ...checklistData } = form
      Object.keys(checklistData).forEach((k) => { checklistData[k] = checklistData[k] ?? '' })

      await api.createChecklist({ ...checklistData, approvers })

      setToast('Checklist submitted successfully!')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-main">
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      {error && <div className="error-banner">{error}</div>}

      <div className="page-header">
        <div>
          <div className="eyebrow">Content Creation</div>
          <h1>New YouTube Checklist</h1>
          <p>Complete all sections before publishing. Mandatory items are highlighted.</p>
        </div>
        <div className="header-progress">
          <div className="header-progress-card">
            <ProgressBar value={progress} label="Overall completion" size="compact" />
            {!mandatoryDone && (
              <div className="mandatory-hint"><ShieldAlert size={12} /> Complete all mandatory sections</div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card form-card">
          <div className="card-header"><h3>Video Details</h3></div>
          <div className="info-grid">
            <div className="field"><span>Video Title *</span>
              <input type="text" value={form.video_title} required
                onChange={(e) => setField('video_title', e.target.value)} /></div>
            <div className="field"><span>Topic / Project</span>
              <input type="text" value={form.video_topic}
                onChange={(e) => setField('video_topic', e.target.value)} /></div>
            <div className="field"><span>Video Editor *</span>
              <input type="text" value={form.video_editor} required
                onChange={(e) => setField('video_editor', e.target.value)} /></div>
            <div className="field"><span>Prepared By</span>
              <input type="text" value={form.prepared_by}
                onChange={(e) => setField('prepared_by', e.target.value)} /></div>
            <div className="field"><span>Date</span>
              <input type="date" value={form.video_date}
                onChange={(e) => setField('video_date', e.target.value)} /></div>
            <div className="field"><span>Duration</span>
              <input type="text" value={form.video_duration} placeholder="e.g. 5:30"
                onChange={(e) => setField('video_duration', e.target.value)} /></div>
          </div>

          <div className="type-row">
            <span className="type-label-title">Video Type:</span>
            {TYPE_OPTIONS.map(([val, label]) => (
              <label key={val} className={`type-pill ${form.video_type === val ? 'selected' : ''}`}>
                <input type="radio" name="video_type" value={val}
                  checked={form.video_type === val}
                  onChange={(e) => setField('video_type', e.target.value)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="sections-stack">
          {sectionDefs.map((s, i) => {
            const Icon = sectionIcons[i]
            return (
              <CollapsibleSection
                key={s.key}
                icon={<Icon size={15} />}
                title={s.title}
                mandatory={s.mandatory}
                completedCount={countSection(form[s.key])}
                totalCount={s.items.length}
              >
                <CheckGroup items={s.items} values={form[s.key]} onChange={(k) => toggle(s.key, k)} />
                {s.textField && (
                  <TextArea
                    label={s.tfLabel}
                    value={form[s.key][s.textField]}
                    onChange={(val) => setText(s.key, s.textField, val)}
                    rows={s.rows || 2}
                  />
                )}
              </CollapsibleSection>
            )
          })}
        </div>

        <div className="card form-card">
          <div className="card-header"><h3>Approvals</h3></div>
          <div className="approval-section">
            {form.approvers.map((approver, i) => (
              <div className={`approval-box role-${i + 1}`} key={approver.role}>
                <h4>
                  {approver.role === 'video_editor' && 'Video Editor'}
                  {approver.role === 'social_media' && 'Social Media Executive'}
                  {approver.role === 'final_approver' && 'Final Approver'}
                </h4>
                <label>Name</label>
                <input type="text" value={approver.name}
                  onChange={(e) => setApprover(i, 'name', e.target.value)} />
                <label>Signature</label>
                <input type="text" value={approver.signature} placeholder="Type name as signature"
                  onChange={(e) => setApprover(i, 'signature', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className={`publish-warning ${mandatoryDone ? 'ready' : ''}`}>
          {mandatoryDone ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>
            {mandatoryDone
              ? 'All mandatory checks are complete. You can publish.'
              : 'PUBLISH ONLY AFTER ALL MANDATORY CHECKS ARE COMPLETED.'}
          </span>
        </div>

        <div className="sticky-submit">
          <div className="sticky-progress">
            <ProgressBar value={progress} label="Completion" size="compact" />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <span className="btn-loader" /> : <Send size={16} />}
            <span>{saving ? 'Submitting...' : 'Submit Checklist'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
