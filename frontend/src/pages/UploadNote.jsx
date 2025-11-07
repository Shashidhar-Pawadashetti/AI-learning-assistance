import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [saveNote, setSaveNote] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [enableTimer, setEnableTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(10);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNotes(event.target.result);
      if (!title) setTitle(file.name.split('.')[0]);
    };

    // Read all text-based files
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      alert("Please paste or upload notes before generating a quiz.");
      return;
    }
    
    localStorage.setItem("studentNotes", notes);
    localStorage.setItem("quizDifficulty", difficulty);
    localStorage.setItem("quizTimer", JSON.stringify({ enabled: enableTimer, duration: timerDuration }));

    // Save note to backend if user wants to
    if (saveNote && title) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        try {
          await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              title: title || 'Untitled Note',
              content: notes,
              subject: subject || 'General'
            })
          });
        } catch (err) {
          console.error('Failed to save note:', err);
        }
      }
    }

    navigate("/quiz");
  };

  return (
    <div className="upload-card">
      <h2>Upload Your Notes</h2>
      <p>Paste your study notes or upload a file (supports .txt, .md, .pdf, .doc, code files, etc.).</p>

      <input
        type="text"
        placeholder="Note Title (optional)"
        className="file-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: '10px' }}
      />

      <input
        type="text"
        placeholder="Subject (e.g., Math, Science)"
        className="file-input"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ marginBottom: '10px' }}
      />

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

      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={saveNote}
            onChange={(e) => setSaveNote(e.target.checked)}
          />
          <span>Save this note to my library</span>
        </label>
      </div>

      <div style={{ marginTop: '15px', marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Quiz Settings</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Difficulty Level:
          </label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="file-input"
            style={{ padding: '8px' }}
          >
            <option value="easy">Easy - Basic concepts and simple questions</option>
            <option value="medium">Medium - Moderate complexity</option>
            <option value="hard">Hard - Advanced and challenging questions</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={enableTimer}
              onChange={(e) => setEnableTimer(e.target.checked)}
            />
            <span style={{ fontWeight: '500' }}>Enable Timer (Challenge Mode)</span>
          </label>
        </div>

        {enableTimer && (
          <div style={{ marginLeft: '25px', marginTop: '8px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Timer Duration (minutes):
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={timerDuration}
              onChange={(e) => setTimerDuration(parseInt(e.target.value) || 10)}
              className="file-input"
              style={{ width: '100px', padding: '5px' }}
            />
          </div>
        )}
      </div>

      <button className="btn" onClick={handleSubmit}>
        Generate Quiz
      </button>

      <button 
        className="btn" 
        onClick={() => navigate('/notes')}
        style={{ marginLeft: '10px', background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)' }}
      >
        View Notes Library
      </button>
    </div>
  );
}
