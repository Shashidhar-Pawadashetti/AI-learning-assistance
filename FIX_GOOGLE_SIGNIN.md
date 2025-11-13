# Fix Google Sign-In Error: auth/unauthorized-domain

## 🔧 Quick Fix (5 minutes)

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com
2. Select your project: **ailearningassistantstudybuddy**

### Step 2: Add Your Vercel Domain
1. Click **Authentication** in left sidebar
2. Click **Settings** tab at the top
3. Scroll down to **Authorized domains** section
4. Click **Add domain**
5. Enter your Vercel domain (e.g., `your-app.vercel.app`)
6. Click **Add**

### Step 3: Test Again
- Go back to your deployed app
- Try Google Sign-In again
- Should work now! ✅

---

## 📋 Domains to Add

Add ALL of these domains to Firebase:

1. **Your Vercel domain**: `your-app.vercel.app` (replace with your actual domain)
2. **Localhost** (if not already there): `localhost`

Example:
- `ai-learning-assistant.vercel.app`
- `localhost`

---

## 🎯 Visual Guide

**Firebase Console → Authentication → Settings → Authorized domains**

You should see:
```
✅ localhost (already there)
✅ ailearningassistantstudybuddy.firebaseapp.com (already there)
➕ your-app.vercel.app (ADD THIS!)
```

---

## ⚠️ Common Mistakes

1. **Don't include `https://`** - Just the domain: `your-app.vercel.app`
2. **Don't include paths** - Just the domain, not `/login` or `/signup`
3. **Wait 1-2 minutes** after adding for changes to propagate

---

## ✅ After Adding Domain

1. Clear browser cache (or open incognito)
2. Go to your deployed app
3. Try Google Sign-In
4. Should work perfectly! 🎉

---

## 🔍 How to Find Your Vercel Domain

1. Go to Vercel dashboard
2. Click your project
3. Look at the top - you'll see: `your-app.vercel.app`
4. Copy that domain (without `https://`)
5. Add it to Firebase

---

## 📞 Still Not Working?

Check:
1. Domain is spelled correctly (no typos)
2. No `https://` prefix
3. Waited 1-2 minutes after adding
4. Cleared browser cache
5. Firebase project is correct: **ailearningassistantstudybuddy**
