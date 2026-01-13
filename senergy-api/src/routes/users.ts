import { Router, Request, Response } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { recommendationService } from '@/services/recommendation.service'
import { db } from '@/config/firebase'

const router = Router()

/**
 * Helper function to get Discord username from Discord ID using Discord API
 */
async function getDiscordUsername(discordId: string): Promise<string | null> {
  try {
    const botToken = process.env.DISCORD_TOKEN
    console.log("TOKEN!!", botToken)
    if (!botToken) {
      console.warn('[Users] Discord bot token not configured, cannot fetch username')
      return null
    }

    const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Users] Discord user ${discordId} not found`)
        return null
      }
      throw new Error(`Discord API error: ${response.status}`)
    }

    const userData = await response.json() as { username?: string }
    console.log(userData)
    return typeof userData.username === 'string' ? userData.username : null
  } catch (error) {
    console.error('[Users] Failed to fetch Discord username:', (error as Error).message)
    return null
  }
}

/**
 * GET /api/users/matches
 * Find similar users by personality and location
 */
router.get('/matches', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const personalityRange = parseFloat(req.query.personalityRange as string) || 0.3
    const maxDistance = parseInt(req.query.maxDistance as string) || 50

    // Validate parameters
    if (personalityRange < 0 || personalityRange > 1) {
      return res.status(400).json({
        success: false,
        error: 'personalityRange must be between 0 and 1',
      })
    }

    if (maxDistance < 1 || maxDistance > 200) {
      return res.status(400).json({
        success: false,
        error: 'maxDistance must be between 1 and 200 km',
      })
    }

    const matches = await recommendationService.findSimilarUsers(
      userId,
      maxDistance,
      personalityRange
    )

    res.json({
      success: true,
      data: matches,
      count: matches.length,
      meta: {
        personalityRange,
        maxDistanceKm: maxDistance,
      },
    })
  } catch (error: any) {
    console.error('Find matches error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find matches',
    })
  }
})

/**
 * GET /api/users/discord/:discordId/profile
 * Get public user profile by Discord ID
 */
router.get('/discord/:discordId/profile', async (req: Request, res: Response) => {
  try {
    const { discordId } = req.params

    const snapshot = await db
      .collection('users')
      .where('discordId', '==', discordId)
      .get()

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User data not found',
      })
    }

    const publicProfile = {
      id: userDoc.id,
      discordId: userData.discordId ?? null,
      displayName: userData.displayName ?? null,
      avatar: userData.avatar ?? null,
      personalityType: userData.personalityType ?? null,
      discordVerified: userData.discordVerified ?? false,

      adjustmentFactor:
        typeof userData.adjustmentFactor === 'number'
          ? Number(userData.adjustmentFactor.toFixed(3))
          : 0,

      totalRatingsCount: userData.totalRatingsCount ?? 0,
      totalGroupsJoined: userData.totalGroupsJoined ?? 0,

      lastRatedPlaceLocation: userData.lastRatedPlaceLocation
        ? {
            lat: userData.lastRatedPlaceLocation.lat,
            lng: userData.lastRatedPlaceLocation.lng,
          }
        : null,

      createdAt: userData.createdAt?.toDate
        ? userData.createdAt.toDate().toISOString()
        : userData.createdAt ?? null,

      quizCompletedAt: userData.quizCompletedAt?.toDate
        ? userData.quizCompletedAt.toDate().toISOString()
        : userData.quizCompletedAt ?? null,
    }

    res.json({
      success: true,
      data: publicProfile,
    })
  } catch (error: any) {
    console.error('Get profile by Discord ID error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch profile',
    })
  }
})


/**
 * GET /api/users/:userId/profile
 * Get public user profile (for matching)
 */
router.get('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    const userData = userDoc.data()

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User data not found',
      })
    }

    // Get Discord username if Discord ID exists
    let discordUsername: string | null = null
    if (userData.discordId) {
      discordUsername = await getDiscordUsername(userData.discordId)
      console.log("DISCORD USERNAME,", discordUsername)
    }

    // Return only public fields
    const publicProfile = {
      id: userId,
      displayName: userData.displayName,
      avatar: userData.avatar || null,
      personalityType: userData.personalityType || null,
      adjustmentFactor: userData.adjustmentFactor || 0,
      totalRatingsCount: userData.totalRatingsCount || 0,
      totalGroupsJoined: userData.totalGroupsJoined || 0,
      city: userData.city || null,
      createdAt: userData.createdAt,
      discordId: userData.discordId ?? null,
      discordUsername: discordUsername,
      discordVerified: userData.discordVerified ?? false,
    }

    res.json({
      success: true,
      data: publicProfile,
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch profile',
    })
  }
})

/**
 * GET /api/users/similarity/:userId1/:userId2
 * Calculate similarity between two users
 */
router.get('/similarity/:userId1/:userId2', async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.params

    const similarity = await recommendationService.calculateUserSimilarity(userId1, userId2)

    res.json({
      success: true,
      data: {
        user1: userId1,
        user2: userId2,
        similarity: Math.round(similarity * 100) / 100, // 0-1 scale
        similarityPercent: Math.round(similarity * 100), // 0-100%
      },
    })
  } catch (error: any) {
    console.error('Calculate similarity error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate similarity',
    })
  }
})

export default router