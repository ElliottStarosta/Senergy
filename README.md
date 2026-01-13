# Senergy

A social platform that helps people discover places matching their personality and find compatible friends for group outings.

## 🎯 Overview

Senergy combines personality-based matching with location-based recommendations to help users find places they'll love and people they'll connect with. The platform uses a personality quiz to understand users' social preferences and recommends venues and friends based on compatibility.

## 🏗️ Architecture

The project consists of four main components:

- **`senergy-api`** - Backend REST API (Node.js/Express/TypeScript)
- **`senergy-web`** - Frontend web application (React/TypeScript/Vite)
- **`senergy-bot`** - Discord bot integration (Discord.js/TypeScript)
- **`senergy-ml`** - Machine learning service (Python)

## 📁 Project Structure

```
Summative/
├── senergy-api/          # Backend API server
├── senergy-web/          # Frontend React application
├── senergy-bot/          # Discord bot
├── senergy-ml/           # ML service for recommendations
├── docs/                  # Project documentation
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for ML service)
- Firebase project with Firestore
- Discord Bot Token (for bot functionality)
- Algolia account (optional, for enhanced search)

### Environment Setup

1. Clone the repository
2. Set up environment variables for each service (see individual READMEs)
3. Install dependencies for each service
4. Start services in order: API → Web → Bot

### Running the Project

See individual README files in each folder for detailed setup instructions:
- [Backend API](./senergy-api/README.md)
- [Web Application](./senergy-web/README.md)
- [Discord Bot](./senergy-bot/README.md)

## 🔑 Key Features

- **Personality-Based Matching** - Find users with compatible social preferences
- **Place Recommendations** - Discover venues tailored to your personality
- **Group Planning** - Create groups and get group recommendations
- **Discord Integration** - Manage groups and interact via Discord bot
- **Location-Based Search** - Find places and people nearby
- **Rating System** - Rate places and build your preference profile

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Discord Commands](./docs/DISCORD_COMMANDS.md)
- [User Guide](./docs/USER_GUIDE.md)

## 🛠️ Development

### Tech Stack

**Backend:**
- Express.js
- TypeScript
- Firebase Admin SDK
- Algolia Search
- JWT Authentication

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- GSAP (animations)
- React Router

**Bot:**
- Discord.js
- TypeScript

**ML:**
- Python
- TensorFlow/PyTorch (if applicable)

## 📝 License

ISC

## 👥 Contributing

This is a private project. For questions or contributions, please contact the project maintainers.

