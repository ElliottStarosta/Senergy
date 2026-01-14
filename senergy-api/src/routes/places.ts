import { Router, Request, Response } from 'express'
import { ratingService } from '@/services/rating.service'
import { algoliaService } from '@/services/algolia.service'

const router = Router()

/**
 * GET /api/places/search
 * Search places by name and location
 */
router.get('/search', async (req: Request, res: Response) => {
  const requestStartTime = Date.now()
  try {
    const { query: searchQuery, location, category, radius } = req.query

    console.log(`[API] Places search request: query="${searchQuery}", location=${location}, radius=${radius}`)

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
    }

    // Parse location if provided
    let lat: number | undefined
    let lng: number | undefined
    if (location && typeof location === 'string') {
      const [latStr, lngStr] = location.split(',')
      lat = parseFloat(latStr)
      lng = parseFloat(lngStr)
    }

    // Try Algolia first (if enabled)
    if (algoliaService.isAvailable() && lat !== undefined && lng !== undefined) {
      console.log('[API] Trying Algolia search...')
      const algoliaStartTime = Date.now()
      
      const algoliaResults = await algoliaService.searchPlaces(
        searchQuery,
        { lat, lng },
        parseFloat(radius as string) || 15000
      )
      
      const algoliaTime = Date.now() - algoliaStartTime
      console.log(`[API] Algolia returned ${algoliaResults.length} results in ${algoliaTime}ms`)

      if (algoliaResults.length > 0) {
        // Enrich with stats from our database
        const enrichedResults = await Promise.all(
          algoliaResults.map(async (place: any) => {
            const stats = await ratingService.getPlaceStats(place.objectID)
            return {
              id: place.objectID,
              name: place.name,
              address: place.address,
              location: place.location,
              category: place.category || 'establishment',
              stats: stats || {
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
                  cleanliness: 0,
                  atmosphere: 0,
                  accessibility: 0,
                },
                lastRatedAt: '',
              },
            }
          })
        )

        const totalTime = Date.now() - requestStartTime
        console.log(`[API] ✅ Algolia search complete in ${totalTime}ms - returning ${enrichedResults.length} places`)

        return res.json({
          success: true,
          data: enrichedResults,
          count: enrichedResults.length,
          source: 'algolia',
        })
      }
    }

    // Fall back to OpenStreetMap Nominatim
    console.log('[API] Falling back to OpenStreetMap Nominatim...')
    
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: '20',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
    })

    // Add location bias if provided
    if (lat !== undefined && lng !== undefined) {
      const searchRadius = parseFloat(radius as string) || 5000
      const radiusDeg = searchRadius / 111000
      
      params.append('viewbox', `${lng - radiusDeg},${lat + radiusDeg},${lng + radiusDeg},${lat - radiusDeg}`)
      params.append('bounded', '1')
      params.append('lat', lat.toString())
      params.append('lon', lng.toString())
    }

    const userAgent = process.env.NOMINATIM_USER_AGENT || 'SenergyApp/1.0 (https://senergy.app)'
    
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?${params.toString()}`
    console.log(`[API] Calling Nominatim API...`)
    
    const fetchStartTime = Date.now()
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    })
    const fetchTime = Date.now() - fetchStartTime

    if (!response.ok) {
      console.error(`[API] ❌ Nominatim API error: ${response.status}`)
      throw new Error(`Geocoding service error: ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return res.json({ success: true, data: [], count: 0, source: 'openstreetmap' })
    }

    // Sort by distance if location provided
    let sortedData = data
    if (lat !== undefined && lng !== undefined) {
      sortedData = data.sort((a: any, b: any) => {
        const distA = Math.sqrt(
          Math.pow(parseFloat(a.lat) - lat, 2) + Math.pow(parseFloat(a.lon) - lng, 2)
        )
        const distB = Math.sqrt(
          Math.pow(parseFloat(b.lat) - lat, 2) + Math.pow(parseFloat(b.lon) - lng, 2)
        )
        return distA - distB
      })
    }

    // Filter for places/establishments
    const places = sortedData
      .filter((item: any) => {
        const itemClass = item.class || ''
        const itemType = item.type || ''
        const validClasses = ['amenity', 'shop', 'tourism', 'leisure', 'craft']
        const validTypes = [
          'restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court',
          'shop', 'store', 'supermarket', 'mall',
          'cinema', 'theatre', 'museum', 'gallery',
          'park', 'gym', 'sports_centre', 'nightclub', 'club'
        ]
        return validClasses.includes(itemClass) || validTypes.includes(itemType)
      })
      .slice(0, 20)

    // Enrich with stats
    const placesWithStats = await Promise.all(
      places.map(async (place: any) => {
        const placeId = place.osm_id ? `osm_${place.osm_type}_${place.osm_id}` : `nominatim_${place.place_id}`
        const stats = await ratingService.getPlaceStats(placeId)

        const addressParts = []
        if (place.address) {
          if (place.address.house_number && place.address.road) {
            addressParts.push(`${place.address.house_number} ${place.address.road}`)
          } else if (place.address.road) {
            addressParts.push(place.address.road)
          }
          
          const city = place.address.city || place.address.town || place.address.village
          if (city) addressParts.push(city)
          if (place.address.state) addressParts.push(place.address.state)
          if (place.address.postcode) addressParts.push(place.address.postcode)
          if (place.address.country) addressParts.push(place.address.country)
        }
        
        const address = addressParts.length > 0 
          ? addressParts.join(', ') 
          : place.display_name

        return {
          id: placeId,
          name: place.display_name.split(',')[0] || place.name || searchQuery,
          address: address,
          location: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
          },
          category: place.type || place.class || 'establishment',
          stats: stats || {
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
              cleanliness: 0,
              atmosphere: 0,
              accessibility: 0,
            },
            lastRatedAt: '',
          },
        }
      })
    )

    const totalTime = Date.now() - requestStartTime
    console.log(`[API] ✅ OpenStreetMap search complete in ${totalTime}ms - returning ${placesWithStats.length} places`)

    res.json({
      success: true,
      data: placesWithStats,
      count: placesWithStats.length,
      source: 'openstreetmap',
    })
  } catch (error: any) {
    const totalTime = Date.now() - requestStartTime
    console.error(`[API] ❌ Place search error after ${totalTime}ms:`, error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search places',
    })
  }
})

