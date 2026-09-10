import { useState, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'

export default function InstallApp({ variant = 'full' }) {
  const deferredPrompt = useRef(null)
  const [installable, setInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    if (ios) return

    const onPrompt = (e) => {
      e.preventDefault()
      deferredPrompt.current = e
      setInstallable(true)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallable(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null
  if (!isIOS && !installable) return null

  const handleInstall = async () => {
    if (isIOS) {
      setShowHelp((v) => !v)
      return
    }
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    deferredPrompt.current = null
    setInstallable(false)
  }

  return (
    <>
      <button
        type="button"
        className={`install-btn ${variant}`}
        onClick={handleInstall}
        title={isIOS ? 'Install on this device' : 'Install App'}
      >
        <Download size={variant === 'icon' ? 18 : 16} />
        {variant !== 'icon' && <span>Install App</span>}
      </button>

      {isIOS && showHelp && (
        <div className="ios-help-backdrop" onClick={() => setShowHelp(false)}>
          <div className="ios-help" onClick={(e) => e.stopPropagation()}>
            <h4>Install on this iPhone/iPad</h4>
            <ol>
              <li>Tap the <b>Share</b> icon in Safari.</li>
              <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
              <li>Tap <b>Add</b> — the app appears on your Home Screen.</li>
            </ol>
            <button type="button" className="btn-primary" onClick={() => setShowHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}