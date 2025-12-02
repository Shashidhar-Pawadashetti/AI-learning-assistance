import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config';
import { fetchUserStats } from '../utils/fetchUserStats';

const BADGES = [
  { key: 'first_quiz', title: 'First Steps', desc: 'Complete your first quiz', emoji: '🥇', category: 'Milestone' },
  { key: 'quiz_5', title: 'Quiz Novice', desc: 'Complete 5 quizzes', emoji: '📘', category: 'Milestone' },
  { key: 'quiz_10', title: 'Quiz Explorer', desc: 'Complete 10 quizzes', emoji: '🧭', category: 'Milestone' },
  { key: 'quiz_25', title: 'Quiz Veteran', desc: 'Complete 25 quizzes', emoji: '⚔️', category: 'Milestone' },
  { key: 'quiz_50', title: 'Dedicated Learner', desc: 'Complete 50 quizzes', emoji: '🎓', category: 'Milestone' },
  { key: 'quiz_100', title: 'Legend', desc: 'Complete 100 quizzes', emoji: '👑', category: 'Milestone' },
  
  { key: 'timed_1', title: 'Speed Runner', desc: 'Complete a timed quiz', emoji: '⏱️', category: 'Speed' },
  { key: 'timed_10', title: 'Time Master', desc: 'Complete 10 timed quizzes', emoji: '⚡', category: 'Speed' },
  
  { key: 'acc_70', title: 'Good Start', desc: 'Reach 70% best score', emoji: '🎯', category: 'Accuracy' },
  { key: 'acc_85', title: 'Sharp Mind', desc: 'Reach 85% best score', emoji: '🔥', category: 'Accuracy' },
  { key: 'acc_95', title: 'Near Perfect', desc: 'Reach 95% best score', emoji: '💎', category: 'Accuracy' },
  
  { key: 'perfect', title: 'Perfectionist', desc: 'Get 100% on any quiz', emoji: '💯', category: 'Perfect' },
  { key: 'perfect_5', title: 'Flawless', desc: 'Get 100% on 5 quizzes', emoji: '✨', category: 'Perfect' },
  
  { key: 'streak_3', title: '3-Day Streak', desc: 'Study for 3 days in a row', emoji: '🔥', category: 'Streak' },
  { key: 'streak_7', title: 'Week Warrior', desc: 'Study for 7 days in a row', emoji: '📅', category: 'Streak' },
  { key: 'streak_30', title: 'Unstoppable', desc: 'Study for 30 days in a row', emoji: '🚀', category: 'Streak' },
  
  { key: 'level_10', title: 'Level 10', desc: 'Reach level 10', emoji: '⭐', category: 'Level' },
  { key: 'level_25', title: 'Level 25', desc: 'Reach level 25', emoji: '🌟', category: 'Level' },
  { key: 'level_50', title: 'Level 50', desc: 'Reach level 50', emoji: '💫', category: 'Level' }
];

