import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  firebaseUid: { type: String, unique: true, sparse: true },
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
