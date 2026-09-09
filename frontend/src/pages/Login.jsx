import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, HeartHandshake, ArrowRight } from 'lucide-react'
import { signIn } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { user, error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      setError(error.message || 'Login failed')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="login-screen">
      <div className="login-bg-overlay" />
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-heart large">
            <HeartHandshake size={34} />
          </div>
          <h1>DIGITAL MARKETING</h1>
          <p>YouTube Upload Checklist</p>
        </div>

        <div className="login-divider"><span>Sign in to continue</span></div>

        {error && (
          <div className="error-banner">
            <Lock size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email Address</span>
            <div className="input-wrap">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <span className="btn-loader" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="login-foot">© {new Date().getFullYear()} Digital Marketing</p>
      </div>
    </div>
  )
}
