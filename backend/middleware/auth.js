import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return true;
  
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase Admin credentials not configured. Authentication will not work.');
    console.warn('   Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env');
    return false;
  }

  // Remove surrounding quotes if present
  projectId = projectId.replace(/^["']|["']$/g, '');
  clientEmail = clientEmail.replace(/^["']|["']$/g, '');
  privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    firebaseInitialized = true;
    console.log('✓ Firebase Admin initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    return false;
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Try JWT first (for regular signup/login)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        uid: decoded.id,
        email: decoded.email,
        userId: decoded.id,
        isJWT: true
      };
      return next();
    } catch (jwtError) {
      // JWT failed, try Firebase
    }
    
    // Try Firebase token
    if (!firebaseInitialized && !initializeFirebase()) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isJWT: false
    };
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Initialize on module load
setTimeout(() => initializeFirebase(), 100);
