export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
