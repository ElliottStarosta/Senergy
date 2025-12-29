// senergy-api/src/services/algolia.service.ts
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch'

interface PlaceRecord {
  objectID: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  _geoloc?: {
    lat: number
    lng: number
  }
  category?: string
  avgScore?: number
  totalRatings?: number
}

export class AlgoliaService {
  private client: SearchClient | null = null
  private index: SearchIndex | null = null
  private isEnabled: boolean = false

  constructor() {
    const appId = process.env.ALGOLIA_APP_ID
    const adminKey = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'places'

    // Only initialize if credentials are provided
    if (appId && adminKey) {
      try {
        console.log(`🔍 Initializing Algolia with app ID: ${appId.substring(0, 4)}...`)
        
        this.client = algoliasearch(appId, adminKey)
        this.index = this.client.initIndex(indexName)
        this.isEnabled = true
        
        console.log('✅ Algolia client initialized')
      } catch (error: any) {
        console.warn('⚠️  Algolia initialization failed:', error.message)
        console.warn('   Search will fall back to OpenStreetMap')
        this.isEnabled = false
      }
    } else {
      console.log('ℹ️  Algolia not configured (optional). Using OpenStreetMap for search.')
      this.isEnabled = false
    }
  }

  /**
   * Check if Algolia is enabled and configured
   */
  isAvailable(): boolean {
    return this.isEnabled && this.index !== null
  }

  /**
   * Configure index settings
   */
  async configureIndex(): Promise<void> {
    if (!this.isAvailable() || !this.index) {
      console.log('⏭️  Skipping Algolia index configuration (not enabled)')
      return
    }

    try {
      console.log('⚙️  Configuring Algolia index settings...')
      
      await this.index.setSettings({
        searchableAttributes: [
          'name',
          'address',
          'category',
        ],
        attributesForFaceting: [
          'searchable(category)',
        ],
        customRanking: [
          'desc(totalRatings)',
          'desc(avgScore)',
        ],
      })

      console.log('✅ Algolia index configured successfully')
    } catch (error: any) {
      console.error('❌ Failed to configure Algolia index:', error)
      // Don't throw - just disable Algolia
      this.isEnabled = false
    }
  }

  /**
   * Index a place (add or update)
   */
  async indexPlace(place: PlaceRecord): Promise<void> {
    if (!this.isAvailable() || !this.index) {
      return // Silently skip if not enabled
    }

    try {
      // Add _geoloc for geo-search
      const record = {
        ...place,
        _geoloc: {
          lat: place.location.lat,
          lng: place.location.lng,
        },
      }

      await this.index.saveObject(record)
      console.log(`✅ Indexed place: ${place.name}`)
    } catch (error: any) {
      console.error(`⚠️  Failed to index place ${place.name}:`, error.message)
      // Don't throw - search can fall back to other methods
    }
  }

  /**
   * Batch index multiple places
   */
  async indexPlaces(places: PlaceRecord[]): Promise<void> {
    if (!this.isAvailable() || !this.index) {
      return
    }

    try {
      const records = places.map(place => ({
        ...place,
        _geoloc: {
          lat: place.location.lat,
          lng: place.location.lng,
        },
      }))

      await this.index.saveObjects(records)
      console.log(`✅ Indexed ${places.length} places`)
    } catch (error: any) {
      console.error(`⚠️  Failed to batch index places:`, error.message)
    }
  }

  /**
   * Search places with geo-filtering
   */
  async searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radiusMeters: number = 15000
  ): Promise<PlaceRecord[]> {
    if (!this.isAvailable() || !this.index) {
      return [] // Return empty, caller should fall back to OSM
    }

    try {
      const searchOptions: any = {
        hitsPerPage: 20,
      }

      // Add geo-search if location provided
      if (location) {
        searchOptions.aroundLatLng = `${location.lat},${location.lng}`
        searchOptions.aroundRadius = radiusMeters
      }

      const response = await this.index.search(query, searchOptions)
      return response.hits as unknown as PlaceRecord[]
    } catch (error: any) {
      console.error('⚠️  Algolia search failed:', error.message)
      return [] // Return empty, caller should fall back
    }
  }

  /**
   * Delete a place from index
   */
  async deletePlace(placeId: string): Promise<void> {
    if (!this.isAvailable() || !this.index) {
      return
    }

    try {
      await this.index.deleteObject(placeId)
      console.log(`🗑️  Deleted place from index: ${placeId}`)
    } catch (error: any) {
      console.error(`⚠️  Failed to delete place:`, error.message)
    }
  }

  /**
   * Clear entire index (use with caution!)
   */
  async clearIndex(): Promise<void> {
    if (!this.isAvailable() || !this.index) {
      return
    }

    try {
      await this.index.clearObjects()
      console.log('🗑️  Cleared Algolia index')
    } catch (error: any) {
      console.error('❌ Failed to clear index:', error.message)
    }
  }
}

// Export singleton instance
export const algoliaService = new AlgoliaService()