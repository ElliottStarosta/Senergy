// senergy-api/src/config/algolia.ts
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch'

let client: SearchClient | null = null
let index: SearchIndex | null = null
let isConfigured = false

/**
 * Get Algolia credentials (read at runtime, not at import time)
 */
function getCredentials() {
  return {
    appId: process.env.ALGOLIA_APP_ID || '',
    apiKey: process.env.ALGOLIA_API_KEY || ''
  }
}

/**
 * Initialize Algolia client (lazy initialization)
 */
function initializeClient() {
  const { appId, apiKey } = getCredentials()
  
  if (!client && appId && apiKey) {
    console.log('🔍 Initializing Algolia client...')
    console.log('   App ID:', appId.substring(0, 4) + '...')
    console.log('   API Key:', apiKey.substring(0, 4) + '...')
    
    client = algoliasearch(appId, apiKey)
    index = client.initIndex(process.env.ALGOLIA_INDEX_NAME || 'places')
    console.log('✅ Algolia client initialized')
  }
  return { client, index }
}

/**
 * Get Algolia client (initializes on first call)
 */
export function getAlgoliaClient(): SearchClient | null {
  const { appId, apiKey } = getCredentials()
  
  if (!appId || !apiKey) {
    return null
  }
  
  if (!client) {
    initializeClient()
  }
  
  return client
}

/**
 * Get places index (initializes on first call)
 */
export function placesIndex(): SearchIndex | null {
  const { appId, apiKey } = getCredentials()
  
  if (!appId || !apiKey) {
    return null
  }
  
  if (!index) {
    initializeClient()
  }
  
  return index
}

/**
 * Configure index settings (call once during setup)
 */
export async function configureAlgoliaIndex() {
  const { appId, apiKey } = getCredentials()
  
  console.log('🔍 [configureAlgoliaIndex] Checking credentials...')
  console.log('   App ID:', appId || 'MISSING')
  console.log('   API Key:', apiKey ? apiKey.substring(0, 4) + '...' : 'MISSING')
  
  if (!appId || !apiKey) {
    console.log('ℹ️  Algolia not configured (optional). Using OpenStreetMap for search.')
    return
  }

  if (isConfigured) {
    console.log('ℹ️  Algolia index already configured')
    return
  }

  try {
    console.log('⚙️  Configuring Algolia index...')
    
    const idx = placesIndex()
    if (!idx) {
      throw new Error('Failed to get Algolia index')
    }

    await idx.setSettings({
      searchableAttributes: [
        'name',
        'address',
        'category'
      ],
      attributesForFaceting: [
        'searchable(category)',
      ],
      customRanking: [
        'desc(stats.totalRatings)',
        'desc(stats.avgOverallScore)'
      ],
      // Geo ranking is automatic with _geoloc
    })
    
    isConfigured = true
    console.log('✅ Algolia index configured successfully')
  } catch (error: any) {
    console.error('❌ Failed to configure Algolia index:', error.message)
    
    if (error.message?.includes('Unreachable hosts')) {
      console.error('   Check your ALGOLIA_APP_ID and ALGOLIA_API_KEY in .env')
      console.error('   Get correct credentials from: https://www.algolia.com/account/api-keys')
    }
  }
}

/**
 * Check if Algolia is available
 */
export function isAlgoliaAvailable(): boolean {
  const { appId, apiKey } = getCredentials()
  return !!(appId && apiKey)
}