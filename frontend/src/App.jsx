import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/NavBar";
import Home from "./pages/Home";
import UploadNotes from "./pages/UploadNote";
import Quiz from "./pages/Quiz";
import Achievements from "./pages/Achievements";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot";
import { useState, useEffect } from "react";

function AppContent() {
  const location = useLocation();
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const checkQuizStatus = () => {
      const started = localStorage.getItem('quizStarted') === 'true';
      setQuizStarted(started);
    };
    
    checkQuizStatus();
    const interval = setInterval(checkQuizStatus, 500);
    return () => clearInterval(interval);
  }, [location]);

  const showChatbot = !quizStarted;

  return (
    <div className="app">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<ProtectedRoute><UploadNotes /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
      {showChatbot && <Chatbot />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
