import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero">
      <h1>Welcome to AI Learning Assistant</h1>
      <p>Turn your notes into quizzes and enjoy learning with gamification!</p>
      <Link to="/upload" className="btn">Get Started</Link>
    </section>
  );
}
