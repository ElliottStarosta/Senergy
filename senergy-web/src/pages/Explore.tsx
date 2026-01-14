import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'
import Snowfall from 'react-snowfall'
import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import api from '@/api/config'

gsap.registerPlugin(ScrollTrigger)

interface Person {
  id: string
  displayName: string
  personalityType: string
  adjustmentFactor: number
  similarity: number
  distance: number
  totalRatingsCount: number
  avatar?: string
}

interface PublicProfile {
  id: string
  displayName: string
  avatar?: string | null
  personalityType?: string | null
  adjustmentFactor: number
  totalRatingsCount: number
  totalGroupsJoined?: number
  city?: string | null
  createdAt?: string | null
  discordId?: string | null
  discordUsername?: string | null
  discordVerified?: boolean
}

interface UserRating {
  id: string
  placeId: string
  placeName: string
  placeAddress: string
  overallScore: number
  createdAt: string
}

interface Place {
  id: string
  name: string
  address: string
  location: { lat: number; lng: number }
  predictedScore: number
  confidence: number
  totalRatings: number
  similarRatings: number
}

export const Explore: React.FC = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const thumbRef1 = useRef<HTMLDivElement>(null)
  const thumbRef2 = useRef<HTMLDivElement>(null)

  const [currentRatingsPage, setCurrentRatingsPage] = useState(1)
  const [isRatingsAnimating, setIsRatingsAnimating] = useState(false)
  const ratingsPerPage = 5

  // Connect panel refs
  const connectPanelRef = useRef<HTMLDivElement>(null)
  const connectHeaderRef = useRef<HTMLDivElement>(null)
  const connectHeroRef = useRef<HTMLDivElement>(null)
  const connectStatsRef = useRef<HTMLDivElement>(null)
  const connectDiscordRef = useRef<HTMLDivElement>(null)
  const connectRatingsRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<'people' | 'places'>('people')
  const [people, setPeople] = useState<Person[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [loadingPlaces, setLoadingPlaces] = useState(true)
  const [maxDistance, setMaxDistance] = useState(50)
  const [radius, setRadius] = useState(15)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null)
  const [selectedRatings, setSelectedRatings] = useState<UserRating[]>([])
  const [loadingConnectInfo, setLoadingConnectInfo] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [copiedTag, setCopiedTag] = useState(false)

  const [currentPeoplePage, setCurrentPeoplePage] = useState(1)
  const [currentPlacesPage, setCurrentPlacesPage] = useState(1)
  const [isPeopleAnimating, setIsPeopleAnimating] = useState(false)
  const [isPlacesAnimating, setIsPlacesAnimating] = useState(false)
  const itemsPerPage = 6

  // Load people with debugging
  useEffect(() => {
    if (!user?.id || !token) return

    const loadPeople = async () => {
      try {
        setLoadingPeople(true)
        console.log('🔍 Loading people recommendations...')
        const response = await api.get(
          `/api/explore/people?maxDistance=${maxDistance}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        console.log('👥 People response:', response.data)
        console.log('👥 Found', response.data.data?.length || 0, 'people')
        setPeople(response.data.data || [])
      } catch (error: any) {
        console.error('❌ Failed to load people:', error)
        console.error('Error details:', error.response?.data)
      } finally {
        setLoadingPeople(false)
      }
    }

    loadPeople()
  }, [user?.id, token, maxDistance])

  useEffect(() => {
    if (!isRatingsAnimating || !selectedRatings.length) return

    const timer = setTimeout(() => {
      if (connectRatingsRef.current) {
        const cards = connectRatingsRef.current.querySelectorAll('[data-rating-card]')
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'back.out(1.7)',
            onComplete: () => setIsRatingsAnimating(false)
          }
        )
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [currentRatingsPage, isRatingsAnimating, selectedRatings])

  // Load places with debugging
  useEffect(() => {
    if (!user?.id || !token) return

    const loadPlaces = async () => {
      try {
        setLoadingPlaces(true)
        console.log('🔍 Loading place recommendations...')
        const response = await api.get(
          `/api/explore/places?radius=${radius}`, // FIXED: Changed from /api/ratings/places
          {
            // Combine authorization and cache-busting headers into one headers object
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        )
        console.log('📍 Places response:', response.data)
        console.log('📍 Found', response.data.data?.length || 0, 'places')
        setPlaces(response.data.data || [])
      } catch (error: any) {
        console.error('❌ Failed to load places:', error)
        console.error('Error details:', error.response?.data)
      } finally {
        setLoadingPlaces(false)
      }
    }

    loadPlaces()
  }, [user?.id, token, radius])

  // Entrance animation - sequential groups
  useEffect(() => {
    if (!containerRef.current) return

    const hasAnimated = containerRef.current.getAttribute('data-animated')
    if (hasAnimated) return

    containerRef.current.setAttribute('data-animated', 'true')
    gsap.set(containerRef.current, { opacity: 1 })

    const tl = gsap.timeline()

    // Header icon floats continuously
    if (headerRef.current) {
      const icon = headerRef.current.querySelector('.header-icon')
      if (icon) {
        gsap.to(icon, {
          y: -8,
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      }
    }

    // Tabs appear together
    if (tabsRef.current) {
      const tabs = Array.from(tabsRef.current.children)
      gsap.set(tabs, { opacity: 0, scale: 0.9, y: 20 })

      tl.to(tabs, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      }, 0.2)
    }
  }, [])

  // Tab change animation - FIXED
  useEffect(() => {
    if (!contentRef.current) return

    const hasTabAnimated = contentRef.current.getAttribute('data-tab-animated')
    if (hasTabAnimated === activeTab) return

    contentRef.current.setAttribute('data-tab-animated', activeTab)

    gsap.set(contentRef.current, { opacity: 0, y: 20 })
    gsap.to(contentRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out'
    })
  }, [activeTab])

  // Animate cards when they load - FIXED
  useEffect(() => {
    if (!cardsRef.current) return

    const cards = cardsRef.current.querySelectorAll('[data-card]')
    if (cards.length === 0) return

    // Clear any previous ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => {
      if (trigger.vars.trigger && cardsRef.current?.contains(trigger.vars.trigger as HTMLElement)) {
        trigger.kill()
      }
    })

    // Remove animated flags to allow re-animation
    cards.forEach(card => card.removeAttribute('data-animated'))

    // Set initial state
    gsap.set(cards, { opacity: 0, y: 50, scale: 0.95 })

    // Create scroll trigger for each card
    cards.forEach((card, index) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%', // When top of card hits 85% of viewport
          end: 'top 20%',
          toggleActions: 'play none none none',
          once: true, // Only animate once
        }
      })
    })

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger && cardsRef.current?.contains(trigger.vars.trigger as HTMLElement)) {
          trigger.kill()
        }
      })
    }
  }, [people, places, activeTab])



  // Slider change handlers with animation
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setMaxDistance(value)

    if (thumbRef1.current) {
      gsap.fromTo(
        thumbRef1.current,
        { scale: 1 },
        { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }
      )
    }
  }

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setRadius(value)

    if (thumbRef2.current) {
      gsap.fromTo(
        thumbRef2.current,
        { scale: 1 },
        { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }
      )
    }
  }

  const handlePeoplePageChange = (newPage: number) => {
    const totalPages = Math.ceil(people.length / itemsPerPage)
    if (newPage < 1 || newPage > totalPages || isPeopleAnimating) return

    setIsPeopleAnimating(true)

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-card]')

      gsap.to(cards, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentPeoplePage(newPage)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => setIsPeopleAnimating(false), 400)
        }
      })
    } else {
      setCurrentPeoplePage(newPage)
      setIsPeopleAnimating(false)
    }
  }

  const handlePlacesPageChange = (newPage: number) => {
    const totalPages = Math.ceil(places.length / itemsPerPage)
    if (newPage < 1 || newPage > totalPages || isPlacesAnimating) return

    setIsPlacesAnimating(true)

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-card]')

      gsap.to(cards, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentPlacesPage(newPage)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => setIsPlacesAnimating(false), 400)
        }
      })
    } else {
      setCurrentPlacesPage(newPage)
      setIsPlacesAnimating(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'people' && isPeopleAnimating) {
      const timer = setTimeout(() => {
        if (cardsRef.current) {
          const cards = cardsRef.current.querySelectorAll('[data-card]')
          gsap.fromTo(
            cards,
            { opacity: 0, y: 30, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              stagger: 0.08,
              ease: 'back.out(1.7)'
            }
          )
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [currentPeoplePage, isPeopleAnimating, activeTab])

  useEffect(() => {
    if (activeTab === 'places' && isPlacesAnimating) {
      const timer = setTimeout(() => {
        if (cardsRef.current) {
          const cards = cardsRef.current.querySelectorAll('[data-card]')
          gsap.fromTo(
            cards,
            { opacity: 0, y: 30, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              stagger: 0.08,
              ease: 'back.out(1.7)'
            }
          )
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [currentPlacesPage, isPlacesAnimating, activeTab])

  const getPersonalityColor = (af: number) => {
    if (af <= -0.2) return 'from-blue-400 to-blue-900'
    if (af >= 0.2) return 'from-pink-400 to-pink-900'
    return 'from-purple-400 to-purple-900'
  }

  const getPersonalityIcon = (type: string) => {
    if (type.includes('Introvert')) return 'fa-book'
    if (type.includes('Extrovert')) return 'fa-people-group'
    return 'fa-balance-scale'
  }

  const loading = activeTab === 'people' ? loadingPeople : loadingPlaces
  const hasResults = activeTab === 'people' ? people.length > 0 : places.length > 0

  const openConnectPanel = async (person: Person) => {
    if (!token) return

    setSelectedPerson(person)
    setSelectedProfile(null)
    setSelectedRatings([])
    setConnectError(null)
    setLoadingConnectInfo(true)

    // Pre-hide elements before they render
    requestAnimationFrame(() => {
      if (connectHeroRef.current) {
        gsap.set(connectHeroRef.current, { opacity: 0, y: 40, scale: 0.95 })
      }
      if (connectStatsRef.current) {
        const statCards = connectStatsRef.current.querySelectorAll('[data-stat-card]')
        gsap.set(statCards, { opacity: 0, y: 30 })
      }
      if (connectDiscordRef.current) {
        gsap.set(connectDiscordRef.current, { opacity: 0, y: 30 })
      }
      if (connectRatingsRef.current) {
        gsap.set(connectRatingsRef.current, { opacity: 0, y: 30 })
      }
    })

    try {
      const [profileRes, ratingsRes] = await Promise.all([
        api.get('/api/users/' + person.id + '/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/ratings', {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId: person.id, limit: 10 },
        }),
      ])

      setSelectedProfile(profileRes.data.data as PublicProfile)
      console.log('Selected profile:', profileRes.data.data)

      const ratingsData = (ratingsRes.data.data || []) as any[]
      const mappedRatings: UserRating[] = ratingsData.map((r: any) => ({
        id: r.id,
        placeId: r.placeId,
        placeName: r.placeName,
        placeAddress: r.placeAddress,
        overallScore: r.overallScore,
        createdAt: r.createdAt,
      }))

      setSelectedRatings(mappedRatings)
    } catch (error: any) {
      console.error('Failed to load connect info:', error)
      setConnectError(error.response?.data?.error || 'Failed to load user activity')
    } finally {
      setLoadingConnectInfo(false)
    }
  }

  const closeConnectPanel = () => {
    if (connectPanelRef.current) {
      connectPanelRef.current.removeAttribute('data-animated')
    }

    // Reset animations
    if (connectHeroRef.current) gsap.set(connectHeroRef.current, { clearProps: 'all' })
    if (connectStatsRef.current) gsap.set(connectStatsRef.current.querySelectorAll('[data-stat-card]'), { clearProps: 'all' })
    if (connectDiscordRef.current) gsap.set(connectDiscordRef.current, { clearProps: 'all' })
    if (connectRatingsRef.current) gsap.set(connectRatingsRef.current, { clearProps: 'all' })

    setSelectedPerson(null)
    setSelectedProfile(null)
    setSelectedRatings([])
    setConnectError(null)
    setLoadingConnectInfo(false)
    setCopiedTag(false)
    setCurrentRatingsPage(1)
    setIsRatingsAnimating(false)
  }

  const handleRatingsPageChange = (newPage: number) => {
    const totalPages = Math.ceil(selectedRatings.length / ratingsPerPage)
    if (newPage < 1 || newPage > totalPages || isRatingsAnimating) return

    setIsRatingsAnimating(true)

    if (connectRatingsRef.current) {
      const cards = connectRatingsRef.current.querySelectorAll('[data-rating-card]')

      gsap.to(cards, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentRatingsPage(newPage)

          // Wait for DOM update
          setTimeout(() => {
            if (connectRatingsRef.current && connectPanelRef.current) {
              // Find the scrollable container - it's the div with overflow-y-auto class
              const scrollableContainer = connectPanelRef.current

              // Get the ratings section's position relative to the top of the scrollable container
              const ratingsRect = connectRatingsRef.current.getBoundingClientRect()
              const containerRect = scrollableContainer.getBoundingClientRect()

              // Calculate the scroll position needed
              const currentScrollTop = scrollableContainer.scrollTop
              const ratingsOffsetFromTop = ratingsRect.top - containerRect.top
              const targetScrollTop = currentScrollTop + ratingsOffsetFromTop - 150

              // Scroll to the target position
              scrollableContainer.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
              })
            }
          }, 350)
        }
      })
    } else {
      setCurrentRatingsPage(newPage)
    }
  }

  const copyDiscordTag = async () => {
    if (!selectedProfile?.discordId) return

    const tag = selectedProfile.discordUsername
      ? `@${selectedProfile.discordUsername}`
      : `@${selectedProfile.discordId}`

    try {
      await navigator.clipboard.writeText(tag)
      setCopiedTag(true)
      setTimeout(() => setCopiedTag(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = tag
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedTag(true)
        setTimeout(() => setCopiedTag(false), 2000)
      } catch (err) {
        console.error('Fallback copy failed:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (selectedPerson) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [selectedPerson])

  // Animate connect panel content (without slide-in)
  useEffect(() => {
    if (!selectedPerson || loadingConnectInfo || !connectPanelRef.current) return

    const hasAnimated = connectPanelRef.current.getAttribute('data-animated')
    if (hasAnimated) return

    connectPanelRef.current.setAttribute('data-animated', 'true')

    const tl = gsap.timeline()

    if (connectHeaderRef.current) {
      const icon = connectHeaderRef.current.querySelector('.header-icon')
      if (icon) {
        gsap.to(icon, {
          y: -8,
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      }
    }

    if (connectHeroRef.current) {
      tl.fromTo(
        connectHeroRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' },
        0.1
      )
    }

    if (connectStatsRef.current) {
      const statCards = connectStatsRef.current.querySelectorAll('[data-stat-card]')
      tl.fromTo(
        statCards,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        0.3
      )
    }

    if (connectDiscordRef.current) {
      tl.fromTo(
        connectDiscordRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        0.5
      )
    }

    if (connectRatingsRef.current) {
      tl.fromTo(
        connectRatingsRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        0.7
      )
    }

    return () => {
      if (connectPanelRef.current) {
        connectPanelRef.current.removeAttribute('data-animated')
      }
    }
  }, [selectedPerson, loadingConnectInfo])

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header ref={headerRef} className="relative w-full border-b border-slate-200/50 bg-white/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="header-icon w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <i className="fas fa-compass text-white text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Discover connections</p>
              <h1 className="text-2xl font-black text-slate-900">Explore</h1>
            </div>
          </div>
          <DashboardReturnBtn />
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-10">
        {/* Tabs */}
        <div ref={tabsRef} className="flex gap-4 mb-10">
          <button
            onClick={() => setActiveTab('people')}
            className={`group flex-1 py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 relative overflow-hidden ${activeTab === 'people'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/50 scale-105'
              : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg'
              }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === 'people' ? '' : 'hidden'}`} />
            <div className="relative flex items-center justify-center gap-3">
              <i className="fas fa-user-group text-xl" />
              <span>People Like You</span>
              {people.length > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${activeTab === 'people' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
                  }`}>
                  {people.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('places')}
            className={`group flex-1 py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 relative overflow-hidden ${activeTab === 'places'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/50 scale-105'
              : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg'
              }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === 'places' ? '' : 'hidden'}`} />
            <div className="relative flex items-center justify-center gap-3">
              <i className="fas fa-location-dot text-xl" />
              <span>Places For You</span>
              {places.length > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${activeTab === 'places' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
                  }`}>
                  {places.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Filters - People Distance Slider */}
        {activeTab === 'people' && (
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-8 overflow-hidden group mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-location-arrow text-white text-lg" />
                  </div>
                  <label className="text-lg font-bold text-slate-800">
                    Search Distance
                  </label>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {maxDistance}
                  </span>
                  <span className="text-2xl font-bold text-slate-400">km</span>
                </div>
              </div>

              <div className="relative">
                <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"
                    style={{ width: `${((maxDistance - 5) / (200 - 5)) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
                  </div>
                </div>

                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={maxDistance}
                  onChange={handleDistanceChange}
                  className="absolute top-0 left-0 w-full h-4 opacity-0 cursor-pointer z-10"
                />

                <div
                  ref={thumbRef1}
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none"
                  style={{ left: `calc(${((maxDistance - 5) / (200 - 5)) * 100}% - 16px)` }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg" />
                    <div className="absolute inset-0 rounded-full bg-white scale-50" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4 px-1">
                <span className="text-sm font-semibold text-slate-500">5km</span>
                <span className="text-sm font-semibold text-slate-500">200km</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Places Radius Slider */}
        {activeTab === 'places' && (
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-8 overflow-hidden group mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-compass text-white text-lg" />
                  </div>
                  <label className="text-lg font-bold text-slate-800">
                    Search Radius
                  </label>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    {radius}
                  </span>
                  <span className="text-2xl font-bold text-slate-400">km</span>
                </div>
              </div>

              <div className="relative">
                <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"
                    style={{ width: `${((radius - 5) / (50 - 5)) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
                  </div>
                </div>

                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={radius}
                  onChange={handleRadiusChange}
                  className="absolute top-0 left-0 w-full h-4 opacity-0 cursor-pointer z-10"
                />

                <div
                  ref={thumbRef2}
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none"
                  style={{ left: `calc(${((radius - 5) / (50 - 5)) * 100}% - 16px)` }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg" />
                    <div className="absolute inset-0 rounded-full bg-white scale-50" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4 px-1">
                <span className="text-sm font-semibold text-slate-500">5km</span>
                <span className="text-sm font-semibold text-slate-500">50km</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef}>
          {loading ? (
            <div className="text-center py-32">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <i className="fas fa-compass absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600 text-2xl" />
              </div>
              <p className="text-slate-600 mt-6 font-semibold">Discovering recommendations...</p>
            </div>
          ) : !hasResults ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <i className="fas fa-inbox text-5xl text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No recommendations yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {activeTab === 'people'
                  ? 'Rate more places to find people with similar tastes nearby'
                  : 'Rate more places to get personalized venue recommendations'}
              </p>
              <button
                onClick={() => navigate('/rate')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <i className="fas fa-star mr-2" />
                Rate Your First Place
              </button>
            </div>
          ) : (
            <div ref={cardsRef} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* People Grid */}
              {activeTab === 'people' && (() => {
                const totalPages = Math.ceil(people.length / itemsPerPage);
                const startIndex = (currentPeoplePage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentPeople = people.slice(startIndex, endIndex);

                return (
                  <>
                    {currentPeople.map((person) => (
                      <div
                        key={person.id}
                        data-card
                        className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative">
                          <div className="flex items-start gap-4 mb-5">
                            <div
                              className={`w-16 h-16 rounded-[4rem] flex items-center justify-center text-white text-2xl font-black bg-gradient-to-br ${getPersonalityColor(
                                person.adjustmentFactor
                              )} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                            >
                              {person.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-lg text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                                {person.displayName}
                              </h3>
                              <p className="text-xs text-slate-500 font-semibold mt-1">{person.personalityType}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="text-center p-3 rounded-xl bg-purple-50 border border-purple-200">
                              <div className="text-2xl font-black text-purple-600">{Math.round(person.similarity * 100)}%</div>
                              <div className="text-xs text-slate-600 font-semibold mt-1">Match</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
                              <div className="text-2xl font-black text-blue-600">{person.distance}</div>
                              <div className="text-xs text-slate-600 font-semibold mt-1">km</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-pink-50 border border-pink-200">
                              <div className="text-2xl font-black text-pink-600">{person.totalRatingsCount}</div>
                              <div className="text-xs text-slate-600 font-semibold mt-1">Ratings</div>
                            </div>
                          </div>

                          <button
                            onClick={() => openConnectPanel(person)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-user-plus" />
                            Connect
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}

              {/* Places Grid */}
              {activeTab === 'places' &&
                places.map((place) => (
                  <div
                    key={place.id}
                    data-card
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <i className="fas fa-location-dot text-white text-2xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-lg text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-1">
                            {place.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{place.address}</p>
                        </div>
                      </div>

                      <div className="mb-5 p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-700">Your predicted score</span>
                          <span className="text-3xl font-black text-purple-600">{place.predictedScore}</span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-chart-line text-purple-500" />
                            {place.confidence}% confident
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-users text-purple-500" />
                            {place.similarRatings} similar
                          </span>
                        </div>
                      </div>

                      <button className="w-full py-3 rounded-xl bg-white border-2 border-purple-300 text-purple-600 font-bold hover:bg-purple-50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                        View Details
                        <i className="fas fa-arrow-right" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>

      {/* Connect Panel - Full Page */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
              <div
                ref={connectPanelRef}
                className="h-full overflow-y-auto overflow-x-hidden"
              >
                <Snowfall
                  color="#6366f1"
                  snowflakeCount={15}
                  style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.3 }}
                />

                {/* Header */}
                <header ref={connectHeaderRef} className="relative w-full border-b border-slate-200/50 bg-white/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
                  <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="header-icon w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <i className="fas fa-user text-white text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">User Profile</p>
                        <h1 className="text-2xl font-black text-slate-900">{selectedPerson.displayName}</h1>
                      </div>
                    </div>
                    <DashboardReturnBtn
                      text="Back to Explore"
                      to="/explore"
                      iconClass="fas fa-arrow-left"
                      onClick={() => {
                        closeConnectPanel();
                      }}
                    />
                  </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
                  {/* Hero Card */}
                  <div ref={connectHeroRef} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-300 via-purple-600 to-pink-300 p-8 text-white shadow-2xl">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg`}>
                              <span className="text-3xl font-black">
                                {selectedPerson.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h2 className="text-3xl font-black leading-tight">{selectedPerson.displayName}</h2>
                              <p className="text-white/80 text-sm mt-1">{selectedPerson.personalityType}</p>
                            </div>
                          </div>
                        </div>

                        {/* Overall Stats Badge */}
                        <div className="flex-shrink-0">
                          <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30">
                            <div className="text-5xl font-black mb-2">{selectedProfile?.totalRatingsCount ?? selectedPerson.totalRatingsCount}</div>
                            <div className="text-white/80 text-sm font-semibold">Total Ratings</div>
                            <div className="text-white/60 text-xs mt-1">
                              {Math.round(selectedPerson.similarity * 100)}% Match
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div ref={connectStatsRef} className="grid md:grid-cols-3 gap-6">
                    {/* Match Score */}
                    <div data-stat-card className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-purple-400 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <i className="fas fa-heart text-white text-xl" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Compatibility</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-purple-600">{Math.round(selectedPerson.similarity * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Distance */}
                    <div data-stat-card className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-blue-400 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <i className="fas fa-map-marker-alt text-white text-xl" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Distance</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-blue-600">{selectedPerson.distance.toFixed(1)}</span>
                            <span className="text-sm text-slate-500">km</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ratings Count */}
                    <div data-stat-card className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-pink-400 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <i className="fas fa-star text-white text-xl" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Ratings</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-pink-600">{selectedProfile?.totalRatingsCount ?? selectedPerson.totalRatingsCount}</span>
                            <span className="text-sm text-slate-500">places</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discord Info Card */}
                  <div ref={connectDiscordRef} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#5865F2] flex items-center justify-center shadow-lg">
                        <i className="fab fa-discord text-white text-lg" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Discord Account</h3>
                    </div>

                    {loadingConnectInfo ? (
                      <div className="py-8 flex items-center justify-center text-slate-500">
                        <i className="fas fa-spinner fa-spin text-2xl mr-3" />
                        <span className="font-semibold">Loading Discord info...</span>
                      </div>
                    ) : connectError ? (
                      <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-exclamation-triangle text-2xl text-red-500" />
                        </div>
                        <p className="text-red-600 font-semibold">{connectError}</p>
                      </div>
                    ) : selectedProfile?.discordId ? (
                      <div className="p-6 rounded-xl bg-gradient-to-br from-[#5865F2]/10 to-purple-50 border-2 border-[#5865F2]/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg">
                              <i className="fab fa-discord text-white text-2xl" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Discord Username</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-slate-900">
                                  {selectedProfile.discordUsername ? `@${selectedProfile.discordUsername}` : `@${selectedProfile.discordId}`}
                                </span>
                                {selectedProfile.discordVerified && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                    <i className="fas fa-check-circle" />
                                    Verified
                                  </span>
                                )}
                                <button
                                  onClick={copyDiscordTag}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 text-sm font-semibold hover:scale-105"
                                  title="Copy Discord tag"
                                >
                                  {copiedTag ? (
                                    <>
                                      <i className="fas fa-check mr-1" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-copy mr-1" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-slate-50 border-2 border-slate-200 text-center">
                        <i className="fas fa-info-circle text-slate-400 text-2xl mb-3" />
                        <p className="text-slate-600 font-semibold">Discord account not linked yet</p>
                        <p className="text-sm text-slate-500 mt-1">This user hasn't connected their Discord account</p>
                      </div>
                    )}
                  </div>

                  {/* Ratings List */}
                  <div ref={connectRatingsRef} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <i className="fas fa-map-pin text-white text-lg" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        Rated Locations ({selectedRatings.length})
                      </h3>
                    </div>

                    {loadingConnectInfo ? (
                      <div className="py-12 flex items-center justify-center text-slate-500">
                        <i className="fas fa-spinner fa-spin text-2xl mr-3" />
                        <span className="font-semibold">Loading ratings...</span>
                      </div>
                    ) : connectError ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-exclamation-triangle text-2xl text-red-500" />
                        </div>
                        <p className="text-red-600 font-semibold">{connectError}</p>
                      </div>
                    ) : selectedRatings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-inbox text-slate-400 text-2xl" />
                        </div>
                        <p className="text-slate-500 font-medium">No ratings yet</p>
                      </div>
                    ) : selectedRatings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-inbox text-slate-400 text-2xl" />
                        </div>
                        <p className="text-slate-500 font-medium">No ratings yet</p>
                      </div>
                    ) : (
                      <>
                        {/* Calculate pagination */}
                        {(() => {
                          const totalPages = Math.ceil(selectedRatings.length / ratingsPerPage)
                          const startIndex = (currentRatingsPage - 1) * ratingsPerPage
                          const endIndex = startIndex + ratingsPerPage
                          const currentRatings = selectedRatings.slice(startIndex, endIndex)

                          return (
                            <>
                              <div className="space-y-4 mb-8">
                                {currentRatings.map((rating, index) => (
                                  <div
                                    key={rating.id}
                                    data-rating-card
                                    className="group p-6 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all duration-300"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                                          <i className="fas fa-map-marker-alt text-sm" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900">{rating.placeName}</span>
                                          </div>
                                          <p className="text-sm text-slate-500">{rating.placeAddress}</p>
                                          <div className="text-xs text-slate-400 mt-1">
                                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0 text-right ml-4">
                                        <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                          {rating.overallScore.toFixed(1)}
                                        </div>
                                        <div className="text-xs text-slate-500 font-semibold">/ 10</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Pagination Controls */}
                              {totalPages > 1 && (
                                <>
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Previous Button */}
                                    <button
                                      onClick={() => handleRatingsPageChange(currentRatingsPage - 1)}
                                      disabled={currentRatingsPage === 1 || isRatingsAnimating}
                                      className="group w-11 h-11 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-pink-100 to-pink-100 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:scale-110 disabled:hover:scale-100 disabled:hover:border-purple-200 flex items-center justify-center"
                                    >
                                      <i className="fas fa-chevron-left text-2xl text-purple-600 group-hover:text-purple-700 transition-colors" />
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-2">
                                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        const showPage =
                                          page === 1 ||
                                          page === totalPages ||
                                          (page >= currentRatingsPage - 1 && page <= currentRatingsPage + 1)

                                        const showEllipsis =
                                          (page === 2 && currentRatingsPage > 3) ||
                                          (page === totalPages - 1 && currentRatingsPage < totalPages - 2)

                                        if (!showPage && !showEllipsis) return null

                                        if (showEllipsis) {
                                          return (
                                            <span key={page} className="px-3 py-2 text-slate-400">
                                              ...
                                            </span>
                                          )
                                        }

                                        return (
                                          <button
                                            key={page}
                                            onClick={() => handleRatingsPageChange(page)}
                                            disabled={isRatingsAnimating}
                                            className={`w-11 h-11 rounded-full font-bold transition-all duration-300 disabled:cursor-wait ${page === currentRatingsPage
                                                ? 'bg-gradient-to-br from-pink-200 to-pink-700 text-white shadow-lg scale-110'
                                                : 'bg-gradient-to-br from-blue-100 to-pink-100 border-2 border-purple-200 text-purple-700 hover:border-purple-400 hover:shadow-lg hover:scale-105'
                                              }`}
                                          >
                                            {page}
                                          </button>
                                        )
                                      })}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                      onClick={() => handleRatingsPageChange(currentRatingsPage + 1)}
                                      disabled={currentRatingsPage === totalPages || isRatingsAnimating}
                                      className="group w-11 h-11 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-blue-100 to-pink-100 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:scale-110 disabled:hover:scale-100 disabled:hover:border-purple-200 flex items-center justify-center"
                                    >
                                      <i className="fas fa-chevron-right text-2xl text-purple-600 group-hover:text-purple-700 transition-colors" />
                                    </button>
                                  </div>

                                  {/* Page Info */}
                                  <div className="text-center mt-6 text-sm text-slate-500">
                                    Showing {startIndex + 1}-{Math.min(endIndex, selectedRatings.length)} of {selectedRatings.length} ratings
                                  </div>
                                </>
                              )}
                            </>
                          )
                        })()}
                      </>
                    )}
                  </div>
                </main>

                <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
              </div>
            </div>
          )}
        </div>
        )
}