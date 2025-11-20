# AI Learning Assistant

A full-stack MERN application that helps students generate personalized quizzes from their study notes using AI, with gamification features and progress tracking.

## Features

- 📝 **Smart Quiz Generation**: Upload PDF, Word, or text files to generate custom quizzes
- 🤖 **AI-Powered**: Uses Hugging Face AI models for intelligent question generation
- 💬 **AI Chatbot**: Get instant help with study questions
- 🎯 **Mixed Question Types**: Multiple-choice and multiple-select questions with partial marking
- ⏱️ **Timed & Untimed Modes**: Practice at your own pace or challenge yourself
- 📊 **Progress Tracking**: View quiz history, scores, and performance analytics
- 🏆 **Gamification**: Earn XP, level up, and unlock badges
- 🔐 **Secure Authentication**: Firebase authentication with email verification
- 🛡️ **Security Features**: Rate limiting, input validation, and secure credential management

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Firebase Authentication
- Inline CSS styling

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Hugging Face API integration
- Nodemailer for email verification
- Multer for file uploads
- pdf-parse for PDF extraction
- mammoth for Word document extraction
- express-rate-limit for API protection

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Firebase project
- Hugging Face API key
- Gmail account (for email verification)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd AI-learning-assistance
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory (see `.env.example` for template):
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_minimum_32_characters
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
HF_API_KEY=your_huggingface_api_key
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
FRONTEND_URL=http://localhost:5173
```

> **Important**: 
> - JWT_SECRET must be at least 32 characters long
> - Never commit .env files to version control
> - Use the `.env.example` file as a template

Start backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in frontend directory (see `.env.example` for template):
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> **Note**: All Firebase environment variables are required for the app to function properly.

Start frontend development server:
```bash
npm run dev
```

## Configuration Guide

### MongoDB Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and add to `MONGO_URI`

### Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Get configuration from Project Settings
4. Add credentials to frontend `.env`

### Hugging Face API
1. Create account at [Hugging Face](https://huggingface.co/)
2. Generate API token from Settings > Access Tokens
3. Add to `HF_API_KEY` in backend `.env`

### Gmail App Password
1. Enable 2-factor authentication on Gmail
2. Generate App Password from Google Account settings
3. Add to `EMAIL_PASS` in backend `.env`

## Usage

1. **Sign Up**: Create account with email verification
2. **Upload Notes**: Upload PDF, Word (.docx), or text files
3. **Select Questions**: Choose number of questions (10-50)
4. **Take Quiz**: Select timed or untimed mode
5. **View Results**: Get instant feedback with AI-generated explanations
6. **Track Progress**: View history and performance analytics

## Project Structure

```
AI-learning-assistance/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Authentication middleware
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── firebase.js  # Firebase config
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Deployment

### Backend (Railway/Heroku)
1. Push code to GitHub
2. Connect repository to Railway/Heroku
3. Add environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Database (MongoDB Atlas)
- Already cloud-hosted, no additional deployment needed

## Features in Detail

### Quiz Generation
- Supports PDF, Word (.docx), and text files
- AI generates mixed MCQ and multiple-select questions
- Customizable difficulty levels (Easy, Medium, Hard)
- 10-50 questions per quiz

### Scoring System
- MCQ: 1 mark for correct answer
- Multiple-select: Partial marking (proportional to correct answers)
- No marks if any incorrect answer selected

### Gamification
- XP system: 10 XP per correct answer
- Bonus XP for difficulty, timed mode, perfect scores
- Level progression system
- Achievement badges
- Daily streak tracking

## Security Features

- **Rate Limiting**: Protects against brute force attacks and API abuse
  - Authentication endpoints: 5 attempts per 15 minutes
  - Email verification: 3 emails per hour
  - Quiz generation: 10 requests per minute
  - Chatbot: 20 messages per minute
- **Input Validation**: All user inputs are validated and sanitized
- **Email Validation**: Accepts all valid email providers (not restricted to Gmail)
- **Verification Code Expiration**: Email verification codes expire after 10 minutes
- **Environment Variable Validation**: Server validates all required configuration on startup
- **Secure Credential Storage**: No hardcoded credentials in source code

## Known Limitations

> This project is designed for **educational purposes** as a college mini-project.

### Current Limitations:
1. **In-Memory Verification Codes**: Email verification codes are stored in memory and will be lost on server restart. For production, use Redis or database storage.
2. **Dual Authentication**: Uses both Firebase Auth and JWT. Production apps should choose one consistent authentication strategy.
3. **Token Storage**: Uses localStorage for JWT tokens. Consider httpOnly cookies for enhanced security in production.
4. **No Automated Tests**: Unit and integration tests are not included.
5. **Basic Error Logging**: Uses console.log instead of proper logging framework.
6. **File Upload Security**: Basic file type validation. Production should include virus scanning.
7. **AI Output Sanitization**: AI-generated content is not sanitized for XSS. Add Content Security Policy for production.
8. **No HTTPS Enforcement**: Should enforce HTTPS in production deployment.

### Recommended for Production:
- Implement comprehensive testing suite
- Add proper logging and monitoring (Winston, Sentry)
- Use Redis for session and verification code storage
- Implement HTTPS with HSTS headers
- Add Content Security Policy headers
- Sanitize all AI-generated content
- Choose single authentication strategy
- Add database backup and recovery procedures
- Implement CI/CD pipeline
- Add API documentation (Swagger/OpenAPI)

## License

This project is for educational purposes.

## Support

For issues or questions, please create an issue in the GitHub repository.
