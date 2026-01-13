import { db } from '@/config/firebase'
import { Rating, RatingCategory, PlaceStats, Place } from '@/types'
import { placesIndex } from '@/config/algolia'


export class RatingService {
  private ratingsCol = db.collection('ratings')
  private placesCol = db.collection('places')


  /**
   * Create a new rating
   */
  async createRating(
    userId: string,
    placeId: string,
    placeName: string,
    placeAddress: string,
    location: { lat: number; lng: number },
    categories: RatingCategory,
    comment: string,
    userAdjustmentFactor: number,
    userPersonalityType: string
  ): Promise<Rating> {
    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(categories)

    const ratingData = {
      userId,
      userAdjustmentFactor,
      userPersonalityType,
      placeId,
      placeName,
      placeAddress,
      location,
      categories,
      overallScore,
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const ratingRef = this.ratingsCol.doc()
    await ratingRef.set(ratingData)

    // Update place stats
    await this.updatePlaceStats(placeId, placeName, placeAddress, location, overallScore, categories, userAdjustmentFactor, userPersonalityType)


    const placeDoc = await this.placesCol.doc(placeId).get()
  if (placeDoc.exists) {
    const placeData = { id: placeDoc.id, ...placeDoc.data() } as Place
    await this.syncPlaceToAlgolia(placeData)
  }


    // Update user's lastRatedPlaceLocation and totalRatingsCount
    await this.updateUserRatingStats(userId, location)

    return { id: ratingRef.id, ...ratingData } as Rating
  }

  /**
   * Get all ratings for a user
   */
  async getUserRatings(userId: string, limit = 50, offset = 0): Promise<Rating[]> {
    const snapshot = await this.ratingsCol.where('userId', '==', userId).get()
    
    return snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() } as Rating))
      .sort((a: Rating, b: Rating) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)
  }

  /**
   * Get rating by ID
   */
  async getRatingById(ratingId: string): Promise<Rating | null> {
    const ratingDoc = await this.ratingsCol.doc(ratingId).get()
    
    if (!ratingDoc.exists) {
      return null
    }
    
    return { id: ratingDoc.id, ...ratingDoc.data() } as Rating
  }

  /**
   * Get all ratings for a place
   */
  async getPlaceRatings(placeId: string): Promise<Rating[]> {
    const snapshot = await this.ratingsCol.where('placeId', '==', placeId).get()
    
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Rating))
  }

  /**
   * Update a rating
   */
  async updateRating(ratingId: string, updates: Partial<Rating>): Promise<void> {
    const ratingDoc = await this.ratingsCol.doc(ratingId).get()
    
    if (!ratingDoc.exists) {
      throw new Error('Rating not found')
    }

    // If categories changed, recalculate overall score
    let updatesToApply: any = { ...updates }
    if (updates.categories) {
      updatesToApply.overallScore = this.calculateOverallScore(updates.categories)
    }

    updatesToApply.updatedAt = new Date().toISOString()

    await this.ratingsCol.doc(ratingId).update(updatesToApply)

    // Update place stats if this changed
    if (updates.categories || updates.overallScore) {
      const oldRating = ratingDoc.data() as Rating
      await this.updatePlaceStats(
        oldRating.placeId,
        oldRating.placeName,
        oldRating.placeAddress,
        oldRating.location,
        updatesToApply.overallScore || oldRating.overallScore,
        updatesToApply.categories || oldRating.categories,
        oldRating.userAdjustmentFactor,
        oldRating.userPersonalityType
      )
    }
  }

  /**
   * Delete a rating
   */
  async deleteRating(ratingId: string): Promise<void> {
    const ratingDoc = await this.ratingsCol.doc(ratingId).get()
    
    if (!ratingDoc.exists) {
      throw new Error('Rating not found')
    }

    await this.ratingsCol.doc(ratingId).delete()

    // Recalculate place stats after deletion
    const rating = ratingDoc.data() as Rating
    await this.recalculatePlaceStats(rating.placeId)

    const placeDoc = await this.placesCol.doc(rating.placeId).get()
    if (!placeDoc.exists) {
      await this.deletePlaceFromAlgolia(rating.placeId)
    } else {
      // Re-sync updated stats to Algolia
      const placeData = { id: placeDoc.id, ...placeDoc.data() } as Place
      await this.syncPlaceToAlgolia(placeData)
    }
  }

  /**
   * Get stats for a place
   */
  async getPlaceStats(placeId: string): Promise<PlaceStats | null> {
    const placeDoc = await this.placesCol.doc(placeId).get()
    
    if (!placeDoc.exists) {
      return null
    }

    const place = placeDoc.data() as Place
    return place.stats
  }

  /**
   * Get nearby places with ratings
   */
  async getNearbyPlaces(
    lat: number,
    lng: number,
    radiusKm: number = 15
  ): Promise<Place[]> {
    const useAlgolia = process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY
  
    if (useAlgolia) {
      // Production: Use Algolia geosearch
      try {
        console.log(`[Algolia] Searching places near ${lat}, ${lng} within ${radiusKm}km`)
        
        const index = placesIndex();
        if (!index) {
          throw new Error("Algolia creds not configured")
        }

        const { hits } = await index.search('', {
          aroundLatLng: `${lat}, ${lng}`,
          aroundRadius: radiusKm * 1000, // Convert km to meters
          hitsPerPage: 100,
        })
  
        console.log(`[Algolia] Found ${hits.length} places`)
  
        return hits.map((hit: any) => ({
          id: hit.objectID,
          name: hit.name,
          address: hit.address,
          location: hit._geoloc, // Algolia stores as _geoloc
          category: hit.category || 'establishment',
          stats: hit.stats
        })) as Place[]
      } catch (error) {
        console.error('[Algolia] Search failed, falling back to Firestore:', error)
        // Fall through to Firestore fallback
      }
    }
  
    // Development/Fallback: Use Firestore with client-side filtering
    console.log(`[Firestore] Searching places near ${lat}, ${lng} within ${radiusKm}km`)
    
    const snapshot = await this.placesCol.get()
    
    const places = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() } as Place))
      .filter((place: Place) => {
        const distance = this.haversineDistance(
          lat,
          lng,
          place.location.lat,
          place.location.lng
        )
        return distance <= radiusKm
      })
      .sort((a: Place, b: Place) => {
        const distA = this.haversineDistance(lat, lng, a.location.lat, a.location.lng)
        const distB = this.haversineDistance(lat, lng, b.location.lat, b.location.lng)
        return distA - distB
      })
  
    console.log(`[Firestore] Found ${places.length} places`)
    return places
  }

  /**
 * Sync a place to Algolia after rating
 * Call this after creating/updating a place
 */
