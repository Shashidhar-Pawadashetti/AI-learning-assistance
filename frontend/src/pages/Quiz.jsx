import { useEffect, useState } from "react";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);

  useEffect(() => {
    const notes = localStorage.getItem("studentNotes");
    const difficulty = localStorage.getItem("quizDifficulty") || "medium";

    // DEBUG: Log what we're sending
    console.log('=== FRONTEND QUIZ DEBUG ===');
    console.log('Notes from localStorage (first 500 chars):', notes ? notes.substring(0, 500) : 'EMPTY');
    console.log('Notes length:', notes ? notes.length : 0);
    console.log('Difficulty:', difficulty);
    console.log('===========================');

    if (!notes) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, level: difficulty })
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

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      const v = answers[i];
      if (!v) return;
      if (q.type === "mcq") {
        if (v === q.a) correct += 1;
      } else {
        if ((v || "").toString().trim().toLowerCase() === (q.a || "").toString().trim().toLowerCase()) correct += 1;
      }
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
    }

    // Track stats
    const stats = JSON.parse(localStorage.getItem('stats') || '{}');
    stats.quizzesCompleted = (stats.quizzesCompleted || 0) + 1;
    stats.lastScore = correct;
    stats.totalQuestions = questions.length;
    localStorage.setItem('stats', JSON.stringify(stats));
  };

  return (
    <div className="quiz-card">
      <h2>Quiz Time 🎯</h2>
      <p style={{ color: '#666', marginBottom: '15px' }}>
        {questions.length > 0 && `20 Questions - ${localStorage.getItem("quizDifficulty") || "medium"} difficulty`}
      </p>
      {loading && <p>Generating your 20-question quiz… This may take up to 90 seconds.</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && questions.length === 0 ? (
        <p>No notes uploaded yet. Please go back and upload notes first.</p>
      ) : (
        questions.map((item, idx) => (
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
      <button className="btn success" onClick={handleSubmit} disabled={loading || questions.length === 0}>
        Submit Quiz
      </button>
      {score !== null && (
        <div style={{ marginTop: 20, padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Results</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: score >= 15 ? '#4CAF50' : score >= 10 ? '#FF9800' : '#f44336' }}>
            Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
          <p>XP Earned: +{score * 10}</p>
        </div>
      )}
    </div>
  );
}