export default function Achievements() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await fetchUserStats(navigate);
      if (data) setStats(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading...</div>;
  if (!stats) return <div style={{padding:'2rem',textAlign:'center'}}>No data</div>;

  const s = stats.stats || {};
  const unlockedBadges = stats.badges || [];
  const unlockedKeys = new Set(unlockedBadges.map(b => b.key));
  
  const categories = ['all', ...new Set(BADGES.map(b => b.category))];
  const filteredBadges = filter === 'all' ? BADGES : BADGES.filter(b => b.category === filter);
  const unlockedCount = BADGES.filter(b => unlockedKeys.has(b.key)).length;

  return (
    <div style={{padding:'1.5rem',maxWidth:'1400px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{marginBottom:'2rem'}}>
        <h1 style={{margin:0,fontSize:'2rem',fontWeight:'bold'}}>🏆 Achievements</h1>
        <p style={{color:'#64748b',marginTop:'0.5rem'}}>Unlock badges by completing challenges</p>
      </div>

      {/* Progress Overview */}
      <div style={{background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',borderRadius:'16px',padding:'2rem',color:'white',marginBottom:'2rem',boxShadow:'0 10px 30px rgba(240,147,251,0.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h2 style={{margin:0,fontSize:'1.5rem'}}>Badge Collection</h2>
            <p style={{opacity:0.9,marginTop:'0.5rem'}}>{unlockedCount} of {BADGES.length} unlocked</p>
          </div>
          <div style={{fontSize:'3rem'}}>🎖️</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.2)',borderRadius:'12px',height:'12px',overflow:'hidden',marginTop:'1rem'}}>
          <div style={{background:'white',height:'100%',width:`${(unlockedCount/BADGES.length)*100}%`,borderRadius:'12px',transition:'width 0.3s'}}></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        <MiniStat icon="🎯" label="Total Quizzes" value={s.totalQuizzes||0} />
        <MiniStat icon="📊" label="Best Score" value={`${s.bestScore||0}%`} />
        <MiniStat icon="🔥" label="Current Streak" value={`${s.currentStreak||0}d`} />
        <MiniStat icon="💯" label="Perfect Scores" value={s.perfectScores||0} />
      </div>

      {/* Category Filter */}
      <div style={{marginBottom:'1.5rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding:'0.5rem 1rem',
              borderRadius:'8px',
              border:'2px solid',
              borderColor: filter === cat ? '#3b82f6' : '#e2e8f0',
              background: filter === cat ? '#3b82f6' : 'white',
              color: filter === cat ? 'white' : '#334155',
              fontWeight:'500',
              cursor:'pointer',
              transition:'all 0.2s'
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
        {filteredBadges.map(badge => {
          const unlocked = unlockedKeys.has(badge.key);
          const unlockedData = unlockedBadges.find(b => b.key === badge.key);
          return (
            <BadgeCard
              key={badge.key}
              badge={badge}
              unlocked={unlocked}
              unlockedAt={unlockedData?.unlockedAt}
            />
          );
        })}
      </div>

      {/* Recent Unlocks */}
      {unlockedBadges.length > 0 && (
        <div style={{marginTop:'2rem',background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0'}}>
          <h3 style={{margin:'0 0 1rem 0'}}>Recent Unlocks</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {unlockedBadges.slice().reverse().slice(0,5).map(ub => {
              const badge = BADGES.find(b => b.key === ub.key);
              if (!badge) return null;
              return (
                <div key={ub.key} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.75rem',background:'#f8fafc',borderRadius:'8px'}}>
                  <span style={{fontSize:'2rem'}}>{badge.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'bold'}}>{badge.title}</div>
                    <div style={{fontSize:'0.875rem',color:'#64748b'}}>{badge.desc}</div>
                  </div>
                  <div style={{fontSize:'0.75rem',color:'#94a3b8'}}>
                    {new Date(ub.unlockedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const MiniStat = ({icon,label,value}) => (
  <div style={{background:'white',borderRadius:'12px',padding:'1rem',border:'1px solid #e2e8f0',textAlign:'center'}}>
    <div style={{fontSize:'2rem',marginBottom:'0.25rem'}}>{icon}</div>
    <div style={{fontSize:'0.75rem',color:'#64748b',marginBottom:'0.25rem'}}>{label}</div>
    <div style={{fontSize:'1.25rem',fontWeight:'bold'}}>{value}</div>
  </div>
);

const BadgeCard = ({badge,unlocked,unlockedAt}) => (
  <div style={{
    background: unlocked ? 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' : '#f8fafc',
    borderRadius:'12px',
    padding:'1.5rem',
    border:'2px solid',
    borderColor: unlocked ? '#667eea' : '#e2e8f0',
    textAlign:'center',
    position:'relative',
    opacity: unlocked ? 1 : 0.6,
    transition:'all 0.3s',
    cursor: unlocked ? 'default' : 'not-allowed'
  }}>
    {!unlocked && (
      <div style={{position:'absolute',top:'0.5rem',right:'0.5rem',fontSize:'1.5rem'}}>🔒</div>
    )}
    <div style={{fontSize:'3rem',marginBottom:'0.5rem',filter:unlocked?'none':'grayscale(100%)'}}>
      {badge.emoji}
    </div>
    <div style={{fontWeight:'bold',fontSize:'1.125rem',color:unlocked?'white':'#334155',marginBottom:'0.25rem'}}>
      {badge.title}
    </div>
    <div style={{fontSize:'0.875rem',color:unlocked?'rgba(255,255,255,0.9)':'#64748b',marginBottom:'0.5rem'}}>
      {badge.desc}
    </div>
    <div style={{
      display:'inline-block',
      padding:'0.25rem 0.75rem',
      borderRadius:'12px',
      background:unlocked?'rgba(255,255,255,0.2)':'#e2e8f0',
      color:unlocked?'white':'#64748b',
      fontSize:'0.75rem',
      fontWeight:'500'
    }}>
      {badge.category}
    </div>
    {unlocked && unlockedAt && (
      <div style={{marginTop:'0.5rem',fontSize:'0.75rem',color:'rgba(255,255,255,0.8)'}}>
        Unlocked {new Date(unlockedAt).toLocaleDateString()}
      </div>
    )}
  </div>
);
