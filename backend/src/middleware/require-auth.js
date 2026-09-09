import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { getDataClient, hasConfig } from '../supabase.js'

// A user-facing client (anon key) is used ONLY to verify the caller's JWT.
// Created only when Supabase is configured; otherwise requests get a clean 503.
const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const authClient = (() => {
  try {
    return hasConfig ? createClient(url || '', anonKey || '') : null
  } catch (err) {
    console.error('[backend] Failed to init auth client:', err.message)
    return null
  }
})()

export async function requireAuth(req, res, next) {
  if (!authClient) {
    return res.status(503).json({ error: 'Server not configured with Supabase credentials' })
  }

  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const { data, error } = await authClient.auth.getUser(token)
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    req.user = data.user

    // Data client scoped to this user (or privileged if service_role is set).
    req.data = getDataClient(token)

    // Load the profile (role) so routes can enforce authorization.
    const { data: profile, error: pErr } = await req.data
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    req.profile = profile || { id: data.user.id, role: 'member' }
    if (pErr) {
      // Fall back gracefully if the profile read still fails.
      req.profile = { id: data.user.id, role: 'member' }
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}