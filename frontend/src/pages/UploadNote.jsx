import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNotes(event.target.result);
      };
      reader.readAsText(file);
    } else {
      alert("Only .txt files are supported in this demo.");
    }
  };

  const handleSubmit = () => {
    if (!notes.trim()) {
      alert("Please paste or upload notes before generating a quiz.");
      return;
    }
    if (numQuestions < 1 || numQuestions > 20) {
      alert("Please enter a number between 1 and 20.");
      return;
    }
    localStorage.setItem("studentNotes", notes);
    localStorage.setItem("numQuestions", numQuestions);
    navigate("/quiz");
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newMessage = { role: 'user', text: userMessage };
    setChatMessages([...chatMessages, newMessage]);
    setUserMessage("");
    setLoading(true);

    try {
      const { data } = await axios.post('http://localhost:5000/api/chatbot', {
        message: userMessage,
        notes: notes
      });
      setChatMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I encountered an error.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="upload-card">
      <h2>Upload Your Notes</h2>
      <p>Paste your study notes or upload a file to generate a quiz.</p>

      <textarea
        className="file-input"
        placeholder="Paste your notes here..."
        rows="8"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <input
        type="file"
        accept=".txt"
        className="file-input"
        onChange={handleFileUpload}
      />

      <div style={{ marginTop: '15px' }}>
        <label>Number of Questions (1-20): </label>
        <input
          type="number"
          min="1"
          max="20"
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', width: '80px', marginLeft: '10px' }}
        />
      </div>

      <button className="btn" onClick={handleSubmit}>
        Generate Quiz
      </button>

      {chatOpen && (
        <div style={{ position: 'fixed', bottom: '80px', right: '20px', width: '350px', height: '450px', border: '1px solid #ddd', borderRadius: '12px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>AI Study Assistant</h3>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', background: '#f9f9f9' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '10px', background: msg.role === 'user' ? '#007bff' : '#e9ecef', color: msg.role === 'user' ? 'white' : 'black', maxWidth: '80%' }}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && <div style={{ textAlign: 'left', color: '#666' }}>Thinking...</div>}
          </div>
          <form onSubmit={handleChatSubmit} style={{ padding: '15px', borderTop: '1px solid #ddd', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Ask about your notes..."
              style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <button type="submit" className="btn" disabled={loading}>Send</button>
          </form>
        </div>
      )}

      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{ position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: '#007bff', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000 }}
      >
        💬
      </button>
    </div>
  );
}
