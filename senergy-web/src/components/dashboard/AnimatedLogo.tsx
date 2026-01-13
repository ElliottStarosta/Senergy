import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

export const AnimatedLogo: React.FC = () => {
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!logoRef.current) return

    const logo = logoRef.current.querySelector('.logo-img')
    const glow = logoRef.current.querySelector('.logo-glow')

    // Floating animation
    gsap.to(logo, {
      y: -12,
      duration: 2.5,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    })

    // Rotation animation
    gsap.to(logo, {
      rotation: 8,
      duration: 3,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    })

    // Glow pulse
    gsap.to(glow, {
      scale: 1.2,
      opacity: 0.6,
      duration: 2,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    })

    // Subtle scale breathing
    gsap.to(logo, {
      scale: 1.05,
      duration: 3.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }, [])

  return (
    <div ref={logoRef} className="relative flex items-center justify-center w-40 h-40">
      {/* Glow effect */}
      <div className="logo-glow absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 blur-3xl opacity-40" />
      
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Logo"
        className="logo-img relative w-36 h-36 object-contain drop-shadow-md"
      />
    </div>
  )
}