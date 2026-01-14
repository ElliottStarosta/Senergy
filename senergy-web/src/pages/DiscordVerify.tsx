import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import Snowfall from 'react-snowfall'
import { useAuth } from '@/context/AuthContext'
import api from '@/api/config'

export const DiscordVerify: React.FC = () => {

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const containerRef = useRef<HTMLDivElement>(null)
  const codeBoxRef = useRef<HTMLDivElement>(null)
  const discordIconRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const pulseRingRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const copyBtnRef = useRef<HTMLButtonElement>(null)


  const cmdCodeRef = useRef<HTMLElement>(null)
  const cmdCopyIconRef = useRef<HTMLElement>(null)
  const [cmdCopied, setCmdCopied] = useState(false)
  const [cmdHovered, setCmdHovered] = useState(false)
  const cmdContainerRef = useRef<HTMLDivElement>(null)
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60)

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    const code = location.state?.verificationCode
    if (!code) {
      navigate('/quiz')
      return
    }
    setVerificationCode(code)
  }, [location.state, navigate])

  useEffect(() => {
    if (!cmdCodeRef.current || !cmdCopyIconRef.current) return

    const code = cmdCodeRef.current
    const icon = cmdCopyIconRef.current

    // Set initial state for the icon
    gsap.set(icon, {
      x: -28,
      opacity: 0
    })

    const handleMouseEnter = () => {
      setCmdHovered(true)

      const tl = gsap.timeline()

      // First: Expand the code block padding
      tl.to(code, {
        paddingRight: '32px',
        duration: 0.25,
        ease: 'power2.out'
      })

      // Then: Animate the code block scale and icon together
      tl.to(code, {
        scale: 1.02,
        y: -2,
        duration: 0.2,
        ease: 'power2.out'
      }, '-=0.1')

      tl.to(icon, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(2)'
      }, '-=0.2')
    }

    const handleMouseLeave = () => {
      setCmdHovered(false)

      const tl = gsap.timeline()

      // First: Animate icon out
      tl.to(icon, {
        x: -28,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      })

      tl.to(code, {
        scale: 1,
        y: 0,
        duration: 0.2,
        ease: 'power2.out'
      }, '-=0.15')

      // Then: Shrink the padding
      tl.to(code, {
        paddingRight: '12px',
        duration: 0.25,
        ease: 'power2.out'
      }, '-=0.1')
    }

    code.addEventListener('mouseenter', handleMouseEnter)
    code.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      code.removeEventListener('mouseenter', handleMouseEnter)
      code.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [verificationCode])

  // Add this useEffect for the color change animation when copied
  useEffect(() => {
    if (!cmdCodeRef.current) return

    const code = cmdCodeRef.current

    if (cmdCopied) {
      // Store original background
      const originalBg = window.getComputedStyle(code).background
      code.dataset.originalBg = originalBg

      gsap.to(code, {
        background: 'linear-gradient(to bottom right, rgb(22, 163, 74), rgb(21, 128, 61))',
        scale: 1.05,
        duration: 0.4,
        ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(code, {
            scale: 1,
            duration: 0.3,
            ease: 'elastic.out(1, 0.5)'
          })
        }
      })
    } else {
      // Restore original background
      const originalBg = code.dataset.originalBg
      if (originalBg) {
        gsap.to(code, {
          background: originalBg,
          duration: 0.8,
          ease: 'power2.inOut'
        })
      }
    }
  }, [cmdCopied])

  // Add this handler function
  const handleCopyCommand = () => {
    const command = `/verify ${verificationCode}`
    navigator.clipboard.writeText(command)
    setCmdCopied(true)

    // Click animation
    if (cmdCodeRef.current) {
      gsap.timeline()
        .to(cmdCodeRef.current, {
          scale: 0.95,
          duration: 0.1,
          ease: 'power2.in'
        })
    }

    setTimeout(() => setCmdCopied(false), 2000)
  }

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Main entrance animation
  useEffect(() => {
    if (!containerRef.current || !verificationCode) return

    const tl = gsap.timeline()

    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    )

    if (discordIconRef.current) {
      tl.fromTo(
        discordIconRef.current,
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
          onComplete: () => {
            gsap.to(discordIconRef.current, {
              y: -12,
              duration: 2.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            })
          }
        },
        0.2
      )
    }

    if (pulseRingRef.current) {
      tl.fromTo(
        pulseRingRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' },
        0.3
      )

      gsap.to(pulseRingRef.current, {
        scale: 1.2,
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: 'power2.out'
      })
    }

    if (codeBoxRef.current) {
      tl.fromTo(
        codeBoxRef.current,
        { y: 40, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)' },
        0.5
      )

      const digits = codeBoxRef.current.querySelectorAll('[data-digit]')
      tl.fromTo(
        digits,
        { y: 20, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(2)' },
        0.7
      )
    }

    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: -30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' },
        0.4
      )
    }

    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        0.6
      )
    }

    if (stepsRef.current) {
      const steps = stepsRef.current.querySelectorAll('[data-step]')
      tl.fromTo(
        steps,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' },
        0.8
      )
    }
  }, [verificationCode])

  // Smooth color transition animation when copied state changes
  useEffect(() => {
    if (!codeBoxRef.current) return

    const digits = codeBoxRef.current.querySelectorAll('[data-digit]')
    const copyBtn = copyBtnRef.current
    const discordIcon = discordIconRef.current

    if (copied) {
      // Store original backgrounds before animating
      digits.forEach((digit, index) => {
        const originalBg = window.getComputedStyle(digit as HTMLElement).background
          ; (digit as HTMLElement).dataset.originalBg = originalBg

        gsap.to(digit, {
          background: 'linear-gradient(to bottom right, rgb(22, 163, 74), rgb(21, 128, 61))',
          scale: 1.1,
          duration: 0.4,
          delay: index * 0.03,
          ease: 'back.out(2)',
          onComplete: () => {
            gsap.to(digit, {
              scale: 1,
              duration: 0.3,
              ease: 'elastic.out(1, 0.5)'
            })
          }
        })
      })

      // Animate Discord icon to green
      if (discordIcon) {
        const originalIconBg = window.getComputedStyle(discordIcon).background
        discordIcon.dataset.originalBg = originalIconBg

        gsap.to(discordIcon, {
          background: 'linear-gradient(to bottom right, rgb(22, 163, 74), rgb(21, 128, 61))',
          boxShadow: '0 25px 50px -12px rgba(22, 163, 74, 0.5)',
          scale: 1.1,
          duration: 0.5,
          ease: 'back.out(2)',
          onComplete: () => {
            gsap.to(discordIcon, {
              scale: 1,
              duration: 0.4,
              ease: 'elastic.out(1, 0.5)'
            })
          }
        })
      }

      // Store and animate button
      if (copyBtn) {
        const originalBtnBg = window.getComputedStyle(copyBtn).background
        copyBtn.dataset.originalBg = originalBtnBg

        gsap.to(copyBtn, {
          background: 'linear-gradient(to right, rgb(22, 163, 74), rgb(21, 128, 61))',
          scale: 0.98,
          duration: 0.15,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(copyBtn, {
              scale: 1,
              duration: 0.4,
              ease: 'elastic.out(1, 0.4)'
            })
          }
        })
      }
    } else {
      // Restore original backgrounds with smooth, slower transition
      digits.forEach((digit, index) => {
        const originalBg = (digit as HTMLElement).dataset.originalBg
        if (originalBg) {
          gsap.to(digit, {
            background: originalBg,
            duration: 0.8,
            delay: index * 0.05,
            ease: 'power2.inOut'
          })
        }
      })

      // Restore Discord icon
      if (discordIcon && discordIcon.dataset.originalBg) {
        gsap.to(discordIcon, {
          background: discordIcon.dataset.originalBg,
          boxShadow: '0 25px 50px -12px rgba(88, 101, 242, 0.5)',
          duration: 0.8,
          ease: 'power3.inOut'
        })
      }

      // Restore button original background
      if (copyBtn && copyBtn.dataset.originalBg) {
        gsap.to(copyBtn, {
          background: copyBtn.dataset.originalBg,
          duration: 0.8,
          ease: 'power3.inOut'
        })
      }
    }
  }, [copied])




  const handleCopy = () => {
    if (!verificationCode) return

    navigator.clipboard.writeText(verificationCode)
    setCopied(true)

    // Button click animation
    if (copyBtnRef.current) {
      gsap.timeline()
        .to(copyBtnRef.current, {
          scale: 0.92,
          duration: 0.1,
          ease: 'power2.in'
        })
        .to(copyBtnRef.current, {
          scale: 1.05,
          duration: 0.2,
          ease: 'back.out(3)'
        })
        .to(copyBtnRef.current, {
          scale: 1,
          duration: 0.15,
          ease: 'power2.out'
        })
    }

    setTimeout(() => setCopied(false), 2000)
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  // Add hover animation for copy button
  useEffect(() => {
    if (!copyBtnRef.current) return

    const btn = copyBtnRef.current
    let hoverAnimation: gsap.core.Tween

    const handleMouseEnter = () => {
      // Kill any existing animation first
      if (hoverAnimation) hoverAnimation.kill()

      hoverAnimation = gsap.to(btn, {
        scale: 1.03,
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 8px 10px -6px rgba(59, 130, 246, 0.3)',
        duration: 0.2,
        ease: 'power2.out'
      })
    }

    const handleMouseLeave = () => {
      // Kill any existing animation first
      if (hoverAnimation) hoverAnimation.kill()

      hoverAnimation = gsap.to(btn, {
        scale: 1,
        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.2)',
        duration: 0.2,
        ease: 'power2.out'
      })
    }

    btn.addEventListener('mouseenter', handleMouseEnter)
    btn.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      btn.removeEventListener('mouseenter', handleMouseEnter)
      btn.removeEventListener('mouseleave', handleMouseLeave)
      if (hoverAnimation) hoverAnimation.kill()
    }
  }, [])

  // Poll for verification status
  useEffect(() => {
    if (!user?.id || !verificationCode) return

    let pollInterval: NodeJS.Timeout
    let pollCount = 0
    const MAX_POLLS = 60 // Poll for 2 minutes

    const checkVerificationStatus = async () => {
      try {
        console.log('[DiscordVerify] Checking verification status...')

        const response = await api.get(`/api/auth/discord/status/${user.id}`)

        console.log('[DiscordVerify] Status:', response.data)

        if (response.data.verified) {
          console.log('[DiscordVerify] ✅ Verification complete! Redirecting...')
          setIsVerifying(true)

          if (pollInterval) clearInterval(pollInterval)

          await new Promise(resolve => setTimeout(resolve, 1500))

          navigate('/dashboard', { replace: true })
        } else {
          pollCount++
          console.log(`[DiscordVerify] Not verified yet (${pollCount}/${MAX_POLLS})`)

          if (pollCount >= MAX_POLLS) {
            clearInterval(pollInterval)
            setVerificationError('Verification timeout. Please try again.')
          }
        }
      } catch (error: any) {
        console.error('[DiscordVerify] Status check error:', error)
      }
    }

    pollInterval = setInterval(checkVerificationStatus, 2000)
    checkVerificationStatus()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [user?.id, verificationCode, navigate])

  if (!verificationCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50">
        <i className="fas fa-spinner fa-spin text-4xl text-primary-600" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 relative overflow-hidden"
    >
      <Snowfall
        color="#8b5cf6"
        snowflakeCount={30}
        style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.3 }}
      />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-2xl">
          {/* Discord Icon with Pulse Ring */}
          <div className="flex justify-center mb-8 relative">
            <div ref={pulseRingRef} className="absolute w-32 h-32 rounded-full bg-primary-400/30 blur-xl" />
            <div
              ref={discordIconRef}
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-2xl shadow-[#5865F2]/50"
            >
              <i className="fab fa-discord text-white text-5xl" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 ref={titleRef} className="text-5xl font-black text-slate-900 mb-3 leading-tight">
              Link Discord
            </h1>
            <p ref={subtitleRef} className="text-lg text-slate-600">
              Use this code to verify your account in Discord
            </p>
          </div>

          {/* Verification Code Card */}
          <div
            ref={codeBoxRef}
            className="bg-white rounded-3xl shadow-2xl border-2 border-primary-200 p-8 mb-6 relative overflow-hidden"
          >
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-accent-50 opacity-50" />

            <div className="relative z-10">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">
                  Your Verification Code
                </p>

                {/* Code Display - Individual Digits */}
                <div className="flex justify-center gap-3 mb-6">
                  {verificationCode.split('').map((digit, idx) => (
                    <div
                      key={idx}
                      data-digit
                      className="w-14 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 transform"
                      style={{
                        background: 'linear-gradient(to bottom right, rgb(59, 130, 246), rgb(37, 99, 235))',
                        transition: 'all 0.3s ease', // CSS fallback
                      }}
                    >
                      <span className="text-3xl font-black text-white tracking-wider">
                        {digit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Copy Button */}
                <button
                  ref={copyBtnRef}
                  onClick={handleCopy}
                  className="w-full px-6 py-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 flex items-center justify-center gap-3 group"
                  style={{
                    transition: 'all 0.3s ease', // Add CSS transition as fallback
                  }}
                >
                  {copied ? (
                    <>
                      <i className="fas fa-check text-xl" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-copy text-xl transition-transform duration-300 group-hover:scale-110" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Timer */}
              <div className="text-center pt-4 border-t border-slate-200">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <i className="fas fa-clock text-primary-600" />
                  <span>Expires in <strong className="text-slate-900">{formatTime(timeRemaining)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div
            ref={stepsRef}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-list-check text-primary-600" />
              How to Verify
            </h3>
            <div className="space-y-4">
              <div
                data-step
                className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Open Discord</p>
                  <p className="text-sm text-slate-600">Open Discord in a DM with the Senergy bot</p>
                </div>
              </div>

              <div
                data-step
                className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Send the command</p>
                  <p className="text-sm text-slate-600 mb-2">Type this command in your DM:</p>
                  <div className="relative inline-block">
                    <code
                      ref={cmdCodeRef}
                      onClick={handleCopyCommand}
                      className="px-3 py-2 bg-gradient-to-br from-blue-600 to-blue-900 text-white rounded-lg text-sm font-mono inline-block transition-all duration-300 cursor-pointer relative"
                      style={{ paddingRight: '12px' }}
                    >
                      /verify {verificationCode}
                      <i
                        ref={cmdCopyIconRef}
                        className={`fas ${cmdCopied ? 'fa-check' : 'fa-copy'} absolute top-1/2 -translate-y-1/2 text-white text-sm pointer-events-none`}
                        style={{
                          opacity: 0,
                          right: '8px'
                        }}
                      />
                    </code>
                  </div>

                </div>
              </div>

              <div
                data-step
                className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border border-pink-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Done!</p>
                  <p className="text-sm text-slate-600">Your account will be linked automatically</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Skip for now</span>
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Need help?{' '}
              <button
                onClick={() => navigate('/discord-bot-docs')}
                className="text-primary-600 font-semibold hover:underline"
              >
                View Discord Bot Docs
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Verification in progress overlay */}
      {isVerifying && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <i className="fas fa-check text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verified!</h2>
            <p className="text-slate-600 mb-4">Taking you to your dashboard...</p>
            <i className="fas fa-spinner fa-spin text-2xl text-indigo-600" />
          </div>
        </div>
      )}

      {/* Error message */}
      {verificationError && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm font-medium">
            <i className="fas fa-exclamation-circle mr-2" />
            {verificationError}
          </p>
        </div>
      )}
    </div>
  )
}                       