import mongoose from 'mongoose';

const firebaseUserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  quizzesCompleted: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('FirebaseUser', firebaseUserSchema);
