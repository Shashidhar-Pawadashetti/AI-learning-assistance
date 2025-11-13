# Fix Vercel 404 Error

## 🔧 Problem
Your Vercel deployment shows "404: NOT_FOUND" error.

## ✅ Solutions

### Solution 1: Check Vercel Build Settings (Most Common)

1. Go to Vercel Dashboard
2. Click your project
3. Go to **Settings** → **General**
4. Check these settings:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. If any are wrong, update them
6. Go to **Deployments** tab
7. Click **Redeploy** on latest deployment

---

### Solution 2: Add vercel.json (Already Done!)

I created `vercel.json` in your root directory. Now:

1. Commit and push:
```bash
git add vercel.json
git commit -m "Add Vercel SPA routing config"
git push origin main
```

2. Vercel will auto-redeploy

---

### Solution 3: Check Build Logs

1. Go to Vercel Dashboard
2. Click your project
3. Click **Deployments** tab
4. Click latest deployment
5. Check **Build Logs** for errors

Common errors:
- Missing environment variables
- Build command failed
- Wrong directory structure

---

### Solution 4: Verify Directory Structure

Your Vercel project should point to `frontend` folder:

```
AI-learning-assistance/
├── frontend/          ← Root Directory in Vercel
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── backend/
```

---

### Solution 5: Manual Redeploy

1. Go to Vercel Dashboard
2. Click your project
3. Click **Deployments** tab
4. Find latest deployment
5. Click **⋯** (three dots)
6. Click **Redeploy**
7. Check "Use existing Build Cache" is OFF
8. Click **Redeploy**

---

## 🎯 Quick Fix Checklist

- [ ] Root Directory = `frontend`
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] Framework = Vite
- [ ] All environment variables added
- [ ] `vercel.json` committed and pushed
- [ ] Redeployed after changes

---

## 📝 Correct Vercel Settings

**Project Settings:**
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x (or latest)
```

**Environment Variables (8 required):**
```
VITE_API_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

---

## 🚨 If Still Not Working

1. **Delete and recreate deployment:**
   - Go to Vercel Dashboard
   - Settings → General → Delete Project
   - Import project again from GitHub
   - Set correct settings from start

2. **Check GitHub repo:**
   - Make sure `frontend` folder exists
   - Make sure `package.json` is in `frontend` folder
   - Make sure code is pushed to `main` branch

3. **Check build locally:**
```bash
cd frontend
npm install
npm run build
```
If this fails locally, fix errors first!

---

## ✅ After Fix

1. Wait 2-3 minutes for deployment
2. Visit your Vercel URL
3. Should see your app homepage
4. Test signup/login

---

## 📞 Common Issues

**Issue:** "Command failed: npm run build"
**Fix:** Check build logs, fix any TypeScript/ESLint errors

**Issue:** "Cannot find module"
**Fix:** Make sure all dependencies in `package.json`, run `npm install`

**Issue:** Blank page after deployment
**Fix:** Check browser console for errors, verify environment variables

**Issue:** Routes don't work (404 on refresh)
**Fix:** `vercel.json` should fix this (already created!)
