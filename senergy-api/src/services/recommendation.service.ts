import { db } from '@/config/firebase'
import { Group, RecommendedPlace, RatingCategory } from '@/types'
import { ratingService } from './rating.service'

export class RecommendationService {
  /**
   * Find similar users by personality and location
   */
  async findSimilarUsers(
    userId: string,
    maxDistance: number,
    personalityRange: number
  ): Promise<Array<{
    userId: string
    displayName: string
    personalityType: string
    adjustmentFactor: number
    similarity: number
    distance: number
  }>> {
    // Get current user
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      throw new Error('User not found')
    }

    const userData = userDoc.data()
    if (!userData) {
      throw new Error('User data not found')
    }
    
    const userAF = userData.adjustmentFactor || 0
    const userLocation = userData.lastRatedPlaceLocation

    if (!userLocation) {
      // Return empty array instead of throwing error
      return []
    }

    // Get all users with personality data
    // Note: Firestore doesn't support != null queries well, so we'll filter client-side
    const usersSnapshot = await db.collection('users').get()

    const matches: Array<{
      userId: string
      displayName: string
      personalityType: string
      adjustmentFactor: number
      similarity: number
      distance: number
    }> = []

    for (const userDocSnap of usersSnapshot.docs) {
      if (userDocSnap.id === userId) continue // Skip self

      const otherUserData = userDocSnap.data()
      if (!otherUserData) continue
      
      // Skip users without personality data
      if (!otherUserData.personalityType) continue
      
      const otherAF = otherUserData.adjustmentFactor || 0
      const otherLocation = otherUserData.lastRatedPlaceLocation

      // Calculate personality similarity
      const personalityDistance = Math.abs(userAF - otherAF)
      if (personalityDistance > personalityRange) continue

      const similarity = 1 - (personalityDistance / personalityRange)

      // Calculate distance if both have locations
      let distance = 0
      if (otherLocation && userLocation) {
        distance = this.haversineDistance(
          userLocation.lat,
          userLocation.lng,
          otherLocation.lat,
          otherLocation.lng
        )
        if (distance > maxDistance) continue
      } else if (!otherLocation) {
        continue // Skip users without location
      }

      matches.push({
        userId: userDocSnap.id,
        displayName: otherUserData.displayName || 'Unknown',
        personalityType: otherUserData.personalityType || 'Unknown',
        adjustmentFactor: otherAF,
        similarity,
        distance,
      })
    }

    // Sort by similarity (descending), then by distance (ascending)
    matches.sort((a, b) => {
      if (Math.abs(a.similarity - b.similarity) < 0.01) {
        return a.distance - b.distance
      }
      return b.similarity - a.similarity
    })

