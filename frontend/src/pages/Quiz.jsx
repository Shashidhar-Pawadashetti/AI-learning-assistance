import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('http://localhost:5000/api/quiz-history', {
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
      localStorage.removeItem('shouldGenerateQuiz');
      setShowHistory(false);
      generateQuiz();
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
    if (mode === 'timed') {
      setTimeLeft(totalTime);
    }
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
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

      const res = await fetch('http://localhost:5000/api/analyze-quiz', {
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
        const saveRes = await fetch('http://localhost:5000/api/save-quiz-history', {
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
  const QuestionReviewItem = ({ q, idx, userAnswer, isCorrect, explanation }) => {
    const correctAnswer = q.a;
    return (
      <div style={{
        marginBottom: 12,
        padding: '10px',
        borderRadius: '8px',
        border: `2px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
        backgroundColor: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: 6 }}>Q{idx + 1}. {q.q}</p>
        <p style={{ color: isCorrect ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
          {isCorrect ? '✅ Correct' : '❌ Incorrect'}
        </p>
        {!isCorrect && userAnswer && (
          <p style={{ marginTop: 4, color: '#dc2626' }}>Your answer: {userAnswer}</p>
        )}
        <p style={{ marginTop: 4, color: '#16a34a', fontWeight: 'bold' }}>Correct answer: {correctAnswer}</p>
        {!isCorrect && explanation && (
          <div style={{ marginTop: 8, padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: 6, fontSize: 14, color: '#334155' }}>
            <strong>Explanation:</strong> {explanation}
          </div>
        )}
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
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Please login to generate a quiz.');
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
      const res = await fetch("http://localhost:5000/api/generate-quiz", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes, level: difficulty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      const merged = [
        ...(data.blanks || []).map(b => ({ type: "blank", q: b.q, a: b.a })),
        ...(data.mcq || []).map(m => ({ type: "mcq", q: m.q, options: m.options, a: m.a }))
      ];
      setQuestions(merged);
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
    <div className="quiz-card">
      {/* Enhanced Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>Quiz Center</h2>
        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: 'clamp(12px, 2vw, 14px)' }}>
          {headerStats ? `Attempts: ${headerStats.attempts} · Best: ${headerStats.best}% · Avg: ${headerStats.avg}% · Last: ${headerStats.last}%` : 'No attempts yet'}
        </p>
        {headerStats && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
            <div style={styles.statChip}>Timed: {headerStats.timedCount}</div>
            <div style={styles.statChip}>Avg: {headerStats.avg}%</div>
            <div style={styles.statChip}>Best: {headerStats.best}%</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <button className="btn" onClick={() => setShowHistory(true)} style={{ flex: '1 1 auto', minWidth: 100 }}>View History</button>
          <button className="btn success" onClick={handleStartNewQuiz} style={{ flex: '1 1 auto', minWidth: 120 }}>Start New Quiz</button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div style={{ marginBottom: 16 }}>
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
                            await fetch('http://localhost:5000/api/save-quiz-history', {
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
                      fetch('http://localhost:5000/api/save-quiz-history', {
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
                  isCorrect={viewAttempt.breakdown?.[idx]?.correct ?? (viewAttempt.answers?.[idx] === q.a)}
                  explanation={viewAttempt.breakdown?.[idx]?.explanation || ''}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Quiz Section */}
      {!showHistory && !viewAttempt && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Quiz Time 🎯</h2>
              <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                {questions.length > 0 && `${questions.length} Questions - ${localStorage.getItem("quizDifficulty") || "medium"} difficulty`}
              </p>
            </div>
          </div>

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

          {!started && questions.length === 0 && (
            <div style={{ ...styles.panel, marginBottom: 16 }}>
              <p style={{ marginBottom: 12 }}>Name your quiz and set a topic (optional):</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  className="file-input"
                  placeholder="Quiz name (e.g., Chapter 3 Practice)"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  style={{ minWidth: 220 }}
                />
                <input
                  className="file-input"
                  placeholder="Topic (e.g., Algebra, Biology)"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  style={{ minWidth: 200 }}
                />
                <button className="btn" onClick={generateQuiz}>Generate 20-Question Quiz</button>
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Note: Quiz is generated from your latest uploaded notes.</p>
            </div>
          )}

          {!started && questions.length > 0 && (
            <div style={{ ...styles.panel, marginBottom: 16 }}>
              <p style={{ marginBottom: 12 }}>How would you like to attempt the quiz?</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn" onClick={() => handleStart('untimed')}>Without Time</button>
                <button className="btn" onClick={() => handleStart('timed')}>With Time ({questions.length} min)</button>
              </div>
            </div>
          )}

          {loading && <p>Generating your 20-question quiz… This may take up to 90 seconds.</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && questions.length === 0 && started === false ? null : (
            started && !submitted && questions.map((item, idx) => (
              <div key={idx} className="question">
                <p>
                  <strong>Q{idx + 1}.</strong> {item.q}
                </p>

                {item.type === "blank" && (
                  <input
                    type="text"
                    className="file-input"
                    placeholder="Your answer..."
                    value={answers[idx] || ""}
                    onChange={(e) => setAnswer(idx, e.target.value)}
                    disabled={submitted}
                  />
                )}

                {item.type === "mcq" && (
                  <ul>
                    {item.options.map((opt, i) => {
                      const isSelected = answers[idx] === opt;
                      const finalClass = submitted
                        ? `option ${isSelected ? 'selected' : ''}`
                        : `option ${isSelected ? 'selected' : ''}`;
                      return (
                        <li
                          key={i}
                          className={finalClass}
                          onClick={() => !submitted && setAnswer(idx, opt)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (!submitted) setAnswer(idx, opt);
                            } else if (e.key === 'ArrowDown' && i < item.options.length - 1) {
                              e.preventDefault();
                              e.currentTarget.nextElementSibling?.focus();
                            } else if (e.key === 'ArrowUp' && i > 0) {
                              e.preventDefault();
                              e.currentTarget.previousElementSibling?.focus();
                            }
                          }}
                        >
                          {opt}
                        </li>
                      );
                    })}
                  </ul>
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
            <div style={{ marginTop: 20, padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
              <h3>{quizName?.trim() ? quizName : 'Results'}</h3>
              <p style={{ marginTop: -6, color: '#64748b' }}>{quizTopic?.trim() || 'General'} · {new Date().toLocaleString()}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: score >= Math.ceil(questions.length * 0.75) ? '#4CAF50' : score >= Math.ceil(questions.length * 0.5) ? '#FF9800' : '#f44336' }}>
                    Score: {score} / {questions.length}
                  </p>
                  <p style={{ marginTop: 6 }}>XP Earned: +{score * 10}</p>
                </div>
                <div style={{ flex: '0 0 auto' }}>
                  <ScoreRing percent={Math.round((score / questions.length) * 100)} />
                </div>
              </div>
              {analysis?.summary && (
                <div style={{ marginTop: 8 }}>
                  <strong>AI Summary:</strong>
                  <p style={{ marginTop: 6 }}>{analysis.summary}</p>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>Question Review: ({questions.length})</h4>
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
                    explanation={analysis?.breakdown?.[idx]?.explanation || ''}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}