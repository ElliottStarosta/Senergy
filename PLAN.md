# Senergy Discord MVP - Complete Guide
## 4-Week Breakdown + Git Repo Structure + Pseudo Code

---

# PART 1: PROJECT OVERVIEW

## What We're Building

**The Product:**
A B2B Discord bot + web platform that helps communities find activities everyone will enjoy using:
- Personality-based recommendations (introvert/extrovert scale)
- Machine learning predictions
- Real ratings from similar users
- Community statistics and analytics

**Business Model:**
Communities (Discord servers) integrate the bot for free/paid, users rate places, system learns and recommends better places over time.

**By Day 28 Well'll Have:**
- Working web app (React frontend)
- Recommendation API (Node.js backend)
- Machine Learning engine (Python TensorFlow)
- Discord bot (fully functional commands)
- ML model trained and improving recommendations

---

# PART 2: GIT REPOSITORY STRUCTURE

## Complete Folder Layout

```
senergy/
│
├── README.md                          # Main project overview
├── ARCHITECTURE.md                    # System design document
├── SETUP.md                          # Local development setup
├── .gitignore                        # Ignore files for all services
│
├── docs/
│   ├── API.md                        # Backend API endpoints
│   ├── DATABASE_SCHEMA.md            # Firebase structure
│   ├── ML_MODEL.md                   # ML model architecture
│   ├── DISCORD_COMMANDS.md           # Bot commands reference
│   ├── PRIVACY_POLICY.md             # Legal
│   ├── TERMS_OF_SERVICE.md           # Legal
│   └── USER_GUIDE.md                 # How to use product
│
├── senergy-web/                      # Frontend (React)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js                # If using Next.js
│   ├── .env.example                  # Template for env vars
│   ├── .env.local                    # (gitignored)
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── images/
│   │
│   ├── src/
│   │   ├── index.tsx                 # Entry point
│   │   ├── App.tsx                   # Root component
│   │   │
│   │   ├── config/
│   │   │   ├── firebase.ts           # Firebase initialization
│   │   │   ├── api.ts                # API base URL config
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # Auth hook
│   │   │   ├── useApi.ts             # API calls hook
│   │   │   ├── useRecommendations.ts # Recommendations hook
│   │   │   └── useMlStatus.ts        # ML status hook
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Auth provider
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Login page
│   │   │   ├── Register.tsx          # Registration page
│   │   │   ├── Quiz.tsx              # Personality quiz
│   │   │   ├── Dashboard.tsx         # Home/dashboard
│   │   │   ├── Rate.tsx              # Rate a place
│   │   │   ├── Recommendations.tsx   # Show recommendations
│   │   │   ├── Community.tsx         # Community profile
│   │   │   ├── Admin/                # Admin panel
│   │   │   │   ├── Dashboard.tsx     # Admin dashboard
│   │   │   │   ├── Analytics.tsx     # Charts and stats
│   │   │   │   └── Settings.tsx      # Bot settings
│   │   │   └── NotFound.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── OAuthButtons.tsx
│   │   │   │
│   │   │   ├── Quiz/
│   │   │   │   ├── QuizQuestion.tsx
│   │   │   │   ├── QuizResults.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   │
│   │   │   ├── Rating/
│   │   │   │   ├── PlaceSearch.tsx
│   │   │   │   ├── RatingForm.tsx
│   │   │   │   └── RatingConfirmation.tsx
│   │   │   │
│   │   │   ├── Recommendations/
│   │   │   │   ├── RecommendationCard.tsx
│   │   │   │   ├── RecommendationList.tsx
│   │   │   │   └── FilterBar.tsx
│   │   │   │
│   │   │   ├── Dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── PersonalityChart.tsx
│   │   │   │   └── TopPlaces.tsx
│   │   │   │
│   │   │   ├── Admin/
│   │   │   │   ├── MlMetrics.tsx
│   │   │   │   ├── CommunityStats.tsx
│   │   │   │   └── MembersList.tsx
│   │   │   │
│   │   │   └── Common/
│   │   │       ├── Header.tsx
│   │   │       ├── Navigation.tsx
│   │   │       ├── Footer.tsx
│   │   │       ├── Loading.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   ├── utils/
│   │   │   ├── api.ts               # API helper functions
│   │   │   ├── auth.ts              # Auth utilities
│   │   │   ├── validation.ts        # Form validation
│   │   │   └── formatters.ts        # Number/date formatting
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts             # All TypeScript types
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── rating.ts
│   │   │   ├── recommendation.ts
│   │   │   └── community.ts
│   │   │
│   │   └── styles/
│   │       ├── globals.css
│   │       └── tailwind.css
│   │
│   └── tests/
│       ├── auth.test.ts
│       ├── quiz.test.ts
│       └── recommendations.test.ts
│
├── senergy-api/                      # Backend (Node.js + Express)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env                          # (gitignored)
│   ├── .eslintrc.json
│   │
│   ├── src/
│   │   ├── index.ts                  # Server entry point
│   │   ├── server.ts                 # Express app setup
│   │   │
│   │   ├── config/
│   │   │   ├── firebase.ts           # Firebase init
│   │   │   ├── database.ts           # DB config
│   │   │   ├── googlePlaces.ts       # Google Places API config
│   │   │   └── environment.ts        # Env variables
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Auth verification
│   │   │   ├── errorHandler.ts       # Error handling
│   │   │   ├── logger.ts             # Request logging
│   │   │   ├── cors.ts               # CORS config
│   │   │   └── rateLimiter.ts        # Rate limiting
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts              # Route aggregator
│   │   │   ├── auth.ts               # Auth endpoints
│   │   │   ├── quiz.ts               # Quiz endpoints
│   │   │   ├── ratings.ts            # Rating endpoints
│   │   │   ├── recommendations.ts    # Recommendation endpoints
│   │   │   ├── communities.ts        # Community endpoints
│   │   │   ├── users.ts              # User endpoints
│   │   │   └── health.ts             # Health check
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── quiz.controller.ts
│   │   │   ├── rating.controller.ts
│   │   │   ├── recommendation.controller.ts
│   │   │   └── community.controller.ts
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Auth logic
│   │   │   ├── user.service.ts       # User logic
│   │   │   ├── rating.service.ts     # Rating logic
│   │   │   ├── recommendation.service.ts  # Heuristic + ML
│   │   │   ├── community.service.ts  # Community logic
│   │   │   ├── googlePlaces.service.ts
│   │   │   └── mlTraining.service.ts # Training trigger
│   │   │
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Rating.ts
│   │   │   ├── Place.ts
│   │   │   ├── Community.ts
│   │   │   ├── Quiz.ts
│   │   │   └── MlModel.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.ts                # JWT token handling
│   │   │   ├── password.ts           # Password hashing
│   │   │   ├── validation.ts         # Input validation
│   │   │   ├── firebase.ts           # Firebase utilities
│   │   │   └── errors.ts             # Custom error classes
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   │
│   │   └── ml/
│   │       └── client.ts             # ML service client
│   │
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── rating.test.ts
│   │   └── recommendation.test.ts
│   │
│   └── scripts/
│       ├── seed-db.ts                # Database seeding
│       └── setup-indexes.ts          # Firebase indexes
│
├── senergy-ml/                       # Machine Learning (Python)
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example
│   ├── .env                          # (gitignored)
│   │
│   ├── main.py                       # FastAPI entry point
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py               # Config/env vars
│   │   ├── firebase.py               # Firebase setup
│   │   └── logging.py                # Logging config
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py                 # FastAPI routes
│   │   └── models.py                 # Request/response models
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── model.py                  # TensorFlow model definition
│   │   ├── training.py               # Training pipeline
│   │   ├── prediction.py             # Prediction logic
│   │   ├── features.py               # Feature engineering
│   │   └── evaluation.py             # Model evaluation
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loader.py                 # Load data from Firebase
│   │   ├── preprocessor.py           # Data preprocessing
│   │   └── pipeline.py               # ML pipeline orchestration
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── firebase.py               # Firebase utilities
│   │   ├── cache.py                  # Model caching
│   │   └── logging.py                # Logging utilities
│   │
│   ├── models/                       # Trained models (gitignored)
│   │   ├── .gitkeep
│   │   └── latest_model.h5           # (gitignored)
│   │
│   └── tests/
│       ├── __init__.py
│       ├── test_model.py
│       └── test_training.py
│
├── senergy-bot/                      # Discord Bot (Node.js)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env                          # (gitignored)
│   │
│   ├── src/
│   │   ├── index.ts                  # Bot entry point
│   │   ├── bot.ts                    # Discord.js client setup
│   │   │
│   │   ├── config/
│   │   │   ├── discord.ts            # Discord config
│   │   │   ├── commands.ts           # Command list
│   │   │   └── environment.ts        # Env vars
│   │   │
│   │   ├── commands/
│   │   │   ├── index.ts              # Command registry
│   │   │   ├── register.ts           # /register command
│   │   │   ├── personality.ts        # /personality command
│   │   │   ├── rate.ts               # /rate command
│   │   │   ├── recommend.ts          # /recommend command
│   │   │   ├── stats.ts              # /stats command
│   │   │   └── help.ts               # /help command
│   │   │
│   │   ├── handlers/
│   │   │   ├── command.ts            # Command handler
│   │   │   ├── error.ts              # Error handler
│   │   │   └── events.ts             # Event handlers
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts                # Backend API client
│   │   │   ├── discord.ts            # Discord utilities
│   │   │   ├── user.ts               # User service
│   │   │   └── cache.ts              # User caching
│   │   │
│   │   ├── utils/
│   │   │   ├── embeds.ts             # Discord embed builders
│   │   │   ├── validation.ts         # Input validation
│   │   │   └── formatters.ts         # Discord formatting
│   │   │
│   │   └── types/
│   │       └── index.ts              # TypeScript types
│   │
│   └── tests/
│       └── commands.test.ts
│
├── docker-compose.yml                # Local dev containers
├── Dockerfile                        # (in each service)
│
└── .github/
    └── workflows/
        ├── frontend.yml              # Frontend CI/CD
        ├── backend.yml               # Backend CI/CD
        ├── ml.yml                    # ML CI/CD
        └── bot.yml                   # Bot CI/CD
```

