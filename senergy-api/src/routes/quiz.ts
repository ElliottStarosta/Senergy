import { Router, Request, Response } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { quizService } from '@/services/quiz.service'

const router = Router()

// Get quiz questions
router.get('/questions', (req: Request, res: Response) => {
  try {
    const questions = quizService.getQuestions()
    res.json({ questions })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// Submit quiz
router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { responses } = req.body
    const userId = req.userId!

    console.log('📝 [Quiz Route] Quiz submission request for user:', userId)

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Invalid responses format' })
    }

    const result = await quizService.submitQuiz(userId, responses)

    console.log('📤 [Quiz Route] Quiz result:', {
      hasVerificationCode: !!result.verificationCode,
      verificationCode: result.verificationCode || 'NONE',
      userDiscordId: result.user.discordId || 'NONE'
    })

    const responseData = {
      adjustmentFactor: result.adjustmentFactor,
      personalityType: result.personalityType,
      description: result.description,
      user: result.user,
      verificationCode: result.verificationCode, // Include verification code if Discord ID is linked
    }

    console.log('📤 [Quiz Route] Sending response with verificationCode:', !!responseData.verificationCode)

    res.json(responseData)
  } catch (error: any) {
    console.error('Quiz submit error:', error)
    res.status(400).json({ error: error.message || 'Failed to submit quiz' })
  }
})

// Get quiz result for user
router.get('/result', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const result = await quizService.getQuizResult(userId)

    if (!result) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

export default router