import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
    localStorage.setItem("studentNotes", notes);
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

      <button className="btn" onClick={handleSubmit}>
        Generate Quiz
      </button>

      <div style={{ marginTop: '30px', border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
        <h3>AI Study Assistant</h3>
        <div style={{ height: '200px', overflowY: 'auto', marginBottom: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '5px' }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
              <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '10px', background: msg.role === 'user' ? '#007bff' : '#e9ecef', color: msg.role === 'user' ? 'white' : 'black' }}>
                {msg.text}
              </span>
            </div>
          ))}
          {loading && <div style={{ textAlign: 'left', color: '#666' }}>Thinking...</div>}
        </div>
        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
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
    </div>
  );
}