---

# PART 3: PSEUDO CODE EXAMPLES

## Frontend - Auth Context Setup

**File: `senergy-web/src/context/AuthContext.tsx`**

```typescript
// PSEUDO CODE - React Auth Context with TypeScript

import React, { createContext, useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  discordId?: string;
  personalityType?: string;
  adjustmentFactor?: number;
  communities: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithDiscord: (code: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pseudo: Check if token exists in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      validateToken(token)
        .then(userData => setUser(userData))
        .catch(() => logout());
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // PSEUDO: POST to /api/auth/login
      const response = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      // PSEUDO: data contains { token, user }
      
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    loginWithDiscord,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
```

---

## Backend - Auth Service

**File: `senergy-api/src/services/auth.service.ts`**

```typescript
// PSEUDO CODE - Authentication Service

import * as admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

class AuthService {
  private db = admin.database();
  private auth = admin.auth();

  // Register new user with email/password
  async registerUser(email: string, password: string) {
    try {
      // PSEUDO: Validate email not already registered
      const existingUser = await this.db
        .ref('users')
        .orderByChild('email')
        .equalTo(email)
        .once('value');

      if (existingUser.exists()) {
        throw new Error('Email already registered');
      }

      // PSEUDO: Create user in Firebase Auth
      const userRecord = await this.auth.createUser({
        email,
        password,
        emailVerified: false
      });

      // PSEUDO: Store user data in Realtime Database
      const userData = {
        id: userRecord.uid,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        createdAt: admin.database.ServerValue.TIMESTAMP,
        personalityType: null,
        adjustmentFactor: null,
        communities: []
      };

      await this.db.ref(`users/${userRecord.uid}`).set(userData);

      // PSEUDO: Generate JWT token
      const token = jwt.sign(
        { userId: userRecord.uid, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { token, user: { id: userRecord.uid, email } };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user with email/password
  async loginUser(email: string, password: string) {
    try {
      // PSEUDO: Find user by email
      const snapshot = await this.db
        .ref('users')
        .orderByChild('email')
        .equalTo(email)
        .once('value');

      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const userId = Object.keys(snapshot.val())[0];
      const user = snapshot.val()[userId];

      // PSEUDO: Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // PSEUDO: Generate token
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { token, user: { id: userId, email, personalityType: user.personalityType } };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Verify JWT token
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      
      // PSEUDO: Fetch user data
      const snapshot = await this.db.ref(`users/${decoded.userId}`).once('value');
      if (!snapshot.exists()) throw new Error('User not found');

      return snapshot.val();
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Refresh expired token
  async refreshToken(expiredToken: string) {
    try {
      // PSEUDO: Decode token even if expired (using ignoreExpiration)
      const decoded = jwt.decode(expiredToken) as { userId: string };
      
      // PSEUDO: Verify user still exists
      const snapshot = await this.db.ref(`users/${decoded.userId}`).once('value');
      if (!snapshot.exists()) throw new Error('User not found');

      // PSEUDO: Issue new token
      const newToken = jwt.sign(
        { userId: decoded.userId, email: snapshot.val().email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { token: newToken };
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }
}

export default new AuthService();
```

