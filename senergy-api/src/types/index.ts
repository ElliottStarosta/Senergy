export interface User {
  id: string
  email: string
  displayName: string
  avatar?: string
  createdAt: string
  
  // Personality
  personalityType?: string
  adjustmentFactor?: number
  quizCompletedAt?: string
  
  // Discord
  discordId?: string
  discordVerified?: boolean
  
  // Location
  lastRatedPlaceLocation?: { lat: number; lng: number }
  city?: string
  
  // Stats
  totalRatingsCount: number
  totalGroupsJoined: number
}

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface QuizSubmission {
  userId: string
  responses: number[]
  adjustmentFactor: number
  personalityType: string
  description: string
  timestamp: string
}

export interface RatingCategory {
  atmosphere: number
  socialEnergy: number
  crowdSize: number
  noiseLevel: number
  service: number
}

export interface Rating {
  id: string
  userId: string
  userAdjustmentFactor: number
  userPersonalityType: string
  
  placeId: string
  placeName: string
  placeAddress: string
  location: { lat: number; lng: number }
  
  categories: RatingCategory
  overallScore: number
  comment?: string
  
  createdAt: string
  updatedAt: string
}

export interface PlaceStats {
  totalRatings: number
  avgOverallScore: number
  byPersonality: {
    introvert: { avgScore: number; count: number }
    ambivert: { avgScore: number; count: number }
    extrovert: { avgScore: number; count: number }
  }
  avgCategories: RatingCategory
  lastRatedAt: string
}

export interface Place {
  id: string
  name: string
  address: string
  location: { lat: number; lng: number }
  category: string
  stats: PlaceStats
}

export interface GroupMember {
  userId: string
  displayName: string
  adjustmentFactor: number
  personalityType: string
}

export interface RecommendedPlace {
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

export interface GroupVotes {
  [userId: string]: string[] // array of placeIds in ranked order
}

export interface Group {
  id: string
  createdBy: string
  createdAt: string
  
  members: string[]
  memberProfiles: { [userId: string]: GroupMember }
  
  searchLocation: { lat: number; lng: number }
  searchRadius: number
  city?: string
  
  communityId?: string
  communityName?: string
  
  recommendedPlaces?: RecommendedPlace[]
  votes: GroupVotes
  
  finalPlace?: {
    placeId: string
    placeName: string
    selectedAt: string
    location?: { lat: number; lng: number }
  }
  
  status: 'active' | 'place_selected' | 'archived'
}

export interface Community {
  id: string
  name: string
  icon?: string
  members: string[]
  memberCount: number
  
  createdAt: string
  lastActivityAt: string
  
  stats: {
    totalGroups: number
    totalRatings: number
    personalityDistribution: {
      introvert: number
      ambivert: number
      extrovert: number
    }
    mostPopularPlaces: Array<{ placeId: string; placeName: string; ratingCount: number }>
  }
}

export interface UserPreferences {
  id: string
  matchMeWithSimilarPersonalities: boolean
  matchRadius: number
  notifyOnGroupInvites: boolean
  notifyOnRecommendations: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}