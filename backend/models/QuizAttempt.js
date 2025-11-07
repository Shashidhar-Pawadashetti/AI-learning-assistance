import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  questions: [{
    question: String,
    type: String, // 'blank' or 'mcq'
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean
  }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  xpEarned: { type: Number, default: 0 },
  difficulty: { type: String, default: 'medium' },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
