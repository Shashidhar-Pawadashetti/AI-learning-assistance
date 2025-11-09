import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from './models/User.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, notes } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = notes ? `Based on these notes: ${notes}\n\nAnswer this question: ${message}` : message;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    res.json({ reply: text });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: error.message || 'Failed to get response from chatbot' });
  }
});

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { notes, numQuestions = 5 } = req.body;
    
    if (!notes) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    if (numQuestions < 1 || numQuestions > 20) {
      return res.status(400).json({ error: 'Number of questions must be between 1 and 20' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const mcqCount = Math.ceil(numQuestions * 0.6);
    const blankCount = numQuestions - mcqCount;
    const prompt = `Based on the following notes, generate exactly ${numQuestions} quiz questions in JSON format. Include ${mcqCount} multiple choice questions and ${blankCount} fill-in-the-blank questions. If the notes don't have enough content, generate as many quality questions as possible. Return ONLY valid JSON array without any markdown formatting or explanation.\n\nNotes: ${notes}\n\nFormat: [{"type":"mcq","q":"question text","options":["A","B","C","D"],"a":"correct answer"},{"type":"blank","q":"question with ____ blank","a":"answer"}]`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonText = text.replace(/```json\n?|```\n?/g, '').trim();
    const questions = JSON.parse(jsonText);
    
    if (questions.length < numQuestions) {
      return res.status(400).json({ error: `Could only generate ${questions.length} questions. The notes may not have enough content for ${numQuestions} questions.` });
    }
    
    res.json({ questions });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
