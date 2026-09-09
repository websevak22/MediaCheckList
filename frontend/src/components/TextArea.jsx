export default function TextArea({ label, value, onChange, rows = 2, disabled }) {
  return (
    <div className="text-area-box">
      <div className="text-area-label">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  )
}
