import { Router, Request, Response } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { db } from '@/config/firebase'
import { ratingService } from '@/services/rating.service'

const router = Router()

interface UserProfile {
  id: string
  displayName: string
  personalityType: string
  adjustmentFactor: number
  totalRatingsCount: number
  avatar?: string
  lastRatedPlaceLocation?: { lat: number; lng: number }
}

/**
 * GET /api/explore/people
 * Get recommended people based on personality and location
 */
router.get('/people', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const maxDistance = parseInt(req.query.maxDistance as string) || 50

    // Get current user
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const userData = userDoc.data()
    const userAF = userData?.adjustmentFactor || 0
    const userLocation = userData?.lastRatedPlaceLocation

    if (!userLocation) {
      return res.json({
        success: true,
        data: [],
        message: 'Rate a place first to get personalized recommendations',
      })
    }

    // Get all users with personality data
    const usersSnapshot = await db.collection('users')
      .where('personalityType', '!=', null)
      .limit(200)
      .get()

    const recommendations: Array<UserProfile & { similarity: number; distance: number }> = []

    for (const doc of usersSnapshot.docs) {
      if (doc.id === userId) continue

      const otherUser = doc.data()
      if (!otherUser.lastRatedPlaceLocation) continue

      const otherAF = otherUser.adjustmentFactor || 0

      // Calculate personality similarity (0-1)
      const afDistance = Math.abs(userAF - otherAF)
      const similarity = Math.max(0, 1 - afDistance)

      // Calculate distance
      const distance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        otherUser.lastRatedPlaceLocation.lat,
        otherUser.lastRatedPlaceLocation.lng
      )

      if (distance <= maxDistance && similarity >= 0.3) {
        recommendations.push({
          id: doc.id,
          displayName: otherUser.displayName,
          personalityType: otherUser.personalityType,
          adjustmentFactor: otherAF,
          totalRatingsCount: otherUser.totalRatingsCount || 0,
          avatar: otherUser.avatar,
          lastRatedPlaceLocation: otherUser.lastRatedPlaceLocation,
          similarity,
          distance: Math.round(distance * 10) / 10,
        })
      }
    }

    // Sort by similarity descending, then distance ascending
    recommendations.sort((a, b) => {
      const simDiff = b.similarity - a.similarity
      if (Math.abs(simDiff) > 0.05) return simDiff
      return a.distance - b.distance
    })

    res.json({
      success: true,
      data: recommendations.slice(0, limit),
      count: recommendations.length,
    })
  } catch (error: any) {
    console.error('Explore people error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations',
    })
  }
})

/**
 * GET /api/explore/places
 * Get recommended places based on user's personality
 */
router.get('/places', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const radius = parseInt(req.query.radius as string) || 15

    // Get current user
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const userData = userDoc.data()
    const userAF = userData?.adjustmentFactor || 0
    const userLocation = userData?.lastRatedPlaceLocation

    if (!userLocation) {
      return res.json({
        success: true,
        data: [],
        message: 'Rate a place first to get personalized recommendations',
      })
    }

    // Get nearby places
    const nearbyPlaces = await ratingService.getNearbyPlaces(
      userLocation.lat,
      userLocation.lng,
      radius
    )

    console.log("nearby places", nearbyPlaces)

    // Score each place for this user
    const recommendations: Array<any> = []

    console.log(`Processing ${nearbyPlaces.length} places for user ${userId}`)

    for (const place of nearbyPlaces) {
      const ratings = await ratingService.getPlaceRatings(place.id)
      
      console.log(`Place: ${place.name} - ${ratings.length} ratings`)
      
      // Handle places with NO ratings - show them with neutral scores
      if (ratings.length === 0) {
        console.log(`  → Adding unrated place: ${place.name}`)
        recommendations.push({
          id: place.id,
          name: place.name,
          address: place.address,
          location: place.location,
          predictedScore: 5.0, // Neutral score
          confidence: 0, // No confidence since unrated
          totalRatings: 0,
          similarRatings: 0,
          isUnrated: true, // Flag for frontend
        })
        continue
      }

      // Use personality-adjusted scoring for rated places
      const adjustedRatings = ratings.map(rating => {
        // Calculate what this rating would mean for the viewing user
        const adjustedOverallScore = ratingService.calculateAdjustedScoreForViewer(
          rating.categories,
          rating.userAdjustmentFactor,
          userAF
        )
        
        return {
          ...rating,
          adjustedOverallScore,
          personalityDistance: Math.abs(rating.userAdjustmentFactor - userAF)
        }
      })

      // Calculate average of all personality-adjusted scores
      // We don't need personality similarity weighting - the scores are already adjusted!
      const avgAdjustedScore = adjustedRatings.reduce((sum, r) => sum + r.adjustedOverallScore, 0) / adjustedRatings.length
      const confidence = Math.min(ratings.length / 10, 1)

      console.log(`  → Adjusted score: ${Math.round(avgAdjustedScore * 10) / 10}, Confidence: ${Math.round(confidence * 100)}%`)

      recommendations.push({
        id: place.id,
        name: place.name,
        address: place.address,
        location: place.location,
        predictedScore: Math.round(avgAdjustedScore * 10) / 10,
        confidence: Math.round(confidence * 100),
        totalRatings: ratings.length,
        similarRatings: adjustedRatings.length,
      })
    }

    // Sort: Rated places first (by score * confidence), then unrated places
    recommendations.sort((a, b) => {
      // Unrated places go to the end
      if (a.isUnrated && !b.isUnrated) return 1
      if (!a.isUnrated && b.isUnrated) return -1
      if (a.isUnrated && b.isUnrated) return 0

      // Sort rated places by predicted score * confidence
      const scoreA = a.predictedScore * (a.confidence / 100)
      const scoreB = b.predictedScore * (b.confidence / 100)
      return scoreB - scoreA
    })

    console.log(`Returning ${recommendations.length} places (${recommendations.filter(r => !r.isUnrated).length} rated, ${recommendations.filter(r => r.isUnrated).length} unrated)`)

    res.json({
      success: true,
      data: recommendations.slice(0, limit),
      count: recommendations.length,
      rated: recommendations.filter(r => !r.isUnrated).length,
      unrated: recommendations.filter(r => r.isUnrated).length,
    })
  } catch (error: any) {
    console.error('Explore places error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations',
    })
  }
})

// Helper function
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default router