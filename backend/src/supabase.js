import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

const hasServiceRole = Boolean(
  serviceRoleKey && serviceRoleKey !== 'REPLACE_WITH_SERVICE_ROLE_KEY'
)

export const hasConfig = Boolean(url && (hasServiceRole || anonKey))

if (!hasConfig) {
  console.warn('[backend] Missing Supabase config. Check backend/.env or Vercel env vars')
}

// Privileged client used ONLY when a real service_role key is set.
// It bypasses RLS — authorization is enforced in this backend instead.
export const serviceRoleClient = hasServiceRole
  ? createClient(url || '', serviceRoleKey)
  : null

// Returns the client to use for data operations in a request.
// - With a real service_role key: the privileged client (bypasses RLS).
// - Without one (fallback): an anon-key client scoped to the caller's JWT,
//   so RLS applies per user. Paste a real service_role key into backend/.env
//   to switch to the privileged mode.
export function getDataClient(accessToken) {
  if (!hasConfig) return null
  if (serviceRoleClient) return serviceRoleClient
  return createClient(url || '', anonKey || '', {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  })
}