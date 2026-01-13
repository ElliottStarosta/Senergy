import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/services/firebase'
import gsap from 'gsap'
import Snowfall from 'react-snowfall'
import { getCountFromServer } from 'firebase/firestore'
import { AnimatedLogo } from '@/components/dashboard/AnimatedLogo'
import axios from 'axios'


interface Rating {
  id: string
  placeName: string
  overallScore: number
  categories: any
  comment?: string
  createdAt: string
}

interface Group {
  id: string
  members: string[]
  city?: string
  createdAt: string
  status: string
  finalPlace?: { placeName: string }
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const [recentRatings, setRecentRatings] = useState<Rating[]>([])
  const [recentGroups, setRecentGroups] = useState<Group[]>([])
  const [stats, setStats] = useState({ totalRatings: 0, totalGroups: 0, avgScore: 0 })
  const [loading, setLoading] = useState(true)

  // Load real data from Firestore
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.log('[Dashboard] No user ID, skipping data load')
        setLoading(false)
        return
      }

      try {
        console.log('[Dashboard] Loading data for user:', user.id)

        const ratingsRef = collection(db, 'ratings')
        const ratingsQuery = query(
          ratingsRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(5)
        )

        const ratingsSnap = await getDocs(ratingsQuery)
        const ratings = ratingsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Rating))

        setRecentRatings(ratings)

        const avgScore =
          ratings.length > 0
            ? Math.round(
              (ratings.reduce(
                (sum, r) => sum + (r.overallScore || 0),
                0
              ) /
                ratings.length) *
              10
            ) / 10
            : 0

        const groupsRef = collection(db, 'groups')
        const groupsQuery = query(
          groupsRef,
          where('members', 'array-contains', user.id),
          orderBy('createdAt', 'desc'),
          limit(5)
        )

        const groupsSnap = await getDocs(groupsQuery)
        const groups = groupsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Group))

        setRecentGroups(groups)

        const [ratingsCountSnap, groupsCountSnap] = await Promise.all([
          getCountFromServer(
            query(ratingsRef, where('userId', '==', user.id))
          ),
          getCountFromServer(
            query(groupsRef, where('members', 'array-contains', user.id))
          ),
        ])

        const totalRatings = ratingsCountSnap.data().count
        const totalGroups = groupsCountSnap.data().count
        setStats({
          totalRatings,
          totalGroups,
          avgScore,
        })

        console.log('[Dashboard] Stats:', {
          totalRatings,
          totalGroups,
          avgScore,
        })
      } catch (error) {
        console.error('[Dashboard] Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])


  // Animations
  useEffect(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline()
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })

    const elements = containerRef.current.querySelectorAll('[data-animate]')
    tl.fromTo(
      elements,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
      0.2
    )
  }, [loading])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-blue-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
      <Snowfall
        color="#9333ea"
        snowflakeCount={25}
        style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.5 }}
      />
      {/* Header */}
      <header className="w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md relative z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <i className="fas fa-compass text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Welcome back</p>
              <h1 className="text-lg font-bold text-slate-900">{user?.displayName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Docs Dropdown */}
            <div className="group relative">
              <button className="w-10 h-10 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all duration-300 flex items-center justify-center">
                <i className="fas fa-book text-slate-600 group-hover:text-indigo-600 transition-colors duration-300" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                <button
                  onClick={() => navigate('/discord-bot-docs')}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl transition flex items-center gap-3 group/item"
                >
                  <i className="fab fa-discord text-[#5865F2] text-lg group-hover/item:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Discord Bot</p>
                    <p className="text-xs text-slate-500">Bot commands</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/api-docs')}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-b-xl transition flex items-center gap-3 group/item"
                >
                  <i className="fas fa-code text-pink-600 text-lg group-hover/item:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">API Docs</p>
                    <p className="text-xs text-slate-500">Developer guide</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Rate Button - Icon Only */}
            <button
              onClick={() => navigate('/rate')}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300 flex items-center justify-center group"
              title="Rate a place"
            >
              <i className="fas fa-star group-hover:rotate-12 transition-transform duration-300" />
            </button>

            {/* Groups Button - Icon Only */}
            <button
              onClick={() => navigate('/groups')}
              className="w-10 h-10 rounded-xl border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 flex items-center justify-center group"
              title="Groups"
            >
              <i className="fas fa-users group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Sign Out Button - Icon Only */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 flex items-center justify-center group"
              title="Sign out"
            >
              <i className="fas fa-sign-out-alt group-hover:-translate-x-0.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Personality Card */}
        <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-pink-600/10">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-6">
                {/* Animated Logo */}
                {user?.personalityType && <AnimatedLogo />}

                {/* Text Content */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Your personality</p>
                  <h2 className="text-4xl font-bold text-slate-900 mt-2">{user?.personalityType || 'Not set'}</h2>
                  <p className="text-slate-600 mt-3">
                    {user?.personalityType
                      ? 'Your adjustment factor helps us understand your preferences and find places that match your energy.'
                      : 'Complete the personality quiz to unlock personalized recommendations.'}
                  </p>
                </div>
              </div>

              {/* Energy Scale */}
              {user?.adjustmentFactor !== undefined && (
                <div className="mt-6 p-5 bg-white/30 backdrop-blur-sm rounded-xl border border-indigo-200">


                  <p className="text-sm font-semibold text-slate-700 mb-3">Energy Scale</p>
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-600 mb-4">
                    <span className="font-medium">Introvert</span>
                    <span className="font-medium">Extrovert</span>
                  </div>
                  <div className="h-3 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full relative">
                    <div
                      className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-900 border-2 border-white rounded-full absolute top-1/2 -translate-y-1/2 shadow-lg"
                      style={{ left: `calc(${((user.adjustmentFactor + 1) / 2) * 100}% - 10px)` }}
                    />
                  </div>






                </div>
              )}
            </div>

            {/* Quiz Button (only if no personality type) */}
            {!user?.personalityType && (
              <button
                onClick={() => navigate('/quiz')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition flex-shrink-0"
              >
                Take Quiz
              </button>
            )}
          </div>
        </div>


        {/* Stats Cards */}
        <div data-animate className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Ratings</p>
            <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.totalRatings}</p>
            <p className="text-sm text-slate-500 mt-2">Places you've rated</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Groups Created</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{stats.totalGroups}</p>
            <p className="text-sm text-slate-500 mt-2">Activities planned</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Average Score</p>
            <p className="text-4xl font-bold text-pink-600 mt-2">{stats.avgScore}</p>
            <p className="text-sm text-slate-500 mt-2">Out of 10</p>
          </div>
        </div>

        {/* Recent Ratings */}
        <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Ratings</h3>
            <button
              onClick={() => navigate('/rate')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Rate more →
            </button>
          </div>

          <div className="space-y-3">
            {recentRatings.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">
                No ratings yet.{' '}
                <button
                  onClick={() => navigate('/rate')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Rate a place
                </button>
              </p>
            ) : (
              recentRatings.map(rating => (
                <div key={rating.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{rating.placeName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </p>
                      {rating.comment && <p className="text-sm text-slate-600 mt-2">{rating.comment}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">
                        {Number.isFinite(rating.overallScore) ? rating.overallScore : '—'}
                      </p>
                      <p className="text-xs text-slate-500">/10</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Groups */}
        <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Groups</h3>
            <button
              onClick={() => navigate('/groups')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Create group →
            </button>
          </div>

          <div className="space-y-3">
            {recentGroups.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">
                No groups yet.{' '}
                <button
                  onClick={() => navigate('/groups')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Create your first group
                </button>
              </p>
            ) : (
              recentGroups.map(group => (
                <div key={group.id} onClick={() => navigate(`/groups/${group.id}`)}     className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition cursor-pointer hover:border-indigo-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {group.finalPlace?.placeName || `Group · ${group.members.length} people`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {group.city} • {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${group.status === 'place_selected'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      {group.status === 'place_selected' ? 'Planned' : 'Planning'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div data-animate className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => navigate('/rate')}
            className="p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition group"
          >
            <i className="fas fa-star text-2xl text-indigo-600 mb-3 group-hover:scale-110 transition" />
            <p className="font-semibold text-slate-900">Rate a Place</p>
            <p className="text-xs text-slate-500 mt-1">Share your experience</p>
          </button>

          <button
            onClick={() => navigate('/groups')}
            className="p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition group"
          >
            <i className="fas fa-users text-2xl text-purple-600 mb-3 group-hover:scale-110 transition" />
            <p className="font-semibold text-slate-900">Create Group</p>
            <p className="text-xs text-slate-500 mt-1">Plan with friends</p>
          </button>


          <button
            onClick={() => navigate('/explore')}
            className="p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition group"
          >
            <i className="fas fa-compass text-2xl text-pink-600 mb-3 group-hover:scale-110 transition" />
            <p className="font-semibold text-slate-900">Explore</p>
            <p className="text-xs text-slate-500 mt-1">Discover people & places</p>
          </button>
        </div>


      </main>
    </div>
  )
}