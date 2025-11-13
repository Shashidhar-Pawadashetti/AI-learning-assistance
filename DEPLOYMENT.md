# Deployment Guide

## Pre-Deployment Checklist

### 1. Rotate All Credentials

**MongoDB:**
- Create new database user with strong password
- Update `MONGO_URI` in backend/.env

**JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
- Update `JWT_SECRET` in backend/.env

**Hugging Face API:**
- Generate new API key at https://huggingface.co/settings/tokens
- Update `HF_API_KEY` in backend/.env

**Email:**
- Generate new Gmail App Password
- Update `EMAIL_PASS` in backend/.env

**Firebase:**
- Generate new service account key
- Update Firebase credentials in backend/.env

### 2. Environment Variables

**Backend (.env):**
```env
MONGO_URI=your_new_mongodb_uri
JWT_SECRET=your_new_jwt_secret
PORT=5000
HF_API_KEY=your_new_hf_api_key
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_new_app_password
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

**Frontend (.env):**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 4. Build Frontend

```bash
cd frontend
npm run build
```

## Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

**Frontend (Vercel):**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Backend (Render):**
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables
6. Deploy

### Option 2: Railway (Full Stack)

1. Push to GitHub
2. Create new project in Railway
3. Add backend service
4. Add frontend service
5. Configure environment variables
6. Deploy

### Option 3: AWS (Production)

**Backend (EC2/Elastic Beanstalk):**
- Deploy Node.js app
- Configure environment variables
- Set up load balancer

**Frontend (S3 + CloudFront):**
- Upload build files to S3
- Configure CloudFront distribution
- Set up custom domain

## Post-Deployment

### 1. Test All Features
- [ ] User signup/login
- [ ] Email verification
- [ ] Quiz generation
- [ ] Quiz submission
- [ ] Dashboard stats
- [ ] Achievements

### 2. Monitor
- Check server logs
- Monitor API response times
- Track error rates

### 3. Security
- Enable HTTPS
- Configure CORS properly
- Set up rate limiting
- Enable MongoDB IP whitelist

## For College Project Submission

**What to Include:**
1. GitHub repository link (with .env.example)
2. Live demo URL
3. Documentation (README.md)
4. Screenshots of features
5. Video demo (optional)

**What NOT to Include:**
- .env files with real credentials
- node_modules folders
- Build artifacts

## Quick Deploy Commands

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run build
npm run preview
```

## Troubleshooting

**Issue: MongoDB connection failed**
- Check MONGO_URI is correct
- Verify IP whitelist in MongoDB Atlas

**Issue: Firebase auth not working**
- Verify all Firebase env vars are set
- Check Firebase console for errors

**Issue: Quiz generation fails**
- Verify HF_API_KEY is valid
- Check API quota limits

## Support

For issues, check:
1. Server logs
2. Browser console
3. Network tab in DevTools
