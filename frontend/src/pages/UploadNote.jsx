import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config';

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();



  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    // PDF and Word files - use backend extraction
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.toLowerCase().endsWith('.docx')) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_URL}/api/extract-pdf`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        setLoading(false);
        
        if (response.ok && data.text && data.text.length >= 50) {
          setNotes(data.text);
        } else {
          setErrorMessage('Could not extract text. Please open the file, select all (Ctrl+A), copy (Ctrl+C), and paste above.');
        }
      } catch (error) {
        setLoading(false);
        setErrorMessage('Extraction failed. Please open the file, select all (Ctrl+A), copy (Ctrl+C), and paste above.');
      }
      return;
    }

    // Text-based files
    const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.html', '.css', '.json', '.xml', '.csv', '.log', '.sh', '.bat', '.sql', '.r', '.swift', '.go', '.rs', '.php', '.rb', '.kt', '.scala'];
    const isTextFile = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (isTextFile || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setNotes(text);
        setTimeout(() => setSuccessMessage(''), 3000);
        setLoading(false);
      };
      reader.onerror = () => {
        setErrorMessage("Failed to read file. Please paste text manually.");
        setLoading(false);
      };
      reader.readAsText(file);
    } else {
      setLoading(false);
      setErrorMessage(`Unsupported file type. Please use PDF, Word (.docx), TXT, MD, or code files.`);
    }
  };

  const handleSubmit = () => {
    if (!notes.trim()) {
      setErrorMessage("Please paste or upload notes before generating a quiz.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Please login to generate a quiz.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    console.log('=== UPLOAD NOTE DEBUG ===');
    console.log('Storing notes (first 500 chars):', notes.substring(0, 500));
    console.log('Notes length:', notes.length);
    console.log('Difficulty:', difficulty);
    console.log('===========================');

    localStorage.setItem("studentNotes", notes);
    localStorage.setItem("quizDifficulty", difficulty);
    localStorage.setItem("shouldGenerateQuiz", "true");
    navigate("/quiz");
  };

  return (
    <div style={{padding:'1.5rem',maxWidth:'1000px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{marginBottom:'2rem'}}>
        <h1 style={{margin:0,fontSize:'2rem',fontWeight:'bold'}}>📝 Upload Your Notes</h1>
        <p style={{color:'#64748b',marginTop:'0.5rem'}}>Paste or upload your study material to generate a personalized quiz</p>
      </div>

      {/* Main Card */}
      <div style={{background:'white',borderRadius:'16px',padding:'2rem',border:'1px solid #e2e8f0',boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>

      {loading && (
        <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'12px',padding:'1.5rem',color:'white',marginBottom:'1.5rem',textAlign:'center'}}>
          <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>⏳</div>
          <p style={{margin:0,fontWeight:'bold'}}>Extracting text from PDF...</p>
          <p style={{margin:'0.5rem 0 0 0',fontSize:'0.875rem',opacity:0.9}}>This may take a moment for scanned PDFs</p>
        </div>
      )}

      {errorMessage && (
        <div style={{background:'#fef3c7',border:'2px solid #f59e0b',borderRadius:'12px',padding:'1rem',marginBottom:'1.5rem',color:'#92400e'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>⚠️</span>
            <strong>{errorMessage}</strong>
          </div>
        </div>
      )}

      {successMessage && (
        <div style={{background:'#d1fae5',border:'2px solid #10b981',borderRadius:'12px',padding:'1rem',marginBottom:'1.5rem',color:'#065f46'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>✓</span>
            <strong>{successMessage}</strong>
          </div>
        </div>
      )}

      <div style={{marginBottom:'1.5rem'}}>
        <label style={{display:'block',marginBottom:'0.75rem',fontWeight:'600',color:'#334155',fontSize:'0.875rem'}}>📄 Your Notes</label>
        <textarea
          placeholder="Paste your notes here..."
          rows="10"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setErrorMessage("");
          }}
          disabled={loading}
          style={{width:'100%',padding:'1rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.95rem',fontFamily:'inherit',resize:'vertical',transition:'border-color 0.2s',boxSizing:'border-box'}}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
        <div style={{marginTop:'0.5rem',fontSize:'0.875rem',color:'#64748b'}}>{notes.length} characters</div>
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <label style={{display:'block',marginBottom:'0.75rem',fontWeight:'600',color:'#334155',fontSize:'0.875rem'}}>📎 Or Upload a File</label>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.json,.xml,.csv,.log,.sh,.bat,.sql,.r,.swift,.go,.rs,.php,.rb,.kt,.scala"
          onChange={handleFileUpload}
          disabled={loading}
          style={{width:'100%',padding:'0.75rem',border:'2px dashed #cbd5e1',borderRadius:'12px',cursor:'pointer',background:'#f8fafc',transition:'all 0.2s',boxSizing:'border-box'}}
          onMouseEnter={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#eff6ff';}}
          onMouseLeave={(e) => {e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc';}}
        />
        <div style={{marginTop:'0.5rem',fontSize:'0.75rem',color:'#64748b'}}>Supports: PDF, Word (.docx), TXT, MD, and code files (.js, .py, .java, .html, etc.)</div>
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <label style={{display:'block',marginBottom:'0.75rem',fontWeight:'600',color:'#334155',fontSize:'0.875rem'}}>⚡ Quiz Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={loading}
          style={{width:'100%',padding:'0.875rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.95rem',cursor:'pointer',background:'white',fontWeight:'500',transition:'border-color 0.2s',boxSizing:'border-box'}}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        >
          <option value="easy">🟢 Easy - Basic recall and understanding</option>
          <option value="medium">🟡 Medium - Moderate difficulty (Recommended)</option>
          <option value="hard">🔴 Hard - Challenging and advanced</option>
        </select>
      </div>

      <div style={{background:'#f0f9ff',border:'2px solid #3b82f6',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <span style={{fontSize:'1.5rem'}}>💡</span>
          <div style={{fontSize:'0.875rem',color:'#1e40af',lineHeight:'1.6'}}>
            <strong style={{display:'block',marginBottom:'0.5rem'}}>How to Add Your Notes:</strong>
            <strong>From PDF/Word (.docx):</strong><br />
            1. Open your file<br />
            2. Select All (Ctrl+A or Cmd+A)<br />
            3. Copy (Ctrl+C or Cmd+C)<br />
            4. Paste above (Ctrl+V or Cmd+V)<br />
            <br />
            <strong>From Text Files:</strong> Use the upload button<br />
            <strong>Tip:</strong> 200+ words recommended for best quiz quality
          </div>
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={loading || !notes.trim()}
        style={{width:'100%',padding:'1rem 2rem',background:loading||!notes.trim()?'#cbd5e1':'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',color:'white',border:'none',borderRadius:'12px',fontSize:'1.125rem',fontWeight:'bold',cursor:loading||!notes.trim()?'not-allowed':'pointer',boxShadow:'0 4px 12px rgba(102,126,234,0.4)',transition:'transform 0.2s',boxSizing:'border-box'}}
        onMouseEnter={(e) => !loading && notes.trim() && (e.target.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
      >
        {loading ? '⏳ Processing...' : 'Submit Notes'}
      </button>
      </div>
    </div>
  );
}
