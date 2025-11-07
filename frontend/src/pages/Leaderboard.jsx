import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leaderboard?limit=20');
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
        
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="leaderboard-container">
      <h2>🏆 Leaderboard</h2>
      <p>Top learners ranked by XP</p>

      {loading && <p>Loading leaderboard...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <div 
              key={user._id} 
              className={`leaderboard-item ${user._id === currentUser.id ? 'current-user' : ''}`}
              style={{
                background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
                           index === 1 ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)' :
                           index === 2 ? 'linear-gradient(135deg, #cd7f32, #e9a874)' : 
                           user._id === currentUser.id ? '#e3f2fd' : '#f9fafb',
                padding: '15px',
                margin: '10px 0',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', width: '40px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                    {user.name} {user._id === currentUser.id && '(You)'}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    Level {user.level} • {user.quizzesCompleted || 0} quizzes completed
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {user.xp} XP
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <p>No users on the leaderboard yet. Be the first!</p>
      )}
    </div>
  );
}
