# Quick Deployment Guide

## ✅ Pre-Deployment Checklist

Your project is now ready to deploy! Here's what you need to do:

### 1. **Commit and Push Latest Changes**
```bash
git add .
git commit -m "Add API URL configuration for deployment"
git push origin main
```

---

## 🚀 Deploy Backend (Render - Free Tier)

### Step 1: Sign up at [render.com](https://render.com)

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `ai-learning-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add these:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
HF_API_KEY=your_huggingface_api_key
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Step 4: Deploy
- Click **"Create Web Service"**
- Wait 5-10 minutes for deployment
- **Copy your backend URL** (e.g., `https://ai-learning-backend.onrender.com`)

---

## 🌐 Deploy Frontend (Vercel - Free Tier)

### Step 1: Sign up at [vercel.com](https://vercel.com)

### Step 2: Import Project
1. Click **"Add New"** → **"Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables
Add these environment variables:

```
VITE_API_URL=https://ai-learning-backend.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

**Important**: Replace `VITE_API_URL` with your actual Render backend URL from Step 4 above!

### Step 4: Deploy
- Click **"Deploy"**
- Wait 2-3 minutes
- Your app will be live at `https://your-app.vercel.app`

---

## 🔧 Update Backend CORS

After deploying frontend, update your backend `.env` on Render:

1. Go to Render Dashboard → Your Web Service
2. Click "Environment" tab
3. Update `FRONTEND_URL` to your Vercel URL: `https://your-app.vercel.app`
4. Click "Save Changes" (this will redeploy)

---

## ✅ Test Your Deployment

1. Visit your Vercel URL
2. Sign up with a new account
3. Upload notes and generate a quiz
4. Complete a quiz and check dashboard
5. Verify achievements are working

---

## 🎯 Where to Get Credentials

### MongoDB URI
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<password>` with your database user password

### JWT Secret
Run this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Hugging Face API Key
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create new token with "Read" access
3. Copy the token

### Gmail App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password

### Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download JSON file
6. Extract values for environment variables

---

## 🐛 Troubleshooting

### Backend not starting
- Check all environment variables are set correctly
- Verify MongoDB connection string is correct
- Check Render logs for errors

### Frontend can't connect to backend
- Verify `VITE_API_URL` matches your Render backend URL
- Check CORS settings in backend
- Verify `FRONTEND_URL` in backend matches Vercel URL

### Quiz generation fails
- Verify `HF_API_KEY` is valid
- Check Hugging Face API quota
- Look at backend logs on Render

### Email verification not working
- Verify Gmail App Password is correct
- Check if 2-Step Verification is enabled
- Test with a real email address

---

## 📝 Important Notes

1. **Free Tier Limitations**:
   - Render: Backend sleeps after 15 min of inactivity (first request takes ~30s to wake up)
   - Vercel: 100GB bandwidth/month
   - MongoDB Atlas: 512MB storage

2. **Security**:
   - Never commit `.env` files
   - Rotate credentials before deployment
   - Use strong JWT secret

3. **Performance**:
   - First quiz generation may take 60-90 seconds
   - Subsequent requests are faster
   - Consider upgrading to paid tier for production

---

## 🎉 You're Done!

Your AI Learning Assistant is now live! Share your Vercel URL with others.

**Next Steps**:
- Add custom domain (optional)
- Monitor usage and errors
- Collect user feedback
- Add more features

---

## 📞 Need Help?

Check:
1. Render logs (Dashboard → Logs)
2. Vercel deployment logs
3. Browser console (F12)
4. Network tab for API errors
