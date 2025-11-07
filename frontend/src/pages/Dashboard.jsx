import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      setProgress((userData.xp / (userData.level * 100)) * 100);

      // Fetch stats and quiz history from backend
      fetchDashboardData(userData.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch stats
      const statsRes = await fetch(`http://localhost:5000/api/quiz-stats/${userId}`);
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch recent quiz history
      const historyRes = await fetch(`http://localhost:5000/api/quiz-history/${userId}?limit=5`);
      const historyData = await historyRes.json();
      setRecentQuizzes(historyData.history || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

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

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <>
          {stats && (
            <div className="stats-section" style={{ marginTop: '20px' }}>
              <h3>Your Statistics 📊</h3>
              <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginTop: '15px'
              }}>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>
                    {stats.totalQuizzes}
                  </p>
                  <p style={{ margin: '5px 0 0 0' }}>Total Quizzes</p>
                </div>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>
                    {stats.avgScore?.toFixed(1) || 0}
                  </p>
                  <p style={{ margin: '5px 0 0 0' }}>Avg Score</p>
                </div>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>
                    {stats.totalScore || 0}/{stats.totalQuestions || 0}
                  </p>
                  <p style={{ margin: '5px 0 0 0' }}>Correct Answers</p>
                </div>
              </div>
            </div>
          )}

          {recentQuizzes.length > 0 && (
            <div className="recent-quizzes" style={{ marginTop: '30px' }}>
              <h3>Recent Quiz Attempts 📝</h3>
              <div style={{ marginTop: '15px' }}>
                {recentQuizzes.map((quiz) => {
                  const percentage = ((quiz.score / quiz.totalQuestions) * 100).toFixed(0);
                  return (
                    <div key={quiz._id} style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ margin: '0', fontWeight: 'bold' }}>
                          Score: {quiz.score}/{quiz.totalQuestions} ({percentage}%)
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                          {new Date(quiz.completedAt).toLocaleDateString()} • 
                          +{quiz.xpEarned} XP • 
                          Difficulty: {quiz.difficulty}
                        </p>
                      </div>
                      <div style={{
                        background: percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        {percentage >= 80 ? '🎉 Great' : percentage >= 60 ? '👍 Good' : '📚 Keep Going'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

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
