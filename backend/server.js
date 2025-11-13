import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from './models/User.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Email Verification Code Store (in-memory, for demo) ---
const verificationCodes = {};

// --- Nodemailer Transport Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // App password (not your Gmail password)
  }
});

// --- Send Verification Code Endpoint ---
app.post('/api/send-verification-code', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

// --- Verify Code Endpoint ---
app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required.' });
  }
  if (verificationCodes[email] === code) {
    delete verificationCodes[email]; // Remove after verification
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid code.' });
  }
});

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
app.post('/api/generate-quiz', authMiddleware, async (req, res) => {
  try {
    const { notes, level = 'medium' } = req.body || {};
    if (!notes || notes.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide sufficient notes text (min 20 chars).' });
    }

    const hfApiKey = process.env.HF_API_KEY;
    // Using Qwen2.5-7B-Instruct for excellent reasoning and quiz quality
    const model = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    if (!hfApiKey) {
      return res.status(500).json({ error: 'Server is not configured with HF_API_KEY.' });
    }

    // Increase note limit for more comprehensive quiz generation
    const maxNotesLength = 4000;
    const truncatedNotes = notes.length > maxNotesLength
      ? notes.substring(0, maxNotesLength) + '...'
      : notes;

    const difficultyHint = level === 'easy' ? 'easy' : level === 'hard' ? 'very challenging and advanced' : 'moderately difficult to challenging';

    const prompt = `You are an expert educational quiz generator with strong reasoning skills. Your task is to create meaningful, thought-provoking quiz questions that test deep understanding of the content.

STUDY NOTES:
${truncatedNotes}

INSTRUCTIONS:
Analyze the study notes carefully and create 10 fill-in-the-blank questions and 10 multiple-choice questions that:
1. Focus on KEY CONCEPTS, IMPORTANT FACTS, and MAIN IDEAS from the content
2. Test comprehension and application, not just surface-level details
3. Avoid questions about formatting, metadata, or document structure
4. Each question should be meaningful and educational
5. For fill-in-the-blank: Use blanks for important terms, concepts, or values
6. For MCQ: Create plausible distractors that test understanding

OUTPUT FORMAT (JSON only, no other text):
{
  "blanks": [
    {"q": "The main concept of ____ refers to...", "a": "concept name"},
    {"q": "According to the notes, ____ is defined as...", "a": "term"},
    ... (10 questions total)
  ],
  "mcq": [
    {"q": "What is the primary purpose of the concept discussed?", "options": ["Option A","Option B","Option C","Option D"], "a": "Option A"},
    {"q": "How does the theory apply to practical scenarios?", "options": ["Choice 1","Choice 2","Choice 3","Choice 4"], "a": "Choice 2"},
    ... (10 questions total)
  ]
}

QUALITY REQUIREMENTS:
- Difficulty level: ${difficultyHint}
- Questions must be based on SUBSTANTIVE CONTENT from the notes
- Avoid trivial details (headings, page numbers, formatting)
- Each question should have clear educational value
- MCQ options must be plausible and test real understanding
- Ensure the answer "a" EXACTLY matches one of the options
- Keep questions clear and under 200 characters
- Use only ASCII characters, proper JSON escaping

Generate EXACTLY 10 fill-in-the-blank and 10 multiple-choice questions. Output ONLY the JSON object.`;

    // Enhanced fallback generator for 20 questions
    const buildFallback = (src) => {
      const sentences = src.split(/[.?!]/).map(s => s.trim()).filter(s => s.length > 12);
      const blanks = [];

      // Generate 10 fill-in-the-blank questions
      for (let i = 0; i < Math.min(10, sentences.length); i++) {
        const s = sentences[i];
        const words = s.split(/\s+/);
        const idx = Math.min(Math.max(1, Math.floor(words.length / 3)), words.length - 1);
        const a = words[idx].replace(/[^a-zA-Z0-9]/g, '');
        words[idx] = '____';
        blanks.push({ q: words.join(' '), a });
      }

      // Generate 10 MCQ questions
      const mcq = [];
      const topics = ['main concept', 'key term', 'important detail', 'primary focus', 'essential element',
        'critical point', 'fundamental idea', 'core principle', 'significant aspect', 'central theme'];

      for (let i = 0; i < 10; i++) {
        mcq.push({
          q: `What is the ${topics[i]} discussed in the notes?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          a: 'Option A'
        });
      }

      return { blanks, mcq };
    };

    // Call new Hugging Face Inference API (2025) - OpenAI-compatible chat completions
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    let data;

    try {
      // Use the new OpenAI-compatible chat completions endpoint
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2048,
          temperature: 0.8,
          top_p: 0.95
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        console.error('HF API error:', response.status, text);
        console.log('Falling back to local quiz generator');
        const { blanks, mcq } = buildFallback(truncatedNotes);
        return res.json({ blanks, mcq });
      }

      data = await response.json();

      // Extract generated text from OpenAI-compatible chat completions response
      let generated = '';
      if (data?.choices?.[0]?.message?.content) {
        generated = data.choices[0].message.content;
      } else if (Array.isArray(data) && data[0]?.generated_text) {
        generated = data[0].generated_text;
      } else if (data?.generated_text) {
        generated = data.generated_text;
      } else {
        throw new Error('Unexpected API response format');
      }

      // Try to parse JSON from the generated text
      let parsed;
      try {
        // Try to extract JSON block from response
        let jsonMatch = generated.match(/\{[\s\S]*\}/);
        let jsonStr = jsonMatch ? jsonMatch[0] : generated;

        // Clean up common JSON formatting issues
        jsonStr = jsonStr
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/\\/g, '\\\\') // Escape backslashes
          .replace(/\\\\"/g, '\\"') // Fix double-escaped quotes
          .replace(/\\\\\\/g, '\\') // Fix triple backslashes
          .replace(/([^\\])"/g, '$1"') // Normalize quotes
          .replace(/\n/g, ' ') // Remove newlines
          .replace(/\r/g, '') // Remove carriage returns
          .replace(/\t/g, ' '); // Replace tabs with spaces

        // Try parsing the cleaned string
        parsed = JSON.parse(jsonStr);

        // Validate structure
        if (!Array.isArray(parsed?.blanks) || !Array.isArray(parsed?.mcq)) {
          throw new Error('Invalid quiz structure');
        }
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        console.log('AI Response:', generated);
        console.log('Falling back to local quiz generator');
        parsed = buildFallback(truncatedNotes);
      }

      // Normalize and return - ensure we have 10 of each type
      const blanks = Array.isArray(parsed?.blanks) ? parsed.blanks.slice(0, 10) : [];
      const mcq = Array.isArray(parsed?.mcq) ? parsed.mcq.slice(0, 10) : [];

      console.log(`✓ Generated quiz with ${blanks.length} blanks and ${mcq.length} MCQs`);
      return res.json({ blanks, mcq });

    } catch (apiErr) {
      clearTimeout(timeout);
      console.error('HF API request failed:', apiErr?.message || apiErr);
      console.log('Falling back to local quiz generator');
      const { blanks, mcq } = buildFallback(truncatedNotes);
      return res.json({ blanks, mcq });
    }

  } catch (err) {
    console.error('generate-quiz error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Quiz Analysis ---
app.post('/api/analyze-quiz', authMiddleware, async (req, res) => {
  try {
    const { questions = [], answers = {}, notes = '', difficulty = 'medium', timed = false, elapsedSeconds = 0 } = req.body || {};
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'No questions provided' });
    }

    // Basic scoring first (deterministic)
    let score = 0;
    const breakdown = questions.map((q, i) => {
      const userAns = answers?.[i];
      let correct = false;
      if (q?.type === 'mcq') {
        correct = (userAns || '') === (q?.a || '');
      } else {
        const ua = (userAns || '').toString().trim().toLowerCase();
        const ca = (q?.a || '').toString().trim().toLowerCase();
        correct = ua === ca || (ua && ca && (ua.includes(ca) || ca.includes(ua)));
      }
      if (correct) score += 1;
      return { index: i, correct, yourAnswer: userAns ?? null, correctAnswer: q?.a ?? null };
    });

    // Try to get AI feedback/explanations via Hugging Face
    const hfApiKey = process.env.HF_API_KEY;
    const model = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    let summary = '';
    let aiBreakdown = [];
    if (hfApiKey) {
      try {
        const compact = questions.map((q, i) => ({
          i,
          type: q.type,
          q: q.q,
          options: q.options || null,
          correct: q.a,
          user: answers?.[i] ?? null
        }));

        const prompt = `You are a helpful tutor. Analyze the following quiz attempt and provide concise feedback.
NOTES (optional): ${notes ? notes.substring(0, 1500) : 'N/A'}
DIFFICULTY: ${difficulty}
TIMED: ${timed}
ELAPSED_SECONDS: ${elapsedSeconds}

For each question, provide a one-sentence explanation focusing on why the correct answer is correct and, if user is wrong, a short tip. Return strict JSON only:
{
  "summary": "one paragraph summary of performance and suggestions",
  "breakdown": [
    {"index": 0, "explanation": "..."},
    ...
  ]
}

QUESTIONS_AND_ANSWERS_JSON:
${JSON.stringify(compact)}
`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 800,
            temperature: 0.5
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          let generated = data?.choices?.[0]?.message?.content || '';
          const match = generated.match(/\{[\s\S]*\}/);
          const jsonStr = (match ? match[0] : generated).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed?.summary) summary = parsed.summary;
            if (Array.isArray(parsed?.breakdown)) aiBreakdown = parsed.breakdown;
          } catch { /* ignore, fallback below */ }
        }
      } catch (e) {
        console.error('analyze-quiz AI feedback error:', e?.message || e);
      }
    }

    // Merge AI explanations into breakdown if available
    const merged = breakdown.map(b => {
      const found = aiBreakdown.find(x => x.index === b.index);
      let defaultExplanation = '';
      if (!b.correct) {
        // Provide a more meaningful fallback explanation for incorrect answers
        const question = questions[b.index];
        if (question?.type === 'mcq') {
          defaultExplanation = `The correct answer is "${b.correctAnswer}". Review the related concept in your notes.`;
        } else {
          defaultExplanation = `The correct answer is "${b.correctAnswer}". Make sure to study this topic carefully.`;
        }
      }
      return { ...b, explanation: found?.explanation || defaultExplanation };
    });

    return res.json({ score, total: questions.length, breakdown: merged, summary });
  } catch (err) {
    console.error('analyze-quiz error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Save Quiz History ---
app.post('/api/save-quiz-history', authMiddleware, async (req, res) => {
  try {
    const { attempt } = req.body;
    const uid = req.user.uid;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        name: req.user.email.split('@')[0],
        email: req.user.email,
        password: 'firebase-auth',
        firebaseUid: uid,
        quizHistory: [],
        stats: {}
      });
    }

    // Handle bulk update/delete operations
    if (attempt.id === 'UPDATE_ALL' || attempt.id === 'DELETE_ALL') {
      user.quizHistory = attempt.quizHistory || [];
      await user.save();
      return res.json({ success: true, history: user.quizHistory, user: { xp: user.xp, level: user.level, stats: user.stats, badges: user.badges } });
    }

    // Handle new quiz submission
    user.quizHistory = user.quizHistory || [];
    const isDuplicate = user.quizHistory.some(h => 
      Math.abs(h.createdAt - attempt.createdAt) < 1000 && 
      h.score === attempt.score && 
      h.total === attempt.total
    );
    
    if (!isDuplicate) {
      // Calculate XP with bonuses
      let baseXP = attempt.score * 10;
      let bonusXP = 0;
      
      // Difficulty bonus
      if (attempt.difficulty === 'hard') bonusXP += Math.floor(baseXP * 0.5);
      else if (attempt.difficulty === 'medium') bonusXP += Math.floor(baseXP * 0.25);
      
      // Timed bonus
      if (attempt.timed) bonusXP += Math.floor(baseXP * 0.25);
      
      // Perfect score bonus
      if (attempt.percent === 100) bonusXP += 100;
      
      // Streak bonus
      const today = new Date().toDateString();
      const lastDate = user.stats?.lastQuizDate || '';
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastDate === today) {
        // Same day, no streak change
      } else if (lastDate === yesterday) {
        user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
        bonusXP += Math.floor(baseXP * 0.1 * user.stats.currentStreak);
      } else {
        user.stats.currentStreak = 1;
      }
      
      user.stats.lastQuizDate = today;
      user.stats.longestStreak = Math.max(user.stats.longestStreak || 0, user.stats.currentStreak || 0);
      
      const totalXP = baseXP + bonusXP;
      user.xp += totalXP;
      
      // Level up
      while (user.xp >= user.level * 100) {
        user.xp -= user.level * 100;
        user.level += 1;
      }
      
      // Update stats
      user.stats.totalQuizzes = (user.stats.totalQuizzes || 0) + 1;
      user.stats.totalCorrect = (user.stats.totalCorrect || 0) + attempt.score;
      user.stats.totalQuestions = (user.stats.totalQuestions || 0) + attempt.total;
      user.stats.totalTimeSpent = (user.stats.totalTimeSpent || 0) + (attempt.elapsedSeconds || 0);
      user.stats.bestScore = Math.max(user.stats.bestScore || 0, attempt.percent);
      user.stats.averageScore = Math.round((user.stats.totalCorrect / user.stats.totalQuestions) * 100);
      
      if (attempt.timed) user.stats.timedQuizzes = (user.stats.timedQuizzes || 0) + 1;
      if (attempt.percent === 100) user.stats.perfectScores = (user.stats.perfectScores || 0) + 1;
      
      // Topic stats
      const topic = attempt.topic || 'General';
      const topicStats = user.stats.topicStats || new Map();
      const current = topicStats.get(topic) || { count: 0, totalScore: 0, bestScore: 0 };
      current.count += 1;
      current.totalScore += attempt.percent;
      current.bestScore = Math.max(current.bestScore, attempt.percent);
      current.avgScore = Math.round(current.totalScore / current.count);
      topicStats.set(topic, current);
      user.stats.topicStats = topicStats;
      
      // Check and unlock badges
      const newBadges = [];
      const badgeChecks = [
        { key: 'first_quiz', condition: user.stats.totalQuizzes >= 1 },
        { key: 'quiz_5', condition: user.stats.totalQuizzes >= 5 },
        { key: 'quiz_10', condition: user.stats.totalQuizzes >= 10 },
        { key: 'quiz_25', condition: user.stats.totalQuizzes >= 25 },
        { key: 'quiz_50', condition: user.stats.totalQuizzes >= 50 },
        { key: 'quiz_100', condition: user.stats.totalQuizzes >= 100 },
        { key: 'timed_1', condition: user.stats.timedQuizzes >= 1 },
        { key: 'timed_10', condition: user.stats.timedQuizzes >= 10 },
        { key: 'acc_70', condition: user.stats.bestScore >= 70 },
        { key: 'acc_85', condition: user.stats.bestScore >= 85 },
        { key: 'acc_95', condition: user.stats.bestScore >= 95 },
        { key: 'perfect', condition: user.stats.perfectScores >= 1 },
        { key: 'perfect_5', condition: user.stats.perfectScores >= 5 },
        { key: 'streak_3', condition: user.stats.currentStreak >= 3 },
        { key: 'streak_7', condition: user.stats.currentStreak >= 7 },
        { key: 'streak_30', condition: user.stats.currentStreak >= 30 },
        { key: 'level_10', condition: user.level >= 10 },
        { key: 'level_25', condition: user.level >= 25 },
        { key: 'level_50', condition: user.level >= 50 }
      ];
      
      user.badges = user.badges || [];
      badgeChecks.forEach(check => {
        if (check.condition && !user.badges.find(b => b.key === check.key)) {
          user.badges.push({ key: check.key, unlockedAt: Date.now() });
          newBadges.push(check.key);
          user.xp += 50; // Badge bonus XP
        }
      });
      
      user.quizHistory.unshift(attempt);
      user.quizHistory = user.quizHistory.slice(0, 50);
      await user.save();
      
      res.json({ 
        success: true, 
        history: user.quizHistory,
        user: { xp: user.xp, level: user.level, stats: user.stats, badges: user.badges },
        xpGained: totalXP,
        bonusXP,
        newBadges
      });
    } else {
      res.json({ success: true, history: user.quizHistory, user: { xp: user.xp, level: user.level, stats: user.stats, badges: user.badges } });
    }
  } catch (error) {
    console.error('Save quiz history error:', error);
    res.status(500).json({ error: 'Failed to save quiz history' });
  }
});

// --- Get Quiz History ---
app.get('/api/quiz-history', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      user = await User.create({
        name: req.user.email.split('@')[0],
        email: req.user.email,
        password: 'firebase-auth',
        firebaseUid: uid,
        quizHistory: [],
        stats: {}
      });
    }
    
    res.json({ history: user.quizHistory || [] });
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Failed to get quiz history' });
  }
});

// --- Get User Stats ---
app.get('/api/user-stats', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.uid;
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      user = await User.create({
        name: req.user.email.split('@')[0],
        email: req.user.email,
        password: 'firebase-auth',
        firebaseUid: uid,
        stats: {}
      });
    }
    
    res.json({ 
      xp: user.xp || 0,
      level: user.level || 1,
      stats: user.stats || {},
      badges: user.badges || [],
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
