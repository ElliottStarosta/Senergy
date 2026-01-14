import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'
import api from '@/api/config'

interface QuizQuestion {
  id: number
  text: string
  weight: number
  reverse?: boolean
}

// Fallback questions if API is not yet wired or returns empty
const DEFAULT_QUESTIONS: QuizQuestion[] = [
   // Extroverted statements (agree = extrovert, disagree = introvert)
   { id: 1, text: 'I feel energized and excited when attending large parties', weight: 3, reverse: false },
   { id: 2, text: 'I am comfortable being the center of attention', weight: 2, reverse: false },
   { id: 3, text: 'I recharge by being around people', weight: 3, reverse: false },
   { id: 4, text: 'I enjoy meeting new people frequently', weight: 2, reverse: false },
   { id: 5, text: 'I think out loud when making decisions', weight: 1, reverse: false },
   
   // Introverted statements (agree = introvert, disagree = extrovert)  
   { id: 6, text: 'I prefer quiet, intimate gatherings', weight: 3, reverse: true },
   { id: 7, text: 'I need alone time to recharge after social events', weight: 3, reverse: true },
   { id: 8, text: 'I prefer deep one-on-one conversations over group discussions', weight: 2, reverse: true },
   { id: 9, text: 'I feel drained after spending time in large groups', weight: 2, reverse: true },
   { id: 10, text: 'I prefer working independently rather than in teams', weight: 1, reverse: true },
]


const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}


