import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'

const router = Router()

const run = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// GET /api/me -> current user profile (role)
router.get('/me', requireAuth, run(async (req, res) => {
  const { id, email } = req.user

  const { data: profile, error } = await req.data
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!profile) {
    return res.json({
      id,
      email,
      role: 'member',
      full_name: null,
    })
  }

  return res.json(profile)
}))

export default router
