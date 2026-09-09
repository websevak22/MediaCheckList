import { supabase } from './supabase'
import { api } from './api'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { user: null, error }
  const { profile } = await fetchProfile(data.user.id)
  return { user: data.user, profile, error: null }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { user: null, profile: null, error }
  const { profile } = await fetchProfile(data.user.id)
  return { user: data.user, profile, error: null }
}

export async function fetchProfile(userId) {
  // Role comes from the backend (server-side authorization).
  try {
    const profile = await api.getMe()
    return { profile: profile || null, error: null }
  } catch (err) {
    return { profile: { id: userId, role: 'member' }, error: err }
  }
}

export function isAdmin(profile) {
  return profile?.role === 'admin'
}
