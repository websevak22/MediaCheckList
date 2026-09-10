import { supabase } from './supabase'

const TIMEOUT_MS = 25000

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

async function request(method, path, body) {
  const token = await getToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw new Error('Cannot reach the server. Check that both servers are running and try again.')
  }
  clearTimeout(timer)

  const contentType = res.headers.get('content-type') || ''
  let data = null
  if (contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch (_e) {
      data = null
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  getMe: () => request('GET', '/me'),

  listChecklists: () => request('GET', '/checklists'),
  getChecklist: (id) => request('GET', `/checklists/${id}`),
  createChecklist: (payload) => request('POST', '/checklists', payload),
  updateChecklist: (id, payload) => request('PUT', `/checklists/${id}`, payload),
  updateStatus: (id, status) => request('PATCH', `/checklists/${id}/status`, { status }),
  deleteChecklist: (id) => request('DELETE', `/checklists/${id}`),
}