import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  firebaseUid: { type: String, unique: true, sparse: true },
  stats: {
    totalQuizzes: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastQuizDate: { type: String, default: '' },
    timedQuizzes: { type: Number, default: 0 },
    perfectScores: { type: Number, default: 0 },
    topicStats: { type: Map, of: mongoose.Schema.Types.Mixed, default: new Map() }
  },
  badges: [{
    key: String,
    unlockedAt: Number
  }],
  quizHistory: [{
    id: String,
    name: String,
    topic: String,
    createdAt: Number,
    difficulty: String,
    timed: Boolean,
    elapsedSeconds: Number,
    score: Number,
    total: Number,
    percent: Number,
    questions: Array,
    answers: Object,
    breakdown: Array,
    summary: String
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
