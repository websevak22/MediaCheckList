export default function ProgressBar({ value, label, size = 'normal' }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={`progress-wrap ${size}`}>
      <div className="progress-top">
        <span className="progress-label">{label}</span>
        <span className="progress-pct">{Math.round(clamped)}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
