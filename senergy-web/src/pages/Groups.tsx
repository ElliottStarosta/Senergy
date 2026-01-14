import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import gsap from 'gsap'
import Snowfall from 'react-snowfall'
import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/services/firebase'
import api from '@/api/config'

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
  finalPlace?: {
    placeId: string;
    placeName: string;
    selectedAt: string,
    location?: { lat: number; lng: number }
  }

  recommendedPlaces?: RecommendedPlace[]
  votes?: { [userId: string]: string[] }
}

const STAGE = {
  LIST: 'list',
  DETAIL: 'detail',
}

const PlaceCard: React.FC<{
  place: RecommendedPlace;
  idx: number;
  navigate: any;
  currentGroupId: string;
}> = ({ place, idx, navigate, currentGroupId }) => {
  const [expanded, setExpanded] = React.useState(false);
  const expandRef = React.useRef<HTMLDivElement>(null);
  const iconRef = React.useRef<HTMLDivElement>(null);

  

  React.useEffect(() => {
    if (expandRef.current) {
      if (expanded) {
        gsap.fromTo(
          expandRef.current,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      } else {
        gsap.to(expandRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        });
      }
    }
  }, [expanded]);

  const getBadgeColor = (index: number) => {
    if (index === 0) return 'from-indigo-500 to-purple-500';
    if (index === 1) return 'from-blue-500 to-cyan-500';
    return 'from-violet-500 to-pink-500';
  };

  const getBgGradient = (index: number) => {
    if (index === 0) return 'from-indigo-50 via-purple-50 to-pink-50';
    if (index === 1) return 'from-blue-50 to-cyan-50';
    return 'from-violet-50 to-pink-50';
  };

  const getScoreColors = (index: number) => {
    if (index === 0) return { score: 'from-indigo-500 to-indigo-600', conf: 'from-purple-500 to-purple-600' };
    if (index === 1) return { score: 'from-blue-500 to-blue-600', conf: 'from-cyan-500 to-cyan-600' };
    return { score: 'from-violet-500 to-violet-600', conf: 'from-pink-500 to-pink-600' };
  };

  return (
    <div
    className={`min-h-[380px] group relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBgGradient(idx)} border-2 ${
      idx === 0 ? 'border-indigo-200' : idx === 1 ? 'border-blue-200' : 'border-violet-200'
    } transition-all duration-300 hover:shadow-xl`}
  >
      {/* Top Icon Badge */}
      <div className="pt-6 pb-4 flex justify-center">
        <div
          ref={iconRef}
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getBadgeColor(idx)} flex items-center justify-center shadow-lg`}
        >
          {idx === 0 && <i className="fas fa-medal text-white text-2xl" />}
          {idx === 1 && <i className="fas fa-gem text-white text-2xl" />}
          {idx === 2 && <i className="fas fa-crown text-white text-2xl" />}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-6">
        {/* Name & Location */}
        <div className="text-center">
        <h3 className="font-bold text-2xl leading-tight text-slate-900 mb-1 line-clamp-2 min-h-[2.5rem]">
        {place.placeName}
          </h3>
          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
            <i className="fas fa-location-dot text-indigo-500" />
            <span className="line-clamp-1">{place.address}</span>
          </p>
        </div>

        {/* Score & Confidence Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`px-4 py-3 rounded-xl bg-gradient-to-br ${getScoreColors(idx).score} shadow-md`}>
            <div className="text-[10px] font-semibold text-white/80 uppercase tracking-wide mb-1">Score</div>
            <div className="font-bold text-2xl font-black text-white">{place.predictedScore.toFixed(1)}</div>
          </div>
          <div className={`px-4 py-3 rounded-xl bg-gradient-to-br ${getScoreColors(idx).conf} shadow-md`}>
            <div className="text-[10px] font-semibold text-white/80 uppercase tracking-wide mb-1">Match</div>
            <div className="font-bold text-2xl font-black text-white">{Math.round(place.confidenceScore * 100)}%</div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="w-full py-2.5 rounded-xl bg-white/30 backdrop-blur-sm border border-slate-200 hover:bg-white/70 hover:border-indigo-300 transition-all duration-300 flex items-center justify-between px-4 group/btn"
        >
          <span className="text-sm font-semibold text-slate-700">
            {expanded ? 'Hide Details' : 'Show Details'}
          </span>
          <i className={`fas fa-chevron-down text-slate-600 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expandable Details */}
        <div ref={expandRef} style={{ height: 0, opacity: 0 }}>
          <div className="space-y-3 pt-2">
            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2 rounded-lg bg-gradient-to-tl from-blue-400/20 to-purple-100/60 border border-slate-200">
                <div className="flex items-center gap-2">
                  <i className="fas fa-chart-line text-indigo-500 text-sm" />
                  <div>
                    <div className="text-[10px] text-slate-600 font-semibold">Avg Rating</div>
                    <div className="font-bold text-lg font-black text-slate-900">{place.predictedScore.toFixed(1)}/10</div>
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-pink-200/80 to-purple-100/60 border border-slate-200">
                <div className="flex items-center gap-2">
                  <i className="fas fa-bullseye text-purple-500 text-sm" />
                  <div>
                    <div className="text-[10px] text-slate-600 font-semibold">Confidence</div>
                    <div className=" font-bold text-lg font-black text-slate-900">{Math.round(place.confidenceScore * 100)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Tags */}
            {place.reasoning && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Why this place?</div>
                <div className="flex flex-wrap gap-2">
                  {place.reasoning.split('•').filter(item => item.trim()).map((insight, i) => {
                    const trimmed = insight.trim();
                    let icon = 'fa-check-circle';
                    let bgColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    
                    if (trimmed.toLowerCase().includes('excellent') || trimmed.toLowerCase().includes('great')) {
                      icon = 'fa-star';
                      bgColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (trimmed.toLowerCase().includes('close') || trimmed.toLowerCase().includes('nearby') || trimmed.toLowerCase().includes('km')) {
                      icon = 'fa-location-dot';
                      bgColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (trimmed.toLowerCase().includes('rating') || trimmed.toLowerCase().includes('based')) {
                      icon = 'fa-chart-line';
                      bgColor = 'bg-purple-50 text-purple-700 border-purple-200';
                    }
                    
                    return (
                      <span 
                        key={i} 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${bgColor} text-[11px] font-semibold`}
                      >
                        <i className={`fas ${icon}`} />
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

           {/* View Full Details Button */}
           <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/places/${place.placeId}?groupId=${currentGroupId}`);
              }}
              onMouseEnter={(e) => {
                const arrow = e.currentTarget.querySelector('.arrow-icon');
                if (arrow) {
                  gsap.fromTo(
                    arrow,
                    { opacity: 0, x: -10, scale: 0.5 },
                    { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }
                  );
                }
                gsap.to(e.currentTarget, {
                  scale: 1.05,
                  duration: 0.3,
                  ease: 'power2.out',
                  transformOrigin: 'center center',
                  borderRadius: '0.75rem'
                });
              }}
              onMouseLeave={(e) => {
                const arrow = e.currentTarget.querySelector('.arrow-icon');
                if (arrow) {
                  gsap.to(arrow, {
                    opacity: 0,
                    x: -10,
                    scale: 0.5,
                    duration: 0.2,
                    ease: 'power2.in'
                  });
                }
                gsap.to(e.currentTarget, {
                  scale: 1,
                  duration: 0.2,
                  ease: 'power2.in',
                  transformOrigin: 'center center',
                  borderRadius: '0.75rem'
                });
              }}
              className={`relative w-full py-4 px-6 rounded-xl bg-gradient-to-r ${getBadgeColor(idx)} text-white font-bold shadow-md overflow-hidden group`}
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out rounded-xl" />
              
              {/* Content */}
              <div className="relative flex items-center justify-center">
                <span className="font-bold text-base tracking-wide">View Full Details</span>
                <i className="arrow-icon fas fa-arrow-right absolute right-0 opacity-0 text-lg" style={{ transform: 'translateX(-10px) scale(0.5)' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(['all']))
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const filterMenuRef = useRef<HTMLDivElement>(null)

  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Toggle map expand/collapse with animation (copied from PlaceDetails.tsx)
  const toggleMap = () => {
    console.log('[Groups] toggleMap called, isMapExpanded:', isMapExpanded)
    console.log('[Groups] mapContainerRef.current:', mapContainerRef.current)

    if (!mapContainerRef.current) {
      console.error('[Groups] mapContainerRef.current is null!')
      return
    }

    if (isMapExpanded) {
      console.log('[Groups] Collapsing map...')
      // Collapse animation
      gsap.to(mapContainerRef.current, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          console.log('[Groups] Map collapsed, setting isMapExpanded to false')
          setIsMapExpanded(false)
        }
      })
    } else {
      console.log('[Groups] Expanding map...')
      // Expand animation
      setIsMapExpanded(true)
      console.log('[Groups] isMapExpanded set to true, starting animation...')

      gsap.fromTo(
        mapContainerRef.current,
        { height: 0, opacity: 0, marginTop: 0 },
        {
          height: 450,
          opacity: 1,
          marginTop: 24,
          duration: 0.6,
          ease: 'power3.out',
          onComplete: () => {
            console.log('[Groups] Map expansion animation complete')
          }
        }
      )
    }
  }

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

  // Firebase listener for groups list
  useEffect(() => {
    if (!user?.id || stage !== STAGE.LIST) return

    console.log('🔥 Setting up Firebase listener for groups list')

    // Subscribe to all groups where user is a member
    const groupsRef = collection(db, 'groups')
    const q = query(
      groupsRef,
      where('members', 'array-contains', user.id),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedGroups = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Group))

        console.log('🔥 Groups list updated from Firebase:', updatedGroups.length)
        setGroups(updatedGroups)
        setLoading(false)
      },
      (error) => {
        console.error('Firebase groups listener error:', error)
        setLoading(false)
      }
    )

    return () => {
      console.log('🔥 Cleaning up groups list listener')
      unsubscribe()
    }
  }, [user?.id, stage])

  // Firebase listener for current group detail
  useEffect(() => {
    if (!currentGroup?.id || stage !== STAGE.DETAIL) return

    console.log('🔥 Setting up Firebase listener for group:', currentGroup.id)

    // Subscribe to real-time updates from Firebase
    const unsubscribe = onSnapshot(
      doc(db, 'groups', currentGroup.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const updatedData = snapshot.data()
          const updatedGroup = { id: snapshot.id, ...updatedData } as Group

          console.log('🔥 Real-time update received from Firebase')

          // Check if data actually changed to avoid unnecessary re-renders
          if (
            updatedGroup.status !== currentGroup.status ||
            (updatedGroup.recommendedPlaces?.length || 0) !== (currentGroup.recommendedPlaces?.length || 0) ||
            Object.keys(updatedGroup.votes || {}).length !== Object.keys(currentGroup.votes || {}).length ||
            updatedGroup.finalPlace?.placeId !== currentGroup.finalPlace?.placeId ||
            JSON.stringify(updatedGroup.members) !== JSON.stringify(currentGroup.members)
          ) {
            setCurrentGroup(updatedGroup)
            calculateGroupStats(updatedGroup)
          }
        }
      },
      (error) => {
        console.error('Firebase listener error:', error)
      }
    )

    // Cleanup listener on unmount
    return () => {
      console.log('🔥 Cleaning up Firebase listener')
      unsubscribe()
    }
  }, [currentGroup?.id, stage])

  // Load groups on mount (fallback if Firebase fails)
  useEffect(() => {
    if (!user?.id || !token) return

    const loadGroups = async () => {
      try {
        const response = await api.get('/api/groups/user/active', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const groupsData = response.data.data || []
        
        // Only set if Firebase hasn't loaded yet
        if (groups.length === 0) {
          setGroups(groupsData)
        }

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

  // Filter menu animation
  useEffect(() => {
    if (!filterMenuRef.current) return

    const menu = filterMenuRef.current
    const buttons = menu.querySelectorAll('[data-filter-button]')

    if (filterMenuOpen) {
      gsap.to(menu, {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      })
      gsap.fromTo(
        buttons,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'back.out(1.7)', delay: 0.1 }
      )
    } else {
      gsap.to(menu, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      })
    }
  }, [filterMenuOpen])

  // Filter functions
  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => {
      const newFilters = new Set(prev)

      if (filterId === 'all') {
        return new Set(['all'])
      }

      newFilters.delete('all')

      if (newFilters.has(filterId)) {
        newFilters.delete(filterId)
        if (newFilters.size === 0) {
          return new Set(['all'])
        }
      } else {
        newFilters.add(filterId)

        // Check if all non-"all" filters are now selected
        const allPossibleFilters = ['active', 'place_selected', 'archived']
        const allSelected = allPossibleFilters.every(f => newFilters.has(f))

        if (allSelected) {
          return new Set(['all'])
        }
      }

      return newFilters
    })
  }

  const getFilteredGroups = () => {
    if (selectedFilters.has('all')) {
      return groups
    }
    return groups.filter(g => selectedFilters.has(g.status))
  }

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
          <DashboardReturnBtn />
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

            {/* Filter Menu */}
            <div className="mb-6 px-4 sm:px-0">
              {/* Hamburger Button */}
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className={`w-6 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 ${filterMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                  <div className={`w-6 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 ${filterMenuOpen ? 'opacity-0' : ''}`} />
                  <div className={`w-6 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 ${filterMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>
                <span className="font-bold text-slate-900">Filters</span>
                <div className="flex items-center gap-1.5 ml-2">
                  {selectedFilters.has('all') ? (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-bold">
                      All
                    </span>
                  ) : (
                    Array.from(selectedFilters).map(filter => (
                      <span key={filter} className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold flex items-center gap-1">
                        {filter === 'active' && 'Planning'}
                        {filter === 'place_selected' && 'Planned'}
                        {filter === 'archived' && 'Archived'}
                      </span>
                    ))
                  )}
                </div>
              </button>

              {/* Filter Options */}
              <div
                ref={filterMenuRef}
                style={{ height: 0, opacity: 0}}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[
                    { id: 'all', label: 'All Groups', icon: 'fa-layer-group' },
                    { id: 'active', label: 'Planning', icon: 'fa-clock' },
                    { id: 'place_selected', label: 'Planned', icon: 'fa-check-circle' },
                    { id: 'archived', label: 'Archived', icon: 'fa-archive' },
                  ].map((filter) => {
                    const count = filter.id === 'all'
                      ? groups.length
                      : groups.filter(g => g.status === filter.id).length
                    const isSelected = selectedFilters.has(filter.id)

                    return (
                      <button
                        key={filter.id}
                        data-filter-button
                        onClick={() => toggleFilter(filter.id)}
                        className={`p-4 rounded-xl font-semibold transition-all duration-300 flex flex-col items-center gap-2 ${isSelected
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                            : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md'
                          }`}
                      >
                        <i className={`fas ${filter.icon} text-2xl`} />
                        <span className="text-sm">{filter.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Active Filter Tags */}
            {!selectedFilters.has('all') && (
              <div className="flex flex-wrap gap-2 mb-6 pb-2">
                {Array.from(selectedFilters).map(filter => (
                  <div key={filter} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md">
                    <i className={`fas ${filter === 'active' ? 'fa-clock' :
                        filter === 'place_selected' ? 'fa-check-circle' :
                          'fa-archive'
                      }`} />
                    {filter === 'active' && 'Planning'}
                    {filter === 'place_selected' && 'Planned'}
                    {filter === 'archived' && 'Archived'}
                    <button
                      onClick={() => toggleFilter(filter)}
                      className="ml-1 hover:bg-white/20 rounded-full p-1 transition"
                    >
                      <i className="fas fa-times text-xs" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setSelectedFilters(new Set(['all']))}
                  className="px-4 py-2 rounded-full bg-white border-2 border-slate-200 text-slate-700 text-sm font-semibold hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
                >
                  Clear all
                </button>
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
              <>
                {getFilteredGroups().length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center">
                    <i className="fas fa-filter text-4xl text-slate-300 mb-4" />
                    <p className="text-slate-600 mb-4 text-lg font-semibold">No groups match your filters</p>
                    <p className="text-slate-500">Try selecting different filters above</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {getFilteredGroups().map((group, idx) => (
                  <div
                    key={group.id}
                    data-animate
                    onMouseEnter={() => setHoveredGroupId(group.id)}
                    onMouseLeave={() => setHoveredGroupId(null)}
                    onClick={(e) => {
                      // Don't navigate if clicking archive button
                      if ((e.target as HTMLElement).closest('.archive-btn')) {
                        return
                      }
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
              </>
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
                  <div className={`w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center`}>
                    <i className="fas fa-circle-check text-lg text-green-800" />
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
            {currentGroup.status !== 'place_selected' && currentGroup.recommendedPlaces && currentGroup.recommendedPlaces.length > 0 && (
              <div data-animate className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-star text-white text-sm" />
                  </div>
                  Top Recommendations
                </h2>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {currentGroup.recommendedPlaces.length} {currentGroup.recommendedPlaces.length === 1 ? 'Place' : 'Places'}
                </span>
              </div>
          
              <div className="grid grid-cols-3 gap-6 items-stretch">
              {currentGroup.recommendedPlaces.slice(0, 3).map((place, idx) => (
                  <PlaceCard 
                    key={place.placeId}
                    place={place}
                    idx={idx}
                    navigate={navigate}
                    currentGroupId={currentGroup.id}
                  />
                ))}
              </div>
          
              {/* Remaining Places (4th and 5th) */}
              {currentGroup.recommendedPlaces.length > 3 && (
                <div className="mt-6 space-y-3">
                  <div className="text-sm font-bold text-slate-600 mb-3">More Options</div>
                  {currentGroup.recommendedPlaces.slice(3, 5).map((place, idx) => (
                    <div
                      key={place.placeId}
                      onClick={() => navigate(`/places/${place.placeId}?groupId=${currentGroup.id}`)}
                      className="group p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-300 cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                          {idx + 4}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {place.placeName}
                          </h3>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <i className="fas fa-location-dot text-indigo-500" />
                            <span className="line-clamp-1">{place.address}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-black text-indigo-600">{place.predictedScore.toFixed(1)}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">Score</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-purple-600">{Math.round(place.confidenceScore * 100)}%</div>
                            <div className="text-[10px] text-slate-500 font-semibold">Match</div>
                          </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

            {/* Final Place Selected */}
            {currentGroup.status === 'place_selected' && currentGroup.finalPlace && (
              <div
                data-animate
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-8 text-white shadow-2xl"
              >
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
                      <p className="text-emerald-100 mt-1">
                        Your group has chosen a destination
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                    <h3 className="text-2xl font-bold mb-2">
                      {currentGroup.finalPlace.placeName}
                    </h3>
                    <p className="text-emerald-50 flex items-center gap-2">
                      <i className="fas fa-calendar" />
                      {new Date(
                        currentGroup.finalPlace.selectedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={toggleMap}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 font-semibold text-sm group border-2 border-white/30"
                    >
                      <i
                        className={`fas ${isMapExpanded ? 'fa-compress' : 'fa-map'
                          } group-hover:scale-110 transition-transform duration-300`}
                      />
                      {isMapExpanded ? 'Hide Map' : 'Show Map'}
                    </button>

                    {/* FIXED: missing <a> tag */}
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        currentGroup.finalPlace.placeName
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-600 font-bold hover:shadow-lg transition hover:scale-105"
                    >
                      <i className="fas fa-map-location-dot" />
                      View on Maps
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
                        src={`https://www.google.com/maps?q=${currentGroup.finalPlace.location
                            ? `${currentGroup.finalPlace.location.lat},${currentGroup.finalPlace.location.lng}`
                            : encodeURIComponent(currentGroup.finalPlace.placeName)
                          }&output=embed`}
                        className="w-full h-full rounded-xl border-2 border-white/30 shadow-2xl"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Location Map"
                        allowFullScreen
                      />
                    )}
                  </div>
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

              {/* Archive Button (only for creator) */}
              {currentGroup.createdBy === user?.id && currentGroup.status !== 'archived' && (
                <button
                  onClick={async () => {
                    if (!confirm('Archive this group? You can view it later in archived groups.')) return

                    try {
                      await api.post(
                        `/api/groups/${currentGroup.id}/archive`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      )

                      // Refresh groups
                      const response = await api.get('/api/groups/user/active', {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      setGroups(response.data.data || [])
                      setStage(STAGE.LIST)
                    } catch (error) {
                      console.error('Failed to archive group:', error)
                      alert('Failed to archive group')
                    }
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-red-200 text-red-700 font-semibold hover:border-red-300 hover:bg-red-50 transition flex items-center gap-2"
                >
                  <i className="fas fa-archive" />
                  Archive Group
                </button>
              )}

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