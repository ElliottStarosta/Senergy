import { Request, Response, NextFunction } from 'express'

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors || error.message,
      })
    }
  }
}