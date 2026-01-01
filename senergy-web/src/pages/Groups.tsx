import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import gsap from 'gsap'
import Snowfall from 'react-snowfall'
import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'

interface GroupMember {
  userId: string
  displayName: string
  personalityType: string
  adjustmentFactor: number
}

interface GroupStats {
  totalMembers: number
  avgCompatibility: number
  personalityDistribution: {
    introvert: number
    ambivert: number
    extrovert: number
  }
  recentActivity: string
}

interface RatingCategory {
  atmosphere: number
  socialEnergy: number
  crowdSize: number
  noiseLevel: number
  service: number
}

interface RecommendedPlace {
  placeId: string
  placeName: string
  address: string
  location: { lat: number; lng: number }
  predictedScore: number
  confidenceScore: number
  reasoning: string
  categories: RatingCategory
  memberScores?: Array<{
    userId: string
    displayName: string
    score: number
    confidence: number
  }>
}

interface Group {
  id: string
  createdBy: string
  members: string[]
  memberProfiles: { [key: string]: GroupMember }
  searchLocation: { lat: number; lng: number }
  searchRadius: number
  city: string
  discordChannelId?: string
  discordGuildId?: string
  createdAt: string
  status: 'active' | 'place_selected' | 'archived'
  finalPlace?: { placeId: string; placeName: string; selectedAt: string }
  recommendedPlaces?: RecommendedPlace[]
  votes?: { [userId: string]: string[] }
}

const STAGE = {
  LIST: 'list',
  DETAIL: 'detail',
}

