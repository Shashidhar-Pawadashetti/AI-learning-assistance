import BadgeCard from "../components/BadgeCard";

export default function Achievements() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const stats = JSON.parse(localStorage.getItem('stats') || '{}');
  const quizzes = stats.quizzesCompleted || 0;
  const lastScore = stats.lastScore || 0;
  const xp = user.xp || 0;

  const dynamic = [];
  if (quizzes >= 1) dynamic.push({ title: "First Quiz", desc: "Completed your first quiz", emoji: "📘" });
  if (quizzes >= 10) dynamic.push({ title: "Quiz Master", desc: "Completed 10 quizzes", emoji: "🏆" });
  if (lastScore >= Math.ceil((stats.totalQuestions || 0) * 0.9) || lastScore >= 9) dynamic.push({ title: "Fast Learner", desc: "Scored 90% in a quiz", emoji: "⚡" });
  if (xp >= 100) dynamic.push({ title: "100 XP", desc: "Earned 100 XP", emoji: "🔥" });

  const badges = dynamic.length ? dynamic : [
    { title: "Keep Going", desc: "Complete quizzes to earn badges", emoji: "�" }
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
