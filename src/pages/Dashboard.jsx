import { useEffect, useState } from "react";

export default function Dashboard() {
  const [xp, setXp] = useState(120); // Example XP
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // XP required for next level = level * 100
    const xpNeeded = level * 100;
    if (xp >= xpNeeded) {
      setLevel(level + 1);
      setXp(xp - xpNeeded);
    }
    setProgress((xp / (level * 100)) * 100);
  }, [xp, level]);

  return (
    <div className="dashboard">
      <div className="profile-card">
       
        <h2>Student Name</h2>
        <p>Level {level}</p>
      </div>

      <div className="xp-section">
        <h3>XP Progress</h3>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p>{xp} / {level * 100} XP</p>
      </div>

      <div className="badges">
        <h3>Achievements 🏅</h3>
        <div className="badge-list">
          <div className="badge">📘 First Quiz</div>
          <div className="badge">🔥 100 XP</div>
          <div className="badge">🎯 Consistency</div>
        </div>
      </div>
    </div>
  );
}