export const Groups: React.FC = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { groupId } = useParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // State
  const [stage, setStage] = useState(groupId ? STAGE.DETAIL : STAGE.LIST)
  const [groups, setGroups] = useState<Group[]>([])
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  const headerIconRef = useRef<HTMLDivElement>(null);

  const handleHeaderIconRef = (element: HTMLDivElement | null) => {
    if (element && !headerIconRef.current) {
      headerIconRef.current = element;

      console.log('Element mounted, creating animation...');

      gsap.to(element, {
        y: -6,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        onStart: () => console.log('Animation started'),
      });
    }
  };

  // Load groups on mount
  useEffect(() => {
    if (!user?.id || !token) return

    const loadGroups = async () => {
      try {
        const response = await axios.get('/api/groups/user/active', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const groupsData = response.data.data || []
        setGroups(groupsData)

        // Load specific group if URL param
        if (groupId) {
          const group = groupsData.find((g: Group) => g.id === groupId)
          if (group) {
            setCurrentGroup(group)
            calculateGroupStats(group)
          }
        }
      } catch (error) {
        console.error('Failed to load groups:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [user?.id, token, groupId])

  // Calculate group statistics
  const calculateGroupStats = (group: Group) => {
    const members = Object.values(group.memberProfiles)
    const totalMembers = members.length

    // Calculate average compatibility
    let totalCompatibility = 0
    const adjustmentFactors = members.map(m => m.adjustmentFactor || 0)

    for (let i = 0; i < adjustmentFactors.length; i++) {
      for (let j = i + 1; j < adjustmentFactors.length; j++) {
        const distance = Math.abs(adjustmentFactors[i] - adjustmentFactors[j])
        const compatibility = Math.max(0, 1 - distance)
        totalCompatibility += compatibility
      }
    }

    const pairCount = (totalMembers * (totalMembers - 1)) / 2
    const avgCompatibility = pairCount > 0 ? (totalCompatibility / pairCount) * 100 : 100

    // Personality distribution
    const distribution = {
      introvert: members.filter(m => (m.adjustmentFactor || 0) <= -0.2).length,
      ambivert: members.filter(m => (m.adjustmentFactor || 0) > -0.2 && (m.adjustmentFactor || 0) < 0.2).length,
      extrovert: members.filter(m => (m.adjustmentFactor || 0) >= 0.2).length,
    }

    setGroupStats({
      totalMembers,
      avgCompatibility: Math.round(avgCompatibility),
      personalityDistribution: distribution,
      recentActivity: group.createdAt,
    })
  }

  // Animations
  useEffect(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline()
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })

    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
        0.2
      )
    }
  }, [loading, stage])

  // Animate member cards on group detail view
  useEffect(() => {
    if (stage === STAGE.DETAIL && timelineRef.current) {
      const memberCards = timelineRef.current.querySelectorAll('[data-member-card]')
      gsap.fromTo(
        memberCards,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [stage, currentGroup])

  const getPersonalityIcon = (type: string) => {
    if (type.includes('Introvert')) return 'fa-book'
    if (type.includes('Extrovert')) return 'fa-people-group'
    return 'fa-balance-scale'
  }

  const getPersonalityColor = (adjustmentFactor: number) => {
    if (adjustmentFactor <= -0.2) return 'from-blue-500 to-blue-600'
    if (adjustmentFactor >= 0.2) return 'from-pink-500 to-pink-600'
    return 'from-purple-500 to-purple-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'place_selected':
        return 'from-emerald-500 to-emerald-600'
      case 'active':
        return 'from-blue-500 to-blue-600'
      case 'archived':
        return 'from-slate-400 to-slate-500'
      default:
        return 'from-indigo-500 to-indigo-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'place_selected':
        return 'Place Selected'
      case 'active':
        return 'Planning'
      case 'archived':
        return 'Archived'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-blue-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4" />
          <p className="text-slate-600">Loading your groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
      <Snowfall
        color="#a44ef2"
        snowflakeCount={50}
        style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.2 }}
      />
      {/* Header */}
      <header className="w-full border-b border-slate-200/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon with float animation */}
            <div
              ref={handleHeaderIconRef}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0 relative"
            >
              <i className="fas fa-people-group text-white text-xl" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest letter-spacing">
                Manage your crews
              </p>
              <h1 className="text-xl font-black text-slate-900">Your Groups</h1>
            </div>
          </div>
          <DashboardReturnBtn/>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* STAGE: List Groups */}
        {stage === STAGE.LIST && (
          <div ref={contentRef} className="space-y-6">
            {/* Stats Overview */}
            {groups.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Groups</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">{groups.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <i className="fas fa-layer-group text-indigo-600 text-lg" />
                    </div>
                  </div>
                </div>

                <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Groups</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {groups.filter(g => g.status === 'active').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <i className="fas fa-circle-play text-blue-600 text-lg" />
                    </div>
                  </div>
                </div>

                <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Places Selected</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">
                        {groups.filter(g => g.status === 'place_selected').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <i className="fas fa-map-pin text-emerald-600 text-lg" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Groups Grid */}
            {groups.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center">
                <i className="fas fa-inbox text-4xl text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4 text-lg font-semibold">No groups yet</p>
                <p className="text-slate-500 mb-6">Create your first group in Discord using the <code className="bg-slate-100 px-2 py-1 rounded text-sm">/group</code> command</p>
                <a
                  href={`https://discord.com/channels/@me`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition"
                >
                  <i className="fab fa-discord" />
                  Open Discord
                </a>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group, idx) => (
                  <div
                    key={group.id}
                    data-animate
                    onMouseEnter={() => setHoveredGroupId(group.id)}
                    onMouseLeave={() => setHoveredGroupId(null)}
                    onClick={() => {
                      setCurrentGroup(group)
                      calculateGroupStats(group)
                      setStage(STAGE.DETAIL)
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 hover:border-indigo-400 transition cursor-pointer bg-white hover:shadow-xl hover:scale-105 transform duration-300"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition duration-300" />

                    {/* Top accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${getStatusColor(group.status)} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />

                    <div className="relative z-10 p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`fab fa-discord text-[#5865F2] text-lg`} />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Discord</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {group.finalPlace?.placeName || `${group.city} Group`}
                          </h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getStatusColor(group.status)}`}>
                          {getStatusLabel(group.status)}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mb-4 flex items-center gap-2 text-slate-600">
                        <i className="fas fa-location-dot text-indigo-600" />
                        <span className="text-sm font-medium">{group.city}</span>
                      </div>

                      {/* Members */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Members ({group.members.length})</p>
                        <div className="flex items-center gap-2">
                          {group.members.slice(0, 4).map(memberId => {
                            const profile = group.memberProfiles[memberId]
                            return (
                              <div
                                key={memberId}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${getPersonalityColor(profile?.adjustmentFactor || 0)}`}
                                title={profile?.displayName}
                              >
                                {profile?.displayName.charAt(0).toUpperCase()}
                              </div>
                            )
                          })}
                          {group.members.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold">
                              +{group.members.length - 4}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                        <div className="text-center">
                          <i className="fas fa-calendar text-slate-400 mb-1" />
                          <p className="text-xs text-slate-600">{new Date(group.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                          <i className="fas fa-ruler text-slate-400 mb-1" />
                          <p className="text-xs text-slate-600">{group.searchRadius}km radius</p>
                        </div>
                      </div>

                      {/* Hover arrow */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
                        <i className="fas fa-arrow-right text-indigo-600 text-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STAGE: Group Detail */}
        {stage === STAGE.DETAIL && currentGroup && groupStats && (
          <div ref={contentRef} className="space-y-8">
            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
              <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Members</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{groupStats.totalMembers}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                    <i className="fas fa-users text-indigo-600 text-lg" />
                  </div>
                </div>
              </div>

              <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compatibility</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{groupStats.avgCompatibility}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <i className="fas fa-handshake text-purple-600 text-lg" />
                  </div>
                </div>
              </div>

              <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search Radius</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{currentGroup.searchRadius}km</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <i className="fas fa-map text-blue-600 text-lg" />
                  </div>
                </div>
              </div>

              <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
                    <p className={`text-2xl font-bold mt-2 bg-gradient-to-r ${getStatusColor(currentGroup.status)} bg-clip-text text-transparent`}>
                      {getStatusLabel(currentGroup.status)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStatusColor(currentGroup.status)} opacity-20 flex items-center justify-center`}>
                    <i className="fas fa-circle-check text-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Personality Distribution */}
            <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <i className="fas fa-chart-pie text-indigo-600" />
                Group Personality Profile
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Introvert */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <i className="fas fa-book text-lg" />
                    </div>
                    <h3 className="font-bold text-slate-900">Introverts</h3>
                  </div>
                  <p className="text-4xl font-black text-blue-600 mb-2">{groupStats.personalityDistribution.introvert}</p>
                  <p className="text-sm text-slate-600">
                    {Math.round((groupStats.personalityDistribution.introvert / groupStats.totalMembers) * 100)}% of group
                  </p>
                </div>

                {/* Ambivert */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                      <i className="fas fa-balance-scale text-lg" />
                    </div>
                    <h3 className="font-bold text-slate-900">Ambiverts</h3>
                  </div>
                  <p className="text-4xl font-black text-purple-600 mb-2">{groupStats.personalityDistribution.ambivert}</p>
                  <p className="text-sm text-slate-600">
                    {Math.round((groupStats.personalityDistribution.ambivert / groupStats.totalMembers) * 100)}% of group
                  </p>
                </div>

                {/* Extrovert */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white">
                      <i className="fas fa-people-group text-lg" />
                    </div>
                    <h3 className="font-bold text-slate-900">Extroverts</h3>
                  </div>
                  <p className="text-4xl font-black text-pink-600 mb-2">{groupStats.personalityDistribution.extrovert}</p>
                  <p className="text-sm text-slate-600">
                    {Math.round((groupStats.personalityDistribution.extrovert / groupStats.totalMembers) * 100)}% of group
                  </p>
                </div>
              </div>
            </div>

            {/* Members Timeline */}
            <div ref={timelineRef} data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <i className="fas fa-people-arrows text-indigo-600" />
                Group Members
              </h2>

              <div className="space-y-3">
                {Object.entries(currentGroup.memberProfiles).map(([memberId, profile], idx) => (
                  <div
                    key={memberId}
                    data-member-card
                    className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getPersonalityColor(profile.adjustmentFactor)}`}>
                          {profile.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">{profile.displayName}</h3>
                          <p className="text-sm text-slate-600">{profile.personalityType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Energy Factor</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{profile.adjustmentFactor.toFixed(2)}</span>
                            <div className="w-20 h-2 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full relative">
                              <div
                                className="h-full bg-indigo-600 rounded-full absolute top-0 left-0"
                                style={{ width: `${((profile.adjustmentFactor + 1) / 2) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {memberId === currentGroup.createdBy && (
                          <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300">
                            <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                              <i className="fas fa-crown text-amber-600" />
                              Creator
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Places */}
            {currentGroup.recommendedPlaces && currentGroup.recommendedPlaces.length > 0 && (
              <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <i className="fas fa-star text-yellow-500" />
                  Top Recommendations
                </h2>

                <div className="space-y-4">
                  {currentGroup.recommendedPlaces.slice(0, 5).map((place, idx) => (
                    <div key={place.placeId} className="p-6 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition group">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-700 font-bold text-lg flex-shrink-0">
                            {idx === 0 && <i className="fas fa-medal" />}
                            {idx === 1 && <i className="fas fa-gem" />}
                            {idx === 2 && <i className="fas fa-crown" />}
                            {idx > 2 && <span>{idx + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition mb-2">
                              {place.placeName}
                            </h3>
                            <p className="text-sm text-slate-600 mb-3">{place.address}</p>
                            <p className="text-sm text-slate-700 italic">{place.reasoning}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Score</p>
                            <p className="text-2xl font-bold text-indigo-600">{place.predictedScore}/10</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Confidence</p>
                            <p className="text-2xl font-bold text-purple-600">{Math.round(place.confidenceScore * 100)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Category Tags */}
                      <div className="flex flex-wrap gap-2">
                        {place.categories && Object.entries(place.categories).map(([key, value]: [string, any]) => (
                          <span key={key} className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
                            {key}: {value}/10
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Place Selected */}
            {currentGroup.status === 'place_selected' && currentGroup.finalPlace && (
              <div data-animate className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <i className="fas fa-check-circle text-3xl text-emerald-200" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black">You're All Set!</h2>
                      <p className="text-emerald-100 mt-1">Your group has chosen a destination</p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                    <h3 className="text-2xl font-bold mb-2">{currentGroup.finalPlace.placeName}</h3>
                    <p className="text-emerald-50 flex items-center gap-2">
                      <i className="fas fa-calendar" />
                      {new Date(currentGroup.finalPlace.selectedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(currentGroup.finalPlace.placeName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-600 font-bold hover:shadow-lg transition hover:scale-105"
                  >
                    <i className="fas fa-map-location-dot" />
                    View on Maps
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pb-8">
              <button
                onClick={() => {
                  setStage(STAGE.LIST)
                  setCurrentGroup(null)
                  setGroupStats(null)
                }}
                className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition flex items-center gap-2"
              >
                <i className="fas fa-arrow-left" />
                Back to Groups
              </button>

              {currentGroup.discordChannelId && (
                <a
                  href={`https://discord.com/channels/${currentGroup.discordGuildId}/${currentGroup.discordChannelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  <i className="fab fa-discord" />
                  View in Discord
                </a>
              )}
            </div>
          </div>
        )}
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

        [data-animate] {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}