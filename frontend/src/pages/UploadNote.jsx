import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker configuration - match installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.js`;

console.log('PDF.js worker configured');

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const extractTextFromPDF = async (file) => {
    try {
      setLoading(true);
      console.log('=== PDF EXTRACTION START ===');
      console.log('File name:', file.name);
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);

      const arrayBuffer = await file.arrayBuffer();
      console.log('✓ File loaded as ArrayBuffer');

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/standard_fonts/',
        useSystemFonts: false
      });

      console.log('✓ PDF loading task created');

      const pdf = await loadingTask.promise;
      console.log(`✓ PDF loaded successfully: ${pdf.numPages} pages`);

      let fullText = '';
      let extractedPages = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map(item => {
              if (typeof item === 'string') return item;
              if (item.str) return item.str;
              return '';
            })
            .filter(text => text.trim().length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (pageText) {
            fullText += pageText + '\n\n';
            extractedPages++;
          }

          console.log(`✓ Extracted page ${i}/${pdf.numPages} (${pageText.length} chars)`);
        } catch (pageError) {
          console.warn(`⚠ Error on page ${i}:`, pageError);
          // Continue with other pages even if one fails
        }
      }

      setLoading(false);

      console.log(`=== EXTRACTION COMPLETE ===`);
      console.log(`Total pages: ${pdf.numPages}, Pages with text: ${extractedPages}, Characters: ${fullText.length}`);

      if (!fullText.trim() || fullText.length < 10) {
        setErrorMessage('No readable text found in PDF. The file may be scanned/image-based or encrypted. Please copy text manually (Ctrl+A, Ctrl+C from PDF viewer).');
        return '';
      }

      setSuccessMessage(`✓ Successfully extracted ${fullText.length} characters from ${pdf.numPages} pages`);
      setTimeout(() => setSuccessMessage(''), 3000);

      console.log('✓ PDF extraction successful!');
      return fullText.trim();

    } catch (error) {
      console.error('PDF extraction error:', error.name, error.message);
      setLoading(false);

      let errorMsg = 'PDF extraction failed. ';
      if (error.message?.includes('Invalid PDF') || error.message?.includes('Invalid header')) {
        errorMsg += 'File may be corrupted or not a valid PDF.';
      } else if (error.message?.includes('password')) {
        errorMsg += 'PDF is password-protected. Please unlock it first.';
      } else if (error.message?.includes('worker')) {
        errorMsg += 'PDF worker failed to load. Check your internet connection.';
      } else {
        errorMsg += 'Please open the PDF, select all text (Ctrl+A), copy (Ctrl+C), and paste above.';
      }

      setErrorMessage(errorMsg);
      return '';
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMessage(""); // Clear any previous errors

    // Check if it's a PDF file
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const extractedText = await extractTextFromPDF(file);
      if (extractedText) {
        setNotes(extractedText);
        setErrorMessage("");
        setSuccessMessage(`✓ Extracted ${extractedText.length} characters from PDF`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage("PDF extraction failed. Please copy text manually and paste above.");
      }
    } else {
      // For non-PDF files, read as text
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setNotes(text);
        setErrorMessage("");
        setSuccessMessage(`✓ Loaded ${text.length} characters from ${file.name}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      };
      reader.onerror = () => {
        setErrorMessage("Failed to read file. Please try pasting text manually.");
      };
      reader.readAsText(file);
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
          <p style={{margin:0,fontWeight:'bold'}}>Extracting text from PDF... Please wait.</p>
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
          style={{width:'100%',padding:'1rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.95rem',fontFamily:'inherit',resize:'vertical',transition:'border-color 0.2s'}}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
        <div style={{marginTop:'0.5rem',fontSize:'0.875rem',color:'#64748b'}}>{notes.length} characters</div>
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <label style={{display:'block',marginBottom:'0.75rem',fontWeight:'600',color:'#334155',fontSize:'0.875rem'}}>📎 Or Upload a File</label>
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={loading}
          style={{width:'100%',padding:'0.75rem',border:'2px dashed #cbd5e1',borderRadius:'12px',cursor:'pointer',background:'#f8fafc',transition:'all 0.2s'}}
          onMouseEnter={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#eff6ff';}}
          onMouseLeave={(e) => {e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc';}}
        />
        <div style={{marginTop:'0.5rem',fontSize:'0.75rem',color:'#64748b'}}>Supports: PDF, TXT, MD, DOC, code files, and more</div>
      </div>

      <div style={{marginBottom:'1.5rem'}}>
        <label style={{display:'block',marginBottom:'0.75rem',fontWeight:'600',color:'#334155',fontSize:'0.875rem'}}>⚡ Quiz Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={loading}
          style={{width:'100%',padding:'0.875rem',border:'2px solid #e2e8f0',borderRadius:'12px',fontSize:'0.95rem',cursor:'pointer',background:'white',fontWeight:'500',transition:'border-color 0.2s'}}
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
            <strong style={{display:'block',marginBottom:'0.5rem'}}>Tips for Best Results:</strong>
            • PDFs are automatically processed<br />
            • If PDF fails: Copy text manually (Ctrl+A, Ctrl+C) and paste above<br />
            • Minimum 200 words recommended for quality questions<br />
            • Supports: PDF, TXT, MD, code files, and more
          </div>
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={loading || !notes.trim()}
        style={{width:'100%',padding:'1rem 2rem',background:loading||!notes.trim()?'#cbd5e1':'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',color:'white',border:'none',borderRadius:'12px',fontSize:'1.125rem',fontWeight:'bold',cursor:loading||!notes.trim()?'not-allowed':'pointer',boxShadow:'0 4px 12px rgba(102,126,234,0.4)',transition:'transform 0.2s'}}
        onMouseEnter={(e) => !loading && notes.trim() && (e.target.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
      >
        {loading ? '⏳ Processing...' : '✨ Generate 20-Question Quiz'}
      </button>
      </div>
    </div>
  );
}
