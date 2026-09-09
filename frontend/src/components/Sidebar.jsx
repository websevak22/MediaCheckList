import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusSquare, ClipboardList, FileText,
  LogOut, HeartHandshake, ShieldCheck, Menu, X,
} from 'lucide-react'
import { isAdmin } from '../lib/auth'

export default function Sidebar({ profile, onLogout, open, onClose }) {
  const navigate = useNavigate()
  const admin = isAdmin(profile)

  const links = admin
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/new', label: 'New Checklist', icon: PlusSquare },
        { to: '/submissions', label: 'All Submissions', icon: ClipboardList },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/new', label: 'New Checklist', icon: PlusSquare },
        { to: '/my-submissions', label: 'My Submissions', icon: FileText },
      ]

  const handleLogout = async () => {
    await onLogout()
    navigate('/login')
  }

  return (
    <>
      <div className="mobile-topbar">
        <button className="menu-btn" onClick={onClose ? () => onClose(!open) : undefined} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="brand-heart"><HeartHandshake size={18} /></div>
        <span className="mobile-title">DIGITAL MARKETING</span>
      </div>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-heart">
            <HeartHandshake size={26} />
          </div>
          <div className="brand-text">
            <strong>DIGITAL MARKETING</strong>
          </div>
        </div>

        <div className="sidebar-section-label">Main Menu</div>
        <nav className="sidebar-nav">
          {links.map((l) => {
            const Icon = l.icon
            return (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={onClose}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span>{l.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">
              {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-meta">
              <strong className="user-name">{profile?.full_name || profile?.email}</strong>
              <span className={`role-pill ${admin ? 'admin' : ''}`}>
                {admin ? (
                  <><ShieldCheck size={11} /> Admin</>
                ) : 'Member'}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}