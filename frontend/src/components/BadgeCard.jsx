export default function BadgeCard({ title, desc, emoji }) {
  return (
    <div className="badge-card">
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
