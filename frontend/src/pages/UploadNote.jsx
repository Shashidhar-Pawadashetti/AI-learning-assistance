import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker configuration - use version-specific CDN
const PDFJS_VERSION = '4.0.379'; // Use a stable version that's known to work
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

console.log('PDF.js configured with worker version:', PDFJS_VERSION);

export default function UploadNotes() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [errorMessage, setErrorMessage] = useState("");
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
        verbosity: 0, // Reduce console noise
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
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
              // Handle both string items and objects with 'str' property
              return typeof item === 'string' ? item : (item.str || '');
            })
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
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
      console.log(`Total pages processed: ${pdf.numPages}`);
      console.log(`Pages with text: ${extractedPages}`);
      console.log(`Total characters extracted: ${fullText.length}`);
      console.log(`First 200 chars: ${fullText.substring(0, 200)}`);

      if (!fullText.trim()) {
        const msg = 'No text content found in the PDF.\n\nPossible reasons:\n- The PDF contains only images (scanned document)\n- The PDF is empty\n- The text is in a non-standard format\n\nPlease try:\n1. Opening the PDF and copying the text manually\n2. Using a different PDF file\n3. Converting scanned PDFs to text using OCR';
        alert(msg);
        return '';
      }

      console.log('✓ PDF extraction successful!');
      return fullText.trim();

    } catch (error) {
      console.error('=== PDF EXTRACTION ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);

      setLoading(false);

      let errorMessage = 'Failed to extract text from PDF.\n\n';

      if (error.message?.includes('Invalid PDF') || error.message?.includes('Invalid header')) {
        errorMessage += 'Cause: The file appears to be corrupted or is not a valid PDF.\n\nSolution: Try opening the file in a PDF reader to verify it works, then try again.';
      } else if (error.message?.includes('password')) {
        errorMessage += 'Cause: The PDF is password-protected.\n\nSolution: Remove the password protection and try again.';
      } else if (error.message?.includes('worker') || error.message?.includes('Worker')) {
        errorMessage += 'Cause: PDF.js worker failed to load.\n\nSolution: Check your internet connection and try again.';
      } else if (error.name === 'UnknownErrorException') {
        errorMessage += 'Cause: PDF parsing error.\n\nSolution: The PDF format might be incompatible. Try copying text manually.';
      } else {
        errorMessage += `Cause: ${error.message}\n\nSolution: Please try copying the text from the PDF manually and pasting it into the text area.`;
      }

      alert(errorMessage);
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
        setErrorMessage(""); // Clear error on success
      } else {
        setErrorMessage("PDF extraction failed. Please copy the text from your PDF and paste it in the text area above.");
      }
    } else {
      // For non-PDF files, read as text
      const reader = new FileReader();
      reader.onload = (event) => {
        setNotes(event.target.result);
        setErrorMessage("");
      };
      reader.onerror = () => {
        setErrorMessage("Failed to read file. Please try pasting the text manually.");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    if (!notes.trim()) {
      alert("Please paste or upload notes before generating a quiz.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to generate a quiz.');
      navigate('/login');
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
    <div className="upload-card">
      <h2>Upload Your Notes</h2>
      <p>Paste your study notes or upload a file (supports .txt, .md, .pdf, code files, etc.).</p>

      {loading && (
        <p style={{ color: '#4CAF50', fontWeight: 'bold', margin: '10px 0' }}>
          ⏳ Extracting text from PDF... Please wait.
        </p>
      )}

      {errorMessage && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '5px',
          padding: '12px',
          margin: '10px 0',
          color: '#856404'
        }}>
          <strong>⚠️ {errorMessage}</strong>
        </div>
      )}

      <textarea
        className="file-input"
        placeholder="Paste your notes here..."
        rows="8"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setErrorMessage(""); // Clear error when user types
        }}
        disabled={loading}
      />

      <input
        type="file"
        accept=".txt,.md,.pdf,.doc,.docx,.html,.js,.jsx,.py,.java,.cpp,.c,.json,.xml,.csv"
        className="file-input"
        onChange={handleFileUpload}
        disabled={loading}
      />

      <div style={{ margin: '15px 0' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Quiz Difficulty Level:
        </label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="file-input"
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          <option value="easy">Easy - Basic recall and understanding</option>
          <option value="medium">Medium - Moderate difficulty (Default)</option>
          <option value="hard">Hard - Challenging and advanced</option>
        </select>
      </div>

      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
        💡 <strong>Tips:</strong><br />
        • For PDFs: The file will be automatically processed<br />
        • If PDF fails: Open the PDF, select all text (Ctrl+A), copy (Ctrl+C), and paste above<br />
        • For best results: Ensure your notes contain at least 200 words
      </div>

      <button className="btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Generate 20-Question Quiz'}
      </button>
    </div>
  );
}