/**
 * GET /api/places/reverse
 * Reverse geocode coordinates to get address
 */
router.get('/reverse', async (req: Request, res: Response) => {
  const requestStartTime = Date.now()
  try {
    const { lat, lng } = req.query

    console.log(`[API] Reverse geocode request: lat=${lat}, lng=${lng}`)

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      })
    }

    const latNum = parseFloat(lat as string)
    const lngNum = parseFloat(lng as string)

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      })
    }

    // Use OpenStreetMap Nominatim reverse geocoding API
    const params = new URLSearchParams({
      lat: latNum.toString(),
      lon: lngNum.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '18', // High detail level
    })

    const userAgent = process.env.NOMINATIM_USER_AGENT || 'SenergyApp/1.0 (https://senergy.app)'
    
    const fetchStartTime = Date.now()
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en',
        },
      }
    )
    const fetchTime = Date.now() - fetchStartTime
    console.log(`[API] Reverse geocode API call took ${fetchTime}ms`)

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }

    const parseStartTime = Date.now()
    const data = await response.json() as any
    const parseTime = Date.now() - parseStartTime
    console.log(`[API] Reverse geocode JSON parse took ${parseTime}ms`)

    // Format address
    const addressParts: string[] = []
    if (data.address) {
      // Street address
      if (data.address.house_number && data.address.road) {
        addressParts.push(`${data.address.house_number} ${data.address.road}`)
      } else if (data.address.road) {
        addressParts.push(data.address.road)
      }
      
      // City/Town/Village
      const city = data.address.city || data.address.town || data.address.village || data.address.municipality
      if (city) addressParts.push(city)
      
      // State/Region
      if (data.address.state) addressParts.push(data.address.state)
      
      // Postal code
      if (data.address.postcode) addressParts.push(data.address.postcode)
      
      // Country
      if (data.address.country) addressParts.push(data.address.country)
    }
    
    const address = addressParts.length > 0 
      ? addressParts.join(', ') 
      : (data.display_name || 'Current Location')

    const placeName = data.address?.name || 
                     data.address?.road || 
                     (data.address?.house_number ? 
                     `${data.address.house_number} ${data.address.road || ''}`.trim() :
                     'Current Location')

    const totalTime = Date.now() - requestStartTime
    console.log(`[API] ✅ Reverse geocode complete in ${totalTime}ms (fetch: ${fetchTime}ms, parse: ${parseTime}ms) - address: ${address}`)

    res.json({
      success: true,
      data: {
        id: `location_${latNum}_${lngNum}`,
        name: placeName,
        address: address,
        location: {
          lat: latNum,
          lng: lngNum,
        },
      },
    })
  } catch (error: any) {
    const totalTime = Date.now() - requestStartTime
    console.error(`[API] ❌ Reverse geocoding error after ${totalTime}ms:`, error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reverse geocode',
    })
  }
})

/**
 * GET /api/places/:placeId
 * Get full place details including all metadata
 * Optional query param: userId - if provided, returns stats adjusted for that user's personality
 */
router.get('/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params
    const userId = req.query.userId as string | undefined

    // Get place from our database
    let stats = await ratingService.getPlaceStats(placeId)
    const ratings = await ratingService.getPlaceRatings(placeId)

    if (ratings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Place not found',
      })
    }

    // If userId provided, get personality-adjusted stats
    if (userId) {
      const { db } = await import('@/config/firebase')
      const userDoc = await db.collection('users').doc(userId).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        const userAF = userData?.adjustmentFactor || 0
        const adjustedStats = await ratingService.getPlaceStatsForUser(placeId, userAF)
        if (adjustedStats) {
          stats = adjustedStats
        }
      }
    }

    const firstRating = ratings[0]
    const place = {
      id: placeId,
      name: firstRating.placeName,
      address: firstRating.placeAddress,
      location: firstRating.location,
      stats: stats || {
        totalRatings: ratings.length,
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
          cleanliness: 0,
          atmosphere: 0,
          accessibility: 0,
        },
        lastRatedAt: '',
      },
    }

    res.json({
      success: true,
      data: place,
      adjustedForUser: !!userId,
    })
  } catch (error: any) {
    console.error('Get place error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch place',
    })
  }
})

export default router

