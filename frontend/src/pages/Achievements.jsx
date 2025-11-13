import { useEffect, useState, useMemo } from "react";
import BadgeCard from "../components/BadgeCard";

// Central badge definitions
const BADGES = [
  { key: 'first_quiz', title: 'First Quiz', desc: 'Complete your first quiz', emoji: '🥇', condition: s => s.quizzesCompleted >= 1 },
  { key: 'quiz_5', title: 'Quiz Novice', desc: 'Complete 5 quizzes', emoji: '📘', condition: s => s.quizzesCompleted >= 5 },
  { key: 'quiz_10', title: 'Quiz Explorer', desc: 'Complete 10 quizzes', emoji: '🧭', condition: s => s.quizzesCompleted >= 10 },
  { key: 'timed_1', title: 'Speed Runner', desc: 'Finish a timed quiz', emoji: '⏱️', condition: s => s.timedQuizzesCompleted >= 1 },
  { key: 'acc_70', title: 'Accuracy 70%', desc: 'Reach 70% best score', emoji: '🎯', condition: s => (s.bestPercent || 0) >= 70 },
  { key: 'acc_85', title: 'Accuracy 85%', desc: 'Reach 85% best score', emoji: '🔥', condition: s => (s.bestPercent || 0) >= 85 },
  { key: 'acc_95', title: 'Accuracy 95%', desc: 'Reach 95% best score', emoji: '💎', condition: s => (s.bestPercent || 0) >= 95 },
];

export default function Achievements() {
  const [stats, setStats] = useState(null);
  const [unlocked, setUnlocked] = useState({}); // key -> timestamp
  const [recent, setRecent] = useState([]); // [{key,time}]

  useEffect(() => {
    const storedStats = localStorage.getItem('quizStats');
    if (storedStats) setStats(JSON.parse(storedStats));
    const storedBadges = localStorage.getItem('badgesUnlocked');
    if (storedBadges) setUnlocked(JSON.parse(storedBadges));
    const storedRecent = localStorage.getItem('recentBadgeUnlocks');
    if (storedRecent) setRecent(JSON.parse(storedRecent));
  }, []);

  const progress = useMemo(() => {
    if (!stats) return null;
    return {
      quizzesCompleted: stats.quizzesCompleted || 0,
      bestPercent: stats.bestPercent || 0,
      timedQuizzesCompleted: stats.timedQuizzesCompleted || 0,
    };
  }, [stats]);

  const evaluated = useMemo(() => {
    if (!progress) return [];
    return BADGES.map(b => ({
      ...b,
      isUnlocked: !!unlocked[b.key] || b.condition(progress),
      unlockedAt: unlocked[b.key] || (b.condition(progress) ? Date.now() : null)
    }));
  }, [progress, unlocked]);

  useEffect(() => {
    if (!progress) return;
    let changed = false;
    const updated = { ...unlocked };
    const newRecent = [...recent];
    evaluated.forEach(b => {
      if (b.isUnlocked && !updated[b.key]) {
        updated[b.key] = b.unlockedAt || Date.now();
        newRecent.unshift({ key: b.key, time: updated[b.key] });
        changed = true;
      }
    });
    if (changed) {
      while (newRecent.length > 10) newRecent.pop();
      setUnlocked(updated);
      setRecent(newRecent);
      localStorage.setItem('badgesUnlocked', JSON.stringify(updated));
      localStorage.setItem('recentBadgeUnlocks', JSON.stringify(newRecent));
    }
  }, [evaluated, progress, recent, unlocked]);

  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '2rem' }}>
        No quiz stats yet. Take a quiz to unlock achievements!
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Achievements</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start', marginTop: '1rem' }}>
        <div style={{ minWidth: 240 }}>
          <h3 style={{ fontSize: '1.1rem' }}>Progress</h3>
          <p><strong>Quizzes Taken:</strong> {progress.quizzesCompleted}</p>
          <p><strong>Best Score:</strong> {progress.bestPercent}%</p>
          <p><strong>Timed Quizzes:</strong> {progress.timedQuizzesCompleted}</p>
          <p><strong>Badges:</strong> {Object.keys(unlocked).length}/{BADGES.length}</p>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem' }}>Badges</h3>
          <div className="badge-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', marginTop: '0.5rem' }}>
            {evaluated.map(b => (
              <BadgeCard
                key={b.key}
                title={b.title}
                desc={b.desc}
                emoji={b.emoji}
                locked={!b.isUnlocked}
                unlockedAt={unlocked[b.key] || null}
              />
            ))}
          </div>
        </div>
        <div style={{ minWidth: 260 }}>
          <h3 style={{ fontSize: '1.1rem' }}>Recent Unlocks</h3>
          {recent.length === 0 && <p style={{ opacity: 0.7 }}>No unlocks yet.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 300, overflowY: 'auto' }}>
            {recent.map(r => {
              const badge = BADGES.find(b => b.key === r.key);
              if (!badge) return null;
              return (
                <li key={r.key + r.time} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 20 }}>{badge.emoji}</span>
                  <div style={{ fontSize: 14 }}>
                    <strong>{badge.title}</strong><br />
                    <span style={{ opacity: 0.7 }}>{new Date(r.time).toLocaleString()}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
