# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Currently, the API uses Firebase Authentication. The frontend obtains Firebase ID tokens after user authentication and stores them in localStorage. Future versions will require these tokens in the Authorization header for protected endpoints.

## Endpoints

### User Management

#### Create or Get Firebase User
```http
POST /firebase-user
```

**Request Body:**
```json
{
  "firebaseUid": "string",
  "email": "string",
  "name": "string"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "xp": 0,
    "level": 1,
    "quizzesCompleted": 0
  }
}
```

#### Update User XP and Level
```http
PUT /firebase-user/:uid
```

**Parameters:**
- `uid` - Firebase user ID

**Request Body:**
```json
{
  "xp": 150,
  "level": 2
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "xp": 150,
    "level": 2
  }
}
```

---

### Quiz System

#### Generate Quiz from Notes
```http
POST /generate-quiz
```

**Request Body:**
```json
{
  "notes": "Your study notes text here...",
  "level": "medium"
}
```

**Notes:**
- `notes`: Minimum 20 characters, max 2000 characters (truncated if longer)
- `level`: Optional. Values: "easy", "medium", "hard"

**Response (200 OK):**
```json
{
  "blanks": [
    {
      "q": "The capital of France is ____.",
      "a": "Paris"
    }
  ],
  "mcq": [
    {
      "q": "What is the largest planet in our solar system?",
      "options": ["Earth", "Jupiter", "Mars", "Venus"],
      "a": "Jupiter"
    }
  ]
}
```

**Error Responses:**
- `400` - Notes too short (less than 20 chars)
- `500` - HF_API_KEY not configured or server error

#### Save Quiz Attempt
```http
POST /quiz-attempt
```

**Request Body:**
```json
{
  "userId": "string",
  "questions": [
    {
      "question": "string",
      "type": "blank|mcq",
      "userAnswer": "string",
      "correctAnswer": "string",
      "isCorrect": true
    }
  ],
  "score": 8,
  "totalQuestions": 10,
  "xpEarned": 80,
  "difficulty": "medium"
}
```

**Response (201 Created):**
```json
{
  "attempt": {
    "_id": "string",
    "userId": "string",
    "score": 8,
    "totalQuestions": 10,
    "xpEarned": 80,
    "completedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Quiz History
```http
GET /quiz-history/:userId?limit=10
```

**Parameters:**
- `userId` - Firebase user ID (path parameter)
- `limit` - Number of results (query parameter, default: 10)

**Response (200 OK):**
```json
{
  "history": [
    {
      "_id": "string",
      "userId": "string",
      "score": 8,
      "totalQuestions": 10,
      "xpEarned": 80,
      "difficulty": "medium",
      "completedAt": "2024-01-01T00:00:00.000Z",
      "questions": [...]
    }
  ]
}
```

#### Get Quiz Statistics
```http
GET /quiz-stats/:userId
```

**Parameters:**
- `userId` - Firebase user ID

**Response (200 OK):**
```json
{
  "stats": {
    "totalQuizzes": 15,
    "totalScore": 120,
    "totalQuestions": 150,
    "avgScore": 8.0,
    "totalXP": 1200
  }
}
```

---

### Notes Management

#### Save Note
```http
POST /notes
```

**Request Body:**
```json
{
  "userId": "string",
  "title": "Chapter 1: Introduction",
  "content": "Full note content here...",
  "subject": "Mathematics",
  "tags": ["algebra", "basics"]
}
```

**Response (201 Created):**
```json
{
  "note": {
    "_id": "string",
    "userId": "string",
    "title": "string",
    "content": "string",
    "subject": "string",
    "tags": ["string"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get User's Notes
```http
GET /notes/:userId
```

**Response (200 OK):**
```json
{
  "notes": [
    {
      "_id": "string",
      "title": "string",
      "content": "string",
      "subject": "string",
      "tags": ["string"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Single Note
```http
GET /note/:noteId
```

**Response (200 OK):**
```json
{
  "note": {
    "_id": "string",
    "title": "string",
    "content": "string",
    "subject": "string",
    "tags": ["string"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Delete Note
```http
DELETE /note/:noteId
```

**Response (200 OK):**
```json
{
  "message": "Note deleted successfully"
}
```

---

### Social Features

#### Get Leaderboard
```http
GET /leaderboard?limit=10
```

**Query Parameters:**
- `limit` - Number of users to return (default: 10)

**Response (200 OK):**
```json
{
  "leaderboard": [
    {
      "_id": "string",
      "name": "John Doe",
      "xp": 2500,
      "level": 5,
      "quizzesCompleted": 25
    }
  ]
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Required backend environment variables:

```env
MONGO_URI=mongodb://localhost:27017/learning-assistant
JWT_SECRET=your_secret_key_here
PORT=5000
HF_API_KEY=your_huggingface_api_key
HF_MODEL=google/flan-t5-large
```

## Rate Limiting

Currently no rate limiting is implemented. Future versions will include rate limiting for quiz generation endpoints.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.
