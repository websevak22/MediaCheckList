import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [status, setStatus] = useState('loading')
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const check = async () => {
      const { user, profile } = await getCurrentUser()
      if (!user) {
        setStatus('unauthenticated')
        return
      }
      if (adminOnly && profile?.role !== 'admin') {
        setStatus('forbidden')
        return
      }
      setProfile(profile)
      setStatus('authenticated')
    }
    check()

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setStatus('unauthenticated')
    })
    return () => sub?.subscription.unsubscribe()
  }, [adminOnly])

  if (status === 'loading') {
    return <div className="page"><div className="spinner" /><div className="loading">Loading...</div></div>
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'forbidden') return <Navigate to="/dashboard" replace />

  return children({ profile })
}
