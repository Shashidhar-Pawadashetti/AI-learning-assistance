import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  subject: { type: String, default: 'General' },
  tags: [String]
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);
