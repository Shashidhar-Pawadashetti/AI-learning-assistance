import { useEffect, useState } from "react";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const notes = localStorage.getItem("studentNotes");
    if (!notes) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, level: "medium" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
        const merged = [
          ...(data.blanks || []).map(b => ({ type: "blank", q: b.q, a: b.a })),
          ...(data.mcq || []).map(m => ({ type: "mcq", q: m.q, options: m.options, a: m.a }))
        ];
        setQuestions(merged);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  const setAnswer = (idx, value) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  };

  const handleSubmit = async () => {
    let correct = 0;
    const detailedQuestions = [];
    
    questions.forEach((q, i) => {
      const v = answers[i];
      let isCorrect = false;
      
      if (q.type === "mcq") {
        isCorrect = v === q.a;
      } else {
        isCorrect = (v || "").toString().trim().toLowerCase() === (q.a || "").toString().trim().toLowerCase();
      }
      
      if (isCorrect) correct += 1;
      
      detailedQuestions.push({
        question: q.q,
        type: q.type,
        userAnswer: v || '',
        correctAnswer: q.a,
        isCorrect
      });
    });
    
    setScore(correct);

    // Award XP: 10 per correct
    const gained = correct * 10;
    const userRaw = localStorage.getItem('user');
    
    if (userRaw) {
      const user = JSON.parse(userRaw);
      let xp = (user.xp || 0) + gained;
      let level = user.level || 1;
      
      // Level-up loop
      while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
      }
      
      const updated = { ...user, xp, level };
      localStorage.setItem('user', JSON.stringify(updated));

      // Save to backend
      try {
        // Save quiz attempt
        await fetch('http://localhost:5000/api/quiz-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            questions: detailedQuestions,
            score: correct,
            totalQuestions: questions.length,
            xpEarned: gained,
            difficulty: 'medium'
          })
        });

        // Update user XP and level
        await fetch(`http://localhost:5000/api/firebase-user/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xp, level })
        });
      } catch (err) {
        console.error('Failed to sync with backend:', err);
      }
    }

    // Track stats in localStorage
    const stats = JSON.parse(localStorage.getItem('stats') || '{}');
    stats.quizzesCompleted = (stats.quizzesCompleted || 0) + 1;
    stats.lastScore = correct;
    stats.totalQuestions = questions.length;
    localStorage.setItem('stats', JSON.stringify(stats));
  };

  return (
    <div className="quiz-card">
      <h2>Quiz Time 🎯</h2>
      {loading && <p>Generating quiz…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && questions.length === 0 ? (
        <p>No notes uploaded yet. Please go back and upload notes first.</p>
      ) : (
        questions.map((item, idx) => (
          <div key={idx} className="question">
            <p>
              {idx + 1}. {item.q}
            </p>

            {item.type === "blank" && (
              <input
                type="text"
                className="file-input"
                placeholder="Your answer..."
                value={answers[idx] || ""}
                onChange={(e) => setAnswer(idx, e.target.value)}
              />
            )}

            {item.type === "mcq" && (
              <ul>
                {item.options.map((opt, i) => (
                  <li key={i} className={`option ${answers[idx] === opt ? 'selected' : ''}`}
                    onClick={() => setAnswer(idx, opt)}>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
      <button className="btn success" onClick={handleSubmit}>Submit</button>
      {score !== null && (
        <div style={{ marginTop: 12 }}>
          <p>You scored {score} / {questions.length}</p>
          <button className="btn" onClick={() => setShowReview(!showReview)} style={{ marginTop: 8 }}>
            {showReview ? 'Hide Review' : 'Review Answers'}
          </button>
          {showReview && (
            <div className="quiz-review" style={{ marginTop: 16, textAlign: 'left' }}>
              <h3>Answer Review</h3>
              {questions.map((item, idx) => {
                const userAns = answers[idx] || '';
                const isCorrect = item.type === "mcq" 
                  ? userAns === item.a 
                  : userAns.toString().trim().toLowerCase() === item.a.toString().trim().toLowerCase();
                
                return (
                  <div key={idx} style={{ 
                    padding: '12px', 
                    marginBottom: '10px', 
                    background: isCorrect ? '#e7f5e7' : '#ffe7e7',
                    borderRadius: '8px'
                  }}>
                    <p><strong>Q{idx + 1}:</strong> {item.q}</p>
                    <p><strong>Your answer:</strong> {userAns || '(not answered)'}</p>
                    <p><strong>Correct answer:</strong> {item.a}</p>
                    <p style={{ color: isCorrect ? 'green' : 'red' }}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
