import { useEffect, useState } from "react";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const notes = localStorage.getItem("studentNotes");
    if (notes) {
      const sentences = notes
        .split(/[.?!]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8);

      const fillBlanks = sentences.slice(0, 3).map((s) => {
        const words = s.split(" ");
        if (words.length > 4) {
          const randomIndex = Math.floor(Math.random() * words.length);
          const answer = words[randomIndex];
          words[randomIndex] = "____";
          return {
            type: "blank",
            q: words.join(" "),
            a: answer,
          };
        }
        return { type: "blank", q: s, a: "N/A" };
      });

      const mcqs = [
        {
          type: "mcq",
          q: "What does AI stand for?",
          options: [
            "Artificial Intelligence",
            "Automatic Input",
            "Advanced Innovation",
            "Applied Informatics",
          ],
          a: "Artificial Intelligence",
        },
        {
          type: "mcq",
          q: "Who is considered the father of AI?",
          options: ["Alan Turing", "Elon Musk", "Einstein", "Newton"],
          a: "Alan Turing",
        },
      ];

      setQuestions([...fillBlanks, ...mcqs]);
    }
  }, []);

  return (
    <div className="quiz-card">
      <h2>Quiz Time 🎯</h2>
      {questions.length === 0 ? (
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
              <ul>
                {item.options.map((opt, i) => (
                  <li key={i} className="option">
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
      <button className="btn success">Submit</button>
    </div>
  );
}
