import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function CollapsibleSection({
  number,
  icon,
  title,
  mandatory,
  completedCount,
  totalCount,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const done = totalCount > 0 && completedCount >= totalCount
  const partial = completedCount > 0 && !done

  return (
    <div className={`collapsible ${mandatory ? 'mandatory' : ''} ${done ? 'complete' : ''} ${partial ? 'partial' : ''}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="cs-number">{icon || number}</span>
        <span className="cs-title">{title}</span>
        {mandatory && <span className="cs-badge">MANDATORY</span>}
        <span className={`cs-count ${done ? 'done' : ''}`}>
          {done ? <><Check size={13} /> Complete</> : `${completedCount}/${totalCount}`}
        </span>
        <span className={`cs-chevron ${open ? 'open' : ''}`}>
          <ChevronDown size={16} />
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  )
}
