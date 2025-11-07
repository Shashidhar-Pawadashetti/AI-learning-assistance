import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';
import FirebaseUser from './models/FirebaseUser.js';
import QuizAttempt from './models/QuizAttempt.js';
import Note from './models/Note.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Quiz Generation using Hugging Face Inference API ---
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { notes, level = 'medium' } = req.body || {};
    if (!notes || notes.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide sufficient notes text (min 20 chars).' });
    }

    const hfApiKey = process.env.HF_API_KEY;
    const model = process.env.HF_MODEL || 'google/flan-t5-large';
    if (!hfApiKey) {
      return res.status(500).json({ error: 'Server is not configured with HF_API_KEY.' });
    }

    // Truncate notes to ~2000 chars to avoid HF API payload limits
    const maxNotesLength = 2000;
    const truncatedNotes = notes.length > maxNotesLength
      ? notes.substring(0, maxNotesLength) + '...'
      : notes;

    const difficultyHint = level === 'easy' ? 'easy' : level === 'hard' ? 'challenging' : 'moderate';

    const prompt = `You are a quiz generator. Read the STUDY_NOTES and produce a compact JSON with two sections: blanks and mcq.
STUDY_NOTES:\n${truncatedNotes}\n\nOutput JSON with this exact shape and nothing else:
{
  "blanks": [
    {"q": "sentence with ____ blank", "a": "answer"}
  ],
  "mcq": [
    {"q": "question?", "options": ["A","B","C","D"], "a": "correct option EXACTLY as in options"}
  ]
}
Rules:
- Difficulty: ${difficultyHint}
- 3 blanks, 2 MCQs.
- Keep q under 140 chars. Use facts from notes only. No markdown. No code fences.`;

    // Small helper to build a basic quiz when HF API errors
    const buildFallback = (src) => {
      const sentences = src.split(/[.?!]/).map(s => s.trim()).filter(s => s.length > 12);
      const blanks = sentences.slice(0, 3).map(s => {
        const words = s.split(/\s+/);
        const i = Math.min(Math.max(1, Math.floor(words.length / 3)), words.length - 1);
        const a = words[i].replace(/[^a-zA-Z0-9]/g, '');
        words[i] = '____';
        return { q: words.join(' '), a };
      });
      const mcq = [
        { q: 'What is a key topic from the notes?', options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'], a: 'Concept A' },
        { q: 'Which term best fits the context?', options: ['Term 1', 'Term 2', 'Term 3', 'Term 4'], a: 'Term 1' }
      ];
      return { blanks, mcq };
    };

    // Call Hugging Face with timeout and wait-for-model to avoid 503
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let data;
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true'
        },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 256, temperature: 0.4 } }),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('HF API error:', response.status, text);
        const { blanks, mcq } = buildFallback(truncatedNotes);
        return res.json({ blanks, mcq });
      }

      data = await response.json();
    } catch (apiErr) {
      console.error('HF API request failed:', apiErr?.message || apiErr);
      const { blanks, mcq } = buildFallback(truncatedNotes);
      return res.json({ blanks, mcq });
    } finally {
      clearTimeout(timeout);
    }
    // HF text-generation returns array with generated_text
    const generated = Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text : (data?.generated_text || '');

    let parsed;
    try {
      // Extract last JSON block if the model echoed prompt
      const jsonStart = generated.lastIndexOf('{');
      const jsonStr = jsonStart >= 0 ? generated.slice(jsonStart) : generated;
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback simple generator if JSON parse fails
      parsed = buildFallback(truncatedNotes);
    }

    // Normalize shape and respond
    const blanks = Array.isArray(parsed?.blanks) ? parsed.blanks : [];
    const mcq = Array.isArray(parsed?.mcq) ? parsed.mcq : [];
    return res.json({ blanks, mcq });
  } catch (err) {
    console.error('generate-quiz error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Firebase User Management ---
// Get or create Firebase user
app.post('/api/firebase-user', async (req, res) => {
  try {
    const { firebaseUid, email, name } = req.body;
    
    if (!firebaseUid || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = await FirebaseUser.findOne({ firebaseUid });
    
    if (!user) {
      user = await FirebaseUser.create({ firebaseUid, email, name });
    }

    res.json({ user: {
      id: user.firebaseUid,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: user.level,
      quizzesCompleted: user.quizzesCompleted
    }});
  } catch (error) {
    console.error('Firebase user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Firebase user XP and level
app.put('/api/firebase-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { xp, level } = req.body;

    const user = await FirebaseUser.findOneAndUpdate(
      { firebaseUid: uid },
      { xp, level },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: {
      id: user.firebaseUid,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: user.level
    }});
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Quiz History ---
// Save quiz attempt
app.post('/api/quiz-attempt', async (req, res) => {
  try {
    const { userId, questions, score, totalQuestions, xpEarned, difficulty } = req.body;

    if (!userId || score === undefined || !totalQuestions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const attempt = await QuizAttempt.create({
      userId,
      questions,
      score,
      totalQuestions,
      xpEarned,
      difficulty
    });

    // Update user stats
    await FirebaseUser.findOneAndUpdate(
      { firebaseUid: userId },
      { 
        $inc: { quizzesCompleted: 1, totalScore: score, xp: xpEarned }
      }
    );

    res.status(201).json({ attempt });
  } catch (error) {
    console.error('Save quiz attempt error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get quiz history for user
app.get('/api/quiz-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const history = await QuizAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .limit(limit);

    res.json({ history });
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get quiz statistics for user
app.get('/api/quiz-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await QuizAttempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          totalScore: { $sum: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          avgScore: { $avg: '$score' },
          totalXP: { $sum: '$xpEarned' }
        }
      }
    ]);

    const result = stats[0] || {
      totalQuizzes: 0,
      totalScore: 0,
      totalQuestions: 0,
      avgScore: 0,
      totalXP: 0
    };

    res.json({ stats: result });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes Management ---
// Save note
app.post('/api/notes', async (req, res) => {
  try {
    const { userId, title, content, subject, tags } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const note = await Note.create({ userId, title, content, subject, tags });
    res.status(201).json({ note });
  } catch (error) {
    console.error('Save note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user notes
app.get('/api/notes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Note.find({ userId }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single note
app.get('/api/note/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findById(noteId);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete note
app.delete('/api/note/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    await Note.findByIdAndDelete(noteId);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Leaderboard ---
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topUsers = await FirebaseUser.find()
      .sort({ xp: -1 })
      .limit(limit)
      .select('name xp level quizzesCompleted');

    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
