export default function BadgeCard({ title, desc, emoji, locked = false, unlockedAt = null }) {
  return (
    <div className={`badge-card ${locked ? 'locked' : ''}`}>
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {!locked && unlockedAt && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Unlocked on {new Date(unlockedAt).toLocaleDateString()}</p>
      )}
    </div>
  );
}
