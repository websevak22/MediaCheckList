export default function CheckItem({ label, checked, onChange, disabled }) {
  return (
    <label className={`check-item ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="check-label">{label}</span>
      <span className="yn-switch" aria-hidden="true">
        <span className="yn-opt no">No</span>
        <span className={`yn-opt yes ${checked ? 'on' : ''}`}>Yes</span>
      </span>
    </label>
  )
}