import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotesLibrary() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/notes/${user.id}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to fetch notes');
        
        setNotes(data.notes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleUseNote = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/note/${noteId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch note');
      
      localStorage.setItem('studentNotes', data.note.content);
      navigate('/quiz');
    } catch (err) {
      alert('Failed to load note: ' + err.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/note/${noteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete note');
      
      setNotes(notes.filter(note => note._id !== noteId));
    } catch (err) {
      alert('Failed to delete note: ' + err.message);
    }
  };

  return (
    <div className="notes-library">
      <h2>📚 Your Notes Library</h2>
      <p>View and manage your saved study notes</p>

      <button className="btn" onClick={() => navigate('/upload')} style={{ marginBottom: '20px' }}>
        ➕ Upload New Notes
      </button>

      {loading && <p>Loading notes...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && notes.length === 0 && (
        <p>No notes saved yet. Upload your first set of notes to get started!</p>
      )}

      <div className="notes-grid">
        {notes.map((note) => (
          <div key={note._id} className="note-card" style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>{note.title}</h3>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              Subject: {note.subject}
            </p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              Created: {new Date(note.createdAt).toLocaleDateString()}
            </p>
            {note.tags && note.tags.length > 0 && (
              <div style={{ margin: '10px 0' }}>
                {note.tags.map((tag, idx) => (
                  <span key={idx} style={{
                    display: 'inline-block',
                    background: '#e3f2fd',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    marginRight: '5px'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p style={{ margin: '10px 0', fontSize: '14px' }}>
              {note.content.substring(0, 150)}...
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="btn" onClick={() => handleUseNote(note._id)}>
                Use for Quiz
              </button>
              <button 
                className="btn" 
                onClick={() => handleDeleteNote(note._id)}
                style={{ background: 'linear-gradient(45deg, #ef4444, #dc2626)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
