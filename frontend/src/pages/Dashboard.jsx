import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      setProgress((userData.xp / (userData.level * 100)) * 100);
    }
  }, []);

  if (!user) return <div className="dashboard"><p>Please login to view dashboard</p></div>;

  return (
    <div className="dashboard">
      <div className="profile-card">
        <h2>{user.name}</h2>
        <p>Level {user.level}</p>
      </div>

      <div className="xp-section">
        <h3>XP Progress</h3>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p>{user.xp} / {user.level * 100} XP</p>
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
