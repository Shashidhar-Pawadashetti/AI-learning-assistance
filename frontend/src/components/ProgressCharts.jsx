import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProgressCharts({ quizHistory }) {
  if (!quizHistory || quizHistory.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        background: '#f8f9fa', 
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <p>📊 No quiz history yet. Complete some quizzes to see your progress charts!</p>
      </div>
    );
  }

  // Prepare data for score progression chart
  const sortedQuizzes = [...quizHistory].sort((a, b) => 
    new Date(a.completedAt) - new Date(b.completedAt)
  );

  const labels = sortedQuizzes.map((quiz, idx) => `Quiz ${idx + 1}`);
  const scorePercentages = sortedQuizzes.map(quiz => 
    (quiz.score / quiz.totalQuestions) * 100
  );
  const xpEarned = sortedQuizzes.map(quiz => quiz.xpEarned);

  const scoreChartData = {
    labels,
    datasets: [
      {
        label: 'Score %',
        data: scorePercentages,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const xpChartData = {
    labels,
    datasets: [
      {
        label: 'XP Earned',
        data: xpEarned,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const xpChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>📈 Performance Charts</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>
            Score Progression
          </h4>
          <Line data={scoreChartData} options={chartOptions} />
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>
            XP Per Quiz
          </h4>
          <Line data={xpChartData} options={xpChartOptions} />
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginTop: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        textAlign: 'center'
      }}>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
            {Math.max(...scorePercentages).toFixed(1)}%
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Best Score</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
            {(scorePercentages.reduce((a, b) => a + b, 0) / scorePercentages.length).toFixed(1)}%
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Average Score</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
            {xpEarned.reduce((a, b) => a + b, 0)}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Total XP Earned</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
            {sortedQuizzes.length}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Quizzes Completed</p>
        </div>
      </div>
    </div>
  );
}
