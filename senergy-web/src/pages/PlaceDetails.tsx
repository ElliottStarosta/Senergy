  import React, { useEffect, useState, useRef } from 'react'
  import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
  import { useAuth } from '@/context/AuthContext'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  import Snowfall from 'react-snowfall'
  import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'
import api from '@/api/config'

  // Register the plugin
  gsap.registerPlugin(ScrollTrigger)

  interface PlaceDetails {
    id: string
    name: string
    address: string
    location: { lat: number; lng: number }
    stats: {
      totalRatings: number
      avgOverallScore: number
      byPersonality: {
        introvert: { avgScore: number; count: number }
        ambivert: { avgScore: number; count: number }
        extrovert: { avgScore: number; count: number }
      }
      avgCategories: {
        crowdSize: number
        noiseLevel: number
        socialEnergy: number
        service: number
        cleanliness: number
        atmosphere: number
        accessibility: number
      }
      lastRatedAt: string
    }
    ratings: Array<{
      id: string
      userId: string
      userDisplayName?: string
      userPersonalityType: string
      overallScore: number
      categories: any
      comment?: string
      createdAt: string
    }>
  }

  export const PlaceDetails: React.FC = () => {
    const { placeId } = useParams<{ placeId: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user, token } = useAuth()
    const [place, setPlace] = useState<PlaceDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const hasAnimated = useRef(false)
    const ratingsRef = useRef<HTMLDivElement | null>(null)

    const groupId = searchParams.get('groupId')


    const [currentPage, setCurrentPage] = useState(1)
    const [isAnimating, setIsAnimating] = useState(false)
    const ratingsPerPage = 5


    const containerRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const heroIconRef = useRef<HTMLDivElement>(null)
    const placeCardRef = useRef<HTMLDivElement>(null)
    const statsRef = useRef<HTMLDivElement>(null)
    const categoriesRef = useRef<HTMLDivElement>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)

    const [isMapExpanded, setIsMapExpanded] = useState(false)

    // Toggle map expand/collapse with animation
    const toggleMap = () => {
      if (!mapContainerRef.current) return

      if (isMapExpanded) {
        // Collapse animation
        gsap.to(mapContainerRef.current, {
          height: 0,
          opacity: 0,
          marginTop: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => setIsMapExpanded(false)
        })
      } else {
        // Expand animation
        setIsMapExpanded(true)
        gsap.fromTo(
          mapContainerRef.current,
          { height: 0, opacity: 0, marginTop: 0 },
          {
            height: 450,
            opacity: 1,
            marginTop: 24,
            duration: 0.6,
            ease: 'power3.out'
          }
        )
      }
    }

    useEffect(() => {
      if (!placeId) {
        setError('Place ID required')
        setLoading(false)
        return
      }

      const fetchPlaceDetails = async () => {
        try {
          const params = user?.id ? { userId: user.id } : {}

          const response = await api.get(`/api/ratings/place/${placeId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            params,
          })

          

          const placeData = response.data.data

          console.log(placeData)

          if (!placeData.ratings || placeData.ratings.length === 0) {
            setError('Place not found')
            setLoading(false)
            return
          }

          const firstRating = placeData.ratings[0]
          setPlace({
            id: placeId,
            name: firstRating.placeName,
            address: firstRating.placeAddress || '',
            location: firstRating.location,
            stats: placeData.stats || {
              totalRatings: placeData.ratings.length,
              avgOverallScore: 0,
              byPersonality: {
                introvert: { avgScore: 0, count: 0 },
                ambivert: { avgScore: 0, count: 0 },
                extrovert: { avgScore: 0, count: 0 },
              },
              avgCategories: {
                crowdSize: 0,
                noiseLevel: 0,
                socialEnergy: 0,
                service: 0,
                cleanliness: 0,
                atmosphere: 0,
                accessibility: 0,
              },
              lastRatedAt: '',
            },
            ratings: placeData.ratings.map((r: any) => ({
              id: r.id,
              userId: r.userId,
              userDisplayName: r.userEmail?.split('@')[0] || 'Anonymous',
              userPersonalityType: r.userPersonalityType || 'Unknown',
              overallScore: r.overallScore,
              categories: r.categories,
              comment: r.comment,
              createdAt: r.createdAt,
            })),
          })
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to load place details')
        } finally {
          setLoading(false)
        }
      }

      fetchPlaceDetails()
    }, [placeId, token])

    useEffect(() => {
      if (!isAnimating || !place) return

      const timer = setTimeout(() => {
        if (ratingsRef.current) {
          const cards = ratingsRef.current.querySelectorAll('[data-rating-card]')
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
              onComplete: () => setIsAnimating(false)
            }
          )
        }
      }, 150)

      return () => clearTimeout(timer)
    }, [currentPage, isAnimating, place])

    // Floating animation for hero icon
    useEffect(() => {
      if (heroIconRef.current) {
        gsap.to(heroIconRef.current, {
          y: -8,
          duration: 2.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      }
    }, [])

    // Main entrance animation
    useEffect(() => {
      if (loading || !containerRef.current || hasAnimated.current) return

      // Add delay to prevent glitching on load
      const timer = setTimeout(() => {
        hasAnimated.current = true

        // Fade in container
        gsap.fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' }
        )

        // Header Icon Animation
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

        // Animate place card - slide up with scale
        if (placeCardRef.current) {
          gsap.fromTo(
            placeCardRef.current,
            { opacity: 0, y: 60, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'back.out(1.4)',
              scrollTrigger: {
                trigger: placeCardRef.current,
                start: 'top 80%',
                toggleActions: 'play none none none'
              }
            }
          )
        }

        // Animate stats cards - staggered entrance
        if (statsRef.current) {
          const statCards = statsRef.current.querySelectorAll('[data-stat-card]')
          gsap.set(statCards, { opacity: 0, y: 50, scale: 0.8 })
        
          ScrollTrigger.create({
            trigger: statsRef.current,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.to(statCards, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                stagger: 0.05,
                ease: 'back.out(1.7)'
              })
            }
          })
        }

        // Animate categories container + bars
        if (categoriesRef.current) {
          // First animate the container
          gsap.fromTo(
            categoriesRef.current,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: categoriesRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          )

          // Animate the category bars
          const categoryItems = categoriesRef.current.querySelectorAll('.space-y-5 > div')

          ScrollTrigger.create({
            trigger: categoriesRef.current,
            start: 'top 75%',
            once: true,
            onEnter: () => {
              categoryItems.forEach((item, index) => {
                const bar = item.querySelector('.h-3 > div')
                if (bar && place && place.stats && place.stats.avgCategories) {
                  // Get the parent width and target percentage
                  const value = Object.values(place.stats.avgCategories)[index]
                  const targetWidth = `${(value / 10) * 100}%`

                  gsap.fromTo(
                    bar,
                    { width: '0%' },
                    {
                      width: targetWidth,
                      duration: 1.2,
                      delay: index * 0.1,
                      ease: 'power3.out'
                    }
                  )
                }
              })
            }
          })
        }

        // Animate ratings section
        if (ratingsRef.current) {
          gsap.fromTo(
            ratingsRef.current,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: ratingsRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          )

          // Animate individual rating cards
          const ratingCards = ratingsRef.current.querySelectorAll('[data-rating-card]')
          if (ratingCards.length > 0) {
            gsap.set(ratingCards, { opacity: 0, x: -30, scale: 0.95 })

            ScrollTrigger.create({
              trigger: ratingsRef.current,
              start: 'top 75%',
              once: true,
              onEnter: () => {
                gsap.to(ratingCards, {
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  duration: 0.6,
                  stagger: 0.1,
                  ease: 'back.out(1.7)'
                })
              }
            })
          }
        }
      }, 20) // 500ms delay

      // Cleanup
      return () => {
        clearTimeout(timer)
        ScrollTrigger.getAll().forEach(trigger => trigger.kill())
      }
    }, [loading])

    const totalPages = place ? Math.ceil(place.ratings.length / ratingsPerPage) : 0
    const startIndex = (currentPage - 1) * ratingsPerPage
    const endIndex = startIndex + ratingsPerPage
    const currentRatings = place ? place.ratings.slice(startIndex, endIndex) : []

    const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || isAnimating) return

      setIsAnimating(true)

      if (ratingsRef.current) {
        const cards = ratingsRef.current.querySelectorAll('[data-rating-card]')
        const ratingsElement = ratingsRef.current // Store reference

        // Fade out current cards
        gsap.to(cards, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          stagger: 0.05,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentPage(newPage)
            // Scroll to top of ratings section using stored reference
            window.scrollTo({
              top: ratingsElement.offsetTop - 150,
              behavior: 'smooth'
            })
          }
        })
      } else {
        setCurrentPage(newPage)
      }
    }

    if (loading) {

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4" />
            <p className="text-slate-600 font-medium">Loading place details...</p>
          </div>
        </div>
      )
    }

    if (error || !place) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Oops!</h2>
            <p className="text-slate-600 mb-6">{error || 'Place not found'}</p>
            <DashboardReturnBtn
              text="Explore"
              to="/explore"
            />
          </div>
        </div>
      )
    }

    const mapUrl = `https://www.google.com/maps?q=${place.location.lat},${place.location.lng}`
    const embedUrl = `https://www.google.com/maps?q=${place.location.lat},${place.location.lng}&output=embed`

    return (
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
        <Snowfall
          color="#6366f1"
          snowflakeCount={15}
          style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.3 }}
        />

        {/* Header */}
        <header ref={headerRef} className="relative w-full border-b border-slate-200/50 bg-white/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="header-icon w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <i className="fas fa-location-dot text-white text-2xl" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Place Details</p>
                <h1 className="text-2xl font-black text-slate-900">{place.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {groupId ? (
                <DashboardReturnBtn
                  text="Back to Group"
                  to={`/groups/${groupId}`}
                  iconClass="fas fa-arrow-left"
                />
              ) : (
                <DashboardReturnBtn
                  text="Explore"
                  to="/explore"
                  iconClass="fas fa-arrow-left"
                />
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
          {/* Place Info Hero Card */}
          <div ref={placeCardRef} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-300 via-purple-600 to-pink-300 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
            </div>

            <div className="relative z-10">
              {/* Top Section: Name, Address, Score */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-map-marker-alt text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black leading-tight">{place.name}</h2>
                      <p className="text-white/80 text-sm mt-1">{place.address}</p>
                    </div>
                  </div>
                </div>

                {/* Overall Score Badge */}
                <div className="flex-shrink-0">
                  <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30">
                    <div className="text-5xl font-black mb-2">{place.stats.avgOverallScore.toFixed(1)}</div>
                    <div className="text-white/80 text-sm font-semibold">Overall Rating</div>
                    <div className="text-white/60 text-xs mt-1">
                      {place.stats.totalRatings} {place.stats.totalRatings === 1 ? 'rating' : 'ratings'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Buttons */}
              <div className="flex flex-wrap gap-3">
                {user && (
                  <Link
                    to={`/rate?placeId=${placeId}&placeName=${encodeURIComponent(place.name)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                  >
                    <i className="fas fa-star group-hover:rotate-12 transition-transform duration-300" />
                    Rate This Place
                  </Link>
                )}

                <button
                  onClick={toggleMap}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 font-semibold text-sm group border-2 border-white/30"
                >
                  <i className={`fas ${isMapExpanded ? 'fa-compress' : 'fa-map'} group-hover:scale-110 transition-transform duration-300`} />
                  {isMapExpanded ? 'Hide Map' : 'Show Map'}
                </button>

                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 font-semibold text-sm group border-2 border-white/30"
                >
                  <i className="fas fa-external-link-alt group-hover:scale-110 transition-transform duration-300" />
                  Open in Google Maps
                </a>
              </div>

              {/* Expandable Map Embed */}
              <div
                ref={mapContainerRef}
                className="overflow-hidden rounded-xl"
                style={{ height: 0, opacity: 0, marginTop: 0 }}
              >
                {isMapExpanded && (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full rounded-xl border-2 border-white/30 shadow-2xl"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div ref={statsRef} className="grid md:grid-cols-3 gap-6">
            {/* Introvert Score */}
            <div data-stat-card className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-blue-400 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-book-reader text-white text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Introvert</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-blue-600">{place.stats.byPersonality.introvert.avgScore.toFixed(1)}</span>
                    <span className="text-sm text-slate-500">({place.stats.byPersonality.introvert.count})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambivert Score */}
            <div data-stat-card className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-purple-400 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-balance-scale text-white text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Ambivert</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-purple-600">{place.stats.byPersonality.ambivert.avgScore.toFixed(1)}</span>
                    <span className="text-sm text-slate-500">({place.stats.byPersonality.ambivert.count})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extrovert Score */}
            <div data-stat-card className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-pink-400 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-users text-white text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Extrovert</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-pink-600">{place.stats.byPersonality.extrovert.avgScore.toFixed(1)}</span>
                    <span className="text-sm text-slate-500">({place.stats.byPersonality.extrovert.count})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div ref={categoriesRef} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <i className="fas fa-chart-bar text-white text-lg" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Category Breakdown</h3>
            </div>

            <div className="space-y-5">
              {Object.entries(place.stats.avgCategories).map(([key, value], index) => (
                <div key={key} style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-lg font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {value.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(value / 10) * 100}%`,
                        animation: `progressGrow 1s ease-out ${index * 100}ms forwards`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings List */}
          <div ref={ratingsRef} className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <i className="fas fa-comments text-white text-lg" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                All Ratings ({place.ratings.length})
              </h3>
            </div>

            <div className="space-y-4 mb-8">
              {place.ratings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-inbox text-slate-400 text-2xl" />
                  </div>
                  <p className="text-slate-500 font-medium">No ratings yet</p>
                </div>
              ) : (
                currentRatings.map((rating, index) => (
                  <div
                    key={rating.id}
                    data-rating-card
                    className="group p-6 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                          {(rating.userDisplayName?.charAt(0) ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rating.userDisplayName ?? 'Unknown User'}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold">
                              {rating.userPersonalityType}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {rating.overallScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">/ 10</div>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-slate-700 leading-relaxed pl-13">{rating.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isAnimating}
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
                      (page >= currentPage - 1 && page <= currentPage + 1)

                    const showEllipsis =
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2)

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
                        onClick={() => handlePageChange(page)}
                        disabled={isAnimating}
                        className={`w-11 h-11 rounded-full font-bold transition-all duration-300 disabled:cursor-wait ${page === currentPage
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isAnimating}
                  className="group w-11 h-11 rounded-full font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-blue-100 to-pink-100 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:scale-110 disabled:hover:scale-100 disabled:hover:border-purple-200 flex items-center justify-center"
                >
                  <i className="fas fa-chevron-right text-2xl text-purple-600 group-hover:text-purple-700 transition-colors" />
                </button>
              </div>
            )}

            {/* Page Info */}
            {totalPages > 1 && (
              <div className="text-center mt-6 text-sm text-slate-500">
                Showing {startIndex + 1}-{Math.min(endIndex, place.ratings.length)} of {place.ratings.length} ratings
              </div>
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
    
          @keyframes progressGrow {
            from {
              width: 0%;
            }
          }
        `}</style>
      </div>
    )
  }