async syncPlaceToAlgolia(place: Place): Promise<void> {
  const useAlgolia = process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY
  
  const index = placesIndex();

  if (!useAlgolia || !index) {
    throw new Error("Algolia credentials missing")
  }

  try {
    await index.saveObject({
      objectID: place.id,
      name: place.name,
      address: place.address,
      _geoloc: {
        lat: place.location.lat,
        lng: place.location.lng
      },
      category: place.category || 'establishment',
      stats: place.stats,
      lastRatedAt: place.stats.lastRatedAt
    })
    console.log(`[Algolia] Synced place: ${place.name}`)
  } catch (error) {
    console.error(`[Algolia] Failed to sync place ${place.id}:`, error)
  }
}

/**
 * Delete a place from Algolia
 */
async deletePlaceFromAlgolia(placeId: string): Promise<void> {
  const useAlgolia = process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY
  const index = placesIndex();
  
  if (!useAlgolia || !index) {
    throw new Error("Algolia credentials not configured")
  }

  try {
    await index.deleteObject(placeId)
    console.log(`[Algolia] Deleted place: ${placeId}`)
  } catch (error) {
    console.error(`[Algolia] Failed to delete place ${placeId}:`, error)
  }
}

  /**
   * Private: Calculate overall score from categories
   */

   
  private calculateOverallScore(categories: RatingCategory): number {
    const weights = {
      atmosphere: 0.25,
      socialEnergy: 0.25,
      crowdSize: 0.15,
      noiseLevel: 0.15,
      service: 0.2,
    }

    const weighted =
      categories.crowdSize * weights.crowdSize +
      categories.noiseLevel * weights.noiseLevel +
      categories.socialEnergy * weights.socialEnergy +
      categories.service * weights.service +
      categories.atmosphere * weights.atmosphere

    return Math.round(weighted * 10) / 10
  }

  /**
   * Private: Update place stats after new/updated rating
   */
  private async updatePlaceStats(
    placeId: string,
    placeName: string,
    placeAddress: string,
    location: { lat: number; lng: number },
    overallScore: number,
    categories: RatingCategory,
    userAdjustmentFactor: number,
    userPersonalityType: string
  ): Promise<void> {
    const placeDoc = await this.placesCol.doc(placeId).get()

    // Get all ratings for this place
    const ratings = await this.getPlaceRatings(placeId)

    // Calculate stats
    const stats = this.calculatePlaceStats(ratings)

    if (!placeDoc.exists) {
      // Create new place document
      await this.placesCol.doc(placeId).set({
        id: placeId,
        name: placeName,
        address: placeAddress,
        location,
        stats,
        lastRatedAt: new Date().toISOString(),
      })
    } else {
      // Update existing place document
      await this.placesCol.doc(placeId).update({
        stats,
        lastRatedAt: new Date().toISOString(),
      })
    }
  }

  /**
   * Private: Recalculate all stats for a place
   */
  private async recalculatePlaceStats(placeId: string): Promise<void> {
    const ratings = await this.getPlaceRatings(placeId)
    
    if (ratings.length === 0) {
      // No more ratings, delete the place doc
      await this.placesCol.doc(placeId).delete().catch(() => {
        // Already deleted or doesn't exist
      })
      return
    }

    const stats = this.calculatePlaceStats(ratings)
    
    await this.placesCol.doc(placeId).update({
      stats,
      lastRatedAt: new Date().toISOString(),
    })
  }

  /**
   * Private: Calculate aggregated stats from ratings
   */
  private calculatePlaceStats(ratings: Rating[]): PlaceStats {
    if (ratings.length === 0) {
      return {
        totalRatings: 0,
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
          atmosphere: 0,
        },
        lastRatedAt: new Date().toISOString(),
      }
    }

    // Overall averages
    const avgOverallScore = Math.round(
      (ratings.reduce((sum, r) => sum + r.overallScore, 0) / ratings.length) * 10
    ) / 10

    // By personality
    const byPersonality = {
      introvert: { avgScore: 0, count: 0 },
      ambivert: { avgScore: 0, count: 0 },
      extrovert: { avgScore: 0, count: 0 },
    }

    ratings.forEach(rating => {
      const type = this.getPersonalityBucket(rating.userAdjustmentFactor)
      byPersonality[type].avgScore += rating.overallScore
      byPersonality[type].count += 1
    })

    Object.keys(byPersonality).forEach(key => {
      const bucket = byPersonality[key as keyof typeof byPersonality]
      if (bucket.count > 0) {
        bucket.avgScore = Math.round((bucket.avgScore / bucket.count) * 10) / 10
      }
    })

    // Average categories
    const avgCategories: RatingCategory = {
      crowdSize: 0,
      noiseLevel: 0,
      socialEnergy: 0,
      service: 0,
      atmosphere: 0,
    }

    Object.keys(avgCategories).forEach(key => {
      avgCategories[key as keyof RatingCategory] = Math.round(
        (ratings.reduce((sum, r) => sum + r.categories[key as keyof RatingCategory], 0) / ratings.length) * 10
      ) / 10
    })

    return {
      totalRatings: ratings.length,
      avgOverallScore,
      byPersonality,
      avgCategories,
      lastRatedAt: new Date().toISOString(),
    }
  }

  /**
   * Private: Convert adjustmentFactor to personality bucket
   */
  private getPersonalityBucket(adjustmentFactor: number): 'introvert' | 'ambivert' | 'extrovert' {
    if (adjustmentFactor <= -0.2) return 'introvert'
    if (adjustmentFactor >= 0.2) return 'extrovert'
    return 'ambivert'
  }

  /**
   * Private: Haversine formula for distance
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth radius in km
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

  /**
   * Private: Update user stats after rating
   */
  private async updateUserRatingStats(userId: string, location: { lat: number; lng: number }): Promise<void> {
    const userDoc = await db.collection('users').doc(userId).get()

    if (userDoc.exists) {
      const user = userDoc.data()
      await db.collection('users').doc(userId).update({
        lastRatedPlaceLocation: location,
        totalRatingsCount: (user?.totalRatingsCount || 0) + 1,
      })
    }
  }
}

export const ratingService = new RatingService()  