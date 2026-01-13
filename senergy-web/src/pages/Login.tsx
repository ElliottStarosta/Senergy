import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/services/firebase'
import axios from 'axios'
import gsap from 'gsap'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated, user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const orbsContainerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Watch for authentication state change
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[Login] User authenticated:', user.displayName, '- redirecting to quiz...')
      navigate('/quiz')
    }
  }, [isAuthenticated, user, navigate])

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      setValidationError('')

      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')

      // Sign in with Google using Firebase popup
      console.log('[Login] Starting Google sign in...')
      const result = await signInWithPopup(auth, provider)

      // Get Firebase ID token
      console.log('[Login] Getting Firebase ID token...')
      const firebaseIdToken = await result.user.getIdToken()

      console.log('[Login] Got Firebase ID token, sending to backend...')

      // Send token to backend
      const response = await axios.post('/api/auth/google', { token: firebaseIdToken })

      console.log('[Login] Backend response received, token:', response.data.token.substring(0, 50) + '...')

      // Store the JWT token
      localStorage.setItem('auth_token', response.data.token)
      console.log('[Login] Token stored in localStorage')

      // Manually verify the token with the backend
      console.log('[Login] Verifying token with backend...')
      try {
        const verifyResponse = await axios.get('/api/auth/verify', {
          headers: { Authorization: `Bearer ${response.data.token}` },
        })
        
        console.log('[Login] Token verified, user data received:', verifyResponse.data.user.displayName)
        
        // Manually update the auth context by calling the state update
        // Since we can't directly access setState, we'll dispatch a custom event
        window.dispatchEvent(new CustomEvent('token-verified', {
          detail: {
            user: verifyResponse.data.user,
            token: response.data.token
          }
        }))
        
        console.log('[Login] Custom event dispatched, waiting for redirect...')
      } catch (verifyError) {
        console.error('[Login] Token verification failed:', verifyError)
        setValidationError('Authentication verification failed')
        localStorage.removeItem('auth_token')
        setIsGoogleLoading(false)
      }
      
    } catch (error: any) {
      console.error('[Login] Google login error:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Google login failed'
      setValidationError(errorMsg)
      setIsGoogleLoading(false)
    }
  }

  const handleGithubLogin = () => {
    // Use redirect flow for GitHub
    window.location.href = '/api/auth/github/redirect'
  }

  // Floating animation for background orbs
  useEffect(() => {
    if (orbsContainerRef.current) {
      const orbs = orbsContainerRef.current.querySelectorAll('[data-orb]')
      orbs.forEach((orb, index) => {
        gsap.to(orb, {
          y: `+=${60 + index * 20}`,
          x: `+=${40 + index * 15}`,
          duration: 6 + index * 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.2
        })
        
        gsap.to(orb, {
          rotation: 360,
          duration: 20 + index * 5,
          repeat: -1,
          ease: 'none'
        })
      })
    }
  }, [])

  // Main page entrance animation
  useEffect(() => {
    if (containerRef.current && formRef.current && logoRef.current) {
      const tl = gsap.timeline()

      tl.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' },
        0
      )

      tl.fromTo(
        logoRef.current,
        { opacity: 0, y: -30, scale: 0.8 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          ease: 'back.out(1.7)'
        },
        0.2
      )

      tl.fromTo(
        formRef.current,
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
        0.4
      )

      const formElements = formRef.current.querySelectorAll('[data-form-item]')
      tl.fromTo(
        formElements,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' },
        0.6
      )
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!email || !password) {
      setValidationError('Please fill in all fields')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Invalid email format')
      return
    }

    try {
      await login(email, password)
      // Don't navigate here - let useEffect handle it
    } catch (err) {
      // Error is handled by context
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50 overflow-hidden relative"
    >
      {/* Animated Background Orbs */}
      <div
        ref={orbsContainerRef}
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      >
        <div
          data-orb
          className="absolute top-[15%] right-[8%] w-72 h-72 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute top-[45%] right-[25%] w-64 h-64 bg-gradient-to-br from-cyan-200/35 to-teal-200/35 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-gradient-to-br from-indigo-200/25 to-blue-200/25 rounded-full blur-3xl"
        />
      </div>

      <div className="relative min-h-screen flex flex-col z-10 py-6">
        {/* Logo */}
        <div ref={logoRef} className="flex justify-center items-center pt-4 pb-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img 
              src="/logo.png" 
              alt="Senergy" 
              className="w-20 h-20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
            <span className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent -ml-3">
              Senergy
            </span>
          </div>
        </div>

        {/* Center Form */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div ref={formRef} className="w-full max-w-md">
            {/* Form Header */}
            <div data-form-item className="mb-8 text-center">
              <h1 className="text-5xl font-black text-slate-800 mb-3 leading-tight">
                Welcome Back
              </h1>
              <p className="text-slate-500 text-base">
                Let's find your perfect match
              </p>
            </div>

            {/* Error Alert */}
            {(error || validationError) && (
              <div
                data-form-item
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 shadow-sm"
              >
                <i className="fas fa-exclamation-circle text-red-500 mt-0.5 flex-shrink-0 text-lg" />
                <p className="text-red-700 text-sm font-medium">
                  {error || validationError}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div data-form-item>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-base focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 hover:border-slate-300 shadow-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div data-form-item>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-base focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 hover:border-slate-300 pr-12 shadow-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-all duration-200 hover:scale-110 text-lg"
                  >
                    <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} />
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-base hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading && <i className="fas fa-spinner fa-spin text-lg" />}
                {isLoading ? 'Signing in...' : (
                  <>
                    Sign In
                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div data-form-item className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Or continue with</p>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>

            {/* OAuth Buttons */}
            <div data-form-item className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-200 flex items-center justify-center gap-2.5 text-base group shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isGoogleLoading && <i className="fas fa-spinner fa-spin" />}
                {!isGoogleLoading && <i className="fab fa-google text-lg group-hover:scale-110 transition-transform duration-200" />}
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white hover:border-slate-700 hover:text-slate-900 transition-all duration-200 flex items-center justify-center gap-2.5 text-base group shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <i className="fab fa-github text-lg group-hover:scale-110 transition-transform duration-200" />
                <span>GitHub</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div data-form-item className="text-center mt-6 text-slate-600 text-base">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-purple-600 font-bold hover:text-purple-700 transition-colors duration-200 hover:underline decoration-2 underline-offset-2"
              >
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}