import CheckItem from './CheckItem'

export default function CheckGroup({ items, values, onChange, disabled }) {
  return (
    <div className="check-grid">
      {items.map(({ key, label }) => (
        <CheckItem
          key={key}
          label={label}
          checked={values[key] || false}
          onChange={() => onChange(key)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
