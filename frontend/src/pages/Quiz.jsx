import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config';

// Style constants
const styles = {
  card: { border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#ffffff' },
  panel: { padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' },
  statChip: { padding: '6px 12px', background: '#f1f5f9', borderRadius: 8, fontSize: 13 },
  emptyState: { padding: '16px', border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc', textAlign: 'center' },
  select: {
    padding: '8px 32px 8px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    background: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23334155\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '12px'
  },
  searchInput: {
    padding: '8px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    background: '#ffffff',
    fontSize: '14px',
    color: '#334155',
    transition: 'all 0.2s ease'
  }
};

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [started, setStarted] = useState(false);
  const [timedMode, setTimedMode] = useState(null); // 'timed' | 'untimed'
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quizName, setQuizName] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(20);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewAttempt, setViewAttempt] = useState(null);
  // History filters/search
  const [search, setSearch] = useState(localStorage.getItem('histSearch') || '');
  const [topicFilter, setTopicFilter] = useState(localStorage.getItem('histTopic') || 'all');
  const [difficultyFilter, setDifficultyFilter] = useState(localStorage.getItem('histDifficulty') || 'all');
  const [timedFilter, setTimedFilter] = useState(localStorage.getItem('histTimed') || 'all'); // all | timed | untimed
  const [sortBy, setSortBy] = useState(localStorage.getItem('histSort') || 'date-desc');

  const topics = useMemo(() => Array.from(new Set((history || []).map(h => h.topic))).filter(Boolean), [history]);
  const difficulties = useMemo(() => Array.from(new Set((history || []).map(h => h.difficulty))).filter(Boolean), [history]);
  const filteredHistory = useMemo(() => {
    let list = [...(history || [])];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(h => (h.name || '').toLowerCase().includes(s) || (h.topic || '').toLowerCase().includes(s));
    }
    if (topicFilter !== 'all') list = list.filter(h => h.topic === topicFilter);
    if (difficultyFilter !== 'all') list = list.filter(h => h.difficulty === difficultyFilter);
    if (timedFilter === 'timed') list = list.filter(h => h.timed);
    if (timedFilter === 'untimed') list = list.filter(h => !h.timed);
    switch (sortBy) {
      case 'date-asc':
        list.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'best-desc':
        list.sort((a, b) => (b.percent || 0) - (a.percent || 0));
        break;
      case 'best-asc':
        list.sort((a, b) => (a.percent || 0) - (b.percent || 0));
        break;
      default:
        list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [history, search, topicFilter, difficultyFilter, timedFilter, sortBy]);

  // Inline rename state for attempts
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  // Collapsible review state
  const [reviewExpanded, setReviewExpanded] = useState(true);
  const [viewReviewExpanded, setViewReviewExpanded] = useState(true);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      let token = localStorage.getItem('token');
      
      // Refresh token
      try {
        const { auth } = await import('../firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          token = await currentUser.getIdToken(true);
          localStorage.setItem('token', token);
        }
      } catch (e) {
        console.error('Token refresh error:', e);
      }
      
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/quiz-history`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setHistory(data.history || []);
          }
        } catch (e) {
          console.error('Failed to fetch history:', e);
        }
      }
    };
    
    fetchHistory();

    const shouldGenerate = localStorage.getItem('shouldGenerateQuiz');
    if (shouldGenerate === 'true') {
      setShowHistory(false);
    }
  }, []);

  const setAnswer = (idx, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [idx]: value }));
  };

  const totalTime = useMemo(() => (questions?.length || 0) * 60, [questions]);
  const answeredCount = useMemo(() => Object.keys(answers || {}).length, [answers]);
  const progressPercent = useMemo(() => {
    if (!questions || questions.length === 0) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions]);
  const statsSummary = useMemo(() => {
    const attempts = history || [];
    const total = attempts.length;
    const best = total ? Math.max(...attempts.map(a => a?.percent || 0)) : 0;
    const last = total ? (attempts[0]?.percent || 0) : 0;
    const avg = total ? Math.round(attempts.reduce((s, a) => s + (a?.percent || 0), 0) / total) : 0;
    const timed = attempts.filter(a => a?.timed).length;
    return { total, best, last, avg, timed, untimed: total - timed };
  }, [history]);

  // Timer
  useEffect(() => {
    if (!started || timedMode !== 'timed') return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, timedMode, timeLeft]);

  // Auto submit when timer runs out
  useEffect(() => {
    if (started && timedMode === 'timed' && timeLeft === 0 && !submitted && !submitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, started, timedMode]);

  const handleStart = (mode) => {
    setTimedMode(mode);
    setStarted(true);
    setStartTime(Date.now());
    localStorage.setItem('quizStarted', 'true');
    if (mode === 'timed') {
      setTimeLeft(totalTime);
    }
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      // Get fresh token
      let token = localStorage.getItem('token');
      try {
        const { auth } = await import('../firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          token = await currentUser.getIdToken(true);
          localStorage.setItem('token', token);
        }
      } catch (e) {
        console.error('Token refresh error:', e);
      }
      
      if (!token) {
        setError('Please login to submit quiz.');
        navigate('/login');
        return;
      }
      
      const elapsedMs = startTime ? Date.now() - startTime : 0;
      const payload = {
        questions,
        answers,
        notes: localStorage.getItem('studentNotes') || '',
        difficulty: localStorage.getItem('quizDifficulty') || 'medium',
        timed: timedMode === 'timed',
        elapsedSeconds: Math.round(elapsedMs / 1000)
      };

      const res = await fetch(`${API_URL}/api/analyze-quiz`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze quiz');

      setScore(data.score);
      setAnalysis(data);
      setSubmitted(true);
      setTimeLeft(0); // Stop timer
      localStorage.removeItem('quizStarted');

      // Award XP: 10 per correct
      const gained = (data.score || 0) * 10;
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        let xp = (user.xp || 0) + gained;
        let level = user.level || 1;
        while (xp >= level * 100) {
          xp -= level * 100;
          level += 1;
        }
        const updated = { ...user, xp, level };
        localStorage.setItem('user', JSON.stringify(updated));
      }

      // Track stats
      const stats = JSON.parse(localStorage.getItem('stats') || '{}');
      const percent = questions.length > 0 ? Math.round((data.score / questions.length) * 100) : 0;
      stats.quizzesCompleted = (stats.quizzesCompleted || 0) + 1;
      stats.lastScore = data.score;
      stats.totalQuestions = questions.length;
      stats.bestPercent = Math.max(stats.bestPercent || 0, percent);
      if (timedMode === 'timed') {
        stats.timedQuizzesCompleted = (stats.timedQuizzesCompleted || 0) + 1;
        stats.bestTimedPercent = Math.max(stats.bestTimedPercent || 0, percent);
      }
      localStorage.setItem('stats', JSON.stringify(stats));

      // Persist attempt in history
      const percentAttempt = questions.length > 0 ? Math.round((data.score / questions.length) * 100) : 0;
      const attempt = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: quizName?.trim() || `Quiz ${new Date().toLocaleString()}`,
        topic: quizTopic?.trim() || 'General',
        createdAt: Date.now(),
        difficulty: localStorage.getItem('quizDifficulty') || 'medium',
        timed: timedMode === 'timed',
        elapsedSeconds: Math.round(elapsedMs / 1000),
        questions,
        answers,
        score: data.score,
        total: questions.length,
        percent: percentAttempt,
        breakdown: data.breakdown || [],
        summary: data.summary || ''
      };
      // Save to backend
      try {
        const saveRes = await fetch(`${API_URL}/api/save-quiz-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ attempt })
        });
        if (saveRes.ok) {
          const saveData = await saveRes.json();
          setHistory(saveData.history || []);
          
          // Update local user data
          if (saveData.user) {
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({...localUser, ...saveData.user}));
          }
          
          // Show XP and badge notifications
          if (saveData.xpGained) {
            const msg = `🎉 +${saveData.xpGained} XP earned!${saveData.bonusXP ? ` (+${saveData.bonusXP} bonus)` : ''}`;
            setNotification(msg);
            setTimeout(() => setNotification(''), 4000);
          }
          
          // Show streak notification
          if (saveData.streakIncreased && saveData.currentStreak > 1) {
            setTimeout(() => {
              setNotification(`🔥 ${saveData.currentStreak} Day Streak! Keep it up!`);
              setTimeout(() => setNotification(''), 4000);
            }, 4500);
          }
          
          if (saveData.newBadges && saveData.newBadges.length > 0) {
            setTimeout(() => {
              setNotification(`🏆 New Badge${saveData.newBadges.length > 1 ? 's' : ''} Unlocked: ${saveData.newBadges.join(', ')}`);
              setTimeout(() => setNotification(''), 5000);
            }, 4000);
          }
        }
      } catch (saveErr) {
        console.error('Failed to save history:', saveErr);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Component: Score Ring
  const ScoreRing = ({ percent }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    const color = percent >= 75 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color }}>{percent}%</div>
        </div>
      </div>
    );
  };

  // Component: Question Review Item
  const QuestionReviewItem = ({ q, idx, userAnswer, isCorrect, explanation, partialMarks }) => {
    const correctAnswers = q.correctAnswers || [q.a];
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : (userAnswer ? [userAnswer] : []);
    return (
      <div style={{
        marginBottom: 12,
        padding: '10px',
        borderRadius: '8px',
        border: `2px solid ${isCorrect ? '#22c55e' : partialMarks > 0 ? '#f59e0b' : '#ef4444'}`,
        backgroundColor: isCorrect ? 'rgba(34,197,94,0.08)' : partialMarks > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: 6 }}>Q{idx + 1}. {q.q}</p>
        <p style={{ color: isCorrect ? '#16a34a' : partialMarks > 0 ? '#d97706' : '#dc2626', fontWeight: 'bold' }}>
          {isCorrect ? '✅ Fully Correct' : partialMarks > 0 ? `⚠️ Partial (${partialMarks.toFixed(2)} marks)` : '❌ Incorrect'}
        </p>
        {userAnswers.length > 0 && (
          <p style={{ marginTop: 4, color: '#334155' }}>Your answers: {userAnswers.join(', ')}</p>
        )}
        <p style={{ marginTop: 4, color: '#16a34a', fontWeight: 'bold' }}>Correct answers: {correctAnswers.join(', ')}</p>

      </div>
    );
  };

  // Component: History Card
  const HistoryCard = ({ item, onView, onDelete }) => (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{item.name}</h4>
        <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
      </div>
      <p style={{ margin: '6px 0 8px 0', color: '#475569' }}>
        Topic: <strong>{item.topic}</strong>
        <br />
        Score: <strong>{item.percent}%</strong> ({item.score}/{item.total})
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={() => onView(item)}>View</button>
        <button className="btn danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );

  const handleStartNewQuiz = () => {
    navigate('/upload');
  };

  const generateQuiz = async () => {
    const notes = localStorage.getItem("studentNotes");
    const difficulty = localStorage.getItem("quizDifficulty") || "medium";
    
    // Get fresh token from Firebase
    let token = localStorage.getItem('token');
    try {
      const { auth } = await import('../firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        token = await currentUser.getIdToken(true);
        localStorage.setItem('token', token);
      } else {
        setError('Please login to generate a quiz.');
        navigate('/login');
        return;
      }
    } catch (e) {
      setError('Authentication error. Please login again.');
      navigate('/login');
      return;
    }
    
    if (!notes) {
      setError('No notes uploaded yet. Please go back and upload notes first.');
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/generate-quiz`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes, level: difficulty, numQuestions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      const questions = (data.questions || []).map(q => ({
        type: q.type || "mcq",
        q: q.q,
        options: q.options,
        correctAnswers: q.correctAnswers,
        a: q.correctAnswers?.[0]
      }));
      setQuestions(questions);
      setAnswers({});
      setScore(null);
      setAnalysis(null);
      setStarted(false);
      setSubmitted(false);
      setTimedMode(null);
      setTimeLeft(0);
      setStartTime(null);
      setShowHistory(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived stats for header
  const headerStats = useMemo(() => {
    if (!history.length) return null;
    const best = Math.max(...history.map(h => h.percent));
    const last = history[0].percent;
    const avg = Math.round(history.reduce((sum, h) => sum + h.percent, 0) / history.length);
    const timedCount = history.filter(h => h.timed).length;
    return { best, last, avg, attempts: history.length, timedCount };
  }, [history]);

  return (
    <div style={{padding:'1.5rem',maxWidth:'1400px',margin:'0 auto'}}>
      {/* Notification */}
      {notification && (
        <div style={{position:'fixed',top:'20px',right:'20px',zIndex:9999,background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',color:'white',padding:'1rem 1.5rem',borderRadius:'12px',boxShadow:'0 10px 30px rgba(0,0,0,0.3)',animation:'slideIn 0.3s ease',maxWidth:'400px'}}>
          <strong>{notification}</strong>
        </div>
      )}

      {/* Header */}
      <div style={{marginBottom:'2rem'}}>
        <h1 style={{margin:0,fontSize:'2rem',fontWeight:'bold'}}>🎯 Quiz Center</h1>
        <p style={{color:'#64748b',marginTop:'0.5rem'}}>
          {headerStats ? `${headerStats.attempts} attempts · Best: ${headerStats.best}% · Avg: ${headerStats.avg}%` : 'Start your first quiz!'}
        </p>
      </div>



      {/* Action Buttons - Hide during quiz attempt */}
      {(!started || submitted) && (
        <div style={{display:'flex',gap:'1rem',marginBottom:'2rem',flexWrap:'wrap'}}>
          <button className="btn" onClick={() => setShowHistory(true)} style={{flex:'1 1 200px',padding:'0.75rem 1.5rem'}}>📜 View History</button>
          <button className="btn success" onClick={handleStartNewQuiz} style={{flex:'1 1 200px',padding:'0.75rem 1.5rem'}}>✨ Start New Quiz</button>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',marginBottom:'2rem'}}>
          {history.length === 0 ? (
            <div style={styles.emptyState}>
              No past quizzes yet. Generate one to get started.
            </div>
          ) : (
            <>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <input
                    placeholder="🔍 Search name/topic"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); localStorage.setItem('histSearch', e.target.value); }}
                    style={{ ...styles.searchInput, flex: '1 1 200px', minWidth: 200 }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <select
                    value={topicFilter}
                    onChange={(e) => { setTopicFilter(e.target.value); localStorage.setItem('histTopic', e.target.value); }}
                    style={{ ...styles.select, flex: '0 0 auto', minWidth: 140 }}
                    onMouseEnter={(e) => e.target.style.borderColor = '#cbd5e1'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="all">📚 All Topics</option>
                    {topics.map(t => <option key={t} value={t}>📖 {t}</option>)}
                  </select>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => { setDifficultyFilter(e.target.value); localStorage.setItem('histDifficulty', e.target.value); }}
                    style={{ ...styles.select, flex: '0 0 auto', minWidth: 150 }}
                    onMouseEnter={(e) => e.target.style.borderColor = '#cbd5e1'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="all">⚡ All Levels</option>
                    {difficulties.map(d => <option key={d} value={d}>{d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                  <select
                    value={timedFilter}
                    onChange={(e) => { setTimedFilter(e.target.value); localStorage.setItem('histTimed', e.target.value); }}
                    style={{ ...styles.select, flex: '0 0 auto', minWidth: 130 }}
                    onMouseEnter={(e) => e.target.style.borderColor = '#cbd5e1'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="all">⏱️ All Types</option>
                    <option value="timed">⏱️ Timed Only</option>
                    <option value="untimed">🕐 Untimed Only</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); localStorage.setItem('histSort', e.target.value); }}
                    style={{ ...styles.select, flex: '0 0 auto', minWidth: 150 }}
                    onMouseEnter={(e) => e.target.style.borderColor = '#cbd5e1'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="date-desc">📅 Newest First</option>
                    <option value="date-asc">📅 Oldest First</option>
                    <option value="best-desc">🏆 Best % First</option>
                    <option value="best-asc">📊 Lowest % First</option>
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: '500' }}>📊 {filteredHistory.length} shown of {history.length} quizzes</div>
              {filteredHistory.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', background: '#f1f5f9', borderRadius: 8 }}>No matches for current filters.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px, 100%),1fr))', gap: 12 }}>
                  {filteredHistory.map(item => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onView={setViewAttempt}
                      onDelete={async (id) => {
                        const filtered = history.filter(h => h.id !== id);
                        setHistory(filtered);
                        const token = localStorage.getItem('token');
                        if (token) {
                          try {
                            await fetch(`${API_URL}/api/save-quiz-history`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ attempt: { id: 'DELETE_ALL', quizHistory: filtered } })
                            });
                          } catch (e) {
                            console.error('Failed to delete:', e);
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* View Attempt Panel */}
      {viewAttempt && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn" onClick={() => setViewAttempt(null)}>Back</button>
          <div style={{ marginTop: 10, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12 }}>
            {renamingId === viewAttempt.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="file-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  style={{ minWidth: 240 }}
                />
                <button
                  className="btn success"
                  onClick={() => {
                    const trimmed = (renameValue || '').trim() || 'Untitled Quiz';
                    const next = history.map(h => h.id === viewAttempt.id ? { ...h, name: trimmed } : h);
                    setHistory(next);
                    const token = localStorage.getItem('token');
                    if (token) {
                      fetch(`${API_URL}/api/save-quiz-history`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ attempt: { id: 'UPDATE_ALL', quizHistory: next } })
                      }).catch(e => console.error('Failed to update:', e));
                    }
                    setViewAttempt({ ...viewAttempt, name: trimmed });
                    setRenamingId(null);
                    setRenameValue('');
                  }}
                >Save</button>
                <button className="btn" onClick={() => { setRenamingId(null); setRenameValue(''); }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ marginBottom: 4 }}>{viewAttempt.name}</h3>
                <button className="btn" onClick={() => { setRenamingId(viewAttempt.id); setRenameValue(viewAttempt.name || ''); }}>Rename</button>
              </div>
            )}
            <p style={{ marginTop: 0, color: '#64748b' }}>Topic: <strong>{viewAttempt.topic}</strong> · {new Date(viewAttempt.createdAt).toLocaleString()} · {viewAttempt.difficulty} · {viewAttempt.timed ? 'Timed' : 'Untimed'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: '1 1 200px' }}>
                <strong>Score:</strong> {viewAttempt.score} / {viewAttempt.total} ({viewAttempt.percent}%)
                <div style={{ marginTop: 8 }}>
                  <button
                    className="btn success"
                    onClick={() => {
                      setQuizName(viewAttempt.name || '');
                      setQuizTopic(viewAttempt.topic || '');
                      localStorage.setItem('quizDifficulty', viewAttempt.difficulty || 'medium');
                      setViewAttempt(null);
                      setShowHistory(false);
                      generateQuiz();
                    }}
                    style={{ width: '100%', maxWidth: 150 }}
                  >
                    Retake
                  </button>
                </div>
              </div>
              <div style={{ flex: '0 0 auto' }}>
                <ScoreRing percent={viewAttempt.percent || 0} />
              </div>
            </div>
            {viewAttempt.summary && (
              <div style={{ marginTop: 10 }}>
                <strong>AI Summary:</strong>
                <p style={{ marginTop: 4 }}>{viewAttempt.summary}</p>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>Question Review ({viewAttempt.questions.length})</h4>
                <button
                  className="btn"
                  onClick={() => setViewReviewExpanded(!viewReviewExpanded)}
                  style={{ fontSize: 12 }}
                >
                  {viewReviewExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
              {viewReviewExpanded && viewAttempt.questions.map((q, idx) => (
                <QuestionReviewItem
                  key={idx}
                  q={q}
                  idx={idx}
                  userAnswer={viewAttempt.answers?.[idx] ?? null}
                  isCorrect={viewAttempt.breakdown?.[idx]?.correct ?? false}
                  partialMarks={viewAttempt.breakdown?.[idx]?.marks ?? 0}
                  explanation={viewAttempt.breakdown?.[idx]?.explanation || ''}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Quiz Section */}
      {!showHistory && !viewAttempt && (
        <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0'}}>
          {questions.length > 0 && (
            <div style={{marginBottom:'1.5rem'}}>
              <h2 style={{margin:0,fontSize:'1.5rem',fontWeight:'bold'}}>🎯 Quiz Time</h2>
              <p style={{color:'#64748b',marginTop:'0.5rem'}}>
                {questions.length} Questions · {localStorage.getItem("quizDifficulty") || "medium"} difficulty
              </p>
            </div>
          )}

          {started && !submitted && questions.length > 0 && (
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', marginBottom: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 'bold', fontSize: 'clamp(13px, 2.5vw, 15px)' }}>Progress: {answeredCount}/{questions.length} ({progressPercent}%)</div>
                {timedMode === 'timed' && (
                  <div style={{ fontWeight: 'bold', color: timeLeft <= 60 ? '#ef4444' : '#16a34a', fontSize: 'clamp(14px, 3vw, 16px)' }}>
                    ⏱ {formatTime(timeLeft)}
                  </div>
                )}
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, marginTop: 8 }}>
                <div style={{ height: 6, width: `${progressPercent}%`, background: '#3b82f6', borderRadius: 4, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}



          {!started && questions.length === 0 && localStorage.getItem('shouldGenerateQuiz') === 'true' && (
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',marginBottom:'1.5rem'}}>
              <p style={{marginBottom:'0.75rem',fontWeight:'600',color:'#334155'}}>Number of Questions:</p>
              <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem'}}>
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(10, Math.min(50, parseInt(e.target.value) || 10)))}
                  style={{width:'100px',padding:'0.5rem',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'1rem',fontWeight:'500'}}
                />
                <span style={{color:'#64748b',fontSize:'0.875rem'}}>Min: 10, Max: 50</span>
              </div>
              <p style={{marginBottom:'0.75rem',fontWeight:'600',color:'#334155'}}>Quiz Difficulty:</p>
              <select
                value={localStorage.getItem('quizDifficulty') || 'medium'}
                onChange={(e) => localStorage.setItem('quizDifficulty', e.target.value)}
                style={{width:'100%',padding:'0.75rem',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'0.95rem',cursor:'pointer',background:'white',fontWeight:'500',marginBottom:'1rem'}}
              >
                <option value="easy">🟢 Easy - Basic recall and understanding</option>
                <option value="medium">🟡 Medium - Moderate difficulty (Recommended)</option>
                <option value="hard">🔴 Hard - Challenging and advanced</option>
              </select>
              <button className="btn" onClick={() => { localStorage.removeItem('shouldGenerateQuiz'); generateQuiz(); }} style={{width:'100%'}}>Start Quiz</button>
            </div>
          )}

          {!started && questions.length > 0 && (
            <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'12px',padding:'2rem',color:'white',marginBottom:'1.5rem',boxShadow:'0 10px 30px rgba(102,126,234,0.3)'}}>
              <h3 style={{margin:'0 0 1rem 0',fontSize:'1.25rem'}}>Choose Quiz Mode</h3>
              <p style={{opacity:0.9,marginBottom:'1.5rem'}}>How would you like to attempt this quiz?</p>
              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <button className="btn" onClick={() => handleStart('untimed')} style={{flex:'1 1 200px',background:'white',color:'#667eea',border:'none'}}>🕒 Untimed Mode</button>
                <button className="btn" onClick={() => handleStart('timed')} style={{flex:'1 1 200px',background:'rgba(255,255,255,0.2)',color:'white',border:'2px solid white'}}>⏱️ Timed ({questions.length} min)</button>
              </div>
            </div>
          )}


          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && questions.length === 0 && started === false ? null : (
            started && !submitted && questions.map((item, idx) => (
              <div key={idx} className="question">
                <p>
                  <strong>Q{idx + 1}.</strong> {item.q}
                </p>

                {item.type === "mcq" && (
                  <ul style={{listStyle:'none',padding:0}}>
                    {item.options.map((opt, i) => {
                      const isSelected = answers[idx] === opt;
                      return (
                        <li
                          key={i}
                          onClick={() => !submitted && setAnswer(idx, opt)}
                          style={{padding:'0.75rem',marginBottom:'0.5rem',border:'2px solid',borderColor:isSelected?'#3b82f6':'#e2e8f0',borderRadius:'8px',cursor:submitted?'default':'pointer',background:isSelected?'#eff6ff':'white',transition:'all 0.2s'}}
                        >
                          {opt}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {item.type === "multiselect" && (
                  <div>
                    <p style={{fontSize:'0.875rem',color:'#64748b',marginBottom:'0.5rem'}}>Select all correct answers (2-3 correct)</p>
                    {item.options.map((opt, i) => {
                      const selected = answers[idx] || [];
                      const isChecked = selected.includes(opt);
                      return (
                        <label key={i} style={{display:'flex',alignItems:'center',padding:'0.75rem',border:'2px solid #e2e8f0',borderRadius:'8px',marginBottom:'0.5rem',cursor:'pointer',background:isChecked?'#eff6ff':'white',borderColor:isChecked?'#3b82f6':'#e2e8f0',transition:'all 0.2s'}}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (submitted) return;
                              const current = answers[idx] || [];
                              const updated = isChecked ? current.filter(a => a !== opt) : [...current, opt];
                              setAnswer(idx, updated);
                            }}
                            disabled={submitted}
                            style={{marginRight:'0.75rem',width:'18px',height:'18px',cursor:'pointer'}}
                          />
                          <span style={{flex:1,color:'#334155'}}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
          {started && !submitted && (
            <button className="btn success" onClick={handleSubmit} disabled={loading || submitting || questions.length === 0}>
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </button>
          )}
          {score !== null && (
            <div style={{marginTop:'2rem',background:'white',borderRadius:'16px',padding:'2rem',border:'1px solid #e2e8f0',boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
              <h3 style={{margin:'0 0 0.5rem 0',fontSize:'1.5rem',color:'#1e293b'}}>{quizName?.trim() ? quizName : 'Quiz Results'}</h3>
              <p style={{margin:0,color:'#64748b',fontSize:'0.875rem'}}>{quizTopic?.trim() || 'General'} · {new Date().toLocaleString()}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <p style={{fontSize:'1.5rem',fontWeight:'bold',margin:0,color:score >= Math.ceil(questions.length * 0.75) ? '#22c55e' : score >= Math.ceil(questions.length * 0.5) ? '#f59e0b' : '#ef4444'}}>
                    Score: {score} / {questions.length}
                  </p>
                  <p style={{marginTop:'0.5rem',color:'#64748b'}}>XP Earned: +{score * 10}</p>
                </div>
                <div style={{ flex: '0 0 auto' }}>
                  <ScoreRing percent={Math.round((score / questions.length) * 100)} />
                </div>
              </div>
              {analysis?.summary && (
                <div style={{marginTop:'1.5rem',padding:'1rem',background:'#f8fafc',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <strong style={{color:'#334155'}}>AI Summary:</strong>
                  <p style={{marginTop:'0.5rem',color:'#475569',lineHeight:'1.6'}}>{analysis.summary}</p>
                </div>
              )}

              <div style={{marginTop:'2rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                  <h4 style={{margin:0,fontSize:'1.125rem',color:'#1e293b'}}>Question Review ({questions.length})</h4>
                  <button
                    className="btn"
                    onClick={() => setReviewExpanded(!reviewExpanded)}
                    style={{ fontSize: 12 }}
                  >
                    {reviewExpanded ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
                {reviewExpanded && questions.map((q, idx) => (
                  <QuestionReviewItem
                    key={idx}
                    q={q}
                    idx={idx}
                    userAnswer={answers[idx] ?? null}
                    isCorrect={analysis?.breakdown?.[idx]?.correct ?? false}
                    partialMarks={analysis?.breakdown?.[idx]?.marks ?? 0}
                    explanation={analysis?.breakdown?.[idx]?.explanation || ''}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const StatCard = ({icon,label,value,color}) => (
  <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',textAlign:'center'}}>
    <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{icon}</div>
    <div style={{fontSize:'0.875rem',color:'#64748b',marginBottom:'0.25rem'}}>{label}</div>
    <div style={{fontSize:'1.75rem',fontWeight:'bold',color}}>{value}</div>
  </div>
);