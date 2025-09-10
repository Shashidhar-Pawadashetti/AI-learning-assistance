import Hero from "../components/Hero";

export default function Home() {
  return (
    <div className="home">
      <Hero />
      <section className="section">
        <h2>How it Works?</h2>
        <p>
          Upload your study notes, and our AI generates quizzes to test your knowledge. 
          Earn badges and achievements while learning in a fun, interactive way!
        </p>
      </section>
    </div>
  );
}