    return matches
  }

  /**
   * Calculate similarity between two users
   */
  async calculateUserSimilarity(userId1: string, userId2: string): Promise<number> {
    const [user1Doc, user2Doc] = await Promise.all([
      db.collection('users').doc(userId1).get(),
      db.collection('users').doc(userId2).get(),
    ])

    if (!user1Doc.exists || !user2Doc.exists) {
      throw new Error('One or both users not found')
    }

    const user1Data = user1Doc.data()
    const user2Data = user2Doc.data()
    
    if (!user1Data || !user2Data) {
      throw new Error('User data not found')
    }

    const af1 = user1Data.adjustmentFactor || 0
    const af2 = user2Data.adjustmentFactor || 0

    // Similarity based on adjustment factor distance
    // Range is -1 to 1, so max distance is 2
    const distance = Math.abs(af1 - af2)
    const similarity = 1 - (distance / 2)

    return Math.max(0, Math.min(1, similarity))
  }

  /**
   * Generate recommendations for a group
   */
  async generateGroupRecommendations(
    group: Group,
    searchRadius: number = 15
  ): Promise<RecommendedPlace[]> {
    const { memberProfiles, searchLocation } = group

    console.log(`[Recommendations] Generating for ${Object.keys(memberProfiles).length} members`)

    // Step 1: Get nearby places
    const nearbyPlaces = await ratingService.getNearbyPlaces(
      searchLocation.lat,
      searchLocation.lng,
      searchRadius
    )

    console.log(`[Recommendations] Found ${nearbyPlaces.length} nearby places`)

    if (nearbyPlaces.length === 0) {
      return []
    }

    // Step 2: Calculate group personality metrics
    const groupMetrics = this.calculateGroupMetrics(memberProfiles)
    
    console.log(`[Recommendations] Group metrics:`, groupMetrics)

    // Step 3: Score each place using comprehensive algorithm
    const scoredPlaces: Array<RecommendedPlace & { matchPercentage: number }> = []

    for (const place of nearbyPlaces) {
      try {
        const score = await this.scorePlaceForGroup(place, memberProfiles, groupMetrics, searchLocation)
        if (score) {
          scoredPlaces.push(score)
        }
      } catch (error) {
        console.error(`[Recommendations] Error scoring place ${place.name}:`, error)
      }
    }

    // Step 4: Sort by weighted score (predicted * confidence * match)
    scoredPlaces.sort((a, b) => {
      const scoreA = a.predictedScore * a.confidenceScore * (a.matchPercentage / 100)
      const scoreB = b.predictedScore * b.confidenceScore * (b.matchPercentage / 100)
      return scoreB - scoreA
    })

    console.log(`[Recommendations] Returning top ${Math.min(scoredPlaces.length, 10)} recommendations`)

    // Return top 10
    return scoredPlaces.slice(0, 10)
  }

  /**
   * Calculate group personality metrics
   */
  private calculateGroupMetrics(memberProfiles: { [key: string]: any }) {
    const members = Object.values(memberProfiles)
    const adjustmentFactors = members.map(m => m.adjustmentFactor || 0)

    return {
      avgAdjustmentFactor: adjustmentFactors.reduce((sum, af) => sum + af, 0) / adjustmentFactors.length,
      minAdjustmentFactor: Math.min(...adjustmentFactors),
      maxAdjustmentFactor: Math.max(...adjustmentFactors),
      personalitySpread: Math.max(...adjustmentFactors) - Math.min(...adjustmentFactors),
      memberCount: members.length,
      personalityTypes: members.map(m => m.personalityType || 'Unknown'),
    }
  }

  /**
   * Score a place for a group
   */
  /**
 * Score a place for a group - returns both group and individual scores
 */
