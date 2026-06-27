# Senergy API

Backend REST API server for the Senergy platform.

## 📋 Overview

The Senergy API provides endpoints for user authentication, place ratings, group management, recommendations, and user matching. It uses Firebase Firestore for data storage and Algolia for geospatial place search.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled
- Algolia account (optional but recommended)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Algolia (Optional)
ALGOLIA_APP_ID=your-app-id
ALGOLIA_API_KEY=your-api-key

# Discord (for username lookup)
DISCORD_TOKEN=your-discord-bot-token

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the PORT specified in `.env`).

## 📁 Project Structure

```
src/
├── config/          # Firebase and Algolia configuration
├── controllers/     # Request controllers
├── middleware/      # Express middleware (auth, error handling)
├── models/          # Data models and interfaces
├── routes/          # API route definitions
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── index.ts         # Entry point
└── server.ts        # Express server setup
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/github` - GitHub OAuth
- `POST /api/auth/discord` - Discord authentication
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/:userId/profile` - Get user profile
- `GET /api/users/matches` - Find similar users
- `GET /api/users/similarity/:userId1/:userId2` - Calculate similarity

### Ratings
- `GET /api/ratings` - Get user's ratings
- `POST /api/ratings` - Create rating
- `PUT /api/ratings/:ratingId` - Update rating
- `DELETE /api/ratings/:ratingId` - Delete rating
- `GET /api/ratings/place/:placeId` - Get place ratings
- `GET /api/ratings/nearby` - Get nearby places

### Groups
- `GET /api/groups/user/active` - Get user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups/:groupId/archive` - Archive group

### Explore
- `GET /api/explore/people` - Get recommended people
- `GET /api/explore/places` - Get recommended places

### Quiz
- `GET /api/quiz/questions` - Get quiz questions
- `POST /api/quiz` - Submit quiz answers

### Places
- `GET /api/places/:placeId` - Get place details
- `GET /api/places/search` - Search places

## 🔐 Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database

The API uses Firebase Firestore for data storage. Collections include:
- `users` - User profiles and authentication data
- `ratings` - Place ratings and reviews
- `places` - Place information and statistics
- `groups` - Group data and member information
- `verificationCodes` - Discord verification codes

## 🔍 Search

Place search uses Algolia for geospatial queries. If Algolia is not configured, the API falls back to Firestore queries with client-side filtering.

## 📝 Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Consistent error handling via middleware

## 🐛 Troubleshooting

**Firebase connection issues:**
- Verify Firebase credentials in `.env`
- Check Firebase project permissions
- Ensure Firestore is enabled in Firebase console

**Algolia search not working:**
- Verify Algolia credentials
- Check Algolia index configuration
- API will fallback to Firestore if Algolia unavailable

**Port already in use:**
- Change PORT in `.env`
- Or kill the process using the port
