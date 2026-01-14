import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/services/firebase'
import api from '@/api/config'
import { getHighPrecisionLocation } from '@/services/location'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading, error } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const orbsContainerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const passwordStrengthRef = useRef<HTMLDivElement>(null)
  const requirementsRef = useRef<HTMLDivElement>(null)
  const requirementsListRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)


  const calculatePasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0
    
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z\d]/.test(pwd)) strength++

    const strengthMap = {
      0: { label: 'Very Weak', color: '#ef4444' },
      1: { label: 'Weak', color: '#f97316' },
      2: { label: 'Fair', color: '#eab308' },
      3: { label: 'Good', color: '#84cc16' },
      4: { label: 'Strong', color: '#22c55e' },
      5: { label: 'Very Strong', color: '#16a34a' }
    }

    return { strength, ...strengthMap[strength as keyof typeof strengthMap] }
  }

  const getPasswordRequirements = (pwd: string) => {
    return {
      length8: pwd.length >= 8,
      length12: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^a-zA-Z\d]/.test(pwd)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const discordId = params.get('discordId')
    
    console.log('🔍 Discord ID from URL:', discordId)
    
    if (discordId) {
      sessionStorage.setItem('pendingDiscordId', discordId)
      console.log('✅ Stored Discord ID in sessionStorage:', discordId)
    } else {
      console.log('ℹ️ No Discord ID in URL')
    }
  }, [])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
  }

  
  useEffect(() => {
    if (!passwordStrengthRef.current) return

    const { strength, color } = calculatePasswordStrength(password)
    const requirements = getPasswordRequirements(password)
    const allMet = Object.values(requirements).every(req => req)
    const barWidth = (strength / 5) * 100
    const hasShown = passwordStrengthRef.current.getAttribute('data-shown') === 'true'

    // Kill any existing timeline
    if (tlRef.current) {
      tlRef.current.kill()
    }

    gsap.set(passwordStrengthRef.current, { clearProps: "all" })

    const tl = gsap.timeline()
    tlRef.current = tl

    // ENTRANCE ANIMATION - only on first password entry
    if (password && !hasShown) {
      passwordStrengthRef.current.setAttribute('data-shown', 'true')
      tl.fromTo(
        passwordStrengthRef.current,
        { opacity: 0, y: -20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.3)' },
        0
      )
    }

    // Update strength bar
    tl.to(
      passwordStrengthRef.current.querySelector('.strength-bar'),
      { width: `${barWidth}%`, backgroundColor: color, duration: 0.5, ease: 'power3.out' },
      0
    )

    // Update strength label color
    tl.to(
      passwordStrengthRef.current.querySelector('.strength-label'),
      { color: color, duration: 0.4, ease: 'power2.out' },
      0
    )

    // When all requirements met - minimize container
    if (allMet && requirementsRef.current && requirementsRef.current.style.opacity !== '0') {
      tl.to(
        requirementsRef.current,
        { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 10, marginTop: 0, duration: 0.5, ease: 'power2.in' },
        0
      )

      // Shrink the main container padding
      tl.to(
        passwordStrengthRef.current,
        { padding: '8px 16px', duration: 0.5, ease: 'power2.out' },
        0
      )
    } else if (!allMet && requirementsRef.current && requirementsRef.current.style.opacity === '0') {
      // Show requirements again - expand container
      tl.to(
        requirementsRef.current,
        { opacity: 1, height: 'auto', paddingTop: '12px', paddingBottom: '0px', marginTop: '0px', duration: 0.5, ease: 'power2.out' },
        0
      )

      tl.to(
        passwordStrengthRef.current,
        { padding: '16px', duration: 0.5, ease: 'power2.out' },
        0
      )
    }

    // Animate individual requirement items
    if (requirementsListRef.current) {
      const items = requirementsListRef.current.querySelectorAll('[data-req-key]')
      
      items.forEach((item: any) => {
        const key = item.dataset.reqKey
        const isMet = requirements[key as keyof typeof requirements]
        const wasCompleted = item.getAttribute('data-completed') === 'true'

        // When requirement is newly completed
        if (isMet && !wasCompleted) {
          item.setAttribute('data-completed', 'true')
          
          // Animate to light purple with low opacity
          tl.to(
            item.querySelector('[data-req-icon]'),
            { backgroundColor: '#c4b5fd', opacity: 0.7, duration: 0.3, ease: 'power2.out' },
            0
          )

          tl.to(
            item.querySelector('[data-req-text]'),
            { color: '#9ca3af', duration: 0.3, ease: 'power2.out' },
            0
          )

          // Add subtle strikethrough effect
          tl.to(
            item,
            { opacity: 0.6, duration: 0.3, ease: 'power2.out' },
            0
          )
        }
        // When requirement is no longer met (text deleted)
        else if (!isMet && wasCompleted) {
          item.setAttribute('data-completed', 'false')
          
          // Animate back to active slate
          tl.to(
            item.querySelector('[data-req-icon]'),
            { backgroundColor: '#cbd5e1', opacity: 1, duration: 0.3, ease: 'power2.out' },
            0
          )

          tl.to(
            item.querySelector('[data-req-text]'),
            { color: '#475569', duration: 0.3, ease: 'power2.out' },
            0
          )

          tl.to(
            item,
            { opacity: 1, duration: 0.3, ease: 'power2.out' },
            0
          )
        }
      })
    }
  }, [password])

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
      const response = await api.post('/api/auth/google', { token: firebaseIdToken })

      console.log('[Login] Backend response received, token:', response.data.token.substring(0, 50) + '...')

      // Store the JWT token
      localStorage.setItem('auth_token', response.data.token)
      console.log('[Login] Token stored in localStorage')

      // Manually verify the token with the backend
      console.log('[Login] Verifying token with backend...')
      try {
        const verifyResponse = await api.get('/api/auth/verify', {
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

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword || !displayName) {
      setValidationError('Please fill in all fields')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Invalid email format')
      return false
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return false
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return false
    }

    if (displayName.length < 2) {
      setValidationError('Display name must be at least 2 characters')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
  
    if (!validateForm()) return
  
    try {
      console.log('📝 Starting registration...')
      
      // Register the user with location if available
      await register(email, password, displayName, userLocation)
      
      console.log('✅ Registration successful', userLocation ? 'with location' : 'without location')
      
      // IMPORTANT: Wait for auth context to update and token to be stored
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Check if we have a pending Discord ID
      const pendingDiscordId = sessionStorage.getItem('pendingDiscordId')
      console.log('🔍 Checking for pending Discord ID:', pendingDiscordId)
      
      if (pendingDiscordId) {
        const token = localStorage.getItem('auth_token')
        console.log('🔑 Token status:', token ? 'EXISTS' : 'MISSING')
        console.log('🔑 Token value (first 30 chars):', token?.substring(0, 30))
        
        if (token) {
          try {
            console.log('🔗 Attempting to link Discord ID...')
            const response = await api.post('/api/auth/discord/link', 
              { discordId: pendingDiscordId },
              { 
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                } 
              }
            )
            console.log('✅ Discord ID linked successfully:', response.data)
            sessionStorage.removeItem('pendingDiscordId')
          } catch (linkError: any) {
            console.error('❌ Failed to link Discord ID:', linkError)
            console.error('Error response:', linkError.response?.data)
            
            // Store for retry later
            sessionStorage.setItem('retryDiscordLink', pendingDiscordId)
          }
        } else {
          console.log('⚠️ No token found, storing Discord ID for later')
          sessionStorage.setItem('retryDiscordLink', pendingDiscordId)
        }
      } else {
        console.log('ℹ️ No Discord ID to link')
      }
      
      console.log('➡️ Navigating to quiz')
      navigate('/quiz')
      
    } catch (err: any) {
      console.error('❌ Registration error:', err)
      console.error('❌ Error response:', err.response?.data)
      console.error('❌ Error status:', err.response?.status)
      // Error already handled by auth context
    }
  }

  const requirements = getPasswordRequirements(password)
  const strengthData = calculatePasswordStrength(password)

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-purple-50 overflow-hidden relative"
    >
      {/* Animated Background Orbs */}
      <div
        ref={orbsContainerRef}
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      >
        <div
          data-orb
          className="absolute top-[15%] right-[8%] w-72 h-72 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute top-[45%] right-[25%] w-64 h-64 bg-gradient-to-br from-teal-200/35 to-cyan-200/35 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-gradient-to-br from-violet-200/25 to-purple-200/25 rounded-full blur-3xl"
        />
      </div>

      <div className="relative min-h-screen flex flex-col z-10 py-6">
        {/* Logo */}
        <div ref={logoRef} className="flex justify-center items-center pt-4 pb-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img 
              src="./public/logo.png" 
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
                Join Senergy
              </h1>
              <p className="text-slate-500 text-base">
                Create your account and discover your match
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
              {/* Display Name */}
              <div data-form-item>
                <label htmlFor="displayName" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 hover:border-slate-300 shadow-sm"
                  disabled={isLoading}
                />
              </div>

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
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 hover:border-slate-300 shadow-sm"
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
                    onChange={handlePasswordChange}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 hover:border-slate-300 pr-12 shadow-sm"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div 
                    ref={passwordStrengthRef} 
                    className="mt-4 space-y-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 overflow-hidden"
                    style={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Password Strength</span>
                      <span 
                        className="strength-label text-xs font-bold transition-colors duration-300" 
                        style={{ color: strengthData.color }}
                      >
                        {strengthData.label}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-300 rounded-full overflow-hidden">
                      <div
                        className="strength-bar h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(strengthData.strength / 5) * 100}%`,
                          backgroundColor: strengthData.color
                        }}
                      />
                    </div>

                    {/* Requirements Checklist */}
                    <div 
                      ref={requirementsRef} 
                      className="space-y-2 pt-3 border-t border-slate-300 overflow-hidden"
                      style={{ opacity: 1 }}
                    >
                      <p className="text-xs font-semibold text-slate-600">Requirements:</p>
                      <div ref={requirementsListRef} className="space-y-2">
                        {/* 8+ characters */}
                        <div 
                          data-req-key="length8"
                          className="flex items-center gap-2 transition-all duration-300"
                        >
                          <div 
                            data-req-icon
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            requirements.length8
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}>
                            {requirements.length8 && (
                              <i className="fas fa-check text-white text-xs" />
                            )}
                          </div>
                          <span 
                            data-req-text
                            className={`text-xs transition-all duration-300 ${
                            requirements.length8
                              ? 'text-green-600'
                              : 'text-slate-600'
                          }`}>
                            At least 8 characters
                          </span>
                        </div>

                        {/* 12+ characters */}
                        <div 
                          data-req-key="length12"
                          className="flex items-center gap-2 transition-all duration-300"
                        >
                          <div 
                            data-req-icon
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            requirements.length12
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}>
                            {requirements.length12 && (
                              <i className="fas fa-check text-white text-xs" />
                            )}
                          </div>
                          <span 
                            data-req-text
                            className={`text-xs transition-all duration-300 ${
                            requirements.length12
                              ? 'text-green-600'
                              : 'text-slate-600'
                          }`}>
                            At least 12 characters
                          </span>
                        </div>

                        {/* Uppercase & Lowercase */}
                        <div 
                          data-req-key="uppercase"
                          className="flex items-center gap-2 transition-all duration-300"
                        >
                          <div 
                            data-req-icon
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            requirements.uppercase && requirements.lowercase
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}>
                            {requirements.uppercase && requirements.lowercase && (
                              <i className="fas fa-check text-white text-xs" />
                            )}
                          </div>
                          <span 
                            data-req-text
                            className={`text-xs transition-all duration-300 ${
                            requirements.uppercase && requirements.lowercase
                              ? 'text-green-600'
                              : 'text-slate-600'
                          }`}>
                            Uppercase & lowercase letters
                          </span>
                        </div>

                        {/* Numbers */}
                        <div 
                          data-req-key="number"
                          className="flex items-center gap-2 transition-all duration-300"
                        >
                          <div 
                            data-req-icon
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            requirements.number
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}>
                            {requirements.number && (
                              <i className="fas fa-check text-white text-xs" />
                            )}
                          </div>
                          <span 
                            data-req-text
                            className={`text-xs transition-all duration-300 ${
                            requirements.number
                              ? 'text-green-600'
                              : 'text-slate-600'
                          }`}>
                            At least one number
                          </span>
                        </div>

                        {/* Special Characters */}
                        <div 
                          data-req-key="special"
                          className="flex items-center gap-2 transition-all duration-300"
                        >
                          <div 
                            data-req-icon
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            requirements.special
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}>
                            {requirements.special && (
                              <i className="fas fa-check text-white text-xs" />
                            )}
                          </div>
                          <span 
                            data-req-text
                            className={`text-xs transition-all duration-300 ${
                            requirements.special
                              ? 'text-green-600'
                              : 'text-slate-600'
                          }`}>
                            Special character (!@#$%^&*)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div data-form-item>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 hover:border-slate-300 pr-12 shadow-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-all duration-200 hover:scale-110 text-lg"
                  >
                    <i className={`fas fa-${showConfirmPassword ? 'eye-slash' : 'eye'}`} />
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-base hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading && <i className="fas fa-spinner fa-spin text-lg" />}
                {isLoading ? 'Creating Account...' : (
                  <>
                    Create Account
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

            {/* Sign In Link */}
            <div data-form-item className="text-center mt-6 text-slate-600 text-base">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-purple-600 font-bold hover:text-purple-700 transition-colors duration-200 hover:underline decoration-2 underline-offset-2"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}