# 🚨 SendGrid Setup - Quick Fix

Your server.js got corrupted from my earlier edit attempt. I've restored it. Now follow these exact steps:

## Step 1: Install SendGrid

```bash
cd backend
npm install @sendgrid/mail
```

## Step 2: Make ONLY 4 Small Changes to server.js

Open `backend/server.js` and make these changes:

### Change 1: Line 7 - Import
**FIND:**
```javascript
import nodemailer from 'nodemailer';
```
**REPLACE WITH:**
```javascript
import sgMail from '@sendgrid/mail';
```

### Change 2: Line 16 - Environment Variables
**FIND:**
```javascript
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
```
**REPLACE WITH:**
```javascript
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'];
```

### Change 3: Lines 82-89 - Setup
**FIND:**
```javascript
// --- Nodemailer Transport Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```
**REPLACE WITH:**
```javascript
// --- SendGrid Setup ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
```

### Change 4: Lines 104-115 - Send Email
**FIND:**
```javascript
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
```
**REPLACE WITH:**
```javascript
  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'AI Learning Assistant - Verification Code',
      text: `Your verification code is: ${code}`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #667eea;">AI Learning Assistant</h2>
        <p>Your verification code is:</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; color: #667eea;">
          ${code}
        </div>
        <p style="color: #64748b; margin-top: 15px;">This code will expire in 10 minutes.</p>
      </div>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('SendGrid email error:', err);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
```

## Step 3: Update Your .env File

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@gmail.com
```

## Step 4: Test Locally

```bash
npm start
```

## Step 5: Update Render

Add environment variables in Render:
- `SENDGRID_API_KEY` = Your API key
- `SENDGRID_FROM_EMAIL` = Your verified email

Remove old variables:
- Delete `EMAIL_USER`
- Delete `EMAIL_PASS`

Save and redeploy!

---

**That's it!** Just 4 small find-and-replace changes in server.js.
