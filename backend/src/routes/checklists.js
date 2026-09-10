import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/require-auth.js'

const router = Router()

const run = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

router.use(requireAuth)

// GET /api/checklists  (admin: all, normal: own) — embeds approvers per checklist
router.get('/', run(async (req, res) => {
  const admin = req.profile?.role === 'admin'

  let query = req.data
    .from('checklists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!admin) query = query.eq('user_id', req.user.id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const result = (data || []).map((c) => ({ ...c, approvers: [] }))

  if (result.length) {
    const ids = result.map((c) => c.id)
    const { data: approvers, error: apErr } = await req.data
      .from('approvers')
      .select('*')
      .in('checklist_id', ids)

    if (!apErr) {
      const map = {}
      ;(approvers || []).forEach((a) => {
        ;(map[a.checklist_id] = map[a.checklist_id] || []).push(a)
      })
      result.forEach((c) => { c.approvers = map[c.id] || [] })
    }
  }

  res.json(result)
}))

// GET /api/checklists/:id  (+ its approvers)
router.get('/:id', run(async (req, res) => {
  const { id } = req.params
  const admin = req.profile?.role === 'admin'

  const { data: checklist, error } = await req.data
    .from('checklists')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!checklist) return res.status(404).json({ error: 'Checklist not found' })

  // Authorization: admin or owner
  if (!admin && checklist.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this checklist' })
  }

  const { data: approvers } = await req.data
    .from('approvers')
    .select('*')
    .eq('checklist_id', id)
    .order('created_at')

  res.json({ ...checklist, approvers: approvers || [] })
}))

// PUT /api/checklists/:id  (owner or admin: update checklist + replace approvers)
router.put('/:id', run(async (req, res) => {
  const { id } = req.params
  const admin = req.profile?.role === 'admin'
  const body = req.body || {}
  const { approvers, ...checklistData } = body

  const { data: existing, error: findErr } = await req.data
    .from('checklists')
    .select('user_id, status')
    .eq('id', id)
    .maybeSingle()

  if (findErr) return res.status(500).json({ error: findErr.message })
  if (!existing) return res.status(404).json({ error: 'Checklist not found' })

  if (!admin && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own checklists' })
  }

  const payload = { ...checklistData, status: 'pending' }

  const { data: updated, error: upErr } = await req.data
    .from('checklists')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (upErr) return res.status(500).json({ error: upErr.message })

  if (Array.isArray(approvers)) {
    await req.data.from('approvers').delete().eq('checklist_id', id)
    const rows = approvers
      .filter((a) => a && a.name && String(a.name).trim())
      .map((a) => ({
        checklist_id: id,
        role: a.role,
        name: a.name,
        signature: a.signature || '',
      }))
    if (rows.length) {
      const { error: apErr } = await req.data.from('approvers').insert(rows)
      if (apErr) return res.status(500).json({ error: apErr.message })
    }
  }

  res.json(updated)
}))

// POST /api/checklists  (create checklist + optional approvers)
router.post('/', run(async (req, res) => {
  const body = req.body || {}
  const { approvers, ...checklistData } = body

  const payload = { ...checklistData, user_id: req.user.id }

  const { data: checklist, error: insertError } = await req.data
    .from('checklists')
    .insert(payload)
    .select()
    .single()

  if (insertError) return res.status(500).json({ error: insertError.message })
  if (!checklist) return res.status(500).json({ error: 'Insert failed' })

  // Optional approvers
  if (Array.isArray(approvers) && approvers.length) {
    const rows = approvers
      .filter((a) => a && a.name && String(a.name).trim())
      .map((a) => ({
        checklist_id: checklist.id,
        role: a.role,
        name: a.name,
        signature: a.signature || '',
      }))
    if (rows.length) {
      const { error: apErr } = await req.data.from('approvers').insert(rows)
      if (apErr) return res.status(500).json({ error: apErr.message })
    }
  }

  res.status(201).json(checklist)
}))

// PATCH /api/checklists/:id/status  (admin only: approved / changes_required / not_approved)
router.patch('/:id/status', requireAdmin, run(async (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}

  const allowed = ['pending', 'approved', 'changes_required', 'not_approved']
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const { data, error } = await req.data
    .from('checklists')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// DELETE /api/checklists/:id  (owner or admin)
router.delete('/:id', run(async (req, res) => {
  const { id } = req.params
  const admin = req.profile?.role === 'admin'

  const { data: checklist } = await req.data
    .from('checklists')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (!checklist) return res.status(404).json({ error: 'Checklist not found' })
  if (!admin && checklist.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own checklists' })
  }

  const { error } = await req.data
    .from('approvers')
    .delete()
    .eq('checklist_id', id)

  if (!error) {
    await req.data.from('checklists').delete().eq('id', id)
  }

  res.json({ ok: true })
}))

export default router
