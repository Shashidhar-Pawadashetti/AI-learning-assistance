import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';

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

    // DEBUG: Log what we received
    console.log('=== QUIZ GENERATION DEBUG ===');
    console.log('Notes received (first 500 chars):', notes ? notes.substring(0, 500) : 'EMPTY');
    console.log('Notes length:', notes ? notes.length : 0);
    console.log('Difficulty level:', level);
    console.log('===========================');

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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
