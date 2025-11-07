import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNotes(event.target.result);
    };

    // Read all text-based files
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!notes.trim()) {
      alert("Please paste or upload notes before generating a quiz.");
      return;
    }
    localStorage.setItem("studentNotes", notes);
    navigate("/quiz");
  };

  return (
    <div className="upload-card">
      <h2>Upload Your Notes</h2>
      <p>Paste your study notes or upload a file (supports .txt, .md, .pdf, .doc, code files, etc.).</p>

      <textarea
        className="file-input"
        placeholder="Paste your notes here..."
        rows="8"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <input
        type="file"
        accept=".txt,.md,.pdf,.doc,.docx,.html,.js,.jsx,.py,.java,.cpp,.c,.json,.xml,.csv"
        className="file-input"
        onChange={handleFileUpload}
      />

      <button className="btn" onClick={handleSubmit}>
        Generate Quiz
      </button>
    </div>
  );
}
