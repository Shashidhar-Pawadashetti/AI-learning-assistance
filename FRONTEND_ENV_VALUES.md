# Frontend Environment Variables - Ready to Use! ✅

## 📋 Copy These EXACT Values to Vercel

When deploying to Vercel, add these environment variables:

---

### 1. VITE_API_URL
```
https://your-backend.onrender.com
```
**⚠️ IMPORTANT:** Replace with your actual Render backend URL after deploying backend!

Example: `https://ai-learning-backend-xyz.onrender.com`

---

### 2. VITE_FIREBASE_API_KEY
```
AIzaSyCuXvdC81nR5VU6STTfeF-vQcZ04ifmX6E
```

---

### 3. VITE_FIREBASE_AUTH_DOMAIN
```
ailearningassistantstudybuddy.firebaseapp.com
```

---

### 4. VITE_FIREBASE_PROJECT_ID
```
ailearningassistantstudybuddy
```

---

### 5. VITE_FIREBASE_STORAGE_BUCKET
```
ailearningassistantstudybuddy.firebasestorage.app
```

---

### 6. VITE_FIREBASE_MESSAGING_SENDER_ID
```
1091858157763
```

---

### 7. VITE_FIREBASE_APP_ID
```
1:1091858157763:web:a4294a8178e7bdf5fa1276
```

---

### 8. VITE_FIREBASE_MEASUREMENT_ID
```
G-HEJ2Q6KK64
```

---

## 📝 Quick Copy-Paste Table for Vercel

| Environment Variable | Value |
|---------------------|-------|
| VITE_API_URL | `https://your-backend.onrender.com` ⚠️ Update this! |
| VITE_FIREBASE_API_KEY | `AIzaSyCuXvdC81nR5VU6STTfeF-vQcZ04ifmX6E` |
| VITE_FIREBASE_AUTH_DOMAIN | `ailearningassistantstudybuddy.firebaseapp.com` |
| VITE_FIREBASE_PROJECT_ID | `ailearningassistantstudybuddy` |
| VITE_FIREBASE_STORAGE_BUCKET | `ailearningassistantstudybuddy.firebasestorage.app` |
| VITE_FIREBASE_MESSAGING_SENDER_ID | `1091858157763` |
| VITE_FIREBASE_APP_ID | `1:1091858157763:web:a4294a8178e7bdf5fa1276` |
| VITE_FIREBASE_MEASUREMENT_ID | `G-HEJ2Q6KK64` |

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend on Render
1. Use backend env variables from `ENV_SETUP_GUIDE.md`
2. **Copy your backend URL** (e.g., `https://ai-learning-backend-abc123.onrender.com`)

### Step 2: Deploy Frontend on Vercel
1. Use the 8 environment variables above
2. **Replace `VITE_API_URL`** with your actual Render backend URL from Step 1
3. Deploy

### Step 3: Update Backend CORS
1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Save (will auto-redeploy)

---

## ✅ You Have Everything!

All credentials are ready. No need to search for APIs - they're all here! 🎉

**Next:** Follow `DEPLOY_QUICK_GUIDE.md` to deploy your app!
