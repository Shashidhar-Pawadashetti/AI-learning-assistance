# AI Learning Assistant - Copilot Instructions

## Architecture Overview

This is a **MERN stack** gamified learning platform with:
- **Frontend**: React 19 + Vite + React Router + Tailwind CSS (in `frontend/`)
- **Backend**: Express.js + MongoDB + JWT auth (in `backend/`)
- **Separation**: Frontend and backend are independent services with no monorepo setup

### Data Flow
1. User auth flows through JWT tokens stored in `localStorage`
2. User model tracks gamification: `xp` (experience points) and `level` fields in `backend/models/User.js`
3. Frontend pages check `localStorage` for user data (see `Dashboard.jsx`)
4. Backend exposes REST API at `http://localhost:5000/api/*`

## Key Conventions

### Authentication Pattern
- **Firebase Authentication** - Email/password + Google provider using Firebase SDK
- Firebase config in `frontend/src/firebase.js` - exports `auth` instance
- Firebase ID tokens stored in `localStorage.setItem('token', token)`
- User object cached in localStorage with structure: `{ id, name, email, xp, level }`
- **Important**: Uses `window.location.href` for navigation after auth (not React Router's `navigate`)
- Navbar checks auth state via `localStorage.getItem('token')` to show/hide Logout button
- Logout calls `signOut(auth)` and clears both `token` and `user` from localStorage (see `NavBar.jsx`)
- Auth methods used:
  - `signInWithEmailAndPassword(auth, email, password)` in Login.jsx
  - `createUserWithEmailAndPassword(auth, email, password)` in Signup.jsx
  - `updateProfile(user, { displayName })` to set user name on signup
  - `signInWithPopup(auth, googleProvider)` for Google sign-in in Login/Signup
  - `signOut(auth)` in NavBar.jsx

### API Communication
- **No backend API calls for authentication** - Firebase handles auth directly
- Firebase SDK communicates with Firebase Auth service
- User data (xp, level) currently only stored in localStorage (not persisted to backend/database)
- Future API endpoints would use Firebase ID tokens for authorization

### Backend Structure
- **Currently unused for authentication** - Firebase Auth handles all user management
- ES modules (`"type": "module"` in both package.json files)
- Import syntax: `import User from './models/User.js'` (must include `.js` extension)
- Environment vars in `backend/.env`: `MONGO_URI`, `JWT_SECRET`, `PORT`
- Server has legacy JWT endpoints `/api/login` and `/api/signup` (not used anymore)
- **Future use**: Could store user game data (xp, level, achievements) with Firebase UID as key

## Development Workflow

### Starting the App
```bash
# Frontend only (authentication works without backend)
cd frontend
npm run dev          # Vite dev server on http://localhost:5173

# Backend (optional - not needed for current auth flow)
cd backend
npm run dev          # Uses node --watch for hot reload
```

### Environment Setup
- Frontend requires Firebase configuration in `frontend/src/firebase.js`
- Firebase project credentials (apiKey, authDomain, projectId, etc.)
- Backend `.env` currently unused but configured for future MongoDB integration
- Frontend has separate `node_modules` - run `npm install` in `frontend/` directory

### Routing
- Frontend uses React Router v7 (see `App.jsx`)
- Routes: `/`, `/upload`, `/quiz`, `/achievements`, `/dashboard`, `/login`, `/signup`
- Navbar component (`components/NavBar.jsx`) present on all pages
- Auth flow: Login/Signup → uses `window.location.href = '/dashboard'` (not `navigate()`)
- Logout: Clears localStorage and uses React Router's `navigate('/')`

## Gamification System

User progression tracked via:
- `xp`: Experience points (Number, default 0)
- `level`: User level (Number, default 1)
- XP calculation for progress bar: `(user.xp / (user.level * 100)) * 100`
- Each level requires `level * 100` XP (level 1 = 100 XP, level 2 = 200 XP, etc.)

## Feature Implementations

### Upload Notes → Quiz Flow
1. User uploads `.txt` file or pastes notes in `UploadNote.jsx`
2. Notes stored in `localStorage.setItem('studentNotes', notes)`
3. Navigate to `/quiz` which reads from localStorage
4. Quiz generates:
   - Fill-in-the-blank questions from sentences (replaces random word with `____`)
   - Hardcoded MCQs about AI concepts
5. **Not implemented yet**: Quiz submission, scoring, XP awarding

### Quiz Generation via Hugging Face
- Backend endpoint: `POST /api/generate-quiz` (see `backend/server.js`)
- Env required in `backend/.env`:
  - `HF_API_KEY=...` (Hugging Face Inference token)
  - `HF_MODEL=google/flan-t5-large` (default; adjust as needed)
- Prompt contract asks the model to output strict JSON:
  - 3 blanks and 2 MCQs only
  - Shape:
    `{ "blanks": [{"q":"...____...","a":"..."}], "mcq": [{"q":"?","options":["A","B","C","D"],"a":"A"}] }`
- Frontend caller: `frontend/src/pages/Quiz.jsx` posts `{ notes, level }` and renders questions
- Fallback: If JSON parse fails, backend generates a simple quiz from notes

Recommended models:
- Default: `google/flan-t5-large` (quality/latency balance, clean JSON with short prompts)
- Faster/cheaper: `google/flan-t5-base`
- Higher quality: `mistralai/Mistral-7B-Instruct-v0.2` (slower, higher cost)
- Gated: `meta-llama/Meta-Llama-3-8B-Instruct` (requires license acceptance)

### Achievements System
- Dynamic badges in `Achievements.jsx` based on localStorage:
  - Reads `user.xp` and `stats` (`quizzesCompleted`, `lastScore`, `totalQuestions`)
  - Badges include First Quiz, Quiz Master (10 quizzes), Fast Learner (>=90%), 100 XP
  - Falls back to a "Keep Going" hint if none earned yet

### Dark Mode
- Toggle button in Navbar (🌙/🌞 emoji)
- Uses React state + `useEffect` to add/remove `.dark-mode` class on `<body>`
- All styles in `frontend/src/App.css` (no Tailwind config file - uses Tailwind v4 CSS-first approach)
- Dark mode styles: `.dark-mode .component-name` pattern

## Code Style Notes

- React components use default exports
- Styling in `frontend/src/App.css` with extensive dark mode overrides
- Form submissions prevent default and handle errors with local state
- No TypeScript - pure JavaScript with JSX
- Props passed directly to functional components (see `BadgeCard.jsx`)
