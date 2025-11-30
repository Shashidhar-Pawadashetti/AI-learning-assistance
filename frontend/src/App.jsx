import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/NavBar";
import { useState, useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "./components/Loading";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot";

const Home = lazy(() => import("./pages/Home"));
const UploadNotes = lazy(() => import("./pages/UploadNote"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

function AppContent() {
  const location = useLocation();
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    // Function to check quiz status
    const checkQuizStatus = () => {
      const isQuizPage = location.pathname === '/quiz';
      const quizInProgress = localStorage.getItem('quiz_started') === 'true';
      const quizSubmitted = localStorage.getItem('quiz_submitted') === 'true';
      // Hide chatbot if on quiz page AND quiz is started AND not yet submitted
      setQuizStarted(isQuizPage && quizInProgress && !quizSubmitted);
    };

    // Check on mount and location change
    checkQuizStatus();

    // Listen for storage changes (when quiz starts/submits)
    const handleStorageChange = (e) => {
      if (e.key === 'quiz_started' || e.key === 'quiz_submitted') {
        checkQuizStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from same window
    window.addEventListener('quizStatusChange', checkQuizStatus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('quizStatusChange', checkQuizStatus);
    };
  }, [location.pathname]);

  const showChatbot = !quizStarted;

  return (
    <div className="app">
      <a 
        href="#main-content" 
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: '1rem',
          background: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          top: '1rem'
        }}
        onFocus={(e) => {
          e.target.style.left = '1rem';
        }}
        onBlur={(e) => {
          e.target.style.left = '-9999px';
        }}
      >
        Skip to main content
      </a>
      <Navbar />
      <div className="content" id="main-content">
        <Suspense fallback={<Loading message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<ProtectedRoute><UploadNotes /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </Suspense>
      </div>
      {showChatbot && <Chatbot />}
    </div>
  );
}



export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}
