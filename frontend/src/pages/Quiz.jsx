import { useEffect, useState, useMemo } from "react";
import axios from "axios";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchQuiz = async () => {
      const notes = localStorage.getItem("studentNotes");
      const numQuestions = localStorage.getItem("numQuestions") || 5;
      if (notes && isMounted) {
        try {
          const { data } = await axios.post('http://localhost:5000/api/generate-quiz', { notes, numQuestions: parseInt(numQuestions) });
          if (isMounted) setQuestions(data.questions);
        } catch (error) {
          console.error('Error generating quiz:', error);
          if (isMounted) alert(error.response?.data?.error || 'Failed to generate quiz. The notes may not have enough content for the requested number of questions.');
        }
      }
      if (isMounted) setLoading(false);
    };
    fetchQuiz();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="quiz-card">
      <h2>Quiz Time 🎯</h2>
      {loading ? (
        <p>Generating quiz from your notes...</p>
      ) : questions.length === 0 ? (
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
              />
            )}

            {item.type === "mcq" && (
              <div>
                {item.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>{String.fromCharCode(97 + i)}.</span>
                    <div className="option" style={{ flex: 1 }}>{opt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
      <button className="btn success">Submit</button>
    </div>
  );
}
