# AI Learning Assistant - Study Buddy

An intelligent learning platform that generates personalized quizzes from your study notes using AI.

## Features

- 📝 Upload notes (text, PDF, markdown, code files)
- 🤖 AI-powered quiz generation (20 questions: 10 fill-in-blank + 10 MCQ)
- ⏱️ Timed and untimed quiz modes
- 📊 Detailed performance analytics with AI feedback
- 🏆 Achievement system with XP and levels
- 📈 Quiz history with filtering and search
- 🔐 Secure authentication (Email/Password + Google Sign-In)
- 📧 Email verification for signup

## Tech Stack

### Frontend
- React 19 + Vite
- React Router for navigation
- Firebase Authentication
- TailwindCSS for styling
- PDF.js for PDF text extraction

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Firebase Admin SDK for auth verification
- Hugging Face API (Qwen2.5-7B-Instruct model)
- Nodemailer for email verification

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Firebase project
- Hugging Face API key
- Gmail account with App Password

### 1. Clone and Install

```bash
cd AI-learning-assistance

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Configuration

Create `backend/.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
HF_API_KEY=your_huggingface_api_key
HF_MODEL=Qwen/Qwen2.5-7B-Instruct

EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Configuration

Update `frontend/src/firebase.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_auth_domain",
  projectId: "your_project_id",
  storageBucket: "your_storage_bucket",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};
```

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend runs on: http://localhost:5000
Frontend runs on: http://localhost:5173

## API Endpoints

### Public Routes
- `POST /api/signup` - Create new account
- `POST /api/login` - Login with credentials
- `POST /api/send-verification-code` - Send email verification code
- `POST /api/verify-code` - Verify email code

### Protected Routes (Require Authentication)
- `POST /api/generate-quiz` - Generate quiz from notes
- `POST /api/analyze-quiz` - Analyze quiz submission

## Project Structure

```
AI-learning-assistance/
├── backend/
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── models/
│   │   └── User.js           # User schema
│   ├── .env                  # Environment variables (DO NOT COMMIT)
│   ├── .env.example          # Example env file
│   ├── server.js             # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NavBar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── UploadNote.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Achievements.jsx
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Usage Guide

1. **Sign Up**: Create an account with email verification
2. **Upload Notes**: Paste or upload your study material (supports PDF, text, code files)
3. **Generate Quiz**: Select difficulty level and generate a 20-question quiz
4. **Take Quiz**: Choose timed or untimed mode
5. **Review Results**: Get AI-powered feedback and explanations
6. **Track Progress**: View history, filter by topic/difficulty, and track your improvement

## Security Features

- ✅ Firebase Authentication with JWT verification
- ✅ Protected API routes with middleware
- ✅ Email verification for signup
- ✅ CORS configuration
- ✅ Password hashing with bcrypt
- ✅ Secure token storage

## Future Improvements

- Add Redis for verification code storage
- Implement rate limiting
- Add comprehensive logging
- Unit and integration tests
- Docker containerization
- API documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License