---

## Backend - Personality Quiz Calculator

**File: `senergy-api/src/services/quiz.service.ts`**

```typescript
// PSEUDO CODE - Personality Quiz Calculation

class QuizService {
  private readonly QUESTIONS = [
    { id: 1, weight: 2, reverse: false, text: "I prefer large group gatherings" },
    { id: 2, weight: 2, reverse: true, text: "I enjoy quiet, peaceful environments" },
    // ... 8 more questions
  ];

  // Process quiz responses and calculate personality
  async calculatePersonality(responses: number[]): {
    adjustmentFactor: number,
    personalityType: string,
    description: string
  } {
    // PSEUDO: responses is array of 10 numbers (1-5)

    let weightedSum = 0;
    let totalWeight = 0;

    // PSEUDO: Apply weights and reverse-scoring
    for (let i = 0; i < responses.length; i++) {
      let response = responses[i];
      const question = this.QUESTIONS[i];

      // PSEUDO: Reverse-score if needed (scale of 1-5: becomes 6-response)
      if (question.reverse) {
        response = 6 - response;
      }

      // PSEUDO: Apply weight
      weightedSum += response * question.weight;
      totalWeight += question.weight;
    }

    // PSEUDO: Calculate average (1-5 scale)
    const average = weightedSum / totalWeight;

    // PSEUDO: Normalize to -1 to +1 scale
    // If average is 3 (neutral), AF should be 0
    // If average is 5 (max extrovert), AF should be +1
    // If average is 1 (max introvert), AF should be -1
    const adjustmentFactor = (average - 3) / 2;

    // PSEUDO: Determine personality type from adjustment factor
    let personalityType: string;
    if (adjustmentFactor <= -0.6) {
      personalityType = 'Strong Introvert';
    } else if (adjustmentFactor <= -0.2) {
      personalityType = 'Moderate Introvert';
    } else if (adjustmentFactor <= 0.2) {
      personalityType = 'Ambivert';
    } else if (adjustmentFactor <= 0.6) {
      personalityType = 'Moderate Extrovert';
    } else {
      personalityType = 'Strong Extrovert';
    }

    return {
      adjustmentFactor: parseFloat(adjustmentFactor.toFixed(2)),
      personalityType,
      description: `You are a ${personalityType}. This affects place recommendations.`
    };
  }

  // Store quiz result
  async saveQuizResult(userId: string, responses: number[], result: any) {
    // PSEUDO: Save to Firebase
    const quizRecord = {
      userId,
      responses,
      adjustmentFactor: result.adjustmentFactor,
      personalityType: result.personalityType,
      timestamp: admin.database.ServerValue.TIMESTAMP
    };

    await this.db.ref(`quizzes/${userId}`).set(quizRecord);

    // PSEUDO: Update user profile
    await this.db.ref(`users/${userId}`).update({
      adjustmentFactor: result.adjustmentFactor,
      personalityType: result.personalityType
    });
  }
}
```

---

## Backend - Heuristic Recommendation Algorithm

**File: `senergy-api/src/services/recommendation.service.ts`**

