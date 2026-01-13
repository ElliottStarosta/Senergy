import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import gsap from 'gsap'

interface Match {
  userId: string
  displayName: string
  personalityType: string
  adjustmentFactor: number
  similarity: number
  distance: number
}

export const Matching: React.FC = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [personalityRange, setPersonalityRange] = useState(0.3)
  const [maxDistance, setMaxDistance] = useState(50)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Load matches
  useEffect(() => {
    if (!user?.id || !token) return

    const loadMatches = async () => {
      try {
        const response = await axios.get(
          `/api/users/matches?personalityRange=${personalityRange}&maxDistance=${maxDistance}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMatches(response.data.data || [])
      } catch (error) {
        console.error('Failed to load matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user?.id, token, personalityRange, maxDistance])

  // Animations
  useEffect(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline()
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-match-card]')
      tl.fromTo(
        cards,
        { opacity: 0, y: 24, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)' },
        0.2
      )
    }
  }, [loading])

  const handleCreateGroupWithMatches = async () => {
    if (selectedUsers.length === 0) {
      alert('Select at least one person')
      return
    }

    navigate('/groups', {
      state: { preSelectedMembers: selectedUsers },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-blue-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-slate-600">Finding your match...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50"
    >
      {/* Header */}
      <header className="w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 hover:opacity-75 transition"
          >
            <i className="fas fa-arrow-left text-indigo-600" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Find Squad</p>
              <h1 className="text-lg font-bold text-slate-900">People like you</h1>
            </div>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition"
          >
            Back
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Filter Matches</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personality Range */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-3">
                Personality Range: {(personalityRange * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={personalityRange}
                onChange={e => setPersonalityRange(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">
                {personalityRange < 0.3 && 'Very similar personality'}
                {personalityRange >= 0.3 && personalityRange < 0.6 && 'Similar personality'}
                {personalityRange >= 0.6 && 'Some personality differences'}
              </p>
            </div>

            {/* Distance Range */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-3">
                Distance: Up to {maxDistance}km
              </label>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={maxDistance}
                onChange={e => setMaxDistance(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">
                {maxDistance <= 15 && 'Very close by'}
                {maxDistance > 15 && maxDistance <= 50 && 'Same city/area'}
                {maxDistance > 50 && 'Broader search area'}
              </p>
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        <div ref={cardsRef} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Squad</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
              </h2>
            </div>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleCreateGroupWithMatches}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
              >
                Create Group with {selectedUsers.length}
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center">
              <i className="fas fa-search text-4xl text-slate-300 mb-4" />
              <p className="text-slate-600 mb-4">No matches found yet</p>
              <p className="text-sm text-slate-500">
                Try adjusting your filters or come back once more people join Senergy
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map(match => {
                const isSelected = selectedUsers.includes(match.userId)
                const personalityColor =
                  match.adjustmentFactor < -0.2
                    ? 'from-blue-400 to-blue-500'
                    : match.adjustmentFactor > 0.2
                    ? 'from-pink-400 to-pink-500'
                    : 'from-purple-400 to-purple-500'

                return (
                  <button
                    key={match.userId}
                    data-match-card
                    onClick={() => {
                      if (isSelected) {
                        setSelectedUsers(selectedUsers.filter(id => id !== match.userId))
                      } else {
                        setSelectedUsers([...selectedUsers, match.userId])
                      }
                    }}
                    className={`p-6 rounded-2xl border-2 transition text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{match.displayName}</h3>
                        <p className="text-xs text-slate-500 mt-1">{match.personalityType}</p>
                      </div>
                      {isSelected && <i className="fas fa-check-circle text-indigo-600 text-lg" />}
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-slate-100">
                      {/* Similarity */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Compatibility</span>
                        <span className="font-semibold text-indigo-600">
                          {Math.round(match.similarity * 100)}%
                        </span>
                      </div>

                      {/* Distance */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Distance</span>
                        <span className="font-semibold text-slate-900">{match.distance.toFixed(1)}km</span>
                      </div>
                    </div>

                    {/* Personality Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${personalityColor}`}>
                      <i
                        className={`fas ${
                          match.adjustmentFactor < -0.2
                            ? 'fa-headphones'
                            : match.adjustmentFactor > 0.2
                            ? 'fa-music'
                            : 'fa-balance-scale'
                        } text-white text-xs`}
                      />
                      <span className="text-xs font-semibold text-white">
                        {Math.round((match.adjustmentFactor + 1) / 2 * 100)}% Social
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* How It Works */}
        {matches.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">💡 How Matching Works</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p>
                <strong>Compatibility %</strong> - Based on personality type similarity. Introverts match with
                introverts, extroverts with extroverts.
              </p>
              <p>
                <strong>Distance</strong> - How far away they are from your last rated place. Closer = easier to
                meet up.
              </p>
              <p>
                <strong>Select & Group</strong> - Pick multiple matches and create a group with them to get
                recommendations for places everyone will enjoy.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}