export const Quiz: React.FC = () => {
  const navigate = useNavigate()
  const { token, updateUserProfile } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const questionRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)


  useEffect(() => {
    const retryDiscordLink = async () => {
      const retryDiscordId = sessionStorage.getItem('retryDiscordLink')

      if (retryDiscordId && token) {
        console.log('🔄 Retrying Discord link from Quiz page...')
        console.log('Discord ID:', retryDiscordId)
        console.log('Token:', token?.substring(0, 30))

        try {
          const response = await api.post('/api/auth/discord/link',
            { discordId: retryDiscordId },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
          console.log('✅ Discord link retry successful:', response.data)
          sessionStorage.removeItem('retryDiscordLink')
        } catch (error: any) {
          console.error('❌ Discord link retry failed:', error)
          console.error('Error response:', error.response?.data)
        }
      }
    }

    if (token && !loading) {
      retryDiscordLink()
    }
  }, [token, loading])

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get('/api/quiz/questions', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data: QuizQuestion[] =
        response.data.questions && Array.isArray(response.data.questions) && response.data.questions.length > 0
            ? response.data.questions
            : DEFAULT_QUESTIONS
        const shuffledQuestions = shuffleArray(data)

        setQuestions(shuffledQuestions)
        setResponses(new Array(shuffledQuestions.length).fill(0))
        setLoading(false)
      } catch (error) {
        console.error('Failed to load questions, falling back to defaults:', error)
        // Use local defaults so the quiz always renders even if the API is not ready
        const shuffledDefaults = shuffleArray(DEFAULT_QUESTIONS)
        setQuestions(shuffledDefaults)
        setResponses(new Array(shuffledDefaults.length).fill(0))
        setLoading(false)
      }
    }

    if (token) {
      fetchQuestions()
    }
  }, [token])

  useEffect(() => {
    if (showResults || loading) return

    // Animate in the question and options
    const tl = gsap.timeline()

    tl.fromTo(
      questionRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    ).fromTo(
      optionsRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      '-=0.3'
    )
  }, [currentQuestion, showResults, loading])

  const handleResponse = (value: number) => {
    const newResponses = [...responses]
    newResponses[currentQuestion] = value
    setResponses(newResponses)
  }

  const animateToQuestion = (newIndex: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentQuestion(newIndex)
        setIsTransitioning(false)
      }
    })

    tl.to(questionRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in'
    }).to(
      optionsRef.current,
      {
        opacity: 0,
        y: -15,
        duration: 0.25,
        ease: 'power2.in'
      },
      '-=0.2'
    )
  }

  const handleSubmit = async () => {
    if (responses.some((r) => r === 0)) {
      alert('Please answer all questions before submitting')
      return
    }

    setIsSubmitting(true)
    console.log('📝 Submitting quiz with token:', token?.substring(0, 20) + '...')

    try {
      // Map shuffled responses back to the original question order for the backend
      // Backend expects responses in the order of QUIZ_QUESTIONS (id 1..N)
      const orderedResponses: number[] = new Array(questions.length).fill(0)
      questions.forEach((q, idx) => {
        // Question ids are 1-based, array index is 0-based
        const targetIndex = (q.id ?? idx + 1) - 1
        orderedResponses[targetIndex] = responses[idx]
      })

      console.log('Quiz submission mapping:', {
        shuffledOrder: questions.map((q) => q.id),
        responsesShuffled: responses,
        responsesOrdered: orderedResponses,
      })

      // CRITICAL: Ensure Discord ID is linked before submitting quiz
      const retryDiscordId = sessionStorage.getItem('retryDiscordLink') || sessionStorage.getItem('pendingDiscordId')
      if (retryDiscordId && token) {
        console.log('🔗 Linking Discord ID before quiz submission:', retryDiscordId)
        try {
          await api.post('/api/auth/discord/link',
            { discordId: retryDiscordId },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
          console.log('✅ Discord ID linked successfully before quiz submission')
          sessionStorage.removeItem('retryDiscordLink')
          sessionStorage.removeItem('pendingDiscordId')
          // Wait a moment for the database to update
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (linkError: any) {
          console.error('❌ Failed to link Discord ID before quiz submission:', linkError)
          console.error('Error response:', linkError.response?.data)
          // Continue anyway - maybe it's already linked
        }
      }

      const response = await api.post(
        '/api/quiz/submit',
        { responses: orderedResponses },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log('✅ Full quiz response:', response.data)
      console.log('🔑 Has verificationCode?', !!response.data.verificationCode)
      console.log('🔑 Code value:', response.data.verificationCode)
      console.log('👤 User Discord ID from response:', response.data.user?.discordId || 'NONE')

      setResults(response.data)

      if (response.data?.personalityType || response.data?.adjustmentFactor) {
        updateUserProfile({
          personalityType: response.data.personalityType,
          adjustmentFactor: response.data.adjustmentFactor,
        })
      }

      setShowResults(true)

      setTimeout(() => {
        if (response.data.verificationCode) {
          console.log('➡️ Redirecting to /discord-verify with code:', response.data.verificationCode)
          navigate('/discord-verify', {
            state: { verificationCode: response.data.verificationCode }
          })
        } else {
          console.log('➡️ No code, redirecting to dashboard')
          navigate('/dashboard')
        }
      }, 2000)

    } catch (error) {
      console.error('❌ Quiz error:', error)
      alert('Failed to submit quiz. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Keyboard navigation for quiz responses
  useEffect(() => {
    if (showResults || loading || isTransitioning) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle number keys 1-5
      if (e.key >= '1' && e.key <= '5') {
        const value = parseInt(e.key)
        handleResponse(value)
      }
      // Arrow keys for navigation
      else if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        animateToQuestion(currentQuestion - 1)
      } else if (e.key === 'ArrowRight' && currentQuestion < questions.length - 1) {
        if (responses[currentQuestion] !== 0) {
          animateToQuestion(currentQuestion + 1)
        }
      }
      // Enter key - go to next question if answered, or submit if on last question
      else if (e.key === 'Enter') {
        if (responses[currentQuestion] === 0) {
          return
        }
        if (currentQuestion === questions.length - 1 && responses.every((r) => r !== 0) && !isSubmitting) {
          handleSubmit()
        } else if (currentQuestion < questions.length - 1) {
          animateToQuestion(currentQuestion + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestion, responses, showResults, loading, questions.length, isSubmitting, isTransitioning])

  // If we somehow finish loading but have no questions, show a friendly message
  if (!loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Quiz not configured</h1>
          <p className="text-neutral-600 mb-4 text-sm">
            We couldn&apos;t find any quiz questions to show you yet. Please try again in a moment,
            or contact the admin if this keeps happening.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition"
          >
            <i className="fas fa-rotate-right mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4" />
          <p className="text-neutral-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const question = questions[currentQuestion]

  if (showResults && results) {
    return (
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-white text-3xl" />
            </div>

            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Great!</h1>
            <p className="text-neutral-500 mb-8">Your personality profile is ready</p>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-5xl font-bold text-primary-600 mb-3">
              {results.adjustmentFactor.toFixed(2)}
            </div>
            <div className="text-2xl font-semibold text-neutral-900 mb-2">
              {results.personalityType}
            </div>
            <p className="text-neutral-600 text-sm leading-relaxed">
              {results.description}
            </p>

            {/* Adjustment Factor Scale */}
            <div className="mt-8 pt-8 border-t border-neutral-200">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Energy Scale
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-600">Introvert</span>
                <span className="text-xs text-neutral-600">Extrovert</span>
              </div>
              <div className="h-2 bg-gradient-to-r from-primary-300 via-primary-500 to-accent-400 rounded-full relative">
                <div
                  className="w-3 h-3 bg-white border-2 border-primary-600 rounded-full absolute top-1/2 transform -translate-y-1/2 shadow-md"
                  style={{
                    left: `calc(${((results.adjustmentFactor + 1) / 2) * 100}% - 6px)`,
                  }}
                />
              </div>
            </div>

            {/* Discord Verification Loading (only show if verificationCode exists) */}
            {results.verificationCode && (
              <div className="mt-8 pt-8 border-t border-neutral-200">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div
                    className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"
                    ref={(el) => {
                      if (el) {
                        gsap.to(el, {
                          rotation: 360,
                          duration: 0.8,
                          repeat: -1,
                          ease: 'linear'
                        })
                      }
                    }}
                  />
                  <p className="text-sm font-medium text-neutral-600">
                    Redirecting to verification...
                  </p>
                </div>
              </div>
            )}
            

          </div>



        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-neutral-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <h2 className="text-3xl font-bold text-neutral-900 mt-1">Know Yourself</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{Math.round(progress)}%</div>
              <p className="text-xs text-neutral-500">Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Question Text */}
          <div ref={questionRef}>
            <h3 className="text-2xl font-bold text-neutral-900 mb-8 leading-tight">
              {question.text}
            </h3>
          </div>

          {/* Scale Labels and Response Options */}
          <div ref={optionsRef}>
            {/* Response Options */}
            <div className="flex gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleResponse(value)}
                  className={`flex-1 py-4 px-2 rounded-lg font-semibold transition-all transform ${responses[currentQuestion] === value
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  <div className="text-lg mb-1">{value}</div>
                  <div className="text-xs">
                    {value === 1 && 'Strongly\nDisagree'}
                    {value === 2 && 'Disagree'}
                    {value === 3 && 'Neutral'}
                    {value === 4 && 'Agree'}
                    {value === 5 && 'Strongly\nAgree'}
                  </div>
                </button>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-500 text-center">
              {responses[currentQuestion] === 0
                ? 'Select your response to enable the Next button'
                : 'Use the Next button below to move to the next question'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => animateToQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0 || isTransitioning}
            className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i className="fas fa-chevron-left" />
            Previous
          </button>

          {currentQuestion === questions.length - 1 && responses.every((r) => r !== 0) ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-accent-400 to-accent-500 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <i className="fas fa-spinner fa-spin" />}
              {isSubmitting ? 'Submitting...' : 'Complete Quiz'}
            </button>
          ) : (
            <button
              onClick={() => animateToQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={responses[currentQuestion] === 0 || isTransitioning}
              className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next
              <i className="fas fa-chevron-right" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}