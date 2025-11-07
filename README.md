# AI Learning Assistant 🎓

A gamified learning platform that transforms your study notes into interactive quizzes using AI. Track your progress, compete on leaderboards, and earn achievements while learning!

## 🌟 Features

### Core Learning Features
- **📝 Upload Notes**: Upload study notes in various formats (.txt, .md, .pdf, .doc, code files)
- **🤖 AI-Powered Quiz Generation**: Automatically generate quizzes from your notes using Hugging Face AI
- **✅ Quiz Review**: Review correct answers after completing quizzes with color-coded feedback
- **📚 Notes Library**: Save and organize your study materials for reuse
- **🏆 Leaderboard**: Compete with other learners and see top performers

### Gamification System
- **⭐ XP & Levels**: Earn experience points for completing quizzes (10 XP per correct answer)
- **📊 Progress Tracking**: Visual progress bars showing XP needed for next level
- **🏅 Achievements**: Unlock badges for milestones (First Quiz, 100 XP, Quiz Master, etc.)
- **📈 Statistics Dashboard**: View your quiz history, average scores, and performance trends

### User Management
- **🔐 Firebase Authentication**: Secure login with email/password or Google Sign-In
- **👤 User Profiles**: Personalized dashboard with stats and achievements
- **🔒 Protected Routes**: Authenticated access to learning features
- **☁️ Cloud Sync**: User data persisted to MongoDB database

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **React Router v7** for routing
- **Tailwind CSS v4** for styling
- **Firebase SDK** for authentication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Firebase Admin** (for future use)
- **Hugging Face API** for AI quiz generation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB instance (local or cloud)
- Firebase project with Authentication enabled
- Hugging Face API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Shashidhar-Pawadashetti/AI-learning-assistance.git
cd AI-learning-assistance
```

2. **Install root dependencies (Firebase)**
```bash
npm install
```

3. **Setup Backend**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key
# PORT=5000
# HF_API_KEY=your_huggingface_api_key
# HF_MODEL=google/flan-t5-large
```

4. **Setup Frontend**
```bash
cd frontend
npm install

# Create .env file (optional - defaults to localhost:5000)
cp .env.example .env
# Edit .env if you need to change the API URL:
# VITE_API_URL=http://localhost:5000/api

# Update firebase.js with your Firebase config
```

5. **Start Development Servers**

Backend (Terminal 1):
```bash
cd backend
npm run dev
```

Frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔒 Security

Before deploying to production, please review [SECURITY.md](SECURITY.md) for important security recommendations including:
- Rate limiting implementation
- CORS configuration
- Firebase token verification
- Security headers with Helmet.js

The current implementation is secure for development but requires hardening for production deployment.

## 📚 API Endpoints

### User Management
- `POST /api/firebase-user` - Get or create user profile
- `PUT /api/firebase-user/:uid` - Update user XP and level

### Quiz System
- `POST /api/generate-quiz` - Generate quiz from notes
- `POST /api/quiz-attempt` - Save quiz results
- `GET /api/quiz-history/:userId` - Get user's quiz history
- `GET /api/quiz-stats/:userId` - Get aggregated statistics

### Notes Management
- `POST /api/notes` - Save notes to library
- `GET /api/notes/:userId` - Get user's saved notes
- `GET /api/note/:noteId` - Get specific note
- `DELETE /api/note/:noteId` - Delete note

### Social Features
- `GET /api/leaderboard` - Get top users by XP

## 🎮 How to Use

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Upload Notes**: Go to "Upload Notes" and paste or upload your study material
3. **Take Quiz**: AI generates questions automatically from your notes
4. **Review Answers**: After submitting, review correct answers with explanations
5. **Track Progress**: Check your dashboard for statistics and XP progress
6. **Compete**: View the leaderboard to see how you rank against others
7. **Library**: Save notes to your library for quick access later

## 🔮 Future Enhancements

- [ ] Difficulty selection for quizzes (Easy, Medium, Hard)
- [ ] Timed quizzes with countdown timer
- [ ] More question types (True/False, Matching, etc.)
- [ ] Progress analytics with charts
- [ ] Study reminders and notifications
- [ ] Collaborative learning features
- [ ] Mobile app version
- [ ] Export quiz results as PDF
- [ ] Custom quiz creation
- [ ] Spaced repetition algorithm

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Shashidhar Pawadashetti

## 🙏 Acknowledgments

- Hugging Face for AI model API
- Firebase for authentication services
- MongoDB for database services
- All contributors and users of this platform

---

**Happy Learning! 🚀📚**