```typescript
// PSEUDO CODE - Recommendation Engine (Heuristic + ML Fallback)

class RecommendationService {
  
  // Get recommendations for user in location
  async getRecommendations(
    userId: string,
    location: { lat: number, lng: number },
    limit: number = 5
  ) {
    // PSEUDO: Fetch user's personality
    const user = await this.getUserData(userId);
    if (!user.adjustmentFactor) {
      throw new Error('User must complete personality quiz first');
    }

    // PSEUDO: Find nearby places (within 10km)
    const places = await this.findNearbyPlaces(location);

    // PSEUDO: For each place, calculate predicted score
    const recommendedPlaces = await Promise.all(
      places.map(place => this.scorePlace(place, user))
    );

    // PSEUDO: Sort by score * confidence, take top 5
    const sorted = recommendedPlaces.sort(
      (a, b) => (b.predictedScore * b.confidence) - (a.predictedScore * a.confidence)
    );

    return sorted.slice(0, limit);
  }

  // Score a single place for a user using heuristic
  async scorePlace(place: any, user: any) {
    // PSEUDO: Find all ratings for this place
    const ratings = await this.getRatingsForPlace(place.id);

    if (ratings.length === 0) {
      // PSEUDO: No data, can't recommend
      return {
        placeId: place.id,
        predictedScore: 5, // neutral
        confidence: 0.1,
        method: 'no_data'
      };
    }

    // PSEUDO: Find similar users (personality distance < 0.3)
    const similarUserRatings = ratings.filter(rating => {
      const distance = Math.abs(rating.userAdjustmentFactor - user.adjustmentFactor);
      return distance <= 0.3;
    });

    if (similarUserRatings.length === 0) {
      // PSEUDO: No similar users, use average
      const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
      return {
        placeId: place.id,
        predictedScore: average,
        confidence: Math.min(ratings.length / 20, 1.0), // confidence based on ratings count
        method: 'global_average'
      };
    }

    // PSEUDO: Calculate average rating from similar users
    const similarAverage = similarUserRatings.reduce((sum, r) => sum + r.score, 0) / 
                          similarUserRatings.length;

    // PSEUDO: Adjust based on personality similarity
    // If similar users are more extroverted and like it, boost slightly
    const avgSimilarAF = similarUserRatings.reduce((sum, r) => sum + r.userAdjustmentFactor, 0) / 
                        similarUserRatings.length;
    const afDifference = user.adjustmentFactor - avgSimilarAF;
    const adjustment = afDifference * 0.3; // Small adjustment

    const predictedScore = Math.max(1, Math.min(10, similarAverage + adjustment));

    // PSEUDO: Confidence higher if more similar users rated it
    const similarityScores = similarUserRatings.map(r => 
      1 - (Math.abs(r.userAdjustmentFactor - user.adjustmentFactor) / 2)
    );
    const avgSimilarity = similarityScores.reduce((a, b) => a + b) / similarityScores.length;
    const confidence = (similarUserRatings.length / 10) * avgSimilarity;

    return {
      placeId: place.id,
      placeName: place.name,
      predictedScore: parseFloat(predictedScore.toFixed(1)),
      confidence: parseFloat(confidence.toFixed(2)),
      method: 'heuristic',
      explanation: `Based on ${similarUserRatings.length} similar users`,
      actualRatings: {
        average: parseFloat(similarAverage.toFixed(1)),
        count: ratings.length,
        byPersonality: this.breakdownByPersonality(ratings)
      }
    };
  }

  // Breakdown ratings by personality type
  breakdownByPersonality(ratings: any[]) {
    const breakdown: { [key: string]: { average: number, count: number } } = {
      'introvert': { average: 0, count: 0 },
      'ambivert': { average: 0, count: 0 },
      'extrovert': { average: 0, count: 0 }
    };

    // PSEUDO: Categorize ratings by personality
    ratings.forEach(rating => {
      let type = 'ambivert';
      if (rating.userAdjustmentFactor < -0.2) type = 'introvert';
      if (rating.userAdjustmentFactor > 0.2) type = 'extrovert';

      breakdown[type].average += rating.score;
      breakdown[type].count += 1;
    });

    // PSEUDO: Calculate averages
    for (const key in breakdown) {
      if (breakdown[key].count > 0) {
        breakdown[key].average = parseFloat(
          (breakdown[key].average / breakdown[key].count).toFixed(1)
        );
      }
    }

    return breakdown;
  }

  // Try ML prediction, fallback to heuristic
  async getRecommendationsWithML(userId: string, location: any) {
    try {
      // PSEUDO: Call ML service to get predictions
      const mlResults = await this.callMlService(userId, location);
      
      return {
        predictions: mlResults,
        method: 'machine_learning',
        modelAccuracy: mlResults.modelStats.mae
      };
    } catch (error) {
      console.warn('ML service failed, falling back to heuristic', error);
      // PSEUDO: Fall back to heuristic
      return {
        predictions: await this.getRecommendations(userId, location),
        method: 'heuristic',
        fallback: true
      };
    }
  }
}
```

---

## Backend - Rating Submission & ML Trigger

**File: `senergy-api/src/controllers/rating.controller.ts`**

