import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config';
import Loading from "../components/Loading";

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
      {explanation && (
        <div style={{ marginTop: 8, padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '6px', fontSize: '0.9rem', fontStyle: 'italic', color: '#475569' }}>
          💡 {explanation}
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

// Component: Stat Card
const StatCard = ({icon,label,value,color}) => (
  <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',textAlign:'center'}}>
    <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{icon}</div>
    <div style={{fontSize:'0.875rem',color:'#64748b',marginBottom:'0.25rem'}}>{label}</div>
    <div style={{fontSize:'1.75rem',fontWeight:'bold',color}}>{value}</div>
  </div>
);

// Add retry logic for failed saves
const saveQuizHistory = async (attempt, retries = 3) => {
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

  for (let i = 0; i < retries; i++) {
    try {
      const saveRes = await fetch(`${API_URL}/api/save-quiz-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attempt })
      });

      if (!saveRes.ok) {
        throw new Error(`Server responded with ${saveRes.status}`);
      }

      const saveData = await saveRes.json();
      return saveData;
    } catch (err) {
      console.error(`Save attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        // Last attempt failed - save locally as backup
        try {
          const localHistory = JSON.parse(localStorage.getItem('localQuizHistory') || '[]');
          localHistory.unshift(attempt);
          localStorage.setItem('localQuizHistory', JSON.stringify(localHistory.slice(0, 100))); // Keep last 100
        } catch (e) {
          console.error('Error saving local history:', e);
        }
        throw err;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Add sync function to upload local history when connection restored
export const syncLocalHistory = async () => {
  let localHistory = [];
  try {
    localHistory = JSON.parse(localStorage.getItem('localQuizHistory') || '[]');
  } catch (e) {
    console.error('Error parsing localQuizHistory:', e);
    localStorage.removeItem('localQuizHistory');
    return;
  }
  if (localHistory.length === 0) return;

  try {
    let token = localStorage.getItem('token');
    const { auth } = await import('../firebase');
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken(true);
    }

    for (const attempt of localHistory) {
      await fetch(`${API_URL}/api/save-quiz-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attempt })
      });
    }

    // Clear local history after successful sync
    localStorage.removeItem('localQuizHistory');
    console.log('✓ Local quiz history synced');
  } catch (err) {
    console.error('Failed to sync local history:', err);
  }
};

export default function Quiz() {
  const navigate = useNavigate();
  
  // Initialize state from localStorage if available
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz_questions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing quiz_questions from localStorage:', e);
      return [];
    }
  });
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz_answers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error parsing quiz_answers from localStorage:', e);
      return {};
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [started, setStarted] = useState(() => localStorage.getItem('quiz_started') === 'true');
  const [timedMode, setTimedMode] = useState(() => localStorage.getItem('quiz_timed_mode')); // 'timed' | 'untimed'
  const [timeLeft, setTimeLeft] = useState(() => parseInt(localStorage.getItem('quiz_time_left')) || 0);
  const [startTime, setStartTime] = useState(() => parseInt(localStorage.getItem('quiz_start_time')) || null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => localStorage.getItem('quiz_submitted') === 'true');
  
  const [quizName, setQuizName] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem('quizDifficulty') || 'medium');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewAttempt, setViewAttempt] = useState(null);
  
  // History filters/search
  const [search, setSearch] = useState(localStorage.getItem('histSearch') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [topicFilter, setTopicFilter] = useState(localStorage.getItem('histTopic') || 'all');
  const [difficultyFilter, setDifficultyFilter] = useState(localStorage.getItem('histDifficulty') || 'all');
  const [timedFilter, setTimedFilter] = useState(localStorage.getItem('histTimed') || 'all');
  const [sortBy, setSortBy] = useState(localStorage.getItem('histSort') || 'date-desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('quiz_questions', JSON.stringify(questions)); }, [questions]);
  useEffect(() => { localStorage.setItem('quiz_answers', JSON.stringify(answers)); }, [answers]);
  useEffect(() => { localStorage.setItem('quiz_started', started); }, [started]);
  useEffect(() => { 
    if (timedMode) localStorage.setItem('quiz_timed_mode', timedMode); 
    else localStorage.removeItem('quiz_timed_mode');
  }, [timedMode]);
  useEffect(() => { localStorage.setItem('quiz_time_left', timeLeft); }, [timeLeft]);
  useEffect(() => { 
    if (startTime) localStorage.setItem('quiz_start_time', startTime); 
  }, [startTime]);
  useEffect(() => { localStorage.setItem('quiz_submitted', submitted); }, [submitted]);

  // Notify the shell app (App.jsx) whenever quiz status changes so it can hide/show the chatbot
  useEffect(() => {
    try {
      window.dispatchEvent(new Event('quizStatusChange'));
    } catch (e) {
      console.error('Error dispatching quizStatusChange event:', e);
    }
  }, [started, submitted]);

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (score !== null && analysis) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const resultsElement = document.getElementById('quiz-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [score, analysis]);

  const topics = useMemo(() => Array.from(new Set((history || []).map(h => h.topic))).filter(Boolean), [history]);
  const difficulties = useMemo(() => Array.from(new Set((history || []).map(h => h.difficulty))).filter(Boolean), [history]);
  const filteredHistory = useMemo(() => {
    let list = [...(history || [])];
    if (debouncedSearch.trim()) {
      const s = debouncedSearch.toLowerCase();
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
  }, [history, debouncedSearch, topicFilter, difficultyFilter, timedFilter, sortBy]);

  // Inline rename state for attempts
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [reviewExpanded, setReviewExpanded] = useState(true);
  const [viewReviewExpanded, setViewReviewExpanded] = useState(true);
  const [notification, setNotification] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
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
    if (shouldGenerate === 'true' && (!questions || questions.length === 0)) {
      setShowHistory(false);
    }

    // Sync local history on mount
    syncLocalHistory().catch(err => {
      console.error('Error syncing local history:', err);
    });
  }, []);

  const setAnswer = useCallback((idx, value, isMultiselect = false) => {
    if (submitted) return;
    setAnswers(prev => {
      if (isMultiselect) {
        // For multiselect, toggle the value in an array
        const current = Array.isArray(prev[idx]) ? prev[idx] : [];
        const newAnswers = { ...prev };
        if (current.includes(value)) {
          newAnswers[idx] = current.filter(v => v !== value);
        } else {
          newAnswers[idx] = [...current, value];
        }
        // Remove empty arrays
        if (newAnswers[idx].length === 0) {
          delete newAnswers[idx];
        }
        return newAnswers;
      } else {
        // For single select, just set the value
        return { ...prev, [idx]: value };
      }
    });
  }, [submitted]);

  const totalTime = useMemo(() => {
    if (!questions || !Array.isArray(questions)) return 0;
    return questions.length * 60;
  }, [questions]);
  const answeredCount = useMemo(() => Object.keys(answers || {}).length, [answers]);
  const progressPercent = useMemo(() => {
    if (!questions || questions.length === 0) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions]);

  // Derived stats for header
  const headerStats = useMemo(() => {
    if (!history.length) return null;
    const best = Math.max(...history.map(h => h.percent));
    const last = history[0].percent;
    const avg = Math.round(history.reduce((sum, h) => sum + h.percent, 0) / history.length);
    const timedCount = history.filter(h => h.timed).length;
    return { best, last, avg, attempts: history.length, timedCount };
  }, [history]);

  // Define handleSubmit before useEffect that uses it
  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setSubmitted(true); // Prevent multiple submissions immediately
    
    try {
      if (!questions || questions.length === 0) {
        throw new Error('No questions to submit');
      }

      const { auth } = await import('../firebase');
      const currentUser = auth.currentUser;
      let token = localStorage.getItem('token');
      if (currentUser) {
        token = await currentUser.getIdToken(true);
        localStorage.setItem('token', token);
      }
      
      // Calculate elapsed time for timed quizzes
      let timeSpent = null;
      if (timedMode === 'timed' && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timeSpent = Math.min(elapsed, totalTime); // Cap at totalTime
      }
      
      const payload = {
        questions: questions.map((q, i) => ({
          question: q.q || q.question || '',
          userAnswer: answers[i] || null,
          correctAnswer: q.correctAnswers || [q.a] || [],
          type: q.type || 'mcq',
          options: q.options || []
        })),
        timed: timedMode === 'timed',
        timeSpent: timeSpent
      };
      
      const res = await fetch(`${API_URL}/api/submit-quiz`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Submission failed");
      }
      
      const data = await res.json();
      
      // Backend returns score as percentage, analysis contains breakdown
      const percent = data.score || (data.analysis?.score || 0);
      setScore(percent);
      setAnalysis(data.analysis || {
        score: percent,
        total: data.total || questions.length,
        breakdown: data.analysis?.breakdown || [],
        summary: data.analysis?.summary || `You scored ${percent}%`
      });
      
      // Fix stats tracking
      try {
        const existingStats = JSON.parse(localStorage.getItem('stats') || '{}');
        
        existingStats.quizzesCompleted = (existingStats.quizzesCompleted || 0) + 1;
        existingStats.lastScore = percent;
        existingStats.totalQuestions = data.total || questions.length;
        existingStats.bestPercent = Math.max(existingStats.bestPercent || 0, percent);
        
        if (timedMode === 'timed') {
          existingStats.timedQuizzesCompleted = (existingStats.timedQuizzesCompleted || 0) + 1;
          existingStats.bestTimedPercent = Math.max(existingStats.bestTimedPercent || 0, percent);
        }
        
        localStorage.setItem('stats', JSON.stringify(existingStats));
      } catch (statsError) {
        console.error('Error saving stats:', statsError);
      }
      
      // Calculate actual score (number of correct answers)
      const correctCount = Math.round((percent / 100) * (data.total || questions.length));
      
      // Calculate elapsed time for timed quizzes
      let elapsedSeconds = 0;
      if (timedMode === 'timed' && startTime) {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        // Cap at totalTime to prevent negative or excessive values
        elapsedSeconds = Math.min(elapsedSeconds, totalTime);
      }
      
      // Save to history
      const newHistoryItem = {
        id: Date.now().toString(),
        name: quizName || `Quiz ${new Date().toLocaleDateString()}`,
        topic: quizTopic || 'General',
        score: correctCount,
        total: data.total || questions.length,
        percent,
        createdAt: Date.now(),
        difficulty: difficulty || localStorage.getItem('quizDifficulty') || 'medium',
        timed: timedMode === 'timed',
        elapsedSeconds: elapsedSeconds,
        questions: questions,
        answers: answers,
        breakdown: data.analysis?.breakdown || [],
        summary: data.analysis?.summary || ''
      };
      
      setHistory(prev => [newHistoryItem, ...prev]);
      
      // Save history to backend with retry logic
      saveQuizHistory(newHistoryItem).catch(e => {
        console.error('Failed to save history after retries:', e);
        setNotification('Saved locally. Will sync when online.');
        setTimeout(() => setNotification(''), 3000);
      });

      // Mark quiz as completed for this session and clear persisted quiz state
      try {
        setStarted(false);
        localStorage.setItem('quiz_started', 'false');
        localStorage.setItem('quiz_submitted', 'true');
        localStorage.removeItem('quiz_questions');
        localStorage.removeItem('quiz_answers');
        localStorage.removeItem('quiz_time_left');
        localStorage.removeItem('quiz_timed_mode');
        localStorage.removeItem('quiz_start_time');
      } catch (storageError) {
        console.error('Error clearing quiz session data:', storageError);
      }
      
    } catch (e) {
      console.error('Quiz submission error:', e);
      setError(e.message || 'Failed to submit quiz. Please try again.');
      setSubmitted(false); // Reset on error
    } finally {
      setSubmitting(false);
    }
  }, [submitting, submitted, questions, answers, timedMode, totalTime, timeLeft, quizName, quizTopic, startTime, difficulty]);

  // Improved Timer Logic
  useEffect(() => {
    if (!started || timedMode !== 'timed' || submitted) return;
    
    // Initialize timer if we have startTime but timeLeft is 0
    if (startTime && timeLeft === 0 && totalTime > 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, totalTime - elapsed);
      if (remaining > 0) {
        setTimeLeft(remaining);
        return; // Return early, will re-run with new timeLeft
      } else {
        setTimeLeft(0);
        return;
      }
    }

    // Don't start timer if timeLeft is 0 or not initialized
    if (timeLeft <= 0) {
      return;
    }

    const t = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(t);
          setTimeLeft(0);
          // Timer hit 0: The useEffect for [timeLeft] will trigger the auto-submit
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [started, timedMode, submitted, startTime, totalTime, timeLeft, submitting, questions, handleSubmit]);

  // Auto submit when timer runs out
  useEffect(() => {
    if (started && timedMode === 'timed' && timeLeft === 0 && !submitted && !submitting && questions && questions.length > 0) {
      // Force immediate submission when timer hits 0
      // Use a small delay to ensure state is consistent
      const submitTimer = setTimeout(() => {
        if (!submitted && !submitting) {
          handleSubmit();
        }
      }, 50);
      return () => clearTimeout(submitTimer);
    }
  }, [timeLeft, started, timedMode, submitted, submitting, questions, handleSubmit]);

  const handleStart = (mode) => {
    setTimedMode(mode);
    setStarted(true);
    const now = Date.now();
    setStartTime(now);
    if (mode === 'timed' && totalTime > 0) {
      setTimeLeft(totalTime);
      localStorage.setItem('quiz_time_left', totalTime.toString());
    }
    localStorage.setItem('quiz_start_time', now.toString());
  };

  const handleStartNewQuiz = () => {
    navigate('/upload');
  };

  const generateQuiz = async () => {
    const notes = localStorage.getItem("studentNotes");
    
    if (!notes) {
      setError('No notes uploaded yet. Please go back and upload notes first.');
      return;
    }

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

    // Clear old quiz state first
    localStorage.removeItem('quiz_questions');
    localStorage.removeItem('quiz_answers');
    localStorage.removeItem('quiz_started');
    localStorage.removeItem('quiz_timed_mode');
    localStorage.removeItem('quiz_time_left');
    localStorage.removeItem('quiz_start_time');
    localStorage.removeItem('quiz_submitted');
    
    // Clear state immediately
    setQuestions([]);
    setAnswers({});
    setScore(null);
    setAnalysis(null);
    setStarted(false);
    setSubmitted(false);
    setTimedMode(null);
    setTimeLeft(0);
    setStartTime(null);
    setShowHistory(false);
    setError("");

    // Save difficulty to localStorage
    localStorage.setItem('quizDifficulty', difficulty);

    setLoading(true);
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
      
      if (data.isFallback) {
        setIsOffline(true);
        setNotification("⚠️ AI Unavailable: Generated offline quiz (simpler questions). Check backend .env for API keys.");
      } else {
        setIsOffline(false);
      }

      const newQuestions = (data.questions || []).map(q => ({
        type: q.type || "mcq",
        q: q.q,
        options: q.options,
        correctAnswers: q.correctAnswers,
        a: q.correctAnswers?.[0]
      }));
      
      // Set new questions
      setQuestions(newQuestions);
      setAnswers({});
      setScore(null);
      setAnalysis(null);
      setStarted(false);
      setSubmitted(false);
      setTimedMode(null);
      setTimeLeft(0);
      setStartTime(null);
      setShowHistory(false);
      
      // Clear the flag
      localStorage.removeItem('shouldGenerateQuiz');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate removed to allow user to select difficulty first
  useEffect(() => {
    const shouldGenerate = localStorage.getItem('shouldGenerateQuiz');
    if (shouldGenerate === 'true') {
      // Just clear the flag so we don't get stuck in a loop if we re-enable this later
      localStorage.removeItem('shouldGenerateQuiz');
      // We purposely do NOT call generateQuiz() here anymore.
      // This allows the user to see the "No quiz generated" state
      // where they can select difficulty and click "Generate" manually.
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{padding:'1.5rem',maxWidth:'1400px',margin:'0 auto'}}>
      {/* Notification */}
      {notification && (
        <div 
          role="status" 
          aria-live="polite"
          style={{position:'fixed',top:'20px',right:'20px',zIndex:9999,background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',color:'white',padding:'1rem 1.5rem',borderRadius:'12px',boxShadow:'0 10px 30px rgba(0,0,0,0.3)',animation:'slideIn 0.3s ease',maxWidth:'400px'}}
        >
          <strong>{notification}</strong>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {loading && "Loading quiz questions"}
        {submitting && "Submitting your answers"}
      </div>

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
                <ScoreRing percent={viewAttempt.percent} />
              </div>
            </div>
            
            {viewAttempt.summary && (
              <div style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
                <strong>Summary:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{viewAttempt.summary}</p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                <h4 style={{ margin: 0 }}>Review Questions</h4>
                <button className="btn" onClick={() => setViewReviewExpanded(!viewReviewExpanded)} style={{fontSize:12}}>
                  {viewReviewExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              {viewReviewExpanded && viewAttempt.questions.map((q, idx) => (
                <QuestionReviewItem
                  key={idx}
                  q={q}
                  idx={idx}
                  userAnswer={viewAttempt.answers[idx]}
                  isCorrect={viewAttempt.breakdown?.[idx]?.correct}
                  partialMarks={viewAttempt.breakdown?.[idx]?.marks}
                  explanation={viewAttempt.breakdown?.[idx]?.explanation}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Interface */}
      {!showHistory && !viewAttempt && (
        <div>
          {/* Setup / Loading */}
          {(!questions || questions.length === 0) && !loading && !error && (
            <div style={styles.emptyState}>
              <p>No quiz generated yet.</p>
              
              {/* Difficulty Selector */}
              <div style={{marginBottom:'1.5rem',width:'100%',maxWidth:'400px',margin:'0 auto'}}>
                <label style={{display:'block',marginBottom:'0.75rem',fontWeight:'600',color:'#334155',fontSize:'0.875rem',textAlign:'left'}}>⚙️ Quiz Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    localStorage.setItem('quizDifficulty', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    color: '#334155',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="easy">Easy - Beginner friendly</option>
                  <option value="medium">Medium - Standard difficulty</option>
                  <option value="hard">Hard - Challenging concepts</option>
                </select>
              </div>
              
              <button className="btn success" onClick={generateQuiz}>Generate Quiz</button>
            </div>
          )}
          
          {loading && <Loading message="Generating your personalized quiz..." />}
          
          {error && (
            <div style={{padding:'1rem',background:'#fee2e2',color:'#dc2626',borderRadius:'8px',marginBottom:'1rem',border:'1px solid #fecaca'}}>
              <strong>Error:</strong> {error}
              <button className="btn" onClick={() => setError('')} style={{marginLeft:'1rem',fontSize:'0.875rem'}}>Dismiss</button>
            </div>
          )}

          {/* Quiz Active */}
          {questions && questions.length > 0 && !score && (
            <div>
              {/* Quiz Header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',background:'white',padding:'1rem',borderRadius:'12px',border:'1px solid #e2e8f0',boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                <div>
                  <h2 style={{margin:0,fontSize:'1.25rem'}}>{quizName || 'Practice Quiz'}</h2>
                  <span style={{fontSize:'0.875rem',color:'#64748b'}}>{questions.length} Questions · {quizTopic || 'General'}</span>
                </div>
                {!started ? (
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button className="btn" onClick={() => handleStart('untimed')}>Practice Mode</button>
                    <button className="btn success" onClick={() => handleStart('timed')}>Start Timed Quiz</button>
                  </div>
                ) : (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'1.5rem',fontWeight:'bold',fontFamily:'monospace',color:timeLeft < 60 ? '#ef4444' : '#334155'}}>
                      {timedMode === 'timed' ? formatTime(timeLeft) : 'Untimed'}
                    </div>
                    <div style={{fontSize:'0.75rem',color:'#64748b'}}>Time Remaining</div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {started && (
                <div style={{marginBottom:'2rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem',fontSize:'0.875rem',color:'#64748b'}}>
                    <span>Progress</span>
                    <span>{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
                  </div>
                  <div style={{height:'8px',background:'#e2e8f0',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(Object.keys(answers).length / questions.length) * 100}%`,background:'#3b82f6',transition:'width 0.3s ease'}}></div>
                  </div>
                </div>
              )}

              {/* Questions */}
              {started && (
                questions.map((item, idx) => (
                  <div key={idx} style={{marginBottom:'2rem',padding:'1.5rem',background:'white',borderRadius:'12px',border:'1px solid #e2e8f0'}}>
                    <h3 style={{marginTop:0,marginBottom:'1rem',fontSize:'1.125rem'}}>
                      <span style={{color:'#64748b',marginRight:'0.5rem'}}>{idx + 1}.</span>
                      {item.q}
                    </h3>
                    
                    <div 
                      style={{display:'flex',flexDirection:'column',gap:'0.75rem'}} 
                      role={item.type === 'multiselect' ? 'group' : 'radiogroup'} 
                      aria-labelledby={`q-label-${idx}`}
                    >
                      {item.options.map((opt, optIdx) => {
                        const isMultiselect = item.type === 'multiselect';
                        const currentAnswer = answers[idx];
                        const isSelected = isMultiselect 
                          ? (Array.isArray(currentAnswer) && currentAnswer.includes(opt))
                          : (currentAnswer === opt);
                        return (
                          <div
                            key={optIdx}
                            role={isMultiselect ? 'checkbox' : 'radio'}
                            aria-checked={isSelected}
                            tabIndex={0}
                            onClick={() => !submitted && setAnswer(idx, opt, isMultiselect)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                !submitted && setAnswer(idx, opt, isMultiselect);
                              }
                            }}
                            style={{
                              display:'flex',
                              alignItems:'center',
                              padding:'1rem',
                              borderRadius:'8px',
                              border:`2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                              background: isSelected ? '#eff6ff' : 'white',
                              cursor: submitted ? 'default' : 'pointer',
                              transition:'all 0.2s',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)'}
                            onBlur={(e) => e.target.style.boxShadow = 'none'}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: isMultiselect ? '4px' : '50%',
                              border: `2px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}`,
                              marginRight: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isSelected ? '#3b82f6' : 'transparent'
                            }}>
                              {isSelected && (
                                isMultiselect ? (
                                  <span style={{color:'white',fontSize:'12px',fontWeight:'bold'}}>✓</span>
                                ) : (
                                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#3b82f6'}} />
                                )
                              )}
                            </div>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Submit Button */}
              {started && (
                <div style={{marginTop:'2rem',textAlign:'right'}}>
                  <button 
                    className="btn success" 
                    onClick={handleSubmit}
                    disabled={submitting}
                    aria-label="Submit quiz answers"
                    aria-busy={submitting}
                    style={{padding:'1rem 2rem',fontSize:'1.125rem'}}
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results View */}
          {score !== null && analysis && (
            <div style={{animation:'fadeIn 0.5s ease'}} id="quiz-results">
              <div style={{textAlign:'center',marginBottom:'2rem',padding:'2rem',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'16px',color:'white',boxShadow:'0 10px 30px rgba(102,126,234,0.3)'}}>
                <h2 style={{margin:0,fontSize:'2.5rem',marginBottom:'0.5rem'}}>
                  {score >= 80 ? '🎉 Outstanding!' : score >= 60 ? '👏 Good Job!' : '💪 Keep Practicing!'}
                </h2>
                <div style={{fontSize:'4rem',fontWeight:'bold',margin:'1rem 0'}}>
                  {score}%
                </div>
                <p style={{fontSize:'1.125rem',opacity:0.9}}>
                  You answered {Math.round((score / 100) * questions.length)} out of {questions.length} questions correctly
                </p>
              </div>

              {/* Detailed Question Review */}
              <div style={{background:'white',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e2e8f0',marginBottom:'2rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                  <h3 style={{margin:0}}>Question Review</h3>
                  <button className="btn" onClick={() => setReviewExpanded(!reviewExpanded)} style={{fontSize:'0.875rem',padding:'0.5rem 1rem'}}>
                    {reviewExpanded ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
                {reviewExpanded && questions.map((q, idx) => {
                  const breakdown = analysis.breakdown[idx] || {};
                  const userAnswer = answers[idx];
                  const isCorrect = breakdown.correct;
                  const partialMarks = breakdown.marks || 0;
                  return (
                    <QuestionReviewItem
                      key={idx}
                      q={q}
                      idx={idx}
                      userAnswer={userAnswer}
                      isCorrect={isCorrect}
                      partialMarks={partialMarks}
                      explanation={breakdown.explanation}
                    />
                  );
                })}
              </div>

              <div style={{textAlign:'center',display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
                <button className="btn" onClick={() => {
                  setScore(null);
                  setAnalysis(null);
                  setQuestions([]);
                  setAnswers({});
                  setStarted(false);
                  setSubmitted(false);
                  navigate('/upload');
                }}>
                  Create New Quiz
                </button>
                <button className="btn success" onClick={() => {
                  // Retake the same quiz
                  setScore(null);
                  setAnalysis(null);
                  setAnswers({});
                  setStarted(false);
                  setSubmitted(false);
                  setTimedMode(null);
                  setTimeLeft(0);
                  setStartTime(null);
                  localStorage.removeItem('quiz_answers');
                  localStorage.removeItem('quiz_started');
                  localStorage.removeItem('quiz_timed_mode');
                  localStorage.removeItem('quiz_time_left');
                  localStorage.removeItem('quiz_start_time');
                  localStorage.removeItem('quiz_submitted');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                  Retake Quiz
                </button>
                <button className="btn" onClick={() => {
                  setScore(null);
                  setAnalysis(null);
                  setShowHistory(true);
                }}>
                  View History
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}