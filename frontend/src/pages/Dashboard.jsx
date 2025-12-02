import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserStats } from '../utils/fetchUserStats';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await fetchUserStats(navigate);
      if (data) {
        setStats(data);
      } else {
        setError('Failed to load stats');
      }
    } catch (e) {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading...</div>;
  if (error) return <div style={{padding:'2rem',textAlign:'center',color:'red'}}>{error}</div>;
  if (!stats) return <div style={{padding:'2rem',textAlign:'center'}}>No data</div>;

  const progress = (stats.xp / (stats.level * 100)) * 100;
  const s = stats.stats || {};

  return (
    <div style={{padding:'1.5rem',maxWidth:'1400px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{marginBottom:'2rem'}}>
        <h1 style={{margin:0,fontSize:'2rem',fontWeight:'bold'}}>Dashboard</h1>
        <p style={{color:'#64748b',marginTop:'0.5rem'}}>Welcome back, {stats.name}!</p>
      </div>

      {/* Stats Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        <StatCard icon="🎯" label="Total Quizzes" value={s.totalQuizzes || 0} color="#3b82f6" />
        <StatCard icon="📊" label="Average Score" value={`${s.averageScore || 0}%`} color="#8b5cf6" />
        <StatCard icon="🏆" label="Best Score" value={`${s.bestScore || 0}%`} color="#f59e0b" />
        <StatCard icon="🔥" label="Current Streak" value={`${s.currentStreak || 0} days`} color="#ef4444" />
      </div>

      {/* Level Progress */}
      <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'16px',padding:'2rem',color:'white',marginBottom:'2rem',boxShadow:'0 10px 30px rgba(102,126,234,0.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <div>
            <h2 style={{margin:0,fontSize:'1.5rem'}}>Level {stats.level}</h2>
            <p style={{opacity:0.9,marginTop:'0.25rem'}}>{Math.floor(stats.xp)} / {stats.level * 100} XP</p>
          </div>
          <div style={{fontSize:'3rem'}}>⭐</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.2)',borderRadius:'12px',height:'12px',overflow:'hidden'}}>
          <div style={{background:'white',height:'100%',width:`${progress}%`,borderRadius:'12px',transition:'width 0.3s'}}></div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'1.5rem',marginBottom:'2rem'}}>
        <ChartCard title="Performance Overview" stats={s} />
        <ActivityCard stats={s} />
      </div>

      {/* Quick Actions */}
      <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',marginBottom:'2rem'}}>
        <h3 style={{margin:'0 0 1rem 0'}}>Quick Actions</h3>
        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
          <button className="btn success" onClick={()=>navigate('/upload')} style={{flex:'1 1 200px'}}>📝 Start New Quiz</button>
          <button className="btn" onClick={()=>navigate('/quiz')} style={{flex:'1 1 200px'}}>📊 View History</button>
          <button className="btn" onClick={()=>navigate('/achievements')} style={{flex:'1 1 200px'}}>🏆 Achievements</button>
        </div>
      </div>

      {/* Recent Badges */}
      {stats.badges && stats.badges.length > 0 && (
        <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0'}}>
          <h3 style={{margin:'0 0 1rem 0'}}>Recent Achievements</h3>
          <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
            {stats.badges.slice(-5).reverse().map(b=>(
              <div key={b.key} style={{padding:'0.75rem 1rem',background:'linear-gradient(135deg,#ffd89b 0%,#19547b 100%)',borderRadius:'8px',color:'white',fontWeight:'bold',fontSize:'0.875rem'}}>
                🏅 {b.key.replace(/_/g,' ').toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({icon,label,value,color}) => (
  <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
    <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{icon}</div>
    <div style={{fontSize:'0.875rem',color:'#64748b',marginBottom:'0.25rem'}}>{label}</div>
    <div style={{fontSize:'1.75rem',fontWeight:'bold',color}}>{value}</div>
  </div>
);

const ChartCard = ({title,stats}) => (
  <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0'}}>
    <h3 style={{margin:'0 0 1rem 0',fontSize:'1.125rem'}}>{title}</h3>
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <ProgressBar label="Accuracy" value={stats.averageScore||0} max={100} color="#3b82f6" />
      <ProgressBar label="Completion" value={stats.totalQuizzes||0} max={50} color="#8b5cf6" />
      <ProgressBar label="Perfect Scores" value={stats.perfectScores||0} max={10} color="#f59e0b" />
    </div>
  </div>
);

const ProgressBar = ({label,value,max,color}) => {
  const percent = Math.min((value/max)*100,100);
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem',fontSize:'0.875rem'}}>
        <span>{label}</span>
        <span style={{fontWeight:'bold'}}>{value}/{max}</span>
      </div>
      <div style={{background:'#f1f5f9',borderRadius:'8px',height:'8px',overflow:'hidden'}}>
        <div style={{background:color,height:'100%',width:`${percent}%`,borderRadius:'8px',transition:'width 0.3s'}}></div>
      </div>
    </div>
  );
};

const ActivityCard = ({stats}) => (
  <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0'}}>
    <h3 style={{margin:'0 0 1rem 0',fontSize:'1.125rem'}}>Activity Stats</h3>
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <ActivityItem icon="⏱️" label="Timed Quizzes" value={stats.timedQuizzes||0} />
      <ActivityItem icon="💯" label="Perfect Scores" value={stats.perfectScores||0} />
      <ActivityItem icon="⏰" label="Time Spent" value={`${Math.floor((stats.totalTimeSpent||0)/60)}m`} />
      <ActivityItem icon="📈" label="Longest Streak" value={`${stats.longestStreak||0} days`} />
    </div>
  </div>
);

const ActivityItem = ({icon,label,value}) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem',background:'#f8fafc',borderRadius:'8px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
      <span style={{fontSize:'1.5rem'}}>{icon}</span>
      <span style={{fontSize:'0.875rem',color:'#475569'}}>{label}</span>
    </div>
    <span style={{fontWeight:'bold',fontSize:'1.125rem'}}>{value}</span>
  </div>
);