```typescript
// PSEUDO CODE - Rating API Endpoint

import { Request, Response } from 'express';
import ratingService from '../services/rating.service';
import mlService from '../services/mlTraining.service';

export async function createRating(req: Request, res: Response) {
  try {
    const userId = req.user.id; // PSEUDO: From auth middleware
    const { placeName, location, score, comment } = req.body;

    // PSEUDO: Validate input
    if (!score || score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be 1-10' });
    }

    // PSEUDO: Get user data (for personality info)
    const user = await getUserData(userId);

    // PSEUDO: Save rating to database
    const rating = {
      userId,
      placeName,
      location,
      score,
      comment,
      userAdjustmentFactor: user.adjustmentFactor,
      userPersonalityType: user.personalityType,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      communityId: req.body.communityId || null
    };

    const ratingId = await ratingService.saveRating(rating);

    // PSEUDO: Update place aggregate stats
    await ratingService.updatePlaceStats(placeName, location, score);

    // PSEUDO: Prepare data for ML training
    const trainingDataPoint = {
      userId,
      placeName,
      userAdjustmentFactor: user.adjustmentFactor,
      score,
      placeCategory: await ratingService.getPlaceCategory(placeName),
      timestamp: new Date()
    };

    await ratingService.addToTrainingData(trainingDataPoint);

    // PSEUDO: Check if we should trigger ML training
    const trainingCount = await ratingService.getTrainingDataCount();
    const lastTrainingTime = await ratingService.getLastTrainingTime();
    const timeSinceLastTraining = Date.now() - lastTrainingTime;

    // PSEUDO: Trigger if: >=100 ratings AND >24 hours since last training
    if (trainingCount >= 100 && timeSinceLastTraining > 24 * 60 * 60 * 1000) {
      console.log('Triggering ML training...');
      
      // PSEUDO: Queue training (async, don't block response)
      mlService.triggerTraining().catch(error => {
        console.error('ML training failed:', error);
      });
    }

    // PSEUDO: Return confirmation with community stats
    const placeStats = await ratingService.getPlaceStats(placeName);
    const communityStats = req.body.communityId ? 
      await getCommunityStats(req.body.communityId) : null;

    return res.json({
      success: true,
      rating: { id: ratingId, ...rating },
      placeStats,
      communityStats,
      mlTrainingTriggered: trainingCount >= 100 && timeSinceLastTraining > 24 * 60 * 60 * 1000
    });

  } catch (error) {
    console.error('Rating creation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## Python ML - Model Definition

**File: `senergy-ml/ml/model.py`**

```python
# PSEUDO CODE - TensorFlow Neural Network Model

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def build_recommendation_model(input_user_dim=7, input_place_dim=5):
    """
    Builds a neural network for place recommendation prediction.
    
    INPUT:
    - User features (7 dims): adjustment_factor, cuisine_sim, location_pref, 
                              avg_rating, reserved, reserved, reserved
    - Place features (5 dims): social_intensity, noise_level, crowd_size,
                               category_encoded, popularity
    
    OUTPUT:
    - Predicted rating (1-10)
    """
    
    # PSEUDO: User branch
    user_input = layers.Input(shape=(input_user_dim,), name='user_input')
    user_x = layers.Dense(32, activation='relu')(user_input)
    user_x = layers.Dropout(0.2)(user_x)
    user_x = layers.Dense(16, activation='relu')(user_x)
    user_output = layers.Dropout(0.1)(user_x)
    
    # PSEUDO: Place branch
    place_input = layers.Input(shape=(input_place_dim,), name='place_input')
    place_x = layers.Dense(32, activation='relu')(place_input)
    place_x = layers.Dropout(0.2)(place_x)
    place_x = layers.Dense(16, activation='relu')(place_x)
    place_output = layers.Dropout(0.1)(place_x)
    
    # PSEUDO: Merge branches
    merged = layers.Concatenate()([user_output, place_output])
    merged = layers.Dense(32, activation='relu')(merged)
    merged = layers.Dropout(0.2)(merged)
    merged = layers.Dense(16, activation='relu')(merged)
    merged = layers.Dropout(0.1)(merged)
    
    # PSEUDO: Output layer (0-1, will scale to 1-10)
    output = layers.Dense(1, activation='sigmoid')(merged)
    
    model = keras.Model(inputs=[user_input, place_input], outputs=output)
    
    # PSEUDO: Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',  # Mean squared error
        metrics=['mae']  # Mean absolute error
    )
    
    return model

# PSEUDO: Usage
if __name__ == '__main__':
    model = build_recommendation_model()
    model.summary()
```

---

## Python ML - Training Pipeline

**File: `senergy-ml/ml/training.py`**

```python
# PSEUDO CODE - ML Training Pipeline

import tensorflow as tf
import numpy as np
from data.loader import load_ratings_from_firebase
from ml.features import prepare_features
from ml.model import build_recommendation_model

class TrainingPipeline:
    
    def __init__(self, model_dir='./models'):
        self.model_dir = model_dir
        self.model = None
        self.history = None
    
    def run_training(self):
        """Main training loop"""
        
        print("Step 1: Load data from Firebase...")
        # PSEUDO: Fetch all ratings
        ratings = load_ratings_from_firebase()
        print(f"Loaded {len(ratings)} ratings")
        
        if len(ratings) < 100:
            print(f"Need at least 100 ratings, only have {len(ratings)}")
            return False
        
        print("\nStep 2: Prepare features...")
        # PSEUDO: Convert ratings to user/place feature vectors
        user_features, place_features, labels = prepare_features(ratings)
        print(f"Features shape: users={user_features.shape}, places={place_features.shape}")
        
        print("\nStep 3: Split into train/validation...")
        # PSEUDO: 80/20 split
        split_idx = int(0.8 * len(user_features))
        
        train_users = user_features[:split_idx]
        train_places = place_features[:split_idx]
        train_labels = labels[:split_idx]
        
        val_users = user_features[split_idx:]
        val_places = place_features[split_idx:]
        val_labels = labels[split_idx:]
        
        print(f"Training: {len(train_users)}, Validation: {len(val_users)}")
        
        print("\nStep 4: Build and train model...")
        # PSEUDO: Create model
        self.model = build_recommendation_model()
        
        # PSEUDO: Train with early stopping
        early_stop = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True
        )
        
        self.history = self.model.fit(
            x=[train_users, train_places],
            y=train_labels,
            validation_data=(
                [val_users, val_places],
                val_labels
            ),
            epochs=20,
            batch_size=32,
            callbacks=[early_stop],
            verbose=1
        )
        
        print("\nStep 5: Evaluate...")
        # PSEUDO: Get validation metrics
        val_loss, val_mae = self.model.evaluate(
            [val_users, val_places],
            val_labels
        )
        print(f"Validation MAE: {val_mae:.3f}")
        
        print("\nStep 6: Save model...")
        # PSEUDO: Save to disk
        model_path = f'{self.model_dir}/model_{int(time.time())}.h5'
        self.model.save(model_path)
        
        # PSEUDO: Save metadata
        metadata = {
            'timestamp': int(time.time()),
            'training_samples': len(train_users),
            'validation_samples': len(val_users),
            'val_loss': float(val_loss),
            'val_mae': float(val_mae),
            'epochs_trained': len(self.history.history['loss'])
        }
        
        save_metadata(metadata, model_path)
        
        print(f"Model saved to {model_path}")
        return True

