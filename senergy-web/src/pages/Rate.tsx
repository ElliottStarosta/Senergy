// senergy-web/src/pages/Rate.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import gsap from 'gsap'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import Snowfall from 'react-snowfall'
import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'

interface PlaceResult {
  id?: string
  name: string
  address?: string
  vicinity?: string
  lat?: number
  lng?: number
}

const ratingQuestions = [
  { key: 'atmosphere' as const, label: 'Atmosphere', hint: 'Overall vibe & feel', description: 'How was the overall atmosphere of this place?' },
  { key: 'socialEnergy' as const, label: 'Social Energy', hint: 'Social intensity', description: 'How socially engaging was the environment?' },
  { key: 'crowdSize' as const, label: 'Crowd Size', hint: 'Empty to packed', description: 'How crowded was it?' },
  { key: 'noiseLevel' as const, label: 'Noise Level', hint: 'Quiet to loud', description: 'How noisy was the environment?' },
  { key: 'service' as const, label: 'Service Quality', hint: 'Service quality', description: 'How was the service?' },
]

export const Rate: React.FC = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const containerRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLDivElement>(null)
  const questionTextRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)
  const prevRatingIndexRef = useRef<number>(0)

  // State
  const [segment, setSegment] = useState(0)
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [categorizedPlaces, setCategorizedPlaces] = useState<{ [category: string]: PlaceResult[] }>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState({
    atmosphere: 5,
    service: 5,
    crowdSize: 5,
    noiseLevel: 5,
    socialEnergy: 5,
  })
  const questionCardRef = useRef<HTMLDivElement>(null)
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const [currentRatingIndex, setCurrentRatingIndex] = useState(0)
  const [comment, setComment] = useState('')
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const hasInitializedSearch = useRef(false)
  const commentSectionRef = useRef<HTMLDivElement>(null)
  const overallScoreRef = useRef<HTMLDivElement>(null)
  const scoreTextRef = useRef<HTMLParagraphElement>(null)
  const completedTextRef = useRef<HTMLParagraphElement>(null)
  const commentBoxRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const hasAnimatedCommentSection = useRef(false)
  const successIconRef = useRef<HTMLDivElement>(null)
  const successCheckRef = useRef<HTMLElement>(null)
  const successTitleRef = useRef<HTMLHeadingElement>(null)
  const successDescRef = useRef<HTMLParagraphElement>(null)
  const successRedirectRef = useRef<HTMLParagraphElement>(null)
  const hasAnimatedSuccess = useRef(false)

  const headerIconRef = useRef<HTMLDivElement>(null)


  // GSAP idle animation for header icon
  useEffect(() => {
    if (headerIconRef.current) {
      gsap.to(headerIconRef.current, {
        y: -6,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }
  }, [])

  // Animate comment section when it appears
  useEffect(() => {
    if (segment === 2 && currentRatingIndex === ratingQuestions.length && !hasAnimatedCommentSection.current) {
      hasAnimatedCommentSection.current = true

      // Animate overall score with rotation and bounce
      if (overallScoreRef.current) {
        gsap.fromTo(overallScoreRef.current,
          { scale: 0.5, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' }
        )
      }

      // Animate score text
      if (scoreTextRef.current) {
        gsap.fromTo(scoreTextRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' }
        )
      }

      // Animate completed text
      if (completedTextRef.current) {
        gsap.fromTo(completedTextRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.4, ease: 'power2.out' }
        )
      }

      // Animate comment box
      if (commentBoxRef.current) {
        gsap.fromTo(commentBoxRef.current,
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, delay: 0.5, ease: 'power3.out' }
        )
      }

      // Animate buttons
      if (buttonsRef.current) {
        gsap.fromTo(buttonsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.7, ease: 'power2.out' }
        )
      }
    }

    // Reset animation flag when leaving comment section
    if (currentRatingIndex < ratingQuestions.length) {
      hasAnimatedCommentSection.current = false
    }
  }, [segment, currentRatingIndex])

  // Animate success screen
  useEffect(() => {
    if (segment === 3 && !hasAnimatedSuccess.current) {
      hasAnimatedSuccess.current = true

      if (successIconRef.current) {
        gsap.fromTo(successIconRef.current,
          { scale: 0, rotation: -180 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)',
            onComplete: () => {
              if (successIconRef.current) {
                gsap.to(successIconRef.current, {
                  scale: 1.1,
                  duration: 0.4,
                  yoyo: true,
                  repeat: 1,
                  ease: 'power2.inOut'
                })
              }
            }
          }
        )
      }

      if (successCheckRef.current) {
        gsap.fromTo(successCheckRef.current,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.4, delay: 0.4, ease: 'back.out(2)' }
        )
      }

      if (successTitleRef.current) {
        gsap.fromTo(successTitleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.5, ease: 'power3.out' }
        )
      }

      if (successDescRef.current) {
        gsap.fromTo(successDescRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.7, ease: 'power2.out' }
        )
      }

      if (successRedirectRef.current) {
        gsap.fromTo(successRedirectRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, delay: 0.9, ease: 'power2.out' }
        )
      }
    }
  }, [segment])

  const headerRef = useRef<HTMLDivElement>(null)

  // GSAP animation for header on category selection
  useEffect(() => {
    if (headerRef.current) {
      if (selectedCategory) {
        // Animate in category header
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        )
      } else {
        // Animate in initial header
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        )
      }
    }
  }, [selectedCategory])


  // Reverse geocode coordinates to get address
  const reverseGeocode = async (coords: { lat: number; lng: number }): Promise<PlaceResult | null> => {
    try {
      const params = new URLSearchParams({
        lat: coords.lat.toString(),
        lng: coords.lng.toString(),
      })

      const resp = await fetch(`/api/places/reverse?${params.toString()}`)
      const data = await resp.json()

      if (data.success && data.data) {
        return {
          id: data.data.id,
          name: data.data.name || 'Current Location',
          address: data.data.address || 'Your current location',
          lat: data.data.location?.lat,
          lng: data.data.location?.lng,
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }

    return null
  }

  // Search for nearby places with 5 second timeout
  const searchNearbyPlaces = async (coords: { lat: number; lng: number }, timeoutMs: number = 10000) => {
    const startTime = Date.now()

    // All queries upfront
    const allQueries = [
      { query: 'restaurant', category: '🍽️ Restaurants' },
      { query: 'cafe', category: '☕ Cafes & Coffee' },
      { query: 'bar', category: '🍺 Bars & Pubs' },
    ]

    // Create all promises immediately - they start executing right away
    const allPromises = allQueries.map(({ query, category }) => {
      const params = new URLSearchParams({
        query,
        location: `${coords.lat},${coords.lng}`,
        radius: '2000',
      })

      return fetch(`/api/places/search?${params.toString()}`)
        .then(resp => resp.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            const newPlaces = data.data
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                address: p.address,
                lat: p.location?.lat,
                lng: p.location?.lng,
              }))
              .slice(0, 6)

            console.log(`✅ Found ${newPlaces.length} ${query} results`)
            return { category, places: newPlaces }
          }
          return { category, places: [] }
        })
        .catch(error => {
          console.error(`Search error for "${query}":`, error)
          return { category, places: [] }
        })
    })

    // Wait for all to complete or timeout
    let results: Array<{ category: string; places: PlaceResult[] }> = []
    try {
      results = await Promise.race([
        Promise.all(allPromises),
        new Promise<Array<{ category: string; places: PlaceResult[] }>>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        )
      ])
    } catch (error) {
      console.log('Search timeout, returning partial results')
      // Get whatever results have completed
      results = await Promise.allSettled(allPromises).then(settled =>
        settled
          .filter((r): r is PromiseFulfilledResult<{ category: string; places: PlaceResult[] }> =>
            r.status === 'fulfilled'
          )
          .map(r => r.value)
      )
    }

    // Build the final categorized results object
    const categorizedResults: { [category: string]: PlaceResult[] } = {}
    results.forEach(({ category, places }) => {
      if (places.length > 0) {
        categorizedResults[category] = places
      }
    })

    return categorizedResults
  }



  // Get user location and search for nearby places on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedSearch.current) return

    if (!navigator.geolocation) {
      setStatus({ type: 'error', message: 'Geolocation is not supported' })
      return
    }

    // Mark as initialized immediately
    hasInitializedSearch.current = true
    let retryAttempted = false

    const attemptGeolocation = () => {
      setIsLoading(true)
      console.log('Requesting geolocation...')

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoordinates(coords)
          console.log('Got location:', coords)

          try {
            const locationPromise = reverseGeocode(coords)
            const placesPromise = searchNearbyPlaces(coords, 5000)

            const [locationResult, categorizedResults] = await Promise.all([
              locationPromise,
              placesPromise,
            ])

            // Create a special "Current Location" category
            const finalCategorized: { [category: string]: PlaceResult[] } = {}

            // Add current location category FIRST
            if (locationResult) {
              finalCategorized['📍 Your Location'] = [locationResult]
            }

            // Add other categorized results
            Object.assign(finalCategorized, categorizedResults)

            // Fallback if no results
            if (Object.keys(finalCategorized).length === 0) {
              finalCategorized['📍 Your Location'] = [{
                id: `location_${coords.lat}_${coords.lng}`,
                name: 'Current Location',
                address: 'Your current location',
                lat: coords.lat,
                lng: coords.lng,
              }]
            }

            setCategorizedPlaces(finalCategorized)
            setSegment(1)
          } catch (error) {
            console.error('Error:', error)
            setStatus({ type: 'error', message: 'Failed to find places' })
            hasInitializedSearch.current = false // Reset on error so user can retry
          } finally {
            setIsLoading(false)
          }
        },
        (error) => {
          console.log('Geolocation failed:', error)

          if (!retryAttempted) {
            retryAttempted = true
            setTimeout(() => {
              attemptGeolocation()
            }, 1000)
          } else {
            setStatus({ type: 'error', message: 'Unable to get your location' })
            setIsLoading(false)
            hasInitializedSearch.current = false // Reset on failure so user can retry
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    }

    attemptGeolocation()
  }, []) // Empty dependency array - only run once on mount

  // Segment animation
  useEffect(() => {
    if (segmentRef.current) {
      gsap.fromTo(
        segmentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [segment])

  useEffect(() => {
    if (segment === 3) {
      const timer = setTimeout(() => {
        navigate('/dashboard')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [segment, navigate])

  // Add animation for category selection
  useEffect(() => {
    if (selectedCategory && categoryRefs.current[selectedCategory]) {
      gsap.fromTo(
        categoryRefs.current[selectedCategory],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      )
    }
  }, [selectedCategory])

  // Rating question text transition animation AND keyboard handling
  useEffect(() => {
    if (segment !== 2) return

    // Skip animation on initial load
    if (prevRatingIndexRef.current === 0 && currentRatingIndex === 0) {
      prevRatingIndexRef.current = currentRatingIndex
    } else if (questionTextRef.current && prevRatingIndexRef.current !== currentRatingIndex && currentRatingIndex < ratingQuestions.length) {
      const isMovingForward = currentRatingIndex > prevRatingIndexRef.current
      const questionText = questionTextRef.current

      const tl = gsap.timeline()

      // Slide out current question text
      tl.to(questionText, {
        x: isMovingForward ? '-100%' : '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      })
        // Reset position for new question
        .set(questionText, {
          x: isMovingForward ? '100%' : '-100%',
          opacity: 0,
        })
        // Slide in new question text
        .to(questionText, {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        })

      prevRatingIndexRef.current = currentRatingIndex
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent any action during page transitions
      if (segment !== 2) return

      // If on the rating questions (not comment section)
      if (currentRatingIndex < ratingQuestions.length) {
        // Only handle if not typing in an input/textarea
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return
        }

        // Number keys: 1-9 for values 1-9, 0 for 10
        if (event.key >= '0' && event.key <= '9') {
          let value = parseInt(event.key, 10)
          if (value === 0) value = 10

          const question = ratingQuestions[currentRatingIndex]
          handleCategoryChange(question.key, value)
          event.preventDefault()
        }

        // Enter key to go to next question
        if (event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()

          if (currentRatingIndex < ratingQuestions.length - 1) {
            setCurrentRatingIndex(prev => prev + 1)
          } else if (currentRatingIndex === ratingQuestions.length - 1) {
            setCurrentRatingIndex(ratingQuestions.length)
          }
        }
      } else if (currentRatingIndex === ratingQuestions.length) {
        // On comment section - Enter submits the form (unless typing in textarea)
        if (event.key === 'Enter' && !event.shiftKey && document.activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault()
          event.stopPropagation()
          handleSubmit()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [segment, currentRatingIndex, ratingQuestions])

  // Smooth slider and card animation when changing questions (GSAP)
  useEffect(() => {
    if (segment !== 2 || !sliderRef.current || currentRatingIndex >= ratingQuestions.length) return

    const question = ratingQuestions[currentRatingIndex]
    const currentValue = categories[question.key]
    const sliderElement = sliderRef.current

    // Animate the entire question card
    if (questionCardRef.current) {
      gsap.fromTo(
        questionCardRef.current,
        { scale: 0.98, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' }
      )
    }

    // Animate slider container with a bounce
    if (sliderContainerRef.current) {
      gsap.fromTo(
        sliderContainerRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)', delay: 0.2 }
      )
    }

    // Animate slider to new value with smooth easing
    gsap.to(
      { value: parseFloat(sliderElement.value) },
      {
        value: currentValue,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 0.3,
        onUpdate: function () {
          sliderElement.value = this.targets()[0].value.toString()
          sliderElement.dispatchEvent(new Event('input', { bubbles: true }))
        },
      }
    )
  }, [currentRatingIndex, segment, ratingQuestions]) // Removed 'categories' from dependencies

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place)
    setSegment(2) // Move to rating
  }

  const handleCategoryChange = (key: keyof typeof categories, value: number) => {
    setCategories(prev => ({ ...prev, [key]: value }))
  }



  const calculateOverallScore = (): number => {
    const weights = {
      atmosphere: 0.25,
      socialEnergy: 0.25,
      crowdSize: 0.15,
      noiseLevel: 0.15,
      service: 0.2,
    }

    const weighted = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (categories[key as keyof typeof categories] * weight)
    }, 0)

    return Math.round(weighted * 10) / 10
  }

  const handleSubmit = async () => {
    if (!selectedPlace || !user) return

    setIsSubmitting(true)
    setStatus(null)

    try {


      const ratingData = {
        userId: user.id,
        userAdjustmentFactor: user.adjustmentFactor || 0,
        userPersonalityType: user.personalityType || 'Unknown',
        placeId: selectedPlace.id,
        placeName: selectedPlace.name,
        placeAddress: selectedPlace.address || '',
        location: {
          lat: selectedPlace.lat || 0,
          lng: selectedPlace.lng || 0,
        },
        categories,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Also sync to backend API
      try {
        await axios.post(
          '/api/ratings',
          ratingData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        console.log('Rating synced to backend')
      } catch (apiError) {
        console.warn('Backend sync failed, but local save succeeded:', apiError)
      }

      setStatus({ type: 'success', message: 'Rating saved! Thanks for sharing.' })
      setSegment(3) // Show success

    } catch (error: any) {
      console.error('Submit error:', error)
      setStatus({
        type: 'error',
        message: error.message || 'Failed to save rating',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50 flex flex-col"
    >
      <Snowfall
        color="#a44ef2"
        snowflakeCount={10}
        style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.2 }}
      />
      {/* Header */}
      <header className="w-full border-b border-slate-200/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon with float animation */}
            <div
              ref={headerIconRef}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0"
            >
              <i className="fas fa-star text-white text-xl" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest letter-spacing">
                Share your thoughts
              </p>
              <h1 className="text-xl font-black text-slate-900">Rate a spot</h1>
            </div>
          </div>

          <DashboardReturnBtn />
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Title */}
          <div className="mb-10 max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {segment === 0 && 'Finding nearby places'}
              {segment === 2 && 'Rate the experience'}
            </h2>
          </div>

          {/* Segment 0: Loading */}
          {segment === 0 && (
            <div ref={segmentRef} className="space-y-6">
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4" />
                    <p className="text-slate-600">Finding places near you...</p>
                  </>
                ) : (
                  <>
                    {status && (
                      <div
                        className={`px-4 py-3 rounded-xl text-sm font-semibold ${status.type === 'error'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                      >
                        {status.message}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Segment 1: Place Selection */}
          {segment === 1 && (
            <div ref={segmentRef} className="space-y-8 pb-8">
              {/* Header */}
              <div ref={headerRef} className="space-y-6 max-w-6xl mx-auto px-4 mb-12">
                <h2 className="text-2xl font-bold text-slate-900">Pick your place</h2>

                {selectedCategory && (
                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <i className={`text-2xl text-white ${selectedCategory.includes('Restaurant')
                          ? 'fas fa-utensils'
                          : selectedCategory.includes('Cafe')
                            ? 'fas fa-coffee'
                            : 'fas fa-glass-cheers'
                          }`} />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 leading-tight">
                          {selectedCategory.replace(/^[^\s]+\s/, '')}
                        </h3>
                        <p className="text-base text-slate-500 mt-2">Select the spot you want to rate</p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedCategory && (
                  <div className="space-y-3 pt-6 border-t border-slate-200">
                    <h3 className="text-3xl font-black text-slate-900">What kind of place?</h3>
                    <p className="text-base text-slate-500">Choose a category to get started</p>
                  </div>
                )}
              </div>

              {/* Category Selection or Place List */}
              {!selectedCategory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mx-auto max-w-6xl px-4">
                  {Object.keys(categorizedPlaces).map((category, idx) => {
                    const isCurrentLocation = category === '📍 Your Location'
                    const placeCount = categorizedPlaces[category].length

                    return (
                      <button
                        key={category}
                        onClick={() => {
                          if (isCurrentLocation) {
                            handlePlaceSelect(categorizedPlaces[category][0])
                          } else {
                            setSelectedCategory(category)
                          }
                        }}
                        className={`relative group overflow-hidden rounded-3xl border-2 transition-all duration-300 p-8 min-h-80 flex flex-col items-center justify-center ${isCurrentLocation
                          ? 'border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 hover:border-purple-500 hover:shadow-2xl hover:scale-105'
                          : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-2xl hover:scale-105'
                          }`}
                        style={{
                          animation: `fadeInUp 0.6s ease-out ${idx * 0.12}s both`,
                        }}
                      >
                        {/* Background animated gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Animated accent line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isCurrentLocation
                          ? 'from-purple-400 via-pink-400 to-transparent'
                          : 'from-indigo-400 via-purple-400 to-transparent'
                          } transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />

                        {/* Content */}
                        <div className="text-center flex flex-col items-center relative z-10 space-y-4">
                          {/* Icon Container */}
                          <div className={`w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl flex-shrink-0 bg-gradient-to-br ${isCurrentLocation
                            ? 'from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                            : 'from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30'
                            }`}>
                            <i className={`text-4xl text-white transition-transform duration-500 ${isCurrentLocation
                              ? 'fas fa-location-dot group-hover:scale-125'
                              : category.includes('Restaurant')
                                ? 'fas fa-utensils group-hover:scale-125'
                                : category.includes('Cafe')
                                  ? 'fas fa-coffee group-hover:scale-125'
                                  : 'fas fa-glass-cheers group-hover:scale-125'
                              }`} />
                          </div>

                          {/* Text */}
                          <div className="space-y-2">
                            <p className="font-black text-slate-900 text-xl line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                              {category.replace(/^[^\s]+\s/, '')}
                            </p>
                            <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors duration-300">
                              {isCurrentLocation ? 'Rate here' : `${placeCount} ${placeCount === 1 ? 'place' : 'places'}`}
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="absolute bottom-4 right-6 z-20">
                          <i className={`fas fa-arrow-right text-slate-400 group-hover:text-indigo-600 text-lg transition-all duration-300 group-hover:translate-x-2`} />
                        </div>

                        {/* Corner accent */}
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-white/20 to-transparent rounded-full transform translate-x-8 translate-y-8 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-500" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                /* Selected Category - Place List */
                <div
                  ref={el => {
                    if (el) categoryRefs.current[selectedCategory] = el
                  }}
                  className="space-y-6"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 font-semibold transition-all duration-300 group text-lg"
                  >
                    <i className="fas fa-arrow-left text-xl group-hover:-translate-x-2 transition-transform duration-300 flex-shrink-0" />
                    <span className="group-hover:underline">Back to Categories</span>
                  </button>

                  {/* Places Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categorizedPlaces[selectedCategory]?.map((place, idx) => (
                      <button
                        key={place.id || idx}
                        onClick={() => handlePlaceSelect(place)}
                        className="group relative overflow-hidden p-7 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all duration-300 hover:shadow-2xl hover:scale-105 text-left h-auto min-h-48 flex flex-col"
                        style={{
                          animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
                        }}
                      >
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                        {/* Content */}
                        <div className="relative z-10 flex-1 flex flex-col justify-between">
                          {/* Icon and title */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <i className="fas fa-location-dot text-white text-xl" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-300 text-lg line-clamp-2">
                                {place.name}
                              </p>
                            </div>
                          </div>

                          {/* Address */}
                          <div className="space-y-3 flex-1">
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              <i className="fas fa-map-marker-alt text-indigo-500 mr-2" />
                              {place.address}
                            </p>
                          </div>

                          {/* CTA */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 group-hover:border-indigo-200 transition-colors duration-300">
                            <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors duration-300 uppercase tracking-wide">
                              Rate this place
                            </span>
                            <i className="fas fa-arrow-right text-slate-400 group-hover:text-indigo-600 transition-all duration-300 group-hover:translate-x-2 text-lg" />
                          </div>
                        </div>

                        {/* Corner accent */}
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tl from-indigo-200/30 to-transparent rounded-full group-hover:scale-110 transition-transform duration-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {status && (
                <div
                  className={`px-6 py-4 rounded-2xl text-sm font-semibold border-l-4 ${status.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-500'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-500'
                    }`}
                >
                  <i className={`mr-2 ${status.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'}`} />
                  {status.message}
                </div>
              )}
            </div>
          )}

          {/* Segment 2: Rating Quiz */}
          {segment === 2 && selectedPlace && (
            <div ref={segmentRef} className="space-y-6">
              {/* Place Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedPlace.name}</h3>
                <p className="text-sm text-slate-600">{selectedPlace.address}</p>
              </div>

              {/* Progress Indicator */}
              {currentRatingIndex < ratingQuestions.length && (
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Question {currentRatingIndex + 1} of {ratingQuestions.length}
                      </p>
                      <h2 className="text-3xl font-bold text-slate-900 mt-1">Rate Your Experience</h2>
                    </div>
                  </div>
                </div>
              )}

              {/* Single Rating Question */}
              {currentRatingIndex < ratingQuestions.length && (() => {
                const question = ratingQuestions[currentRatingIndex]
                const value = categories[question.key]

                return (
                  <div ref={questionCardRef} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-6">
                    {/* Question Text */}
                    <div className="w-full mb-8" style={{ overflow: 'hidden' }}>
                      <h3
                        ref={questionTextRef}
                        className="text-2xl font-bold leading-tight text-slate-900"
                      >
                        {question.description}
                      </h3>
                    </div>

                    {/* Large Slider */}
                    <div ref={sliderContainerRef} className="mb-8">
                      <div className="flex items-center justify-center mb-6">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-2xl font-bold text-indigo-600 inline-block">
                            {value}
                          </span>
                          <span className="text-2xl font-semibold text-slate-500 inline-block">/ 10</span>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="relative h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-full transition-all duration-150"
                            style={{ width: `${((value - 1) / 9) * 100}%` }}
                          />
                          <input
                            ref={sliderRef}
                            type="range"
                            min={1}
                            max={10}
                            value={value}
                            onChange={e => handleCategoryChange(question.key, Number(e.target.value))}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10 slider-input"
                            style={{
                              WebkitAppearance: 'slider-horizontal',
                            } as React.CSSProperties}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-center">Use number keys (1-0) or drag. Press Enter to continue.</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Navigation */}
              {currentRatingIndex < ratingQuestions.length && (
                <div className="flex gap-4">
                  {currentRatingIndex > 0 && (
                    <button
                      onClick={() => setCurrentRatingIndex(currentRatingIndex - 1)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-chevron-left" />
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (currentRatingIndex < ratingQuestions.length - 1) {
                        setCurrentRatingIndex(currentRatingIndex + 1)
                      } else {
                        setCurrentRatingIndex(ratingQuestions.length)
                      }
                    }}
                    className={`${currentRatingIndex === 0 ? 'w-full' : 'flex-1'} py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition flex items-center justify-center gap-2`}
                  >
                    {currentRatingIndex === ratingQuestions.length - 1 ? (
                      <>
                        Finish
                        <i className="fas fa-chevron-right" />
                      </>
                    ) : (
                      <>
                        Next
                        <i className="fas fa-chevron-right" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Comment Section */}
              {currentRatingIndex >= ratingQuestions.length && (
                <div ref={commentSectionRef} className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                    <div className="mb-4">
                      <div
                        ref={overallScoreRef}
                        className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent mb-2"
                      >
                        {calculateOverallScore()}
                      </div>
                      <p ref={scoreTextRef} className="text-slate-600">
                        Your Overall Rating
                      </p>
                    </div>
                    <p ref={completedTextRef} className="text-sm text-slate-500">
                      You've completed all ratings!
                    </p>
                  </div>

                  <div ref={commentBoxRef} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <label className="text-sm font-semibold text-slate-700 mb-3 block">
                      Add a comment (optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What made this place special? Great service, cool vibes, perfect for...?"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Final Actions */}
                  <div ref={buttonsRef} className="flex gap-4">
                    <button
                      onClick={() => setCurrentRatingIndex(ratingQuestions.length - 1)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-chevron-left" />
                      Edit Ratings
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Submit Rating
                          <i className="fas fa-check" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {status && (
                <div
                  className={`px-4 py-3 rounded-xl text-sm font-semibold ${status.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                >
                  {status.message}
                </div>
              )}
            </div>
          )}

          {/* Segment 3: Success */}
          {segment === 3 && (
            <div ref={segmentRef} className="text-center py-12">
              <div
                ref={successIconRef}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mx-auto mb-6"
              >
                <i ref={successCheckRef} className="fas fa-check text-white text-3xl" />
              </div>
              <h3 ref={successTitleRef} className="text-3xl font-bold text-slate-900 mb-2">
                Rating Saved!
              </h3>
              <p ref={successDescRef} className="text-slate-600 mb-6">
                Your feedback helps the whole crew find better spots.
              </p>
              <p ref={successRedirectRef} className="text-sm text-slate-500">
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* CSS Animations */}
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
  )
}