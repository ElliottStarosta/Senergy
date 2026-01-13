import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'

export const DiscordBotDocs: React.FC = () => {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const heroIconRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState('getting-started')
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  // Entrance animations
  useEffect(() => {
    if (!containerRef.current || !sidebarRef.current || !contentRef.current) return

    const tl = gsap.timeline()

    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    )

    tl.fromTo(
      sidebarRef.current,
      { opacity: 0, x: -40, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' },
      0.2
    )

    tl.fromTo(
      contentRef.current,
      { opacity: 0, x: 40, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' },
      0.3
    )
  }, [])

  // Idle float animation for hero icon
  useEffect(() => {
    if (heroIconRef.current) {
      gsap.to(heroIconRef.current, {
        y: -8,
        duration: 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to(heroIconRef.current, {
        rotation: 5,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }
  }, [activeSection])

  // Animate content change with stagger
  useEffect(() => {
    if (!contentRef.current) return

    const tl = gsap.timeline()

    tl.fromTo(
      contentRef.current,
      { opacity: 0, y: 30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    )

    const items = contentRef.current.querySelectorAll('[data-animate-item]')
    if (items.length > 0) {
      tl.fromTo(
        items,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
        0.2
      )
    }
  }, [activeSection])

  const copyToClipboard = (text: string, commandId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(commandId)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'fa-rocket',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'hover:bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'profile',
      title: 'Profile & Stats',
      icon: 'fa-user',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'hover:bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      id: 'rating',
      title: 'Rating Places',
      icon: 'fa-star',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'hover:bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      id: 'groups',
      title: 'Group Planning',
      icon: 'fa-users',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'hover:bg-green-50',
      textColor: 'text-green-600',
    },
    {
      id: 'matching',
      title: 'Finding Friends',
      icon: 'fa-heart',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'hover:bg-pink-50',
      textColor: 'text-pink-600',
    },
  ]

  const handleSectionChange = (sectionId: string) => {
    const button = document.querySelector(`[data-section-btn="${sectionId}"]`)
    if (button) {
      gsap.fromTo(
        button,
        { scale: 1 },
        { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' }
      )
    }
    setActiveSection(sectionId)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-8">
            {/* Hero */}
            <div data-animate-item className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div ref={heroIconRef} className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <i className="fas fa-rocket text-3xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">Getting Started</h1>
                  <p className="text-white/80 mt-1">Set up your Senergy Discord bot</p>
                </div>
              </div>
            </div>

            {/* Quick Start Steps */}
            <div data-animate-item className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-list-check text-white" />
                </div>
                Quick Start Guide
              </h2>
              <div className="space-y-6">
                <div data-animate-item className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Add Bot to Server</h3>
                    <p className="text-slate-600 mb-3">
                      Invite the Senergy bot to your Discord server using the invite link. The bot needs permission to read messages and send responses.
                    </p>
                    <a
                      href="https://discord.com/oauth2/authorize?client_id=1451012603714207744&permissions=8&integration_type=0&scope=bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                      >
                      <i className="fab fa-discord mr-2" />
                      Invite Bot
                    </a>

                  </div>
                </div>

                <div data-animate-item className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Register Your Account</h3>
                    <p className="text-slate-600 mb-3">
                      Use the <code className="px-2 py-1 bg-slate-100 rounded text-indigo-600 font-mono text-sm">/register</code> command to create your Senergy account.
                    </p>
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-slate-200 hover:border-indigo-300 transition-all duration-300 group/code">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-slate-700 font-semibold">/register</code>
                        <button
                          onClick={() => copyToClipboard('/register', 'register')}
                          className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105"
                        >
                          {copiedCommand === 'register' ? (
                            <><i className="fas fa-check mr-1" />Copied</>
                          ) : (
                            <><i className="fas fa-copy mr-1" />Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div data-animate-item className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Verify Your Discord</h3>
                    <p className="text-slate-600 mb-3">
                      You'll receive a code. Use <code className="px-2 py-1 bg-slate-100 rounded text-indigo-600 font-mono text-sm">/verify</code> to link your account.
                    </p>
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-slate-200 hover:border-indigo-300 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-slate-700 font-semibold">/verify 123456</code>
                        <button
                          onClick={() => copyToClipboard('/verify 123456', 'verify')}
                          className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105"
                        >
                          {copiedCommand === 'verify' ? (
                            <><i className="fas fa-check mr-1" />Copied</>
                          ) : (
                            <><i className="fas fa-copy mr-1" />Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div data-animate-item className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <i className="fas fa-check text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Start Using Senergy!</h3>
                    <p className="text-slate-600">
                      You're all set! Rate places, create groups, and find people with similar vibes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-8">
            <div data-animate-item className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div ref={heroIconRef} className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <i className="fas fa-user text-3xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">Profile & Stats</h1>
                  <p className="text-white/80 mt-1">Manage your Senergy profile</p>
                </div>
              </div>
            </div>

            <div data-animate-item className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-terminal text-white" />
                </div>
                Commands
              </h2>
              <div className="space-y-4">
                <div data-animate-item className="group relative overflow-hidden p-6 rounded-xl border-2 border-slate-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-xl font-mono font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                        /profile
                      </code>
                      <button
                        onClick={() => copyToClipboard('/profile', 'profile-cmd')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 text-sm font-semibold hover:scale-105"
                      >
                        {copiedCommand === 'profile-cmd' ? (
                          <><i className="fas fa-check mr-1" />Copied</>
                        ) : (
                          <><i className="fas fa-copy mr-1" />Copy</>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-700 mb-2 leading-relaxed">
                      View your complete profile: personality type, adjustment factor, total ratings, and groups joined.
                    </p>
                    <div className="text-sm text-slate-500">
                      <strong>Example:</strong> <code className="bg-slate-100 px-2 py-1 rounded">/profile</code>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>

                <div data-animate-item className="group relative overflow-hidden p-6 rounded-xl border-2 border-slate-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-xl font-mono font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                        /stats
                      </code>
                      <button
                        onClick={() => copyToClipboard('/stats', 'stats-cmd')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 text-sm font-semibold hover:scale-105"
                      >
                        {copiedCommand === 'stats-cmd' ? (
                          <><i className="fas fa-check mr-1" />Copied</>
                        ) : (
                          <><i className="fas fa-copy mr-1" />Copy</>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-700 mb-2 leading-relaxed">
                      Detailed statistics: ratings given, average scores, and group participation.
                    </p>
                    <div className="text-sm text-slate-500">
                      <strong>Example:</strong> <code className="bg-slate-100 px-2 py-1 rounded">/stats</code>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
            </div>
          </div>
        )

      case 'rating':
        return (
          <div className="space-y-8">
            <div data-animate-item className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div ref={heroIconRef} className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <i className="fas fa-star text-3xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">Rating Places</h1>
                  <p className="text-white/80 mt-1">Share your experiences</p>
                </div>
              </div>
            </div>

            <div data-animate-item className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-star text-white" />
                </div>
                Rate Command
              </h2>

              <div data-animate-item className="group relative overflow-hidden p-6 rounded-xl border-2 border-slate-200 hover:border-orange-400 transition-all duration-300 mb-6 hover:shadow-xl hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-xl font-mono font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                      /rate [place_name]
                    </code>
                    <button
                      onClick={() => copyToClipboard('/rate Brew & Co Cafe', 'rate-cmd')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200 text-sm font-semibold hover:scale-105"
                    >
                      {copiedCommand === 'rate-cmd' ? (
                        <><i className="fas fa-check mr-1" />Copied</>
                      ) : (
                        <><i className="fas fa-copy mr-1" />Copy</>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-700 mb-2 leading-relaxed">
                    Rate a place with detailed feedback on atmosphere, service, crowd size, noise level, and social energy.
                  </p>
                  <div className="text-sm text-slate-500">
                    <strong>Example:</strong> <code className="bg-slate-100 px-2 py-1 rounded">/rate Brew & Co Cafe</code>
                  </div>
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>

              <div data-animate-item className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-lightbulb text-orange-500" />
                  What You'll Rate
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { icon: 'fa-sparkles', label: 'Atmosphere', desc: 'Overall vibe' },
                    { icon: 'fa-concierge-bell', label: 'Service', desc: 'Staff quality' },
                    { icon: 'fa-users', label: 'Crowd Size', desc: 'How packed' },
                    { icon: 'fa-volume-up', label: 'Noise Level', desc: 'Quiet to loud' },
                    { icon: 'fa-bolt', label: 'Social Energy', desc: 'Engagement' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100 hover:border-orange-300 transition-all hover:shadow-md">
                      <i className={`fas ${item.icon} text-orange-500 mt-1`} />
                      <div>
                        <strong className="text-slate-900">{item.label}</strong>
                        <p className="text-sm text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'groups':
        return (
          <div className="space-y-8">
            <div data-animate-item className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div ref={heroIconRef} className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <i className="fas fa-users text-3xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">Group Planning</h1>
                  <p className="text-white/80 mt-1">Plan outings with friends</p>
                </div>
              </div>
            </div>

            <div data-animate-item className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-terminal text-white" />
                </div>
                Group Commands
              </h2>
              <div className="space-y-4">
                {[
                  {
                    cmd: '/group create [location]',
                    desc: 'Create a new group for planning an outing in a specific location',
                    example: '/group create Downtown Seattle',
                    id: 'create',
                  },
                  {
                    cmd: '/group add [@user]',
                    desc: 'Add a member to your active group',
                    example: '/group add @username',
                    id: 'add',
                  },
                  {
                    cmd: '/group remove [@user]',
                    desc: 'Remove a member from your active group',
                    example: '/group remove @username',
                    id: 'remove',
                  },
                  {
                    cmd: '/group recommend',
                    desc: 'Generate personalized place recommendations based on group personalities',
                    example: '/group recommend',
                    id: 'recommend',
                  },
                  {
                    cmd: '/group vote',
                    desc: 'Cast ranked choice votes for your top 3 favorite places',
                    example: '/group vote',
                    id: 'vote',
                  },
                  {
                    cmd: '/group finalize',
                    desc: 'Lock in the final place selection and get directions',
                    example: '/group finalize',
                    id: 'finalize',
                  },
                  {
                    cmd: '/group cancel',
                    desc: 'Cancel your active group',
                    example: '/group cancel',
                    id: 'cancel',
                  },
                  {
                    cmd: '/group history',
                    desc: 'View past groups and places you\'ve been to',
                    example: '/group history',
                    id: 'history',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    data-animate-item
                    className="group relative overflow-hidden p-6 rounded-xl border-2 border-slate-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <code className="text-lg font-mono font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg group-hover:bg-green-100 transition-colors">
                          {item.cmd}
                        </code>
                        <button
                          onClick={() => copyToClipboard(item.example, `group-${item.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600 transition-all duration-200 text-sm font-semibold hover:scale-105"
                        >
                          {copiedCommand === `group-${item.id}` ? (
                            <><i className="fas fa-check mr-1" />Copied</>
                          ) : (
                            <><i className="fas fa-copy mr-1" />Copy</>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-700 mb-2 leading-relaxed">{item.desc}</p>
                      <div className="text-sm text-slate-500">
                        <strong>Example:</strong> <code className="bg-slate-100 px-2 py-1 rounded">{item.example}</code>
                      </div>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'matching':
        return (
          <div className="space-y-8">
            <div data-animate-item className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div ref={heroIconRef} className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <i className="fas fa-heart text-3xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">Finding Friends</h1>
                  <p className="text-white/80 mt-1">Connect with similar people</p>
                </div>
              </div>
            </div>

            <div data-animate-item className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-heart text-white" />
                </div>
                Find Your Squad
              </h2>

              <div data-animate-item className="group relative overflow-hidden p-6 rounded-xl border-2 border-slate-200 hover:border-pink-400 transition-all duration-300 mb-6 hover:shadow-xl hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-xl font-mono font-bold text-pink-600 bg-pink-50 px-4 py-2 rounded-lg">
                      /find-squad [distance]
                    </code>
                    <button
                      onClick={() => copyToClipboard('/find-squad 30', 'squad-cmd')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-pink-100 hover:text-pink-600 transition-all duration-200 text-sm font-semibold hover:scale-105"
                    >
                      {copiedCommand === 'squad-cmd' ? (
                        <><i className="fas fa-check mr-1" />Copied</>
                      ) : (
                        <><i className="fas fa-copy mr-1" />Copy</>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-700 mb-2 leading-relaxed">
                    Find people with similar personality types in your area. Distance in km (default: 50km).
                  </p>
                  <div className="text-sm text-slate-500">
                    <strong>Example:</strong> <code className="bg-slate-100 px-2 py-1 rounded">/find-squad 30</code>
                  </div>
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>

              <div data-animate-item className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-lightbulb text-pink-500" />
                  How Matching Works
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: 'fa-brain', label: 'Personality Match', desc: 'Find introverts, extroverts, or ambiverts like you' },
                    { icon: 'fa-map-marker-alt', label: 'Location', desc: 'Only shows people within your specified distance' },
                    { icon: 'fa-percent', label: 'Compatibility', desc: 'Higher match % = more similar vibe' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-pink-100 hover:border-pink-300 transition-all hover:shadow-md">
                      <i className={`fas ${item.icon} text-pink-500 mt-1`} />
                      <div>
                        <strong className="text-slate-900">{item.label}:</strong>
                        <p className="text-slate-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-lg shadow-[#5865F2]/40">
          <i className="fab fa-discord text-white text-lg" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Discord Bot</p>
              <h1 className="text-lg font-bold text-slate-900">Documentation</h1>
            </div>
          </div>     
        <DashboardReturnBtn />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar Navigation */}
        <aside ref={sidebarRef} className="w-72 flex-shrink-0 sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">Contents</h2>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  data-section-btn={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 group ${activeSection === section.id
                      ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                      : `${section.bgColor} text-slate-700 hover:scale-105`
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${activeSection === section.id
                      ? 'bg-white/20'
                      : 'bg-white border border-slate-200 group-hover:border-slate-300'
                    }`}>
                    <i className={`fas ${section.icon} ${activeSection === section.id ? 'text-white' : section.textColor}`} />
                  </div>
                  <span className="flex-1">{section.title}</span>
                  {activeSection === section.id && (
                    <i className="fas fa-chevron-right text-white/80" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}