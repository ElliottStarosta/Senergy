import { Router, Request, Response } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { ratingService } from '@/services/rating.service'
import { RatingCategory } from '@/types'

const router = Router()

const algoliasearch = require('algoliasearch');

// Initialize Algolia client
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const placesIndex = algoliaClient.initIndex('places');

// In your ratings.routes.ts, add this test endpoint:
router.get('/test-algolia', async (req: Request, res: Response) => {
  try {
    const { hits } = await placesIndex().search('', {
      aroundLatLng: '45.4208777,-75.6901106',
      aroundRadius: 25000, // 25km in meters
      hitsPerPage: 10
    })

    res.json({
      success: true,
      count: hits.length,
      places: hits
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})



/**
 * POST /api/ratings
 * Create a new rating
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const {
      placeId,
      placeName,
      placeAddress,
      location,
      categories,
      comment,
      userAdjustmentFactor,
      userPersonalityType,
    } = req.body

    // Validate required fields
    if (!placeId || !placeName || !location || !categories) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: placeId, placeName, location, categories',
      })
    }

    if (!location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        error: 'Invalid location format. Must have lat and lng',
      })
    }

    // Validate categories (5 categories)
    const requiredCategories = [
      'atmosphere',
      'service',
      'crowdSize',
      'noiseLevel',
      'socialEnergy',
    ]
    
    for (const cat of requiredCategories) {
      if (!(cat in categories)) {
        return res.status(400).json({
          success: false,
          error: `Missing category: ${cat}`,
        })
      }
      const value = categories[cat]
      if (typeof value !== 'number' || value < 1 || value > 10) {
        return res.status(400).json({
          success: false,
          error: `Invalid ${cat} value. Must be between 1-10`,
        })
      }
    }

    const rating = await ratingService.createRating(
      userId,
      placeId,
      placeName,
      placeAddress || '',
      location,
      categories as RatingCategory,
      comment || '',
      userAdjustmentFactor || 0,
      userPersonalityType || 'Unknown'
    )

    res.status(201).json({
      success: true,
      data: rating,
    })
  } catch (error: any) {
    console.error('Create rating error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create rating',
    })
  }
})

/**
 * GET /api/ratings
 * Get user's ratings (paginated)
 * Optional query param: userId - if provided, fetches that user's ratings (for viewing other profiles)
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.userId!
    // Allow fetching other user's ratings if userId query param is provided
    const targetUserId = (req.query.userId as string) || currentUserId
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const ratings = await ratingService.getUserRatings(targetUserId, limit, offset)

    res.json({
      success: true,
      data: ratings,
      pagination: {
        limit,
        offset,
        count: ratings.length,
      },
    })
  } catch (error: any) {
    console.error('Get ratings error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ratings',
    })
  }
})

/**
 * GET /api/ratings/place/:placeId
 * Get all ratings for a place
 */
router.get('/place/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params

    const ratings = await ratingService.getPlaceRatings(placeId)
    const stats = await ratingService.getPlaceStats(placeId)

    res.json({
      success: true,
      data: {
        ratings,
        stats,
      },
    })
  } catch (error: any) {
    console.error('Get place ratings error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch place ratings',
    })
  }
})

/**
 * PUT /api/ratings/:ratingId
 * Update a rating
 */
router.put('/:ratingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { ratingId } = req.params
    const { categories, comment } = req.body

    // Verify user owns this rating
    const rating = await ratingService.getRatingById(ratingId)
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found',
      })
    }

    if (rating.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this rating',
      })
    }

    const updates: any = {}
    if (categories) updates.categories = categories
    if (comment !== undefined) updates.comment = comment

    await ratingService.updateRating(ratingId, updates)

    res.json({
      success: true,
      message: 'Rating updated',
    })
  } catch (error: any) {
    console.error('Update rating error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update rating',
    })
  }
})

/**
 * DELETE /api/ratings/:ratingId
 * Delete a rating
 */
router.delete('/:ratingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { ratingId } = req.params

    // Verify user owns this rating
    const rating = await ratingService.getRatingById(ratingId)
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found',
      })
    }

    if (rating.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this rating',
      })
    }

    await ratingService.deleteRating(ratingId)

    res.json({
      success: true,
      message: 'Rating deleted',
    })
  } catch (error: any) {
    console.error('Delete rating error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete rating',
    })
  }
})

/**
 * GET /api/ratings/nearby
 * Get nearby places with ratings
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string)
    const lng = parseFloat(req.query.lng as string)
    const radius = Math.min(parseInt(req.query.radius as string) || 15, 50)

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Must provide lat and lng',
      })
    }

    const places = await ratingService.getNearbyPlaces(lat, lng, radius)

    res.json({
      success: true,
      data: places,
      meta: {
        lat,
        lng,
        radiusKm: radius,
        count: places.length,
      },
    })
  } catch (error: any) {
    console.error('Get nearby places error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch nearby places',
    })
  }
})

export default router