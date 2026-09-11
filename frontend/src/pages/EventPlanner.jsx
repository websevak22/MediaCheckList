import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays, Plus, Save, Trash2, Eye, Pencil, ArrowLeft,
  Building2, Clock, MapPin, Users, ShieldCheck, LifeBuoy, FileText, ClipboardList,
  FileDown, Printer, X,
} from 'lucide-react'
import { api } from '../lib/api'
import { isAdmin } from '../lib/auth'
import { useToast } from '../components/Toast'
import TextArea from '../components/TextArea'
import ProgressBar from '../components/ProgressBar'

const CATEGORIES = [
  'Visually Impaired',
  'Children',
  'Senior Citizens',
  'Women',
  'Underprivileged Families',
  'Persons with Disabilities',
]

const emptyForm = {
  ngo_name: '',
  program_title: '',
  program_date: '',
  program_time: '',
  program_description: '',
  location: '',
  volunteers_required: '',
  volunteer_role: '',
  beneficiary_categories: [],
  beneficiaries_required: '',
  distribution_items: [{ item: '', quantity: '', remarks: '' }],
  special_requirements: '',
}

const OTHER_TAG = 'Other'

const parseOtherText = (categories) => {
  const other = categories.find((c) => c && c.startsWith(`${OTHER_TAG}:`))
  return other ? other.slice(OTHER_TAG.length + 1).trim() : ''
}

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(`${d}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ChipTag({ label, onRemove }) {
  return (
    <span className="chip-tag">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><X size={12} /></button>
    </span>
  )
}

function emptyRow() {
  return { item: '', quantity: '', remarks: '' }
}

export default function EventPlanner({ profile }) {
  const showToast = useToast()
  const admin = isAdmin(profile)
  const [searchParams, setSearchParams] = useSearchParams()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ ...emptyForm, distribution_items: [emptyRow()] })

  const loadPlans = () => {
    setLoading(true)
    api.listEvents()
      .then((data) => setPlans(data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }

  useEffect(loadPlans, [])

  // Support deep links: /event-planner?id=... (view) or ?edit=... (form)
  useEffect(() => {
    const viewId = searchParams.get('id')
    const editId = searchParams.get('edit')
    if (editId) {
      startEdit(editId)
      setSearchParams({}, { replace: true })
    } else if (viewId) {
      startView(viewId)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNew = () => {
    setEditingId(null)
    setError(null)
    setForm({ ...emptyForm, distribution_items: [emptyRow()] })
    setMode('form')
  }

  const startEdit = async (id) => {
    setError(null)
    try {
      const data = await api.getEvent(id)
      setEditingId(id)
      setForm({
        ...emptyForm,
        ...data,
        distribution_items:
          Array.isArray(data.distribution_items) && data.distribution_items.length
            ? data.distribution_items.map((r) => ({ ...emptyRow(), ...r }))
            : [emptyRow()],
      })
      setMode('form')
    } catch (_e) {
      showToast('Could not load this event plan', 'error')
    }
  }

  const startView = async (id) => {
    setError(null)
    try {
      const data = await api.getEvent(id)
      setViewing(data)
      setMode('view')
    } catch (_e) {
      showToast('Could not load this event plan', 'error')
    }
  }

  const downloadPdf = async (id) => {
    setError(null)
    try {
      const data = id ? await api.getEvent(id) : viewing
      if (!data) return
      setViewing(data)
      setMode('view')
      setTimeout(() => window.print(), 250)
    } catch (_e) {
      showToast('Could not load this event plan', 'error')
    }
  }

  const handleDelete = async (plan) => {
    if (!confirm(`Delete "${plan.program_title || 'this event plan'}" permanently?\n\nThis action cannot be undone.`)) return
    try {
      await api.deleteEvent(plan.id)
      setPlans((prev) => prev.filter((p) => p.id !== plan.id))
      if (mode !== 'list') {
        setViewing(null)
        setMode('list')
      }
      showToast('Event plan deleted successfully!')
    } catch (_e) {
      showToast(_e.message || 'Could not delete this event plan', 'error')
    }
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleCategory = (cat) => {
    setForm((prev) => {
      const cur = [...prev.beneficiary_categories]
      const exists = cur.includes(cat)
      if (exists) {
        if (cat === OTHER_TAG) return { ...prev, beneficiary_categories: cur.filter((c) => c !== cat) }
        return { ...prev, beneficiary_categories: cur.filter((c) => c !== cat) }
      }
      return { ...prev, beneficiary_categories: [...cur, cat] }
    })
  }

  const setOtherText = (text) => {
    setForm((prev) => {
      const rest = prev.beneficiary_categories.filter((c) => c !== OTHER_TAG && !c.startsWith(`${OTHER_TAG}:`))
      const trimmed = text.trim()
      if (!trimmed) return { ...prev, beneficiary_categories: rest }
      return { ...prev, beneficiary_categories: [...rest, `${OTHER_TAG}: ${trimmed}`] }
    })
  }

  const setDistRow = (index, key, value) =>
    setForm((prev) => {
      const rows = [...prev.distribution_items]
      rows[index] = { ...rows[index], [key]: value }
      return { ...prev, distribution_items: rows }
    })

  const addDistRow = () =>
    setForm((prev) => ({ ...prev, distribution_items: [...prev.distribution_items, emptyRow()] }))

  const removeDistRow = (index) =>
    setForm((prev) => {
      const rows = prev.distribution_items.filter((_r, i) => i !== index)
      return { ...prev, distribution_items: rows.length ? rows : [emptyRow()] }
    })

  const progress = (() => {
    const fields = [
      form.ngo_name, form.program_title, form.program_date, form.program_time,
      form.program_description, form.location, form.volunteers_required,
      form.volunteer_role, form.beneficiary_categories.length, form.beneficiaries_required,
      form.special_requirements,
    ]
    const distFilled = form.distribution_items.some((r) => (r.item || '').trim())
    const done = fields.filter((f) => (Array.isArray(f) ? f.length : String(f).trim())).length + (distFilled ? 1 : 0)
    return Math.round((done / (fields.length + 1)) * 100)
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ngo_name: (form.ngo_name || '').trim(),
        program_title: (form.program_title || '').trim(),
        program_date: form.program_date || null,
        program_time: (form.program_time || '').trim(),
        program_description: (form.program_description || '').trim(),
        location: (form.location || '').trim(),
        volunteers_required: (form.volunteers_required || '').trim(),
        volunteer_role: (form.volunteer_role || '').trim(),
        beneficiary_categories: form.beneficiary_categories.filter(Boolean),
        beneficiaries_required: (form.beneficiaries_required || '').trim(),
        distribution_items: form.distribution_items
          .filter((r) => (r.item || '').trim())
          .map((r) => ({
            item: (r.item || '').trim(),
            quantity: (r.quantity || '').trim(),
            remarks: (r.remarks || '').trim(),
          })),
        special_requirements: (form.special_requirements || '').trim(),
      }

      if (editingId) {
        await api.updateEvent(editingId, payload)
        showToast('Event plan updated successfully!')
      } else {
        await api.createEvent(payload)
        showToast('Event plan saved successfully!')
      }
      loadPlans()
      setMode('list')
      setEditingId(null)
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.'
      setError(
        err.status === 404 && msg === 'Not found'
          ? 'The backend is missing the Event Planner API. Restart the backend (npm run dev) and try again.'
          : msg
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  const selected = new Set(form.beneficiary_categories)
  const otherText = parseOtherText(form.beneficiary_categories)
  const otherSelected = selected.has(OTHER_TAG) || parseOtherText(form.beneficiary_categories) !== ''

  if (loading && mode === 'list') {
    return (
      <div className="content-main">
        <div className="empty"><div className="spinner" /><p>Loading event plans...</p></div>
      </div>
    )
  }

  if (mode === 'view' && viewing) {
    const distRows = Array.isArray(viewing.distribution_items) ? viewing.distribution_items : []
    return (
      <div className="content-main">
        <div className="print-only print-header">
          <h1>NGO Program Requirement &amp; Planning Form</h1>
          <h2>Event Planner · {viewing.program_title || 'Untitled Program'}</h2>
          <div className="print-meta">
            <span><strong>NGO:</strong> {viewing.ngo_name || '—'}</span>
            <span><strong>Date:</strong> {formatDate(viewing.program_date) || '—'}</span>
            <span><strong>Beneficiaries:</strong> {viewing.beneficiaries_required || '—'}</span>
            <span className="print-status" style={{ background: '#2b3651' }}>Event Plan</span>
          </div>
        </div>

        <div className="page-header plan-view-header">
          <div>
            <button className="back-link" onClick={() => setMode('list')}>
              <ArrowLeft size={15} /> Back to Event Planner
            </button>
            <div className="eyebrow">Program Preview</div>
            <h1>{viewing.program_title || 'Untitled Program'}</h1>
            <p>{viewing.ngo_name ? `Planned for ${viewing.ngo_name}` : 'NGO program planning form'}</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => window.print()}>
              <FileDown size={15} /> Download PDF
            </button>
            <button className="btn-outline" onClick={() => startEdit(viewing.id)}>
              <Pencil size={15} /> Edit
            </button>
            <button className="btn-outline danger" onClick={() => handleDelete(viewing)}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <div className="card form-card">
            <div className="card-header"><h3>1. Program Details</h3></div>
            <div className="detail-fields">
              <div className="detail-field"><span>Name of NGO</span><strong>{viewing.ngo_name || '—'}</strong></div>
              <div className="detail-field"><span>Title of Program</span><strong>{viewing.program_title || '—'}</strong></div>
              <div className="detail-field"><span>Date</span><strong>{formatDate(viewing.program_date) || '—'}</strong></div>
              <div className="detail-field"><span>Time</span><strong>{viewing.program_time || '—'}</strong></div>
              <div className="detail-field"><span>Location Decided</span><strong>{viewing.location || '—'}</strong></div>
              <div className="detail-field wide"><span>Description of Program</span><strong>{viewing.program_description || '—'}</strong></div>
            </div>
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>2. Volunteer Requirement</h3></div>
            <div className="detail-fields">
              <div className="detail-field"><span>Volunteers Required</span><strong>{viewing.volunteers_required || '—'}</strong></div>
              <div className="detail-field"><span>Volunteer Role</span><strong>{viewing.volunteer_role || '—'}</strong></div>
            </div>
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>3. Beneficiary Details</h3></div>
            <div className="detail-fields">
              <div className="detail-field wide"><span>Beneficiary Category</span>
                <strong>
                  {viewing.beneficiary_categories && viewing.beneficiary_categories.length
                    ? viewing.beneficiary_categories.map((c) => <span key={c} className="chip-tag static">{c}</span>)
                    : '—'}
                </strong>
              </div>
              <div className="detail-field"><span>Number of Beneficiaries</span><strong>{viewing.beneficiaries_required || '—'}</strong></div>
            </div>
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>4. Distribution / Service Details</h3></div>
            {distRows.length === 0 ? (
              <p className="status-empty">No distribution items listed.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Sr. No.</th><th>Item / Service</th><th>Quantity</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {distRows.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{r.item || '—'}</td>
                        <td>{r.quantity || '—'}</td>
                        <td>{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>5. Additional Requirements</h3></div>
            <div className="detail-fields">
              <div className="detail-field wide"><span>Special Requirements / Arrangements</span><strong>{viewing.special_requirements || '—'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'form') {
    return (
      <div className="content-main">
        {error && <div className="error-banner">{error}</div>}

        <div className="page-header">
          <div>
            <button className="back-link" onClick={() => setMode('list')}>
              <ArrowLeft size={15} /> Back to Event Planner
            </button>
            <div className="eyebrow">{editingId ? 'Editing' : 'New Program'}</div>
            <h1>{editingId ? 'Edit Event Plan' : 'New Event Plan'}</h1>
            <p>Fill in the planning form. Sections with content will be counted in your completion.</p>
          </div>
          <div className="header-progress">
            <div className="header-progress-card">
              <ProgressBar value={progress} label="Form completion" size="compact" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card form-card">
            <div className="card-header"><h3>1. Program Details</h3></div>
            <div className="info-grid">
              <div className="field"><span>Name of NGO</span>
                <input type="text" value={form.ngo_name} placeholder="e.g. Being Sevak Charitable Trust"
                  onChange={(e) => setField('ngo_name', e.target.value)} /></div>
              <div className="field"><span>Title of the Program</span>
                <input type="text" value={form.program_title} placeholder="e.g. Blind School Donation Drive"
                  onChange={(e) => setField('program_title', e.target.value)} /></div>
              <div className="field"><span>Date of the Program</span>
                <input type="date" value={form.program_date}
                  onChange={(e) => setField('program_date', e.target.value)} /></div>
              <div className="field"><span>Time of the Program</span>
                <input type="text" value={form.program_time} placeholder="e.g. 10:00 AM"
                  onChange={(e) => setField('program_time', e.target.value)} /></div>
              <div className="field"><span>Location Decided</span>
                <input type="text" value={form.location} placeholder="e.g. Pune, Maharashtra"
                  onChange={(e) => setField('location', e.target.value)} /></div>
            </div>
            <TextArea label="Description of the Program" value={form.program_description} rows={3}
              onChange={(v) => setField('program_description', v)} />
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>2. Volunteer Requirement</h3></div>
            <div className="info-grid">
              <div className="field"><span>Number of Volunteers Required</span>
                <input type="text" value={form.volunteers_required} placeholder="e.g. 10"
                  onChange={(e) => setField('volunteers_required', e.target.value)} /></div>
              <div className="field"><span>Volunteer Role</span>
                <input type="text" value={form.volunteer_role} placeholder="e.g. Distribution, Registration"
                  onChange={(e) => setField('volunteer_role', e.target.value)} /></div>
            </div>
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>3. Beneficiary Details</h3></div>
            <span className="field-label">Beneficiary Category <span className="hint">(select all that apply)</span></span>
            <div className="cat-pills">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`type-pill cat-pill ${selected.has(cat) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                className={`type-pill cat-pill ${otherSelected ? 'selected' : ''}`}
                onClick={() => toggleCategory(OTHER_TAG)}
              >
                Other
              </button>
            </div>
            {otherSelected && (
              <div className="field other-field">
                <span>Specify other category</span>
                <input type="text" value={otherText} placeholder="e.g. Orphanage children, Migrant workers"
                  onChange={(e) => setOtherText(e.target.value)} />
              </div>
            )}
            <div className="info-grid">
              <div className="field"><span>Number of Beneficiaries Required</span>
                <input type="text" value={form.beneficiaries_required} placeholder="e.g. 30"
                  onChange={(e) => setField('beneficiaries_required', e.target.value)} /></div>
            </div>
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>4. Distribution / Service Details</h3></div>
            <div className="dist-table">
              <div className="dist-head">
                <span>Sr. No.</span><span>Item / Service</span><span>Quantity</span><span>Remarks</span><span></span>
              </div>
              {form.distribution_items.map((row, i) => (
                <div className="dist-row" key={i}>
                  <span className="dist-sr">{i + 1}</span>
                  <input type="text" placeholder="e.g. School Kit" value={row.item}
                    onChange={(e) => setDistRow(i, 'item', e.target.value)} />
                  <input type="text" placeholder="e.g. 30" value={row.quantity}
                    onChange={(e) => setDistRow(i, 'quantity', e.target.value)} />
                  <input type="text" placeholder="Remarks" value={row.remarks}
                    onChange={(e) => setDistRow(i, 'remarks', e.target.value)} />
                  <button type="button" className="remove-row" onClick={() => removeDistRow(i)} aria-label="Remove row">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-outline add-row" onClick={addDistRow}>
              <Plus size={15} /> Add Row
            </button>
          </div>

          <div className="card form-card">
            <div className="card-header"><h3>5. Additional Requirements</h3></div>
            <TextArea label="Special Requirements / Arrangements" value={form.special_requirements} rows={3}
              onChange={(v) => setField('special_requirements', v)} />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="sticky-submit">
            <div className="sticky-progress">
              <ProgressBar value={progress} label="Completion" size="compact" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="btn-loader" /> : <Save size={16} />}
              <span>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Event Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="content-main">
      <div className="page-header">
        <div>
          <div className="eyebrow">Planning</div>
          <h1>Event Planner</h1>
          <p>{admin ? 'All saved NGO program plans.' : 'Plan and save your NGO program requirements.'}</p>
        </div>
        <button className="btn-primary" onClick={startNew}>
          <Plus size={16} /> New Event Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card">
          <div className="empty">
            <CalendarDays size={40} className="empty-icon" />
            <p>No event plans yet.</p>
            <button className="btn-primary" onClick={startNew}>
              <Plus size={15} /> Create your first event plan
            </button>
          </div>
        </div>
      ) : (
        <div className="events-grid">
          {plans.map((plan) => {
            const cats = Array.isArray(plan.beneficiary_categories) ? plan.beneficiary_categories : []
            const distCount = (Array.isArray(plan.distribution_items) ? plan.distribution_items : []).length
            return (
              <div className="event-card" key={plan.id}>
                <div className="event-card-head">
                  <div className="event-icon"><Building2 size={18} /></div>
                  <div className="event-title-block">
                    <strong className="event-title">{plan.program_title || 'Untitled Program'}</strong>
                    <span className="event-ngo">{plan.ngo_name || '—'}</span>
                  </div>
                </div>

                <div className="event-meta">
                  {(plan.program_date || plan.program_time) && (
                    <span><Clock size={14} />{plan.program_date ? formatDate(plan.program_date) : ''}{plan.program_date && plan.program_time ? ' · ' : ''}{plan.program_time || ''}</span>
                  )}
                  {plan.location && <span><MapPin size={14} />{plan.location}</span>}
                </div>

                <div className="event-stats">
                  <span title="Beneficiaries"><Users size={14} /> {plan.beneficiaries_required || '0'} beneficiaries</span>
                  <span title="Volunteers"><LifeBuoy size={14} /> {plan.volunteers_required || '0'} volunteers</span>
                  <span title="Distribution items"><ClipboardList size={14} /> {distCount} item{distCount === 1 ? '' : 's'}</span>
                </div>

                {cats.length > 0 && (
                  <div className="event-cats">
                    {cats.slice(0, 3).map((c) => <span className="chip-tag static" key={c}>{c}</span>)}
                    {cats.length > 3 && <span className="chip-tag static">+{cats.length - 3} more</span>}
                  </div>
                )}

                <div className="event-card-actions">
                  <button className="btn-view" onClick={() => startView(plan.id)}><Eye size={13} /> View</button>
                  <button className="btn-edit" onClick={() => startEdit(plan.id)}><Pencil size={13} /> Edit</button>
                  <button className="btn-pdf" onClick={() => downloadPdf(plan.id)}><FileDown size={13} /> Download PDF</button>
                  <button className="icon-btn-sm delete" onClick={() => handleDelete(plan)} title="Delete"><Trash2 size={15} /></button>
                </div>

                {admin && plan.user_id && (
                  <div className="event-owner"><ShieldCheck size={11} /> Created by user {plan.user_id.slice(0, 8)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}