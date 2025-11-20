import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import User from './models/User.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

// Validate critical environment variables on startup
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('   Please create a .env file in the backend directory. See .env.example for reference.');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long for security.');
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 emails per hour
  message: { error: 'Too many verification emails sent. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const quizLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 quiz generations per minute
  message: { error: 'Too many quiz requests. Please wait a moment before generating another quiz.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 20, // 20 messages per minute
  message: { error: 'Too many messages. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- Email Verification Code Store (in-memory, for demo) ---
// Structure: { email: { code: '123456', expiresAt: timestamp } }
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
app.post('/api/send-verification-code', emailLimiter, async (req, res) => {
  const { email } = req.body;

  // Proper email validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  // Generate 6-digit code with 10-minute expiration
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes from now
  verificationCodes[email] = { code, expiresAt };
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

  const stored = verificationCodes[email];
  if (!stored) {
    return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
  }

  // Check if code has expired
  if (Date.now() > stored.expiresAt) {
    delete verificationCodes[email];
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  // Check if code matches
  if (stored.code === code) {
    delete verificationCodes[email]; // Remove after successful verification
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid code.' });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/signup', authLimiter, async (req, res) => {
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

app.post('/api/login', authLimiter, async (req, res) => {
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
app.post('/api/generate-quiz', quizLimiter, authMiddleware, async (req, res) => {
  try {
    const { notes, level = 'medium', numQuestions = 20 } = req.body || {};
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

    const totalQuestions = Math.max(10, Math.min(50, parseInt(numQuestions) || 20));
    const mcqCount = Math.floor(totalQuestions / 2);
    const multiselectCount = totalQuestions - mcqCount;

    const prompt = `You are an expert educational quiz generator. Create a mixed quiz with both multiple-choice and multiple-select questions.

STUDY NOTES:
${truncatedNotes}

INSTRUCTIONS:
Create EXACTLY ${totalQuestions} questions:
- ${mcqCount} multiple-choice questions (MCQ) with 1 correct answer
- ${multiselectCount} multiple-select questions with 2-3 correct answers
- Mix them throughout (don't group by type)

OUTPUT FORMAT (JSON only):
{
  "questions": [
    {"type":"mcq", "q":"What is X?", "options":["A","B","C","D"], "correctAnswers":["B"]},
    {"type":"multiselect", "q":"Which are true about Y?", "options":["A","B","C","D"], "correctAnswers":["A","C"]},
    ... (${totalQuestions} total)
  ]
}

REQUIREMENTS:
- Difficulty: ${difficultyHint}
- Focus on key concepts from notes
- MCQ: exactly 1 correct answer
- Multiselect: 2-3 correct answers
- correctAnswers must match options exactly
- Clear, concise questions

Generate EXACTLY ${totalQuestions} questions (${mcqCount} MCQ + ${multiselectCount} multiselect, mixed). Output ONLY JSON.`;

    // Fallback generator for mixed questions
    const buildFallback = (src) => {
      const questions = [];
      const words = src.split(/\s+/).filter(w => w.length > 3).slice(0, 100);
      const topics = ['concepts', 'characteristics', 'features', 'elements', 'components', 'aspects', 'principles', 'ideas', 'factors', 'themes'];

      for (let i = 0; i < totalQuestions; i++) {
        const baseIdx = i * 4;
        if (i % 2 === 0) {
          questions.push({
            type: 'mcq',
            q: `What is related to ${topics[i % 10]} in the content?`,
            options: [
              words[baseIdx % words.length] || 'Concept A',
              words[(baseIdx + 1) % words.length] || 'Concept B',
              words[(baseIdx + 2) % words.length] || 'Concept C',
              words[(baseIdx + 3) % words.length] || 'Concept D'
            ],
            correctAnswers: [words[baseIdx % words.length] || 'Concept A']
          });
        } else {
          questions.push({
            type: 'multiselect',
            q: `Select all that apply to ${topics[i % 10]}:`,
            options: [
              words[baseIdx % words.length] || 'Item A',
              words[(baseIdx + 1) % words.length] || 'Item B',
              words[(baseIdx + 2) % words.length] || 'Item C',
              words[(baseIdx + 3) % words.length] || 'Item D'
            ],
            correctAnswers: [
              words[baseIdx % words.length] || 'Item A',
              words[(baseIdx + 1) % words.length] || 'Item B'
            ]
          });
        }
      }

      return { questions };
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
        const { questions } = buildFallback(truncatedNotes);
        return res.json({ questions });
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
        if (!Array.isArray(parsed?.questions)) {
          throw new Error('Invalid quiz structure');
        }
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        console.log('AI Response:', generated);
        console.log('Falling back to local quiz generator');
        parsed = buildFallback(truncatedNotes);
      }

      // Normalize and return
      const questions = Array.isArray(parsed?.questions) ? parsed.questions.slice(0, totalQuestions) : [];

      console.log(`✓ Generated quiz with ${questions.length} questions`);
      return res.json({ questions });

    } catch (apiErr) {
      clearTimeout(timeout);
      console.error('HF API request failed:', apiErr?.message || apiErr);
      console.log('Falling back to local quiz generator');
      const { questions } = buildFallback(truncatedNotes);
      return res.json({ questions });
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

    // Scoring with partial marks for multiple-select
    let score = 0;
    const breakdown = questions.map((q, i) => {
      const userAnswer = answers?.[i];
      const correctAnswers = q?.correctAnswers || [];
      const questionType = q?.type || 'mcq';

      let marks = 0;

      if (questionType === 'mcq') {
        // Single answer MCQ
        marks = userAnswer === correctAnswers[0] ? 1 : 0;
      } else {
        // Multiple-select with partial marks
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        if (userAnswers.length > 0) {
          const correctSelected = userAnswers.filter(ans => correctAnswers.includes(ans)).length;
          const incorrectSelected = userAnswers.filter(ans => !correctAnswers.includes(ans)).length;

          if (incorrectSelected > 0) {
            marks = 0;
          } else if (correctSelected === correctAnswers.length) {
            marks = 1;
          } else if (correctSelected > 0) {
            marks = correctSelected / correctAnswers.length;
          }
        }
      }

      score += marks;
      return {
        index: i,
        marks,
        correct: marks === 1,
        yourAnswer: userAnswer,
        correctAnswer: correctAnswers
      };
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
      // Calculate XP with bonuses (always whole numbers)
      let baseXP = Math.floor(attempt.score * 10);
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
      let streakIncreased = false;

      if (lastDate === today) {
        // Same day, no streak change
      } else if (lastDate === yesterday) {
        user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
        bonusXP += Math.floor(baseXP * 0.1 * user.stats.currentStreak);
        streakIncreased = true;
      } else {
        user.stats.currentStreak = 1;
      }

      user.stats.lastQuizDate = today;
      user.stats.longestStreak = Math.max(user.stats.longestStreak || 0, user.stats.currentStreak || 0);

      const totalXP = Math.floor(baseXP + bonusXP);
      user.xp = Math.floor((user.xp || 0) + totalXP);

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
          user.xp = Math.floor((user.xp || 0) + 50); // Badge bonus XP
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
        newBadges,
        streakIncreased,
        currentStreak: user.stats.currentStreak
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

// --- Document Extraction Endpoint (PDF & Word) ---
app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Document extraction:', req.file.originalname, req.file.size, 'bytes');
    const fileName = req.file.originalname.toLowerCase();

    // Word documents (.docx)
    if (fileName.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        const text = result.value.trim();

        if (text && text.length >= 50) {
          console.log(`✓ Extracted ${text.length} characters from Word`);
          return res.json({ text, method: 'word' });
        }
        return res.status(400).json({ error: 'Could not extract text from Word document.' });
      } catch (wordError) {
        console.error('Word extraction error:', wordError.message);
        return res.status(500).json({ error: 'Word extraction failed: ' + wordError.message });
      }
    }

    // PDF documents
    if (fileName.endsWith('.pdf')) {
      let pdfParse;
      try {
        const pdfModule = await import('pdf-parse/lib/pdf-parse.js');
        pdfParse = pdfModule.default;
      } catch (importError) {
        console.error('pdf-parse import failed:', importError.message);
        return res.status(500).json({ error: 'PDF library not available. Please copy text manually.' });
      }

      const data = await pdfParse(req.file.buffer);
      const text = data.text.trim();

      if (text && text.length >= 50) {
        console.log(`✓ Extracted ${text.length} characters from PDF`);
        return res.json({ text, method: 'text' });
      }

      return res.status(400).json({
        error: 'Could not extract text. This may be a scanned PDF. Please copy text manually.'
      });
    }

    return res.status(400).json({ error: 'Unsupported file type. Please use PDF or DOCX files.' });

  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: 'PDF extraction failed: ' + error.message });
  }
});

// --- Chatbot Endpoint ---
app.post('/api/chatbot', chatbotLimiter, async (req, res) => {
  try {
    const { message, context = '' } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Chatbot request:', { message: message.substring(0, 100) });

    const hfApiKey = process.env.HF_API_KEY;
    const model = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

    console.log('HF_API_KEY available:', !!hfApiKey);

    // Enhanced fallback function
    const getFallbackResponse = (msg) => {
      const lowerMessage = msg.toLowerCase();

      if (lowerMessage.includes('study better') || lowerMessage.includes('how to study')) {
        return "Here are proven study techniques: 1) Use active recall - test yourself frequently, 2) Space out your learning sessions, 3) Break topics into smaller chunks, 4) Teach concepts to others, 5) Use multiple senses (visual, auditory), 6) Take regular breaks, 7) Create a distraction-free environment. What subject are you studying?";
      }

      if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('exam')) {
        return "For effective test preparation: 1) Upload your notes to generate practice quizzes, 2) Review mistakes carefully, 3) Practice under timed conditions, 4) Focus on weak areas, 5) Get enough sleep before exams. Need help with a specific subject?";
      }

      if (lowerMessage.includes('math') || lowerMessage.includes('mathematics')) {
        return "Math study tips: 1) Practice problems daily, 2) Understand concepts before memorizing formulas, 3) Work through examples step-by-step, 4) Identify your mistake patterns, 5) Use visual aids for complex problems. What math topic are you working on?";
      }

      if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) {
        return "Science learning strategies: 1) Connect theory to real-world examples, 2) Use diagrams and flowcharts, 3) Practice lab procedures mentally, 4) Explain processes in your own words, 5) Form study groups for discussions. Which science subject interests you?";
      }

      if (lowerMessage.includes('memory') || lowerMessage.includes('remember') || lowerMessage.includes('memorize')) {
        return "Memory enhancement techniques: 1) Use mnemonics and acronyms, 2) Create mental associations, 3) Review material before sleeping, 4) Use the method of loci, 5) Practice retrieval regularly. What do you need help remembering?";
      }

      if (lowerMessage.includes('motivation') || lowerMessage.includes('procrastination')) {
        return "Stay motivated with these tips: 1) Set small, achievable goals, 2) Reward yourself for progress, 3) Find your peak energy hours, 4) Use the Pomodoro technique, 5) Connect learning to your future goals. What's your biggest challenge?";
      }

      if (lowerMessage.includes('time') || lowerMessage.includes('schedule') || lowerMessage.includes('manage')) {
        return "Time management for students: 1) Use a planner or calendar, 2) Prioritize tasks by importance, 3) Block time for focused study, 4) Eliminate distractions, 5) Include breaks and leisure time. How much time do you have for studying?";
      }

      if (lowerMessage.includes('notes') || lowerMessage.includes('note-taking')) {
        return "Effective note-taking methods: 1) Use the Cornell note system, 2) Write in your own words, 3) Include examples and diagrams, 4) Review and revise notes regularly, 5) Use colors and highlighting strategically. What format works best for you?";
      }

      if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('difficult')) {
        return "When you're stuck: 1) Break the problem into smaller parts, 2) Look for similar examples, 3) Ask specific questions, 4) Take a short break and return fresh, 5) Explain what you do understand first. What specific part is challenging you?";
      }

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm your AI learning assistant. I can help you with study strategies, explain concepts, provide learning tips, and support your academic journey. What would you like to learn about today?";
      }

      // Default response
      return "I'm your AI learning assistant! I can help with study techniques, explain concepts, provide learning strategies, and support your academic goals. Try asking me about: study methods, time management, memory techniques, test preparation, or specific subjects like math, science, or languages. What would you like to know?";
    };

    if (!hfApiKey) {
      console.log('No HF_API_KEY, using fallback response');
      return res.json({ response: getFallbackResponse(message) });
    }

    const systemPrompt = `You are a helpful AI learning assistant for students. Your role is to:
- Answer questions about the study material and quiz content provided in context
- Explain concepts from the notes in simple terms
- Help students understand specific topics from their study material
- Provide study tips and learning strategies
- Answer questions directly based on the context provided

IMPORTANT: If context/study material is provided, answer questions based on that content. Be specific and reference the material.

Keep responses concise, friendly, and educational.`;

    const userMessage = context ? `${context}\n\nStudent Question: ${message}` : message;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      console.log('Making HF API request...');
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      console.log('HF API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HF API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data?.choices?.[0]?.message?.content;

      if (aiResponse) {
        console.log('AI response received successfully');
        return res.json({ response: aiResponse.trim() });
      } else {
        console.log('No AI response content, using fallback');
        return res.json({ response: getFallbackResponse(message) });
      }

    } catch (apiError) {
      clearTimeout(timeout);
      console.error('Chatbot API error:', apiError.message);
      return res.json({ response: getFallbackResponse(message) });
    }

  } catch (error) {
    console.error('Chatbot error:', error);
    return res.json({ response: "I'm here to help with your learning! I'm having some technical difficulties right now, but I can still provide study tips and guidance. What would you like to know about?" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
