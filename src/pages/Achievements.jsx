import BadgeCard from "../components/BadgeCard";

export default function Achievements() {
  const badges = [
    { title: "Quiz Master", desc: "Completed 10 quizzes", emoji: "🏆" },
    { title: "Fast Learner", desc: "Scored 90% in a quiz", emoji: "⚡" },
    { title: "Dedicated", desc: "Uploaded 5 notes", emoji: "📚" },
  ];

  return (
    <div className="achievements">
      <h2>Your Achievements</h2>
      <div className="badge-grid">
        {badges.map((badge, idx) => (
          <BadgeCard key={idx} {...badge} />
        ))}
      </div>
    </div>
  );
}
