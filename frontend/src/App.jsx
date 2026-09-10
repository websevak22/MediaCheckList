import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { getCurrentUser, signOut } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { ToastProvider } from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewChecklist from './pages/NewChecklist'
import Submissions from './pages/Submissions'
import SubmissionDetail from './pages/SubmissionDetail'

function AppLayout({ profile, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen(prev => !prev)

  return (
    <div className="app-shell">
      <Sidebar
        profile={profile}
        onLogout={async () => { closeMenu(); await onLogout() }}
        open={menuOpen}
        onToggle={toggleMenu}
        onClose={closeMenu}
      />
      <div className={menuOpen ? 'sidebar-backdrop' : 'sidebar-backdrop hidden'} onClick={closeMenu} />
      <main className="app-main">{children}</main>
    </div>
  )
}

function EditChecklistRoute({ profile }) {
  const { id } = useParams()
  return <NewChecklist profile={profile} editId={id} />
}

export default function App() {
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { profile } = await getCurrentUser()
      setProfile(profile)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        getCurrentUser().then(({ profile }) => setProfile(profile))
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      }
    })
    return () => sub?.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut()
    setProfile(null)
    navigate('/login')
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>{(p) => (
            <AppLayout profile={p} onLogout={handleLogout}>
              <Dashboard profile={p} />
            </AppLayout>
          )}</ProtectedRoute>
        } />

        <Route path="/new" element={
          <ProtectedRoute>{(p) => (
            <AppLayout profile={p} onLogout={handleLogout}>
              <NewChecklist profile={p} />
            </AppLayout>
          )}</ProtectedRoute>
        } />

        <Route path="/edit/:id" element={
          <ProtectedRoute>{(p) => (
            <AppLayout profile={p} onLogout={handleLogout}>
              <EditChecklistRoute profile={p} />
            </AppLayout>
          )}</ProtectedRoute>
        } />

        <Route path="/my-submissions" element={
          <ProtectedRoute>{(p) => (
            <AppLayout profile={p} onLogout={handleLogout}>
              <Submissions profile={p} admin={false} />
            </AppLayout>
          )}</ProtectedRoute>
        } />

        <Route path="/submissions" element={
          <ProtectedRoute adminOnly>{(p) => (
            <AppLayout profile={p} onLogout={handleLogout}>
              <Submissions profile={p} admin />
            </AppLayout>
          )}</ProtectedRoute>
        } />

        <Route path="/submission/:id" element={
          <ProtectedRoute>{(p) => (
            <AppLayout profile={p} onLogout={handleLogout}>
              <SubmissionDetail profile={p} />
            </AppLayout>
          )}</ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ToastProvider>
  )
}