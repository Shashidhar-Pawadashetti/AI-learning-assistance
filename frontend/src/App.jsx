import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Home from "./pages/Home";
import UploadNotes from "./pages/UploadNote";
import Quiz from "./pages/Quiz";
import Achievements from "./pages/Achievements";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<UploadNotes />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />1
          </Routes>
        </div>
      </div>
    </Router>
  );
}
