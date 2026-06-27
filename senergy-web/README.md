# Senergy Web

Frontend web application for the Senergy platform built with React and TypeScript.

## 📋 Overview

The Senergy web application provides a modern, responsive interface for users to discover places, find compatible friends, rate venues, and manage groups. It features smooth animations, real-time updates, and an intuitive user experience.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see `senergy-api`)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Running the Application

**Development:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm run preview
```

The application will start on `http://localhost:5173` (Vite default port).

## 📁 Project Structure

```
src/
├── components/      # Reusable React components
│   ├── common/     # Shared components
│   └── dashboard/ # Dashboard-specific components
├── context/        # React Context providers (Auth)
├── hooks/          # Custom React hooks
├── pages/          # Page components (routes)
├── services/       # API and external service integrations
├── styles/         # Global styles and Tailwind config
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component with routing
└── main.tsx        # Entry point
```

## 🎨 Features

### Pages

- **Dashboard** - Main landing page with overview
- **Login/Register** - Authentication pages
- **Quiz** - Personality quiz to determine social preferences
- **Rate** - Rate places and build your preference profile
- **Explore** - Discover people and places
- **Matching** - Find compatible users
- **Groups** - Create and manage groups
- **Place Details** - View place information and ratings
- **Discord Verify** - Link Discord account
- **API Documentation** - Interactive API docs
- **Discord Bot Docs** - Bot command documentation

### Key Features

- **Personality-Based Matching** - Find users with compatible preferences
- **Place Recommendations** - Discover venues tailored to your personality
- **Group Planning** - Create groups and get group recommendations
- **Rating System** - Rate places across multiple categories
- **Location Services** - Find places and people nearby
- **Discord Integration** - Link Discord account for bot features
- **Smooth Animations** - GSAP-powered animations throughout
- **Responsive Design** - Works on desktop and mobile devices

## 🎨 Styling

The application uses **Tailwind CSS** for styling with custom configurations:
- Custom color palette matching brand identity
- Responsive breakpoints
- Custom animations and transitions
- GSAP for complex animations

## 🔐 Authentication

Authentication is handled via:
- Firebase Authentication (for OAuth providers)
- JWT tokens stored in localStorage
- Protected routes that require authentication
- Automatic token refresh

## 📡 API Integration

The app communicates with the backend API via:
- Axios for HTTP requests
- Centralized API service (`src/services/api.ts`)
- Request interceptors for authentication
- Error handling and retry logic

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Key Dependencies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **GSAP** - Animation library
- **Axios** - HTTP client
- **Firebase** - Authentication and real-time features

## 🎯 Routing

Protected routes require authentication:
- `/dashboard` - Main dashboard
- `/rate` - Rate places
- `/explore` - Explore people and places
- `/matching` - Find matches
- `/groups` - Group management
- `/quiz` - Personality quiz

Public routes:
- `/login` - Login page
- `/register` - Registration page
- `/api-docs` - API documentation
- `/discord-bot-docs` - Bot documentation

## 🐛 Troubleshooting

**API connection issues:**
- Verify `VITE_API_URL` in `.env`
- Ensure backend API is running
- Check CORS configuration on backend

**Firebase authentication errors:**
- Verify Firebase credentials in `.env`
- Check Firebase project settings
- Ensure Firebase Authentication is enabled

**Build errors:**
- Clear `node_modules` and reinstall
- Check TypeScript version compatibility
- Verify all environment variables are set

