import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: {
        userId: string
        email: string
      }
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  
  console.log('🔐 Auth middleware check:')
  console.log('  - Path:', req.path)
  console.log('  - Method:', req.method)
  console.log('  - Auth header present?', !!authHeader)
  
  const token = authHeader?.split(' ')[1]

  if (!token) {
    console.log('  ❌ No token provided')
    return res.status(401).json({ error: 'No token provided' })
  }

  console.log('  - Token (first 30 chars):', token.substring(0, 30))

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'some_key') as JWTPayload
    console.log('  ✅ Token verified successfully')
    console.log('  - User ID:', decoded.userId)
    console.log('  - Email:', decoded.email)
    
    req.userId = decoded.userId
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }
    next()
  } catch (error) {
    console.error('  ❌ Token verification failed:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}
