import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    setToast(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type })
    timerRef.current = setTimeout(dismiss, type === 'error' ? 5000 : 3200)
  }, [dismiss])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status" onClick={dismiss}>
          <span className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToast = useContext(ToastContext)
  if (!showToast) throw new Error('useToast must be used within a ToastProvider')
  return showToast
}