private async scorePlaceForGroup(
  place: any,
  memberProfiles: { [key: string]: any },
  groupMetrics: any,
  groupLocation: { lat: number; lng: number }
): Promise<(RecommendedPlace & { matchPercentage: number; memberScores?: Array<{userId: string, displayName: string, score: number, confidence: number}> }) | null> {
  // Get all ratings for this place
  const ratings = await ratingService.getPlaceRatings(place.id)

  if (ratings.length === 0) {
    // No ratings yet - use neutral score with low confidence
    return {
      placeId: place.id,
      placeName: place.name,
      address: place.address || '',
      location: place.location,
      predictedScore: 5.0,
      confidenceScore: 0.1,
      matchPercentage: 50,
      reasoning: 'New place with no ratings yet - could be worth exploring!',
      categories: this.getNeutralCategories(),
      memberScores: Object.values(memberProfiles).map((member: any) => ({
        userId: member.userId,
        displayName: member.displayName,
        score: 5.0,
        confidence: 10
      }))
    }
  }

  // Calculate distance factor
  const distance = this.haversineDistance(
    groupLocation.lat,
    groupLocation.lng,
    place.location.lat,
    place.location.lng
  )
  const distanceFactor = Math.max(0, 1 - (distance / 15))

  // Calculate individual member scores
  const memberScores = await Promise.all(
    Object.values(memberProfiles).map(async (member: any) => {
      const result = await this.scorePlaceForMember(place.id, member, ratings)
      return {
        userId: member.userId,
        displayName: member.displayName,
        score: result.score,
        confidence: Math.round(result.confidence * 100) // Convert to percentage
      }
    })
  )

  // Calculate group harmony score (how well the place suits everyone)
  const harmonyScore = this.calculateHarmonyScore(memberScores.map(m => ({ score: m.score, confidence: m.confidence / 100 })))

  // Calculate weighted average score
  const avgPredictedScore = memberScores.reduce((sum, s) => sum + s.score, 0) / memberScores.length

  // IMPROVED CONFIDENCE CALCULATION
  // Base confidence on data availability (more generous)
  const dataConfidence = Math.min(ratings.length / 10, 1.0) // Reach 100% at 10 ratings instead of 20
  
  // Agreement between members (lower std dev = higher agreement)
  const scoreStdDev = this.calculateStdDev(memberScores.map(s => s.score))
  const agreementFactor = Math.max(0, 1 - (scoreStdDev / 5)) // More forgiving
  
  // Individual confidence average
  const avgMemberConfidence = memberScores.reduce((sum, s) => sum + s.confidence, 0) / memberScores.length / 100
  
  // Weighted combination (more weight on data availability)
  const baseConfidence = (
    dataConfidence * 0.5 +        // 50% weight on having data
    agreementFactor * 0.25 +       // 25% weight on group agreement
    avgMemberConfidence * 0.25     // 25% weight on individual confidence
  )
  
  // Apply distance factor but less harshly
  const overallConfidence = baseConfidence * (0.7 + (distanceFactor * 0.3)) // At least 70% even if far

  // Calculate match percentage
  const matchPercentage = Math.round(
    (avgPredictedScore / 10) * 0.5 * 100 +
    harmonyScore * 0.3 * 100 +
    overallConfidence * 0.2 * 100
  )

  // Generate reasoning
  const reasoning = this.generateReasoning(
    memberScores.map(m => ({ score: m.score, confidence: m.confidence / 100 })),
    harmonyScore,
    ratings.length,
    distance,
    groupMetrics
  )

  // Calculate average categories
  const avgCategories = this.calculateAverageCategories(ratings)

  return {
    placeId: place.id,
    placeName: place.name,
    address: place.address || '',
    location: place.location,
    predictedScore: Math.round(avgPredictedScore * 10) / 10,
    confidenceScore: Math.round(overallConfidence * 100) / 100,
    matchPercentage,
    reasoning,
    categories: avgCategories,
    memberScores, // Include individual scores
  }
}

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    memberScores: any[],
    harmonyScore: number,
    totalRatings: number,
    distance: number,
    groupMetrics: any
  ): string {
    const avgScore = memberScores.reduce((sum, s) => sum + s.score, 0) / memberScores.length
    const parts: string[] = []

    // Lead with confidence
    if (harmonyScore > 0.8) {
      parts.push('Excellent match for your whole group!')
    } else if (harmonyScore > 0.6) {
      parts.push('Good fit for most members')
    } else {
      parts.push('Decent option with some personality trade-offs')
    }

    // Data quality
    if (totalRatings >= 20) {
      parts.push(`Based on ${totalRatings} ratings`)
    } else if (totalRatings >= 10) {
      parts.push(`${totalRatings} ratings available`)
    } else {
      parts.push('Limited ratings data')
    }

    // Distance
    if (distance < 2) {
      parts.push('Very close by')
    } else if (distance < 5) {
      parts.push(`${distance.toFixed(1)}km away`)
    }

    // Group personality insight
    if (groupMetrics.personalitySpread > 0.6) {
      parts.push('Balances diverse personalities')
    } else if (groupMetrics.avgAdjustmentFactor > 0.3) {
      parts.push('Great for extroverted groups')
    } else if (groupMetrics.avgAdjustmentFactor < -0.3) {
      parts.push('Perfect for introverted gatherings')
    }

    return parts.join(' • ')
  }

  /**
   * Calculate harmony score (how well the place suits everyone)
   * Lower standard deviation = higher harmony
   */
  private calculateHarmonyScore(memberScores: Array<{ score: number; confidence: number }>): number {
    const scores = memberScores.map(s => s.score)
    const stdDev = this.calculateStdDev(scores)
    
    // Convert stdDev to harmony score (0-1)
    // StdDev of 0 = perfect harmony (1.0)
    // StdDev of 5 = low harmony (0.0)
    return Math.max(0, 1 - (stdDev / 5))
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(numbers: number[]): number {
    const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
    const squareDiffs = numbers.map(n => Math.pow(n - avg, 2))
    const avgSquareDiff = squareDiffs.reduce((sum, n) => sum + n, 0) / numbers.length
    return Math.sqrt(avgSquareDiff)
  }


  /**
   * Score a place for an individual member
   */
  private async scorePlaceForMember(
    placeId: string,
    member: any,
    allRatings: any[]
  ): Promise<{ score: number; confidence: number }> {
    const memberAF = member.adjustmentFactor || 0

    // Find ratings from similar users (within 0.3 AF range)
    const similarRatings = allRatings.filter(rating => {
      const distance = Math.abs(rating.userAdjustmentFactor - memberAF)
      return distance <= 0.3
    })

    if (similarRatings.length === 0) {
      // No similar users - use global average with low confidence
      const globalAvg = allRatings.reduce((sum, r) => sum + r.overallScore, 0) / allRatings.length
      return {
        score: globalAvg,
        confidence: Math.min(allRatings.length / 20, 0.5),
      }
    }

    // Calculate weighted average based on personality similarity
    let weightedSum = 0
    let totalWeight = 0

    similarRatings.forEach(rating => {
      const afDistance = Math.abs(rating.userAdjustmentFactor - memberAF)
      const similarity = 1 - (afDistance / 0.3) // Convert distance to similarity (0-1)
      const weight = similarity * similarity // Square for emphasis
      
      weightedSum += rating.overallScore * weight
      totalWeight += weight
    })

    const predictedScore = weightedSum / totalWeight

    // Confidence based on number of similar users and their similarity
    const avgSimilarity = similarRatings.reduce((sum, r) => {
      const afDistance = Math.abs(r.userAdjustmentFactor - memberAF)
      return sum + (1 - (afDistance / 0.3))
    }, 0) / similarRatings.length

    const confidence = Math.min(
      (similarRatings.length / 10) * avgSimilarity,
      1.0
    )

    return {
      score: predictedScore,
      confidence,
    }
  }

  /**
   * Calculate average categories from ratings
   */
  private calculateAverageCategories(ratings: any[]): RatingCategory {
    if (ratings.length === 0) {
      return this.getNeutralCategories()
    }

    const totals = ratings.reduce(
      (acc, r) => {
        acc.crowdSize += r.categories.crowdSize || 5
        acc.noiseLevel += r.categories.noiseLevel || 5
        acc.socialEnergy += r.categories.socialEnergy || 5
        acc.service += r.categories.service || 5
        acc.atmosphere += r.categories.atmosphere || 5
        return acc
      },
      {
        crowdSize: 0,
        noiseLevel: 0,
        socialEnergy: 0,
        service: 0,
        atmosphere: 0,
      }
    )

    const count = ratings.length
    return {
      crowdSize: Math.round((totals.crowdSize / count) * 10) / 10,
      noiseLevel: Math.round((totals.noiseLevel / count) * 10) / 10,
      socialEnergy: Math.round((totals.socialEnergy / count) * 10) / 10,
      service: Math.round((totals.service / count) * 10) / 10,
      atmosphere: Math.round((totals.atmosphere / count) * 10) / 10,
    } as RatingCategory
  }

   /**
   * Get neutral categories
   */
   private getNeutralCategories(): RatingCategory {
    return {
      crowdSize: 5,
      noiseLevel: 5,
      socialEnergy: 5,
      service: 5,
      atmosphere: 5,
    } as RatingCategory
  }



  /**
   * Haversine formula for distance calculation
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
}

export const recommendationService = new RecommendationService()

