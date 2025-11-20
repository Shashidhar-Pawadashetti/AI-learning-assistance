# Quick Setup Guide for AI Learning Assistant

## Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] MongoDB Atlas account created
- [ ] Firebase project created
- [ ] Hugging Face account with API key
- [ ] Gmail account with 2FA enabled

## Step-by-Step Setup

### 1. MongoDB Atlas Setup (5 minutes)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Save this for MONGO_URI in .env

### 2. Firebase Setup (10 minutes)

#### Frontend Configuration:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Click "Add app" → Web (</>) icon
4. Copy all configuration values
5. Go to Project Settings → Service Accounts
6. Click "Generate new private key"
7. Save the JSON file (you'll need values from it)

#### Authentication Setup:
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Save changes

### 3. Hugging Face API Key (3 minutes)
1. Go to [Hugging Face](https://huggingface.co/)
2. Create account or log in
3. Go to Settings → Access Tokens
4. Click "New token"
5. Give it a name and select "Read" permission
6. Copy the token (starts with hf_...)

### 4. Gmail App Password (5 minutes)
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → 2-Step Verification
3. Scroll to "App passwords"
4. Select app: "Mail", Select device: "Other (Custom name)"
5. Enter "AI Learning Assistant"
6. Copy the 16-character password (remove spaces)

### 5. Backend Environment Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-learning-db
JWT_SECRET=your_super_secure_random_32_character_secret_key_here_123456
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # (remove spaces)
HF_API_KEY=hf_your_huggingface_api_key_here
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FRONTEND_URL=http://localhost:5173
```

### 6. Frontend Environment Setup
```bash
cd ../frontend
cp .env.example .env
# Edit .env with your Firebase values
npm install
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF
```

### 7. Start the Application

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 8. Test the Application
1. Open http://localhost:5173
2. Click "Sign Up"
3. Enter email and password
4. Check your email for verification code
5. Enter code and complete signup
6. Try generating a quiz!

## Common Issues

### "Missing Firebase environment variables"
- Make sure all VITE_FIREBASE_* variables are set in frontend/.env
- Restart the dev server after changing .env

### "MongoDB connection error"
- Check MONGO_URI format
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify database password is correct

### "Email not sending"
- Verify EMAIL_USER and EMAIL_PASS are correct
- Make sure you're using App Password, not regular Gmail password
- Check Gmail 2FA is enabled

### "HF API error"
- Verify HF_API_KEY is correct
- Check your Hugging Face API quota
- The app will fall back to local quiz generation if API fails

### Server won't start - "Missing required environment variables"
- Check that all required variables in backend/.env are filled
- JWT_SECRET must be at least 32 characters
- No quotes around values unless specified

## Production Deployment

### Backend (Railway/Render)
1. Create account on Railway.app or Render.com
2. Connect GitHub repository
3. Add all environment variables from backend/.env
4. Deploy

### Frontend (Vercel/Netlify)
1. Create account on Vercel.com or Netlify.com
2. Connect GitHub repository
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add all VITE_* environment variables
6. Update VITE_API_URL to your backend URL
7. Deploy

### Update CORS
In backend .env on production:
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Security Notes
- Never commit .env files
- Use strong JWT_SECRET (32+ characters)
- Keep API keys secure
- Enable Firebase security rules in production
- Use environment-specific .env files for different deployments

## Need Help?
Check the main README.md for detailed feature documentation and known limitations.