# PSEUDO: Main entry point
if __name__ == '__main__':
    pipeline = TrainingPipeline()
    success = pipeline.run_training()
    if success:
        print("\n✅ Training completed successfully!")
    else:
        print("\n❌ Training failed")
```

---

## Python ML - Prediction API

**File: `senergy-ml/api/routes.py`**

```python
# PSEUDO CODE - FastAPI Routes for ML

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from ml.features import prepare_single_prediction
from ml.model import load_model
from utils.cache import get_cached_model

app = FastAPI()

class PredictionRequest(BaseModel):
    userId: str
    placeId: str
    userFeatures: list  # 7 floats
    placeFeatures: list  # 5 floats

class PredictionResponse(BaseModel):
    userId: str
    placeId: str
    predictedScore: float  # 1-10
    confidence: float
    method: str  # 'ml' or 'fallback'

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Get ML prediction for user-place pair
    """
    
    try:
        # PSEUDO: Load model (with caching)
        model = get_cached_model()
        
        if model is None:
            raise HTTPException(status_code=503, detail="Model not ready")
        
        # PSEUDO: Prepare features
        user_features = np.array([request.userFeatures]).astype(np.float32)
        place_features = np.array([request.placeFeatures]).astype(np.float32)
        
        # PSEUDO: Get prediction
        prediction = model.predict([user_features, place_features])
        
        # PSEUDO: Scale from [0-1] to [1-10]
        score = float(prediction[0][0]) * 9 + 1
        
        return PredictionResponse(
            userId=request.userId,
            placeId=request.placeId,
            predictedScore=round(score, 1),
            confidence=0.85,  # PSEUDO: could calculate real confidence
            method='ml'
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def status():
    """Get ML service status"""
    model = get_cached_model()
    
    return {
        'is_ready': model is not None,
        'last_training': get_last_training_time(),
        'training_samples': get_training_count(),
        'model_accuracy': get_model_mae()
    }

@app.post("/api/train")
async def trigger_training():
    """Trigger model retraining"""
    
    from ml.training import TrainingPipeline
    
    # PSEUDO: Run training async
    pipeline = TrainingPipeline()
    success = pipeline.run_training()
    
    return {
        'success': success,
        'message': 'Training started' if success else 'Training failed'
    }
```

---

## Discord Bot - Command Implementation

**File: `senergy-bot/src/commands/recommend.ts`**

```typescript
// PSEUDO CODE - Discord /recommend Command

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import apiClient from '../services/api';
import { formatEmbeds } from '../utils/embeds';

export const command = new SlashCommandBuilder()
  .setName('recommend')
  .setDescription('Get place recommendations for your group')
  .addStringOption(option =>
    option
      .setName('location')
      .setDescription('City or area (e.g. "downtown", "midtown")')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  
  try {
    // PSEUDO: Get user's Discord ID from interaction
    const discordId = interaction.user.id;
    const location = interaction.options.getString('location');
    const communityId = interaction.guildId; // PSEUDO: Get Discord server ID

    // PSEUDO: Check if user is registered
    const userRecord = await apiClient.get(`/users?discordId=${discordId}`);
    
    if (!userRecord || !userRecord.userId) {
      return interaction.editReply({
        content: '❌ You must register first! Use `/register`'
      });
    }

    // PSEUDO: Check if user took personality quiz
    if (!userRecord.adjustmentFactor) {
      return interaction.editReply({
        content: '❌ You must take the personality quiz first! Use `/personality`'
      });
    }

    // PSEUDO: Get recommendations from API
    const response = await apiClient.post('/recommendations', {
      userId: userRecord.userId,
      location,
      communityId
    });

    const recommendations = response.predictions;

    // PSEUDO: Build Discord embeds for recommendations
    const embeds = [];
    
    embeds.push(new EmbedBuilder()
      .setTitle(`🎯 Recommendations for ${location}`)
      .setDescription(`Based on your ${userRecord.personalityType} personality`)
      .setColor('#0099ff'));

    // PSEUDO: Add each recommendation as embed field
    recommendations.forEach((rec, index) => {
      const confidence = (rec.confidence * 100).toFixed(0);
      const fieldName = `${index + 1}. ${rec.placeName} — ${rec.predictedScore}/10`;
      const fieldValue = `
**Confidence:** ${confidence}%
**${rec.method === 'ml' ? '🤖 ML' : '📊 Heuristic'}**
${rec.explanation}
**Similar users rated:** ${rec.actualRatings.average}/10 (${rec.actualRatings.count} ratings)
      `;
      
      embeds.push(new EmbedBuilder()
        .setTitle(fieldName)
        .setDescription(fieldValue.trim())
        .setColor(rec.confidence > 0.7 ? '#00ff00' : '#ffaa00'));
    });

    // PSEUDO: Add footer
    embeds[embeds.length - 1].setFooter({
      text: `Method: ${response.method} | Accuracy: ${response.modelAccuracy?.toFixed(2) || 'N/A'}`
    });

    return interaction.editReply({
      embeds
    });

  } catch (error) {
    console.error('Recommend error:', error);
    
    return interaction.editReply({
      content: '❌ Error getting recommendations: ' + error.message
    });
  }
}
```

---

## Frontend - Recommendations Component

**File: `senergy-web/src/components/Recommendations/RecommendationList.tsx`**

```typescript
// PSEUDO CODE - React Recommendations Component

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import RecommendationCard from './RecommendationCard';
import Loading from '../Common/Loading';

interface Recommendation {
  placeId: string;
  placeName: string;
  predictedScore: number;
  confidence: number;
  method: 'ml' | 'heuristic';
  explanation: string;
  actualRatings: {
    average: number;
    count: number;
    byPersonality: any;
  };
}

export default function RecommendationList() {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [mlMethod, setMlMethod] = useState('unknown');

  // PSEUDO: Fetch recommendations when location changes
  useEffect(() => {
    if (!location) return;
    
    fetchRecommendations();
  }, [location]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // PSEUDO: Call API endpoint
      const response = await apiCall('/recommendations', 'POST', {
        userId: user.id,
        location
      });

      setRecommendations(response.predictions);
      setMlMethod(response.method);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // PSEUDO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Finding perfect places for you..." />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Recommendations for {location}
      </h1>
      
      {/* PSEUDO: Show ML status badge */}
      <div className="mb-6 p-3 bg-blue-100 rounded-lg">
        <span className="text-sm">
          {mlMethod === 'ml' ? '🤖' : '📊'} Using {mlMethod} recommendations
        </span>
      </div>

      {/* PSEUDO: Show recommendation cards */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <RecommendationCard key={rec.placeId} rec={rec} rank={index + 1} />
        ))}
      </div>

      {recommendations.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No recommendations found for this location.
        </p>
      )}
    </div>
  );
}
```

---


## Database Schema (Firebase Realtime)

**File: `docs/DATABASE_SCHEMA.md`**

```
firebase_project/
│
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── passwordHash: string
│       ├── discordId: string (optional)
│       ├── personalityType: string ("Introvert", "Ambivert", "Extrovert")
│       ├── adjustmentFactor: number (-1 to 1)
│       ├── communities: string[] (array of community IDs)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── quizzes/
│   └── {userId}/
│       ├── responses: number[] (array of 10 scores 1-5)
│       ├── adjustmentFactor: number
│       ├── personalityType: string
│       └── timestamp: timestamp
│
├── ratings/
│   └── {ratingId}/
│       ├── userId: string
│       ├── placeName: string
│       ├── location: { lat: number, lng: number }
│       ├── score: number (1-10)
│       ├── comment: string (optional)
│       ├── userAdjustmentFactor: number (denormalized for ML)
│       ├── userPersonalityType: string (denormalized)
│       ├── communityId: string (optional)
│       └── timestamp: timestamp
│
├── places/
│   └── {placeId}/
│       ├── name: string
│       ├── location: { lat: number, lng: number }
│       ├── address: string
│       ├── category: string ("restaurant", "bar", "cafe", etc)
│       ├── aggregateStats:
│       │   ├── averageScore: number
│       │   ├── totalRatings: number
│       │   ├── ratingsByPersonality: { ... }
│       │   └── lastRatingDate: timestamp
│       └── googlePlacesId: string (optional)
│
├── communities/
│   └── {communityId}/
│       ├── name: string
│       ├── description: string
│       ├── location: string (city)
│       ├── discordServerId: string (unique)
│       ├── adminUserId: string
│       ├── memberCount: number
│       ├── stats:
│       │   ├── totalRatings: number
│       │   ├── personalityDistribution: { ... }
│       │   └── topPlaces: [...]
│       ├── createdAt: timestamp
│       └── members: { userId: timestamp, ... }
│
├── trainingData/
│   └── {dataId}/
│       ├── userId: string
│       ├── placeName: string
│       ├── userAdjustmentFactor: number
│       ├── score: number (1-10)
│       ├── placeCategory: string
│       └── timestamp: timestamp
│
└── mlModels/
    └── latest/
        ├── version: number
        ├── trainedAt: timestamp
        ├── trainingDataCount: number
        ├── validationLoss: number
        ├── validationMAE: number
        ├── modelPath: string
        └── status: string ("ready", "training", "failed")
```

---

## Complete Week-by-Week Task Breakdown

### WEEK 1: Foundation (Days 1-7)

**Days 1-2: Infrastructure**
- [ ] Create GitHub repo with folder structure
- [ ] Set up 3 Node projects (web, api, bot) with TypeScript
- [ ] Set up Python ML project
- [ ] Create Firebase project
- [ ] Set up GitHub Actions workflows
- [ ] Deploy skeleton apps to netlify
- **Deliverable:** 3 services can start and connect to Firebase

**Days 3-5: Auth System**
- [ ] Frontend: Login/Register pages, Auth context
- [ ] Backend: Register/login/google/discord endpoints
- [ ] Frontend: Connect to real backend auth
- [ ] Add JWT token handling
- [ ] Add protected routes wrapper
- **Deliverable:** Users can sign up and log in via email/Google/Discord

**Days 6-7: Quiz System**
- [ ] Backend: Store quiz questions, calculate personality
- [ ] Frontend: Build 10-question quiz UI
- [ ] Frontend: Connect quiz to backend
- [ ] Display personality results
- [ ] Store adjustment factor in user profile
- **Deliverable:** Users complete quiz and see personality type

---

### WEEK 2: Core Features (Days 8-14)

**Days 8-10: Rating System**
- [ ] Backend: Integrate Google Places API
- [ ] Frontend: Build place search component
- [ ] Frontend: Build rating form (1-10 slider)
- [ ] Backend: Save ratings to database
- [ ] Backend: Calculate place aggregates
- [ ] Backend: Prepare data for ML training
- [ ] Set up cron job to trigger ML training
- **Deliverable:** Users can search and rate places. System collects ML training data

**Days 11-13: Heuristic Recommendations**
- [ ] Backend: Implement collaborative filtering algorithm
- [ ] Backend: Find similar users
- [ ] Backend: Calculate confidence scores
- [ ] Backend: Build /recommendations endpoint
- [ ] Frontend: Build recommendations display
- [ ] Frontend: Show explanation for each recommendation
- [ ] Add filters (cuisine, vibe, distance)
- **Deliverable:** Users get personalized recommendations based on similar users

**Day 14: Communities**
- [ ] Backend: Create community database schema
- [ ] Backend: Implement community endpoints (create, join, stats)
- [ ] Frontend: Build community creation page
- [ ] Frontend: Show community profile and stats
- [ ] Update ratings to include community ID
- **Deliverable:** Communities can be created and users can join

---

### WEEK 3: Discord Bot & ML (Days 15-21)

**Days 15-17: Discord Bot**
- [ ] Set up Discord bot project
- [ ] Register slash commands with Discord
- [ ] Implement /register command
- [ ] Implement /personality command
- [ ] Implement /rate command
- [ ] Implement /recommend command
- [ ] Implement /stats command
- [ ] Implement /help command
- [ ] Add error handling and rate limiting
- **Deliverable:** Discord bot fully functional with all commands

**Days 18-20: ML & Dashboard**
- [ ] Python: Build TensorFlow model
- [ ] Python: Implement training pipeline
- [ ] Python: Implement prediction endpoint
- [ ] Backend: Add ML prediction calls
- [ ] Backend: Fallback to heuristic if ML not ready
- [ ] Frontend: Build admin dashboard
- [ ] Frontend: Display ML metrics (accuracy, status)
- [ ] Frontend: Show community analytics
- [ ] Frontend: Add ML status badge to recommendations
- **Deliverable:** ML model trained and serving predictions, dashboard shows metrics

**Day 21: Testing**
- [ ] End-to-end testing (sign up → quiz → rate → recommend)
- [ ] Discord bot testing (all commands)
- [ ] Error handling testing
- [ ] Load testing (100+ concurrent users)
- [ ] Fix critical bugs
- **Deliverable:** All systems working together

---

### WEEK 4: Launch (Days 22-28)

**Days 22-23: Optimization**
- [ ] Frontend: Bundle size analysis, code splitting
- [ ] Backend: Add caching layer
- [ ] Backend: Optimize database queries
- [ ] ML: Cache model in memory
- [ ] Bot: User caching, reduce API calls
- [ ] Performance testing
- **Deliverable:** System responses in <500ms

**Days 24-25: Documentation & Outreach**
- [ ] Write API documentation
- [ ] Write database schema docs
- [ ] Write Discord setup guide
- [ ] Write user guide
- [ ] Create landing page
- [ ] Create demo video
- [ ] Identify 20-30 target communities
- [ ] Create outreach message template
- [ ] Reach out to first 10-15 communities
- **Deliverable:** Bot ready to invite, clear docs

**Days 26-27: Beta Testing**
- [ ] Monitor usage metrics
- [ ] Collect community feedback
- [ ] Fix bugs reported
- [ ] Improve error messages
- [ ] Gather testimonials
- [ ] Measure success metrics data

**Day 28: Launch**
- [ ] Final deployment
- [ ] Create GitHub README
- [ ] Prepare case studies
- [ ] Track key metrics
- **Deliverable:** Product live with active usage

---

## Quick Start Commands

```bash
# Clone and setup
git clone <repo>
cd senergy

# Setup frontend
cd senergy-web
npm install
cp .env.example .env.local
npm run dev

# Setup backend (new terminal)
cd senergy-api
npm install
cp .env.example .env
npm run dev

# Setup ML (new terminal)
cd senergy-ml
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python main.py

# Setup bot (new terminal)
cd senergy-bot
npm install
cp .env.example .env
npm run dev

# All services running:
# Frontend: http://localhost:3000
# Backend: http://localhost:3000/api
# ML: http://localhost:8000
# Check health: curl http://localhost:3000/api/health
```

---

## Summary of What You're Building

| Component | Tech | Purpose |
|-----------|------|---------|
| **Frontend** | React + TypeScript + Tailwind | User interface, auth, quiz, ratings, recommendations |
| **Backend API** | Node.js + Express + TypeScript | All business logic, auth, database, Discord bot |
| **Machine Learning** | Python + TensorFlow + FastAPI | Prediction model, training, feature engineering |
| **Discord Bot** | discord.js + TypeScript | Commands, community engagement |
| **Database** | Firebase Realtime DB | All user, rating, place, community data |
| **Hosting** | netlify + Google Cloud | Deploy frontend, backend, ML service |

