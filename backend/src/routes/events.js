import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { requireAdmin } from '../middleware/require-auth.js'

const router = Router()

const run = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

router.use(requireAuth)

const EVENT_FIELDS = [
  'ngo_name',
  'program_title',
  'program_date',
  'program_time',
  'program_description',
  'location',
  'volunteers_required',
  'volunteer_role',
  'beneficiary_categories',
  'beneficiaries_required',
  'distribution_items',
  'special_requirements',
]

// GET /api/events  (admin: all, normal: own)
router.get('/', run(async (req, res) => {
  const admin = req.profile?.role === 'admin'

  let query = req.data
    .from('event_plans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!admin) query = query.eq('user_id', req.user.id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  res.json(data || [])
}))

// GET /api/events/:id
router.get('/:id', run(async (req, res) => {
  const { id } = req.params
  const admin = req.profile?.role === 'admin'

  const { data: plan, error } = await req.data
    .from('event_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!plan) return res.status(404).json({ error: 'Event plan not found' })
  if (!admin && plan.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this event plan' })
  }

  res.json(plan)
}))

// POST /api/events
router.post('/', run(async (req, res) => {
  const body = req.body || {}
  const payload = { ...body }

  EVENT_FIELDS.forEach((f) => {
    if (payload[f] === undefined || payload[f] === null) payload[f] = ''
  })

  if (!Array.isArray(payload.beneficiary_categories)) payload.beneficiary_categories = []
  if (!Array.isArray(payload.distribution_items)) payload.distribution_items = []

  payload.user_id = req.user.id
  if (!payload.program_date) payload.program_date = null

  const { data, error } = await req.data
    .from('event_plans')
    .insert(payload)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}))

// PUT /api/events/:id  (owner or admin)
router.put('/:id', run(async (req, res) => {
  const { id } = req.params
  const admin = req.profile?.role === 'admin'
  const body = req.body || {}

  const { data: existing, error: findErr } = await req.data
    .from('event_plans')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (findErr) return res.status(500).json({ error: findErr.message })
  if (!existing) return res.status(404).json({ error: 'Event plan not found' })
  if (!admin && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own event plans' })
  }

  const payload = { ...body }
  EVENT_FIELDS.forEach((f) => {
    if (payload[f] === undefined || payload[f] === null) payload[f] = ''
  })
  if (!Array.isArray(payload.beneficiary_categories)) payload.beneficiary_categories = []
  if (!Array.isArray(payload.distribution_items)) payload.distribution_items = []
  payload.updated_at = new Date().toISOString()
  if (!payload.program_date) payload.program_date = null

  const { data, error } = await req.data
    .from('event_plans')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// DELETE /api/events/:id  (owner or admin)
router.delete('/:id', run(async (req, res) => {
  const { id } = req.params
  const admin = req.profile?.role === 'admin'

  const { data: existing, error: findErr } = await req.data
    .from('event_plans')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (findErr) return res.status(500).json({ error: findErr.message })
  if (!existing) return res.status(404).json({ error: 'Event plan not found' })
  if (!admin && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own event plans' })
  }

  const { error } = await req.data.from('event_plans').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })

  res.json({ ok: true })
}))

export default router