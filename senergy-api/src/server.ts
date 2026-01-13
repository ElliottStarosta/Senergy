import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@/middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

// Routes
import authRoutes from '@/routes/auth'
import quizRoutes from '@/routes/quiz'
import ratingsRoutes from '@/routes/rating'
import groupsRoutes from '@/routes/groups'
import usersRoutes from '@/routes/users'
import placesRoutes from '@/routes/places'
import exploreRoutes from '@/routes/explore'
dotenv.config()

export function createServer(): Express {
  const app = express()

  // Middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))

  // CORS
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Logging
  app.use(requestLogger)

  // ============================================
  // HEALTH & STATUS ENDPOINTS
  // ============================================

  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })

  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Senergy API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        auth: '/api/auth',
        quiz: '/api/quiz',
        ratings: '/api/ratings',
        groups: '/api/groups',
        users: '/api/users',
        places: '/api/places',
      },
    })
  })

  // ============================================
  // API ROUTES
  // ============================================

  // Auth
  app.use('/api/auth', authRoutes)
  app.use('/auth', authRoutes) // Alternative path

  // Quiz
  app.use('/api/quiz', quizRoutes)
  app.use('/quiz', quizRoutes) // Alternative path

  // Ratings
  app.use('/api/ratings', ratingsRoutes)
  app.use('/ratings', ratingsRoutes) // Alternative path

  // Groups
  app.use('/api/groups', groupsRoutes)
  app.use('/groups', groupsRoutes) // Alternative path

  // Explore
  app.use('/api/explore', exploreRoutes)
  app.use('/explore', exploreRoutes) // Alternative path
  // Users (Matching)
  app.use('/api/users', usersRoutes)
  app.use('/users', usersRoutes) // Alternative path

  // Places
  app.use('/api/places', placesRoutes)
  app.use('/places', placesRoutes) // Alternative path

  // ============================================
  // 404 HANDLER
  // ============================================

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.path,
      method: req.method,
      availableEndpoints: {
        health: 'GET /health',
        auth: 'POST /api/auth/register, /api/auth/login, etc',
        quiz: 'GET /api/quiz/questions, POST /api/quiz/submit',
        ratings: 'POST /api/ratings, GET /api/ratings, etc',
        groups: 'POST /api/groups, GET /api/groups/:id, etc',
        users: 'GET /api/users/matches, GET /api/users/:id/profile',
        places: 'GET /api/places/search, GET /api/places/:placeId',
      },
    })
  })

  // ============================================
  // ERROR HANDLER (Must be last)
  // ============================================

  app.use(errorHandler)

  return app
}